# Prodigy Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a persistent, Spotify-style glass music player in the dashboard, backed by the Audius public API and a native `<audio>` element.

**Architecture:** `src/data/player.ts` holds station config, Audius fetching, and pure persistence/formatting helpers (unit tested). `src/components/player/MusicPlayer.tsx` is one client component that owns the `<audio>` element, queue cache, collapsed pill, and expanded glass dock. It is mounted once in `(dashboard)/layout.tsx`, so playback survives route changes.

**Tech Stack:** Next.js App Router, React 19 client component, Tailwind CSS v3 (custom zinc/amber palette), framer-motion, lucide-react, localStorage, Vitest + jsdom.

## Global Constraints

- No new dependencies.
- Amber (`amber-400/500`) is the only accent color; no green.
- Glassmorphism surfaces: translucent zinc base + `backdrop-blur-2xl backdrop-saturate-150`, `border-white/10`, inset top highlight, dark outer shadow, top sheen. Provide `supports-[backdrop-filter]` fallback to `bg-zinc-950/90`.
- Audius requests always include `app_name=ProdigyOS`; API base `https://api.audius.co/v1`.
- localStorage key: `STORAGE_KEYS.PLAYER = 'samundar-player'`.
- No YouTube code or `extractVideoId` left in `src/data/player.ts`.
- Client components start with `'use client'`; tests live in sibling `__tests__` folders (`*.test.ts`).
- Verification commands: `npm run test`, `npm run typecheck`, `npm run lint`.
- Repo-local git identity is already set (`Neeraj Surnis <neerajsurnis@gmail.com>`).

---

### Task 1: Data layer + storage key + unit tests

**Files:**
- Modify: `src/lib/storage-keys.ts`
- Rewrite: `src/data/player.ts`
- Create: `src/data/__tests__/player.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type PlayerStationId = 'lofi' | 'deep' | 'synth'`
  - `interface AudiusTrack { id: string; title: string; artist: string; duration: number; artwork: string | null; permalink: string }`
  - `interface PlayerStation { id: PlayerStationId; label: string; genre: string }`
  - `PLAYER_STATIONS: PlayerStation[]`
  - `interface SavedPlayer { stationId: PlayerStationId; trackIndex: number; volume: number; muted: boolean; expanded: boolean }`
  - `DEFAULT_PLAYER: SavedPlayer`
  - `fetchStationTracks(stationId: PlayerStationId, fetchImpl?: typeof fetch): Promise<AudiusTrack[]>`
  - `streamUrl(trackId: string): string`
  - `trackPageUrl(track: AudiusTrack): string`
  - `readSavedPlayer(raw: string | null): SavedPlayer`
  - `nextTrackIndex(index: number, length: number): number`
  - `formatTime(seconds: number): string`
  - `STORAGE_KEYS.PLAYER`

- [ ] **Step 0: Install dependencies (fresh clone has no `node_modules`)**

Run: `npm install`
Expected: exits 0; `node_modules/.bin/vitest`, `tsc`, and `eslint` exist.

- [ ] **Step 1: Add the storage key**

In `src/lib/storage-keys.ts`, add this line inside `STORAGE_KEYS` (after `COMMAND_CENTER_STICKY`):

```ts
  PLAYER: 'samundar-player',
```

- [ ] **Step 2: Write the failing tests**

Create `src/data/__tests__/player.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLAYER,
  fetchStationTracks,
  formatTime,
  nextTrackIndex,
  readSavedPlayer,
  streamUrl,
  trackPageUrl,
  type AudiusTrack,
} from '../player';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

const apiPayload = {
  data: [
    {
      id: 'a',
      title: 'Alpha',
      duration: 100,
      permalink: '/artist/alpha',
      is_streamable: true,
      is_stream_gated: false,
      artwork: { '150x150': 'https://img/a.jpg' },
      user: { name: 'Artist A' },
    },
    {
      id: 'b',
      title: 'Beta',
      duration: 200,
      permalink: '/artist/beta',
      is_streamable: false,
      artwork: {},
      user: { name: 'Artist B' },
    },
    {
      id: 'c',
      title: 'Gamma',
      duration: 300,
      permalink: '/artist/gamma',
      is_streamable: true,
      is_stream_gated: true,
      artwork: {},
      user: { name: 'Artist C' },
    },
  ],
};

describe('nextTrackIndex', () => {
  it('wraps in both directions', () => {
    expect(nextTrackIndex(0, 3)).toBe(0);
    expect(nextTrackIndex(3, 3)).toBe(0);
    expect(nextTrackIndex(4, 3)).toBe(1);
    expect(nextTrackIndex(-1, 3)).toBe(2);
  });

  it('returns 0 for an empty queue', () => {
    expect(nextTrackIndex(5, 0)).toBe(0);
  });
});

describe('formatTime', () => {
  it('formats m:ss and h:mm:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3725)).toBe('1:02:05');
  });

  it('guards invalid input', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('readSavedPlayer', () => {
  it('falls back to defaults for missing or broken data', () => {
    expect(readSavedPlayer(null)).toEqual(DEFAULT_PLAYER);
    expect(readSavedPlayer('{nope')).toEqual(DEFAULT_PLAYER);
  });

  it('rejects unknown stations and clamps numbers', () => {
    const saved = readSavedPlayer(
      JSON.stringify({ stationId: 'nope', trackIndex: -4, volume: 999, muted: 'yes', expanded: 1 })
    );
    expect(saved).toEqual({
      stationId: 'lofi',
      trackIndex: 0,
      volume: 100,
      muted: false,
      expanded: false,
    });
  });

  it('keeps valid values', () => {
    const value = { stationId: 'deep', trackIndex: 3, volume: 40, muted: true, expanded: true };
    expect(readSavedPlayer(JSON.stringify(value))).toEqual(value);
  });
});

describe('fetchStationTracks', () => {
  it('requests the station genre and normalizes playable tracks', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => jsonResponse(apiPayload));
    const tracks = await fetchStationTracks('lofi', fetchMock as unknown as typeof fetch);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('https://api.audius.co/v1/tracks/trending');
    expect(url).toContain('genre=Lo-Fi');
    expect(url).toContain('app_name=ProdigyOS');
    expect(tracks).toEqual([
      {
        id: 'a',
        title: 'Alpha',
        artist: 'Artist A',
        duration: 100,
        artwork: 'https://img/a.jpg',
        permalink: '/artist/alpha',
      },
    ]);
  });

  it('throws on a failed response', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, false, 503));
    await expect(fetchStationTracks('deep', fetchMock as unknown as typeof fetch)).rejects.toThrow(
      'Audius 503'
    );
  });
});

describe('urls', () => {
  it('builds the stream and page urls', () => {
    expect(streamUrl('abc')).toBe(
      'https://api.audius.co/v1/tracks/abc/stream?app_name=ProdigyOS'
    );
    const track: AudiusTrack = {
      id: 'abc',
      title: 'T',
      artist: 'A',
      duration: 1,
      artwork: null,
      permalink: '/artist/t',
    };
    expect(trackPageUrl(track)).toBe('https://audius.co/artist/t');
  });
});
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `npx vitest run src/data/__tests__/player.test.ts`
Expected: FAIL — `src/data/player.ts` does not export `DEFAULT_PLAYER`, `fetchStationTracks`, etc.

- [ ] **Step 4: Rewrite `src/data/player.ts`**

```ts
export type PlayerStationId = 'lofi' | 'deep' | 'synth';

export interface PlayerStation {
  id: PlayerStationId;
  label: string;
  genre: string;
}

export interface AudiusTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artwork: string | null;
  permalink: string;
}

export const PLAYER_STATIONS: PlayerStation[] = [
  { id: 'lofi', label: 'Lofi', genre: 'Lo-Fi' },
  { id: 'deep', label: 'Deep work', genre: 'Ambient' },
  { id: 'synth', label: 'Synth', genre: 'Electronic' },
];

const AUDIUS_API = 'https://api.audius.co/v1';
const AUDIUS_APP_NAME = 'ProdigyOS';

interface AudiusApiTrack {
  id: string;
  title: string;
  duration?: number;
  permalink?: string;
  is_streamable?: boolean;
  is_stream_gated?: boolean;
  artwork?: Record<string, string> | null;
  user?: { name?: string } | null;
}

export function streamUrl(trackId: string): string {
  return `${AUDIUS_API}/tracks/${trackId}/stream?app_name=${AUDIUS_APP_NAME}`;
}

export function trackPageUrl(track: AudiusTrack): string {
  return `https://audius.co${track.permalink}`;
}

export async function fetchStationTracks(
  stationId: PlayerStationId,
  fetchImpl: typeof fetch = fetch
): Promise<AudiusTrack[]> {
  const station = PLAYER_STATIONS.find((s) => s.id === stationId);
  if (!station) return [];
  const url = `${AUDIUS_API}/tracks/trending?app_name=${AUDIUS_APP_NAME}&limit=20&genre=${encodeURIComponent(
    station.genre
  )}`;
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`Audius ${response.status}`);
  const payload = (await response.json()) as { data?: AudiusApiTrack[] };
  return (payload.data ?? [])
    .filter((t) => t.is_streamable === true && t.is_stream_gated !== true)
    .map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.user?.name ?? 'Unknown artist',
      duration: t.duration ?? 0,
      artwork: t.artwork?.['480x480'] ?? t.artwork?.['150x150'] ?? null,
      permalink: t.permalink ?? '',
    }));
}

export interface SavedPlayer {
  stationId: PlayerStationId;
  trackIndex: number;
  volume: number;
  muted: boolean;
  expanded: boolean;
}

export const DEFAULT_PLAYER: SavedPlayer = {
  stationId: 'lofi',
  trackIndex: 0,
  volume: 70,
  muted: false,
  expanded: false,
};

export function readSavedPlayer(raw: string | null): SavedPlayer {
  if (!raw) return DEFAULT_PLAYER;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedPlayer>;
    const stationId = PLAYER_STATIONS.some((s) => s.id === parsed.stationId)
      ? (parsed.stationId as PlayerStationId)
      : DEFAULT_PLAYER.stationId;
    return {
      stationId,
      trackIndex:
        typeof parsed.trackIndex === 'number' && Number.isFinite(parsed.trackIndex)
          ? Math.max(0, Math.trunc(parsed.trackIndex))
          : DEFAULT_PLAYER.trackIndex,
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.min(100, Math.max(0, Math.trunc(parsed.volume)))
          : DEFAULT_PLAYER.volume,
      muted: parsed.muted === true,
      expanded: parsed.expanded === true,
    };
  } catch {
    return DEFAULT_PLAYER;
  }
}

export function nextTrackIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 5: Run the tests again**

Run: `npx vitest run src/data/__tests__/player.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/storage-keys.ts src/data/player.ts src/data/__tests__/player.test.ts
git commit -m "feat(player): add Audius data layer and persistence helpers"
```

---

### Task 2: MusicPlayer component, glass surfaces, dashboard mount

**Files:**
- Create: `src/components/player/MusicPlayer.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: everything produced by Task 1 (`PLAYER_STATIONS`, `fetchStationTracks`, `streamUrl`, `trackPageUrl`, `readSavedPlayer`, `nextTrackIndex`, `formatTime`, `DEFAULT_PLAYER`, types) plus `STORAGE_KEYS.PLAYER`, `cn`, `toast`.
- Produces: `export function MusicPlayer(): JSX.Element` mounted once in the dashboard layout.

- [ ] **Step 1: Add the two keyframe animations**

Append to the end of `src/app/globals.css`:

```css
/* Player — equalizer bars and title marquee (no Tailwind equivalent) */
@keyframes player-eq {
  0%,
  100% {
    transform: scaleY(0.35);
  }
  50% {
    transform: scaleY(1);
  }
}

.player-eq {
  transform-origin: bottom;
  animation: player-eq 0.9s ease-in-out infinite;
}

@keyframes player-marquee {
  0%,
  8% {
    transform: translateX(0);
  }
  92%,
  100% {
    transform: translateX(-50%);
  }
}

.player-marquee {
  animation: player-marquee 9s linear infinite;
}
```

- [ ] **Step 2: Create the component**

Create `src/components/player/MusicPlayer.tsx`:

```tsx
'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Music2,
  Pause,
  Play,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { STORAGE_KEYS } from '@/lib/storage-keys';
import {
  DEFAULT_PLAYER,
  PLAYER_STATIONS,
  fetchStationTracks,
  formatTime,
  nextTrackIndex,
  readSavedPlayer,
  streamUrl,
  trackPageUrl,
  type AudiusTrack,
  type PlayerStationId,
} from '@/data/player';

type Status = 'idle' | 'playing' | 'paused' | 'buffering' | 'error';

const GLASS =
  'border border-white/10 bg-zinc-950/90 supports-[backdrop-filter]:bg-zinc-950/60 backdrop-blur-2xl backdrop-saturate-150';
const GLASS_SHADOW =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_28px_70px_-18px_rgba(0,0,0,0.85)]';

function Art({ src, size, className }: { src: string | null; size: number; className?: string }) {
  if (!src) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/25 to-zinc-800',
          className
        )}
        style={{ width: size, height: size }}
      >
        <Music2 className="text-amber-400/70" style={{ width: size / 2.5, height: size / 2.5 }} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn('shrink-0 rounded-lg object-cover', className)}
    />
  );
}

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="player-eq w-[2px] rounded-full bg-amber-400"
          style={{
            height: 10,
            animationDelay: `${i * 120}ms`,
            animationPlayState: playing ? 'running' : 'paused',
            opacity: playing ? 1 : 0.35,
          }}
        />
      ))}
    </span>
  );
}

export function MusicPlayer() {
  const reduceMotion = useReducedMotion();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const wantPlayRef = React.useRef(false);
  const loadedIdRef = React.useRef<string | null>(null);
  const failedRef = React.useRef(new Set<string>());
  const stationRef = React.useRef<PlayerStationId>(DEFAULT_PLAYER.stationId);
  const queueRef = React.useRef<AudiusTrack[]>([]);
  const indexRef = React.useRef(0);
  const trackRef = React.useRef<AudiusTrack | null>(null);
  const activeItemRef = React.useRef<HTMLButtonElement | null>(null);

  const [restored, setRestored] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [stationId, setStationId] = React.useState<PlayerStationId>(DEFAULT_PLAYER.stationId);
  const [trackIndex, setTrackIndex] = React.useState(0);
  const [volume, setVolume] = React.useState(DEFAULT_PLAYER.volume);
  const [muted, setMuted] = React.useState(false);
  const [queues, setQueues] = React.useState<Partial<Record<PlayerStationId, AudiusTrack[]>>>({});
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>('idle');
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  stationRef.current = stationId;
  const queue = queues[stationId] ?? [];
  queueRef.current = queue;
  const track = queue[trackIndex] ?? null;
  trackRef.current = track;
  indexRef.current = trackIndex;

  const station = PLAYER_STATIONS.find((s) => s.id === stationId) ?? PLAYER_STATIONS[0];
  const playing = status === 'playing' || status === 'buffering';
  const shownDuration = Number.isFinite(duration) && duration > 0 ? duration : track?.duration ?? 0;

  React.useEffect(() => {
    const saved = readSavedPlayer(localStorage.getItem(STORAGE_KEYS.PLAYER));
    setStationId(saved.stationId);
    setTrackIndex(saved.trackIndex);
    setVolume(saved.volume);
    setMuted(saved.muted);
    setExpanded(saved.expanded);
    setRestored(true);
  }, []);

  React.useEffect(() => {
    if (!restored) return;
    localStorage.setItem(
      STORAGE_KEYS.PLAYER,
      JSON.stringify({ stationId, trackIndex, volume, muted, expanded })
    );
  }, [restored, stationId, trackIndex, volume, muted, expanded]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
    audio.muted = muted;
  }, [volume, muted]);

  const loadStation = React.useCallback(async (id: PlayerStationId) => {
    setLoading(true);
    setLoadError(null);
    try {
      const tracks = await fetchStationTracks(id);
      if (stationRef.current !== id) return;
      if (tracks.length === 0) {
        setLoadError('No playable tracks in this station.');
        return;
      }
      setQueues((q) => ({ ...q, [id]: tracks }));
      setTrackIndex((i) => Math.min(i, tracks.length - 1));
    } catch {
      if (stationRef.current === id) setLoadError("Can't reach Audius. Check the network and retry.");
    } finally {
      if (stationRef.current === id) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!restored || queues[stationId] !== undefined) return;
    void loadStation(stationId);
  }, [restored, stationId, queues, loadStation]);

  React.useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [trackIndex, expanded]);

  const playIndex = React.useCallback((idx: number) => {
    const next = queueRef.current[idx];
    if (!next) return;
    const audio = audioRef.current;
    wantPlayRef.current = true;
    setTrackIndex(idx);
    setTime(0);
    setDuration(next.duration);
    setStatus('buffering');
    if (!audio) return;
    loadedIdRef.current = next.id;
    audio.src = streamUrl(next.id);
    audio.load();
    void audio.play().catch(() => {
      wantPlayRef.current = false;
      setStatus('paused');
    });
  }, []);

  const handleFailure = React.useCallback(() => {
    const q = queueRef.current;
    const current = trackRef.current;
    if (!current || q.length === 0) return;
    failedRef.current.add(current.id);
    let candidate: number | null = null;
    let idx = nextTrackIndex(indexRef.current + 1, q.length);
    for (let n = 0; n < q.length; n++) {
      if (!failedRef.current.has(q[idx].id)) {
        candidate = idx;
        break;
      }
      idx = nextTrackIndex(idx + 1, q.length);
    }
    if (candidate === null) {
      wantPlayRef.current = false;
      setStatus('error');
      setLoadError('Every track in this station failed to play.');
      return;
    }
    toast.error('Track unavailable', `Skipping “${current.title}”.`);
    playIndex(candidate);
  }, [playIndex]);

  const changingId = track?.id ?? null;
  React.useEffect(() => {
    if (!changingId || !wantPlayRef.current) return;
    if (loadedIdRef.current === changingId) return;
    const audio = audioRef.current;
    if (!audio) return;
    loadedIdRef.current = changingId;
    setTime(0);
    setDuration(trackRef.current?.duration ?? 0);
    audio.src = streamUrl(changingId);
    audio.load();
    void audio.play().catch(() => {
      wantPlayRef.current = false;
      setStatus('paused');
    });
  }, [changingId]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onPlay = () => setStatus('playing');
    const onPause = () => setStatus('paused');
    const onWaiting = () => setStatus('buffering');
    const onEnded = () => {
      const q = queueRef.current;
      if (q.length === 0) return;
      playIndex(nextTrackIndex(indexRef.current + 1, q.length));
    };
    const onError = () => {
      if (!audio.currentSrc) return;
      handleFailure();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('durationchange', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('durationchange', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [handleFailure, playIndex]);

  const toggle = React.useCallback(() => {
    const audio = audioRef.current;
    const current = trackRef.current;
    if (!current) {
      wantPlayRef.current = true;
      if (loadError) {
        failedRef.current.clear();
        void loadStation(stationRef.current);
      }
      return;
    }
    if (!audio || audio.paused) {
      wantPlayRef.current = true;
      if (audio && loadedIdRef.current !== current.id) {
        loadedIdRef.current = current.id;
        audio.src = streamUrl(current.id);
        audio.load();
        setTime(0);
        setDuration(current.duration);
      }
      void audio?.play().catch(() => {
        wantPlayRef.current = false;
        setStatus('paused');
        toast.error('Playback blocked', 'Tap play again to start audio.');
      });
    } else {
      wantPlayRef.current = false;
      audio.pause();
    }
  }, [loadError, loadStation]);

  const stepTrack = (dir: 1 | -1) => {
    if (queueRef.current.length === 0) return;
    playIndex(nextTrackIndex(indexRef.current + dir, queueRef.current.length));
  };

  const switchStation = (id: PlayerStationId) => {
    if (id === stationId) return;
    failedRef.current.clear();
    loadedIdRef.current = null;
    wantPlayRef.current = playing;
    setStationId(id);
    setTrackIndex(0);
    setTime(0);
    setDuration(0);
    setStatus(playing ? 'buffering' : 'idle');
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setTime(value);
  };

  const retry = () => {
    failedRef.current.clear();
    setLoadError(null);
    void loadStation(stationId);
  };

  return (
    <>
      <audio ref={audioRef} preload="metadata" className="hidden" />

      <AnimatePresence>
        {expanded && (
          <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-3 md:bottom-24">
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={
                reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }
              }
              className={cn(
                'pointer-events-auto relative w-full max-w-[560px] overflow-hidden rounded-2xl',
                GLASS,
                GLASS_SHADOW
              )}
              aria-label="Music player"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.07] to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-8 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl"
                aria-hidden
              />

              <div className="relative flex items-start gap-4 p-4 pb-3">
                <div className="relative h-24 w-24 shrink-0">
                  {track?.artwork && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.artwork}
                      alt=""
                      className="absolute inset-0 h-full w-full scale-125 rounded-xl object-cover opacity-40 blur-xl"
                      aria-hidden
                    />
                  )}
                  <Art src={track?.artwork ?? null} size={96} className="relative" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-amber-400/90">
                    <Music2 className="h-3 w-3" />
                    {station.label}
                  </div>
                  {track ? (
                    <>
                      <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                        {track.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{track.artist}</p>
                      {track.permalink && (
                        <a
                          href={trackPageUrl(track)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-amber-400"
                        >
                          Open on Audius
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
                      {loading ? 'Loading station…' : loadError ?? 'Press play to start'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  aria-label="Collapse player"
                  className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="relative px-4">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, Math.round(shownDuration))}
                  step={1}
                  value={Math.min(Math.round(time), Math.max(1, Math.round(shownDuration)))}
                  onChange={(e) => seek(Number(e.target.value))}
                  aria-label="Seek"
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-amber-400 transition-all hover:h-1.5"
                />
                <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-500">
                  <span>{formatTime(Math.min(time, shownDuration))}</span>
                  <span>{formatTime(shownDuration)}</span>
                </div>
              </div>

              <div className="relative flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => stepTrack(-1)}
                    aria-label="Previous track"
                    className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    onClick={toggle}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95"
                  >
                    {status === 'buffering' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : playing ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => stepTrack(1)}
                    aria-label="Next track"
                    className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      setMuted(false);
                      setVolume(Number(e.target.value));
                    }}
                    aria-label="Volume"
                    className="w-24 cursor-pointer accent-amber-400"
                  />
                </div>
              </div>

              <div className="relative flex gap-1.5 px-4 pb-3">
                {PLAYER_STATIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => switchStation(s.id)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] transition-colors',
                      s.id === stationId
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {loadError && (
                <div className="relative mx-4 mb-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-[11px] text-red-300">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{loadError}</span>
                  <button
                    onClick={retry}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-red-200 transition-colors hover:bg-red-500/10"
                  >
                    <RotateCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              )}

              <div className="relative border-t border-white/5 bg-white/[0.02]">
                <div className="max-h-52 overflow-y-auto p-1.5">
                  {loading && queue.length === 0 &&
                    [0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                        <div className="h-7 w-7 animate-pulse rounded-md bg-white/5" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-2/3 animate-pulse rounded bg-white/5" />
                          <div className="h-2 w-1/3 animate-pulse rounded bg-white/5" />
                        </div>
                      </div>
                    ))}
                  {!loading && queue.length === 0 && (
                    <p className="px-3 py-4 text-center text-[11px] text-zinc-500">
                      No tracks loaded.
                    </p>
                  )}
                  {queue.map((t, i) => (
                    <button
                      key={t.id}
                      ref={i === trackIndex ? activeItemRef : undefined}
                      onClick={() => playIndex(i)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors',
                        i === trackIndex ? 'bg-white/5' : 'hover:bg-white/5'
                      )}
                    >
                      <Art src={t.artwork} size={28} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-[11px]',
                            i === trackIndex ? 'text-amber-300' : 'text-zinc-200'
                          )}
                        >
                          {t.title}
                        </p>
                        <p className="truncate text-[10px] text-zinc-500">{t.artist}</p>
                      </div>
                      <span className="text-[10px] tabular-nums text-zinc-500">
                        {formatTime(t.duration)}
                      </span>
                      {i === trackIndex && playing && <Equalizer playing />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 md:bottom-5">
        <div
          className={cn(
            'flex w-full max-w-xs items-center gap-2 rounded-full px-2 py-1.5',
            GLASS,
            GLASS_SHADOW
          )}
        >
          <Art src={track?.artwork ?? null} size={36} />
          <div className="min-w-0 flex-1">
            {track ? (
              <div className="relative overflow-hidden">
                <div
                  className={cn(
                    'flex w-max gap-6',
                    playing && !reduceMotion && track.title.length > 24 && 'player-marquee'
                  )}
                >
                  <span className="whitespace-nowrap text-xs font-medium text-zinc-100">
                    {track.title}
                  </span>
                  {track.title.length > 24 && (
                    <span className="whitespace-nowrap text-xs font-medium text-zinc-100" aria-hidden>
                      {track.title}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="truncate text-xs font-medium text-zinc-100">
                {loadError ? 'Player offline' : `${station.label} radio`}
              </p>
            )}
            <p className="truncate text-[10px] text-zinc-500">
              {track ? track.artist : loading ? 'Loading…' : loadError ? 'Open to retry' : 'Tap play'}
            </p>
          </div>
          <Equalizer playing={playing} />
          <button
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-zinc-950 transition-transform hover:scale-105 active:scale-95"
          >
            {loading && !track ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : playing ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="ml-0.5 h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse player' : 'Expand player'}
            aria-expanded={expanded}
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Mount it in the dashboard layout**

In `src/app/(dashboard)/layout.tsx`:
1. Add the import next to the other imports:

```tsx
import { MusicPlayer } from '@/components/player/MusicPlayer';
```

2. Give the main scroll container bottom padding so the pill never covers content:

```tsx
<main className="flex-1 overflow-y-auto pb-24 md:pb-20">
```

3. Render the player after `<CompanionAvatar />`:

```tsx
<CompanionAvatar />
<MusicPlayer />
```

- [ ] **Step 4: Typecheck and lint the touched files**

Run: `npm run typecheck`
Expected: no errors (the repo ignores build errors but `tsc --noEmit` must pass).

Run: `npm run lint`
Expected: no errors (warnings tolerated).

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`, open the dashboard (sign-in may be required).

Check, in order:
1. Pill appears bottom-center with artwork/title; no layout shift on reload.
2. Play → audio starts within a few seconds (Audius CDN first load can take 1–3 s).
3. Expand → glass panel renders above the pill, backdrop blur visible, amber accents only.
4. Navigate between dashboard pages → music keeps playing.
5. Next/prev, seek, volume, mute, station switch (Lofi → Deep work → Synth) work.
6. Reload → same station/track/volume restored, paused.
7. Expand state persists across reload.
8. DevTools offline → expand → "Can't reach Audius" + Retry; going online + Retry loads tracks.

- [ ] **Step 6: Commit**

```bash
git add src/components/player/MusicPlayer.tsx "src/app/(dashboard)/layout.tsx" src/app/globals.css
git commit -m "feat(player): add global glass Spotify-style music dock"
```

---

### Task 3: Full verification sweep

**Files:**
- Modify: any file needed for fixes only.

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: green test/typecheck/lint, verified player behavior.

- [ ] **Step 1: Run the whole suite**

Run: `npm run test`
Expected: all suites pass, including `src/data/__tests__/player.test.ts`.

Run: `npm run typecheck`
Expected: zero errors.

Run: `npm run lint`
Expected: zero errors.

- [ ] **Step 2: Fix any failures with the smallest diff**

Common expected issues and fixes:
- `react-hooks/exhaustive-deps` warnings → add the missing dep or move the value into a ref; do not disable the rule.
- Tailwind arbitrary value with `supports-[backdrop-filter]` unsupported by the installed version → replace with inline `style={{ backdropFilter: 'blur(24px) saturate(150%)' }}` on the glass containers.
- Audius returning zero playable tracks for a genre → verify with `curl` (see below) and, if the genre is empty, swap the station genre in `PLAYER_STATIONS`.

- [ ] **Step 3: Recheck the API assumptions**

Run (needs network):

```bash
node -e "fetch('https://api.audius.co/v1/tracks/trending?app_name=ProdigyOS&limit=3&genre=Lo-Fi').then(r=>r.json()).then(j=>console.log(j.data.map(t=>t.is_streamable)))"
```

Expected: `[ true, true, true ]` (or an array of booleans with at least one `true`).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(player): address verification findings"
```

Only commit if Step 2 changed something.

---

## Self-review notes

- Spec coverage: source engine (Task 2), stations/queue + auto-scroll (Tasks 1–2), persistence (Tasks 1–2), collapsed pill + expanded dock + glass (Task 2), a11y labels/range inputs (Task 2), tests (Task 1), verification (Task 3).
- No placeholders: every code step contains the full code.
- Type consistency: `AudiusTrack`, `SavedPlayer`, `PlayerStationId`, and helper signatures match between tasks.
- Deliberately not implemented: marquee measurement (uses a 24-char heuristic), Media Session API, queue reordering, focus-mode integration.
