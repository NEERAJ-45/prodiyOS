'use client';

import { useMutation, useQuery, useQueryClient, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useProfile } from '@/components/providers/ProfileProvider';

export type FileKind = 'file' | 'folder';
export type FileSort = 'name' | 'size' | 'type' | 'modified';
export type FileView = 'grid' | 'list';
export type DocStatus = 'TO_READ' | 'READING' | 'COMPLETED' | 'REFERENCE';

export interface FileNode {
  _id?: string;
  id: string;
  title: string;
  kind: FileKind;
  parentId: string | null;
  category: string;
  status: DocStatus;
  progress: number;
  fileType: string;
  mimeType: string;
  size: number;
  fileName: string;
  deletedAt?: string | null;
  trashedFrom?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilesPage {
  folders: FileNode[];
  files: FileNode[];
  hasMore: boolean;
  nextCursor: string | null;
}

function jsonHeaders(customDbUrl?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (customDbUrl) headers['x-mongodb-url'] = customDbUrl;
  return headers;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error((data as { error?: string }).error || 'Request failed');
  return data as T;
}

export function useFilesQuery(params: {
  parentId: string | null;
  sort: FileSort;
  dir: 'asc' | 'desc';
  trashed?: boolean;
  q?: string;
}) {
  const { userEmail, customDbUrl } = useProfile();
  const { parentId, sort, dir, trashed = false, q = '' } = params;

  return useInfiniteQuery<FilesPage, Error, InfiniteData<FilesPage>, readonly unknown[], string | null>({
    queryKey: ['files', userEmail, trashed ? 'trash' : (parentId ?? 'root'), sort, dir, q],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }: { pageParam: string | null }) => {
      const search = new URLSearchParams({
        parentId: parentId ?? 'root',
        sort,
        dir,
        limit: '100',
        trashed: trashed ? '1' : '0',
      });
      if (q) search.set('q', q);
      if (pageParam) search.set('cursor', pageParam);

      const res = await fetch(`/api/db/docs?${search.toString()}`, {
        headers: jsonHeaders(customDbUrl),
      });
      return readJson<FilesPage>(res);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!userEmail,
    staleTime: 30 * 1000,
  });
}

export function useNameSearchQuery(q: string) {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<FileNode[]>({
    queryKey: ['file-search', userEmail, q],
    queryFn: async () => {
      const res = await fetch(
        `/api/db/docs?scope=all&q=${encodeURIComponent(q)}&limit=30`,
        { headers: jsonHeaders(customDbUrl) }
      );
      const data = await readJson<FilesPage>(res);
      return [...data.folders, ...data.files];
    },
    enabled: !!userEmail && q.trim().length > 0,
    staleTime: 30 * 1000,
  });
}

export function useFileTreeQuery(parentId: string | null, enabled = true) {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<FileNode[]>({
    queryKey: ['file-tree', userEmail, parentId ?? 'root'],
    queryFn: async () => {
      const res = await fetch(`/api/db/docs/tree?parentId=${encodeURIComponent(parentId ?? 'root')}`, {
        headers: jsonHeaders(customDbUrl),
      });
      const data = await readJson<{ folders: FileNode[] }>(res);
      return data.folders;
    },
    enabled: !!userEmail && enabled,
    staleTime: 60 * 1000,
  });
}

export function useFileNodeQuery(id: string | null) {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<{ doc: FileNode; path: { id: string; title: string }[] }>({
    queryKey: ['file-node', userEmail, id],
    queryFn: async () => {
      const res = await fetch(`/api/db/docs/${encodeURIComponent(id!)}`, {
        headers: jsonHeaders(customDbUrl),
      });
      return readJson<{ doc: FileNode; path: { id: string; title: string }[] }>(res);
    },
    enabled: !!userEmail && !!id,
    staleTime: 60 * 1000,
  });
}

function useInvalidateFiles() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['files'] });
    void queryClient.invalidateQueries({ queryKey: ['file-tree'] });
    void queryClient.invalidateQueries({ queryKey: ['file-search'] });
    void queryClient.invalidateQueries({ queryKey: ['doc-search'] });
  };
}

export function useCreateNode() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async (input: {
      kind: 'folder' | 'text';
      title: string;
      parentId: string | null;
      content?: string;
      mimeType?: string;
    }) => {
      const res = await fetch('/api/db/docs', {
        method: 'POST',
        headers: jsonHeaders(customDbUrl),
        body: JSON.stringify({
          kind: input.kind === 'folder' ? 'folder' : 'file',
          title: input.title,
          parentId: input.parentId,
          content: input.content,
          mimeType: input.mimeType,
        }),
      });
      return readJson<{ doc: FileNode }>(res);
    },
    onSuccess: invalidate,
  });
}

export function useRenameNode() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/db/docs?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: jsonHeaders(customDbUrl),
        body: JSON.stringify({ title }),
      });
      return readJson<{ doc: FileNode }>(res);
    },
    onSuccess: invalidate,
  });
}

export function useBulkNodeAction() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async (input: {
      action: 'trash' | 'restore' | 'move';
      ids: string[];
      parentId?: string | null;
    }) => {
      const res = await fetch('/api/db/docs/bulk', {
        method: 'POST',
        headers: jsonHeaders(customDbUrl),
        body: JSON.stringify(input),
      });
      return readJson<{ success: boolean; affected: number }>(res);
    },
    onSuccess: invalidate,
  });
}

export function usePurgeNode() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/db/docs/trash?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: jsonHeaders(customDbUrl),
      });
      return readJson<{ success: boolean; purged: number }>(res);
    },
    onSuccess: invalidate,
  });
}

export function useEmptyTrash() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/db/docs/trash?all=1', {
        method: 'DELETE',
        headers: jsonHeaders(customDbUrl),
      });
      return readJson<{ success: boolean; purged: number }>(res);
    },
    onSuccess: invalidate,
  });
}

export function useDuplicateNode() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async ({ id, parentId }: { id: string; parentId?: string | null }) => {
      const res = await fetch('/api/db/docs/duplicate', {
        method: 'POST',
        headers: jsonHeaders(customDbUrl),
        body: JSON.stringify({ id, parentId }),
      });
      return readJson<{ doc: FileNode }>(res);
    },
    onSuccess: invalidate,
  });
}

export function useSaveTextContent() {
  const { customDbUrl } = useProfile();
  const invalidate = useInvalidateFiles();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/docs/content/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: jsonHeaders(customDbUrl),
        body: JSON.stringify({ content }),
      });
      return readJson<{ success: boolean; size: number }>(res);
    },
    onSuccess: invalidate,
  });
}

export function useTextContentQuery(id: string | null) {
  const { userEmail, customDbUrl } = useProfile();

  return useQuery<{ type: string; text?: string; html?: string }>({
    queryKey: ['file-content', userEmail, id],
    queryFn: async () => {
      const res = await fetch(`/api/docs/content/${encodeURIComponent(id!)}`, {
        headers: jsonHeaders(customDbUrl),
      });
      return readJson<{ type: string; text?: string; html?: string }>(res);
    },
    enabled: !!userEmail && !!id,
    staleTime: 60 * 1000,
  });
}
