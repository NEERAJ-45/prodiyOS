import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSelection } from '../use-selection';

describe('useSelection', () => {
  it('replaces, toggles and ranges selections', () => {
    const { result } = renderHook(() => useSelection(['a', 'b', 'c', 'd']));

    act(() => result.current.toggle('a', false, false));
    expect(result.current.selectedIds).toEqual(['a']);

    act(() => result.current.toggle('b', false, true));
    expect(result.current.selectedIds.sort()).toEqual(['a', 'b']);

    act(() => result.current.toggle('c', true, false));
    expect(result.current.selectedIds.sort()).toEqual(['a', 'b', 'c']);

    act(() => result.current.toggle('a', true, false));
    expect(result.current.selectedIds.sort()).toEqual(['b', 'c']);
  });

  it('supports select-all, only and clear', () => {
    const { result } = renderHook(() => useSelection(['a', 'b', 'c']));

    act(() => result.current.selectAll());
    expect(result.current.count).toBe(3);

    act(() => result.current.only('b'));
    expect(result.current.selectedIds).toEqual(['b']);
    expect(result.current.isSelected('b')).toBe(true);

    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
