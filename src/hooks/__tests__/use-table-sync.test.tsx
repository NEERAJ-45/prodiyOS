import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTableSync } from '@/hooks/use-table-sync';

const { toggleMutate } = vi.hoisted(() => ({ toggleMutate: vi.fn() }));

vi.mock('@/hooks/use-completions', () => ({
  useToggleCompletion: () => ({ mutate: toggleMutate }),
}));
vi.mock('@/hooks/use-notes', () => ({
  useSaveNote: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/hooks/use-custom-topics', () => ({
  useAddCustomTopic: () => ({ mutate: vi.fn() }),
  useDeleteCustomTopic: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/components/providers/ProfileProvider', () => ({
  useProfile: () => ({ userEmail: 'test@example.com', customDbUrl: undefined }),
}));

describe('useTableSync', () => {
  beforeEach(() => {
    toggleMutate.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ dbConnected: false }) }),
    );
  });

  it('sends the item title so activity log shows the name, not the id', () => {
    const items = [{ id: 2005, title: 'Load Balancing', difficulty: 'MEDIUM', link: '' }];
    const { result } = renderHook(() =>
      useTableSync({ storagePrefix: 'system-design-hld', allItems: items }),
    );

    act(() => {
      result.current.toggleCompleted(2005);
    });

    expect(toggleMutate).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: '2005', title: 'Load Balancing' }),
    );
  });
});
