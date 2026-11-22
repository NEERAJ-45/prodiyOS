'use client';

import * as React from 'react';
import { ChevronDown, GripVertical, Settings2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODEL_UID = 'ff95785538a445eb8d5ee3c913aa76f6';
const STORAGE_KEY = 'samundar-companion-v1';
const API_SRC = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';

type Prefs = {
  scale: number;
  x: number;
  y: number;
  opacity: number;
  animIndex: number;
  hidden: boolean;
};

const DEFAULT_PREFS: Prefs = { scale: 1, x: 0, y: 0, opacity: 1, animIndex: 0, hidden: false };

interface SketchfabApi {
  start: () => void;
  setCurrentAnimation: (index: number) => void;
  getAnimations?: (cb: (err: string | null, animations: { name: string }[]) => void) => void;
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
    Sketchfab?: new (iframeId: string) => { init: (uid: string, options: Record<string, unknown>) => void };
  }
}

export function CompanionAvatar() {
  const frameId = React.useId().replace(/[:]/g, '-');
  const apiRef = React.useRef<SketchfabApi | null>(null);
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [animations, setAnimations] = React.useState<{ name: string }[]>([]);
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
        if (cancelled || !window.Sketchfab) return;
        const client = new window.Sketchfab(frameId);
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
            apiRef.current = api;
            api.start();
            api.getAnimations?.((err, list) => {
              if (!err && Array.isArray(list) && list.length) setAnimations(list);
            });
            setReady(true);
          },
          error: () => setReady(false),
        });
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
    };
  }, [frameId]);

  React.useEffect(() => {
    if (ready) apiRef.current?.setCurrentAnimation(prefs.animIndex);
  }, [ready, prefs.animIndex]);

  function update(patch: Partial<Prefs>) {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }

  function onPointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: prefs.x, baseY: prefs.y };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    update({
      x: Math.min(0, Math.max(-window.innerWidth + 220, drag.baseX + event.clientX - drag.startX)),
      y: Math.min(window.innerHeight - 320, Math.max(0, drag.baseY + event.clientY - drag.startY)),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  if (!hydrated) return null;

  if (prefs.hidden) {
    return (
      <button
        type="button"
        onClick={() => update({ hidden: false })}
        className="fixed bottom-4 left-3 z-40 rounded-full border border-border bg-card/95 px-3 py-1.5 text-[10px] text-muted-foreground shadow-lg transition-colors hover:text-foreground"
      >
        Show Nezuko
      </button>
    );
  }

  const width = Math.round(220 * prefs.scale);

  return (
    <div
      className="fixed left-3 top-16 z-40 select-none"
      style={{ transform: `translate(${prefs.x}px, ${prefs.y}px)` }}
      data-agent-ignore
    >
      <div
        className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-sm"
        style={{ width, opacity: prefs.opacity }}
      >
        <div
          className="flex h-7 items-center gap-1 border-b border-border/60 px-1.5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground" />
          <span className="truncate text-[10px] font-medium tracking-wide text-muted-foreground">Nezuko</span>
          <div className="ml-auto flex items-center">
            <button
              type="button"
              aria-label="Toggle companion settings"
              onClick={() => setOpen((v) => !v)}
              className={cn('rounded p-1 text-muted-foreground transition-colors hover:text-foreground', open && 'text-foreground')}
            >
              <Settings2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label="Hide companion"
              onClick={() => update({ hidden: true })}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="relative" style={{ height: Math.round(150 * prefs.scale) }}>
          <iframe
            id={frameId}
            title="Companion"
            src={`https://sketchfab.com/models/${MODEL_UID}/embed?autostart=1&autospin=0&preload=1&transparent=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_stop=0&ui_annotations=0&ui_hint=0`}
            className="h-full w-full border-0"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
          />
          <button
            type="button"
            aria-label="Show animations"
            onClick={() => setOpen(true)}
            className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/50 to-transparent text-[10px] text-white/70 transition-opacity hover:text-white"
          >
            <span className="pointer-events-none flex items-center justify-center gap-1">
              animations <ChevronDown className="h-3 w-3" />
            </span>
          </button>
        </div>

        {open && (
          <div className="space-y-2.5 border-t border-border/60 p-2.5">
            <label className="block space-y-1">
              <span className="text-[10px] text-muted-foreground">Animation</span>
              <select
                value={prefs.animIndex}
                onChange={(e) => update({ animIndex: Number(e.target.value) })}
                disabled={!ready}
                className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] outline-none focus:border-ring"
              >
                {(animations.length ? animations : [{ name: 'Default' }, { name: 'Second' }]).map((anim, index) => (
                  <option key={index} value={index}>{anim.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="flex justify-between text-[10px] text-muted-foreground">
                <span>Size</span>
                <span className="tabular-nums">{Math.round(prefs.scale * 100)}%</span>
              </span>
              <input
                type="range" min={0.7} max={2} step={0.05}
                value={prefs.scale}
                onChange={(e) => update({ scale: Number(e.target.value) })}
                className="w-full accent-[hsl(var(--ring))]"
              />
            </label>
            <label className="block space-y-1">
              <span className="flex justify-between text-[10px] text-muted-foreground">
                <span>Opacity</span>
                <span className="tabular-nums">{Math.round(prefs.opacity * 100)}%</span>
              </span>
              <input
                type="range" min={0.3} max={1} step={0.05}
                value={prefs.opacity}
                onChange={(e) => update({ opacity: Number(e.target.value) })}
                className="w-full accent-[hsl(var(--ring))]"
              />
            </label>
            <button
              type="button"
              onClick={() => setPrefs(DEFAULT_PREFS)}
              className="w-full rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
