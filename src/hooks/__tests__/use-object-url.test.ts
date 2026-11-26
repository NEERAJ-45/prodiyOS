import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useObjectUrl } from '../use-object-url';

const DATA = 'data:text/plain;base64,aGVsbG8=';

let counter = 0;
const createObjectURL = vi.fn(() => `blob:test-${++counter}`);
const revokeObjectURL = vi.fn();

beforeEach(() => {
  counter = 0;
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true });
});

describe('useObjectUrl', () => {
  it('converts a data URL to a blob URL', async () => {
    const { result } = renderHook(() => useObjectUrl(DATA));
    await waitFor(() => expect(result.current).toMatch(/^blob:/));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('does not recreate the blob URL on re-render', async () => {
    const { result, rerender } = renderHook(({ value }) => useObjectUrl(value), {
      initialProps: { value: DATA },
    });
    await waitFor(() => expect(result.current).toMatch(/^blob:/));
    const first = result.current;
    rerender({ value: DATA });
    await waitFor(() => expect(result.current).toBe(first));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('passes through non-data URLs', () => {
    const { result } = renderHook(() => useObjectUrl('https://example.com/x.png'));
    expect(result.current).toBe('https://example.com/x.png');
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('revokes the previous blob URL when the value changes', async () => {
    const { result, rerender } = renderHook(({ value }) => useObjectUrl(value), {
      initialProps: { value: DATA },
    });
    await waitFor(() => expect(result.current).toMatch(/^blob:/));
    const first = result.current;
    rerender({ value: 'data:text/plain;base64,d29ybGQ=' });
    await waitFor(() => expect(result.current).not.toBe(first));
    expect(revokeObjectURL).toHaveBeenCalledWith(first);
  });
});
