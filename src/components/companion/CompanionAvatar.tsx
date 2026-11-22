'use client';

import * as React from 'react';

const MODEL_UID = 'ff95785538a445eb8d5ee3c913aa76f6';
const SIT_ANIMATION_UID = 'd5f5d820326b4a1d8b9027c5517f6f3d';
const STORAGE_KEY = 'samundar-companion-v1';
const API_SRC = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';

type Prefs = { scale: number; x: number; y: number; opacity: number; hidden: boolean };

const DEFAULT_PREFS: Prefs = { scale: 1, x: 0, y: 0, opacity: 1, hidden: false };

interface SketchfabApi {
  start: () => void;
  addEventListener: (event: string, cb: () => void) => void;
  setCycleMode: (mode: string, cb?: (err: string | null) => void) => void;
  setCurrentAnimationByUID: (uid: string, cb?: (err: string | null) => void) => void;
  play: (cb?: (err: string | null) => void) => void;
}

let apiPromise: Promise<void> | null = null;

function loadSketchfabApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Sketchfab) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = API_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Sketchfab API failed to load'));
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

declare global {
  interface Window {
    Sketchfab?: new (iframe: HTMLIFrameElement) => { init: (uid: string, options: Record<string, unknown>) => void };
  }
}

export function CompanionAvatar() {
  const frameId = React.useId().replace(/[:]/g, '-');
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = React.useState(false);
  const dragRef = React.useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) });
    } catch {}
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  React.useEffect(() => {
    let cancelled = false;
    loadSketchfabApi()
      .then(() => {
        const iframe = document.getElementById(frameId) as HTMLIFrameElement | null;
        if (cancelled || !window.Sketchfab || !iframe) return;
        const client = new window.Sketchfab(iframe);
        client.init(MODEL_UID, {
          autostart: 1,
          autospin: 0,
          preload: 1,
          transparent: 1,
          ui_theme: 'dark',
          ui_infos: 0,
          ui_controls: 0,
          ui_stop: 0,
          ui_watermark: 0,
          ui_annotations: 0,
          ui_hint: 0,
          ui_fullscreen: 0,
          success: (api: SketchfabApi) => {
            api.start();
            api.addEventListener('viewerready', () => {
              api.setCycleMode('loopOne');
              api.setCurrentAnimationByUID(SIT_ANIMATION_UID, () => api.play());
            });
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [frameId]);

  function onPointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: prefs.x, baseY: prefs.y };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    setPrefs((prev) => ({
      ...prev,
      x: Math.min(0, Math.max(-window.innerWidth + 200, drag.baseX + event.clientX - drag.startX)),
      y: Math.min(window.innerHeight - 300, Math.max(0, drag.baseY + event.clientY - drag.startY)),
    }));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  if (!hydrated || prefs.hidden) return null;

  const width = Math.round(180 * prefs.scale);

  return (
    <div
      className="group fixed right-4 top-16 z-40 select-none"
      style={{ transform: `translate(${prefs.x}px, ${prefs.y}px)`, opacity: prefs.opacity }}
      data-agent-ignore
    >
      <div
        className="relative overflow-hidden rounded-lg border border-border/60 bg-card/80 shadow-lg"
        style={{ width, height: Math.round(160 * prefs.scale) }}
      >
        <iframe
          id={frameId}
          title="Companion"
          src=""
          className="h-full w-full border-0"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          execution-while-not-rendered=""
          execution-while-out-of-viewport=""
          allowFullScreen
        />
        <div
          aria-label="Drag companion"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-x-6 bottom-0 h-4 cursor-grab opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div className="mx-auto mt-1.5 h-0.5 w-8 rounded-full bg-foreground/40" />
        </div>
      </div>
    </div>
  );
}
