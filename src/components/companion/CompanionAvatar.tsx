'use client';

import * as React from 'react';

const STORAGE_KEY = 'samundar-companion-pos';
const ANGLE_COUNT = 8;
const ANGLES = Array.from({ length: ANGLE_COUNT }, (_, i) => `/companion/nezuko-a${i}.webp`);

export function CompanionAvatar() {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const [angle, setAngle] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPos(JSON.parse(raw) as { x: number; y: number });
    } catch {}
    ANGLES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      setAngle((current) => (current + (event.deltaY > 0 ? 1 : -1) + ANGLE_COUNT) % ANGLE_COUNT);
    }
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  function onPointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: pos?.x ?? 0, baseY: pos?.y ?? 0 };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    setPos({
      x: Math.min(0, Math.max(-(window.innerWidth - 120), drag.baseX + event.clientX - drag.startX)),
      y: Math.min(window.innerHeight - 150, Math.max(-56, drag.baseY + event.clientY - drag.startY)),
    });
  }

  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setPos((current) => {
      if (current) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return current;
    });
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Companion: Nezuko sitting. Drag to move, scroll to rotate."
      title="Drag to move · Scroll to rotate"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="fixed right-4 top-16 z-40 h-24 w-24 cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ transform: `translate(${pos?.x ?? 0}px, ${pos?.y ?? 0}px)` }}
      data-agent-ignore
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ANGLES[angle]}
        alt=""
        draggable={false}
        className="pointer-events-none h-full w-full object-contain"
      />
    </div>
  );
}
