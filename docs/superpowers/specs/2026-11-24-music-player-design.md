# Prodigy Player — Global Spotify-style Music Dock

Date: 2026-11-24
Status: Approved

## Goal

One persistent, Spotify-style music player available on every dashboard page. Playback is
YouTube-backed, the UI is custom, and it matches ProdigyOS: dark zinc glass with amber accents.

## Non-goals

- Spotify OAuth / Web Playback SDK.
- Uploading or hosting audio files.
- Queue reordering, search, playlists, accounts.
- Changing the Focus page's existing player (kept as is).

## Context

- `src/data/player.ts` already defines `STATIONS` (Lofi, Synth, Deep work) with YouTube
  `videoId`s plus `extractVideoId()`. Nothing renders it today.
- `public/audio/ambient/*.m4a` are Git LFS pointers; they are not reliable playback sources.
- `src/app/(dashboard)/layout.tsx` persists across dashboard navigation, so a player mounted
  there keeps audio alive while routes change.
- The app already uses framer-motion, lucide-react, Tailwind v4 tokens, and `cn()`.
- Tests live in `__tests__` folders, run by Vitest (`npm run test`).

## Architecture

| File | Change |
| --- | --- |
| `src/components/player/MusicPlayer.tsx` | New client component: YT IFrame API loader, playback state, collapsed pill, expanded dock, queue, custom link. |
| `src/data/player.ts` | Add pure helpers: `DEFAULT_PLAYER`, `nextTrackIndex`, `readSavedPlayer`, `formatTime`. |
| `src/app/(dashboard)/layout.tsx` | Mount `<MusicPlayer />`; add bottom padding so the pill never covers page content. |
| `src/app/globals.css` | Equalizer-bar keyframes; marquee animation. |
| `src/data/__tests__/player.test.ts` | Unit tests for the pure helpers. |

One component file on purpose: playback and UI are tightly coupled and there is exactly one
consumer. No store, context, or extra abstraction.

## Playback engine

- Load `https://www.youtube.com/iframe_api` once (module-level singleton promise); render a
  hidden 1×1 host element.
- Player vars: `controls: 0`, `disablekb: 1`, `playsinline: 1`, `rel: 0`.
- Start paused. Playback begins only from a user click (autoplay policy).
- `onStateChange` maps to `idle | loading | playing | paused | buffering | error`.
- While playing, poll `getCurrentTime()` / `getDuration()` every 500 ms.
- `getDuration() === 0` → treat as live: show a LIVE badge, hide the seek track.
- Volume 0–100 maps to `setVolume`; mute toggles `mute()/unMute()`.
- Track end (`ENDED`) advances via `nextTrackIndex` (wraps within the station).
- Track change uses `loadVideoById`.
- `onError` codes 100/101/150 (unavailable / embed-blocked) → toast + auto-advance. If every
  track in the station fails, show an error pill with Retry. Custom tracks do not auto-advance.
- Script fails to load (offline/blocked) → error pill with Retry; UI stays usable.

## State and persistence

```ts
interface SavedPlayer {
  stationId: string; // must match a STATIONS id
  trackIndex: number; // clamped to station length
  volume: number; // 0–100, default 70
  muted: boolean;
  expanded: boolean;
}
```

- Key: `localStorage['samundar-player']`.
- Restored on mount, always paused.
- Invalid JSON or unknown station falls back to `DEFAULT_PLAYER` (lofi, track 0, volume 70).
- Writes happen on station/track/volume/mute/expanded change (cheap, debounced by React state).
- A custom link is session-only: while active it is the single queue item; picking a station
  discards it.

## UI

### Collapsed pill (default)

- Fixed bottom-center, `z-30`, ~320 px, rounded-full.
- Contents: album art (YouTube thumbnail), marquee title, 4-bar equalizer (animates only while
  playing), play/pause, expand chevron.
- Style: `bg-zinc-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl`, amber accents.

### Expanded dock

- ~560 px wide, rounded-2xl glass card above the pill position; on `<md` it becomes a
  full-width bottom sheet that clears the floating mobile nav (`bottom: 5rem` + safe-area).
- Header: 96 px art with a blurred copy of the same art as amber-tinted glow, title, artist,
  album, station badge, "Open on YouTube" link, collapse button.
- Progress row: 3 px track that thickens on hover; elapsed/duration labels; hidden seek for
  live streams (LIVE badge instead).
- Controls: previous, play/pause, next, volume slider with mute toggle.
- Station pills: Lofi / Synth / Deep work (active = amber).
- Queue: station tracks with active highlight; auto-scrolls to the active item.
- Custom link: small input + play button; validated with `extractVideoId`; invalid input shows
  an inline error.
- Album art uses a plain `<img>` with `https://i.ytimg.com/vi/<id>/hqdefault.jpg` (same pattern as
  `CompanionAvatar`); no `next.config` change.

### Aesthetics and motion

- Amber (`amber-400/500`) is the only accent; no Spotify green.
- framer-motion spring for expand/collapse; equalizer and marquee are CSS keyframes.
- `prefers-reduced-motion` (via `useReducedMotion`) disables the spring, equalizer, and marquee.
- Focus-visible rings on every control; `aria-label`s; the progress bar is a real `<input
  type="range">` when seekable.

## Edge cases

- Navigation between dashboard pages must not interrupt playback (layout mount).
- Switching station resets to its first track and plays if something was already playing.
- Volume/mute persist; expanded state persists.
- iOS: iframe stays in the DOM with `playsinline`.
- Modals/palette (z-50) render above the dock; the dock never blocks the mobile nav.
- No audio overlap handling with the Focus page player (user-controlled, out of scope).

## Testing and verification

- Vitest: `nextTrackIndex` wraps correctly; `readSavedPlayer` handles null/garbage/unknown
  station/clamping; `formatTime` for m:ss and h:mm:ss.
- Manual smoke: play → navigate pages → song continues; pause/seek/volume; live station shows
  LIVE; reload restores station, paused; blocked/unavailable video skips.
- Commands: `npm run test`, `npm run typecheck`, `npm run lint`.

## Risks

- YouTube can serve ads inside the hidden iframe; ad audio is audible and progress may drift
  briefly. Accepted.
- Region/embed restrictions can make some station videos unplayable; auto-skip plus Retry
  covers it.
- YT IFrame API is third-party and unversioned; failures degrade to the error pill.
