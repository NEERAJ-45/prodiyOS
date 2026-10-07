'use client';

import { useRef, useCallback } from 'react';

const HOLD_MS = 450;
const MOVE_TOLERANCE = 10;

/**
 * Fires on a press-and-hold (and on right-click via the caller's
 * onContextMenu). Cancels if the pointer moves more than 10px, so
 * scrolling never triggers it.
 */
export function useLongPress(onHold: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        timer.current = null;
        onHold();
      }, HOLD_MS);
    },
    [onHold]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!start.current || !timer.current) return;
      const dx = Math.abs(e.clientX - start.current.x);
      const dy = Math.abs(e.clientY - start.current.y);
      if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) cancel();
    },
    [cancel]
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
