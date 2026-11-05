import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

vi.mock('@/components/providers/ProfileProvider', () => ({
  useProfile: () => ({ userEmail: 'test@example.com', customDbUrl: undefined }),
}));

import { useUploadFiles } from '../use-upload';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

function json(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('useUploadFiles', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('splits a file into chunks and completes the upload', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => json({ uploadId: 'u1', chunkSize: 4, chunkCount: 3 }))
      .mockImplementation(() => json({ success: true }))
      .mockImplementation(() => json({ doc: { id: 'd1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['0123456789'], 'data.bin', { type: 'application/octet-stream' });
    const { result } = renderHook(() => useUploadFiles(), { wrapper });

    await act(async () => {
      await result.current.uploadFiles([file], null);
    });

    await waitFor(() => expect(result.current.transfers[0]?.status).toBe('done'));

    const calls = fetchMock.mock.calls as [string, RequestInit?][];
    expect(calls[0][0]).toBe('/api/docs/upload/init');
    const chunkUrls = calls.map(([url]) => url).filter((url) => url.includes('/chunk?'));
    expect(chunkUrls).toEqual([
      '/api/docs/upload/u1/chunk?index=0',
      '/api/docs/upload/u1/chunk?index=1',
      '/api/docs/upload/u1/chunk?index=2',
    ]);
    expect(calls.at(-1)?.[0]).toBe('/api/docs/upload/u1/complete');
    expect(result.current.transfers[0]?.progress).toBe(100);
  });

  it('marks a failed upload without throwing', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => json({ error: 'Storage down' }, false));
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['x'], 'bad.txt', { type: 'text/plain' });
    const { result } = renderHook(() => useUploadFiles(), { wrapper });

    await act(async () => {
      await result.current.uploadFiles([file], null);
    });

    await waitFor(() => expect(result.current.transfers[0]?.status).toBe('error'));
    expect(result.current.transfers[0]?.error).toBe('Storage down');
  });
});
