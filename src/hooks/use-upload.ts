'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';
import { mimeForName } from '@/lib/files/mime';

export interface Transfer {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error' | 'canceled';
  error?: string;
}

export interface UploadHandlers {
  onStart?: (job: { id: string; name: string; abort: () => void }) => void;
  onProgress?: (id: string, progress: number) => void;
  onFinish?: (id: string, status: 'done' | 'error' | 'canceled', error?: string) => void;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error((data as { error?: string }).error || 'Upload failed');
  return data as T;
}

export function useUploadFiles(handlers: UploadHandlers = {}) {
  const { customDbUrl } = useProfile();
  const queryClient = useQueryClient();
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const patch = useCallback((id: string, update: Partial<Transfer>) => {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, ...update } : t)));
  }, []);

  const uploadFiles = useCallback(
    async (files: File[], parentId: string | null) => {
      const extraHeaders: Record<string, string> = customDbUrl ? { 'x-mongodb-url': customDbUrl } : {};

      for (const file of files) {
        const transferId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const controller = new AbortController();
        let uploadId: string | null = null;
        setTransfers((prev) => [
          ...prev,
          { id: transferId, name: file.name, progress: 0, status: 'uploading' },
        ]);
        handlers.onStart?.({ id: transferId, name: file.name, abort: () => controller.abort() });

        try {
          if (file.size === 0) throw new Error('Empty files are not supported');

          const init = await readJson<{ uploadId: string; chunkSize: number; chunkCount: number }>(
            await fetch('/api/docs/upload/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...extraHeaders },
              body: JSON.stringify({
                name: file.name,
                parentId,
                mimeType: file.type || mimeForName(file.name),
                size: file.size,
              }),
              signal: controller.signal,
            })
          );
          uploadId = init.uploadId;

          for (let index = 0; index < init.chunkCount; index += 1) {
            if (controller.signal.aborted) throw new DOMException('Upload canceled', 'AbortError');

            const start = index * init.chunkSize;
            const end = Math.min(start + init.chunkSize, file.size);
            await readJson<{ success: boolean }>(
              await fetch(`/api/docs/upload/${init.uploadId}/chunk?index=${index}`, {
                method: 'PUT',
                headers: extraHeaders,
                body: file.slice(start, end),
                signal: controller.signal,
              })
            );
            const progress = Math.round(((index + 1) / init.chunkCount) * 90);
            patch(transferId, { progress });
            handlers.onProgress?.(transferId, progress);
          }

          await readJson<{ doc: unknown }>(
            await fetch(`/api/docs/upload/${init.uploadId}/complete`, {
              method: 'POST',
              headers: extraHeaders,
              signal: controller.signal,
            })
          );

          patch(transferId, { progress: 100, status: 'done' });
          handlers.onFinish?.(transferId, 'done');
        } catch (error) {
          if (controller.signal.aborted) {
            patch(transferId, { status: 'canceled', error: 'Canceled' });
            handlers.onFinish?.(transferId, 'canceled');
            if (uploadId) {
              void fetch(`/api/docs/upload/${uploadId}`, {
                method: 'DELETE',
                headers: extraHeaders,
              }).catch(() => {});
            }
            continue;
          }
          patch(transferId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
          handlers.onFinish?.(
            transferId,
            'error',
            error instanceof Error ? error.message : 'Upload failed'
          );
        }
      }

      void queryClient.invalidateQueries({ queryKey: ['files'] });
      void queryClient.invalidateQueries({ queryKey: ['file-tree'] });
      void queryClient.invalidateQueries({ queryKey: ['file-search'] });
    },
    [customDbUrl, handlers, patch, queryClient]
  );

  const clearFinished = useCallback(() => {
    setTransfers((prev) => prev.filter((t) => t.status === 'uploading'));
  }, []);

  return { transfers, uploadFiles, clearFinished };
}
