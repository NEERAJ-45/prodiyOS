'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

export function useSelection(orderedIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastIndexRef = useRef<{ index: number | null }>({ index: null });

  const positionOf = useCallback(
    (id: string) => orderedIds.indexOf(id),
    [orderedIds]
  );

  const toggle = useCallback(
    (id: string, additive: boolean, range: boolean) => {
      const index = positionOf(id);
      setSelected((prev) => {
        const next = new Set(additive || range ? prev : []);
        if (range && lastIndexRef.current.index !== null && index >= 0) {
          const from = Math.min(lastIndexRef.current.index, index);
          const to = Math.max(lastIndexRef.current.index, index);
          for (let i = from; i <= to; i += 1) next.add(orderedIds[i]);
        } else if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      if (index >= 0) lastIndexRef.current.index = index;
    },
    [lastIndexRef, orderedIds, positionOf]
  );

  const clear = useCallback(() => {
    setSelected(new Set());
    lastIndexRef.current.index = null;
  }, [lastIndexRef]);

  const selectAll = useCallback(() => {
    setSelected(new Set(orderedIds));
  }, [orderedIds]);

  const only = useCallback((id: string) => {
    setSelected(new Set([id]));
    lastIndexRef.current.index = orderedIds.indexOf(id);
  }, [lastIndexRef, orderedIds]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return {
    selected,
    selectedIds,
    count: selected.size,
    toggle,
    clear,
    selectAll,
    only,
    isSelected: (id: string) => selected.has(id),
  };
}
