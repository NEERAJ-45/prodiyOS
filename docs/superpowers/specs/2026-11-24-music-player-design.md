# Prodigy Player — Global Spotify-style Music Dock

Date: 2026-11-24
Status: Approved (rev 2 — Audius audio source)

## Goal

One persistent, Spotify-style music player available on every dashboard page. Music comes from
the Audius public API, played through a native `<audio>` element. The UI is custom and matches
ProdigyOS: dark zinc glass with amber accents.

## Non-goals

- YouTube playback (removed: fails behind firewalls that block youtube.com).
- Spotify OAuth / Web Playback SDK.
- Uploading or hosting local audio files.
- Search, playlists, accounts, queue reordering.
- Changing the Focus page's existing player (kept as is).

## Context

- `src/data/player.ts` currently holds an unused YouTube station stub; it will be repurposed for
  Audius station config and pure helpers.
- Audius API verified from this network, no key required:
  - `GET https://api.audius.co/v1/tracks/trending?genre=<genre>&limit=20&app_name=ProdigyOS`
    → 200, `Access-Control-Allow-Origin: *`, tracks with `id`, `title`, `user.name`,
    `duration` (seconds), `artwork['480x480']`, `permalink`, `is_streamable`, `is_stream_gated`.
  - `GET https://api.audius.co/v1/tracks/<id>/stream?app_name=ProdigyOS` → 302 to CDN audio.
  - Artwork URLs are plain JPEGs on a CDN.
- `src/app/(dashboard)/layout.tsx` persists across dashboard navigation, so a player mounted
  there keeps audio alive while routes change.
- The app already uses framer-motion, lucide-react, Tailwind v4 tokens, and `cn()`.
- Tests live in `__tests__` folders, run by Vitest (`npm run test`).

## Architecture

| File | Change |
| --- | --- |
| `src/components/player/MusicPlayer.tsx` | New client component: queue fetching, `<audio>` control, collapsed pill, expanded dock, queue list, error states. |
| `src/data/player.ts` | Replace YouTube stub with `PLAYER_STATIONS` (label → Audius genre), `AudiusTrack`, `fetchStationTracks`, `streamUrl`, `DEFAULT_PLAYER`, `nextTrackIndex`, `readSavedPlayer`, `formatTime`. |
| `src/app/(dashboard)/layout.tsx` | Mount `<MusicPlayer />`; add bottom padding so the pill never covers page content. |
| `src/app/globals.css` | Equalizer-bar keyframes; marquee animation. |
| `src/data/__tests__/player.test.ts` | Unit tests for helpers (including mocked fetch normalization). |

One component file on purpose: playback and UI are tightly coupled and there is exactly one
consumer. No store, context, proxy route, or extra abstraction.

## Audio engine

- A single `HTMLAudioElement` created in a ref; `crossOrigin` not needed for playback.
- Stations map to Audius genres: Lofi → `Lo-Fi`, Deep work → `Ambient`, Synth → `Electronic`.
- On first selection of a station (and on Retry), fetch trending tracks with
  `app_name=ProdigyOS&limit=20`; drop tracks that are not `is_streamable` or are
  `is_stream_gated`; keep the normalized queue in an in-memory `Map` for the session.
- Playback starts only from a user gesture (`audio.play()` on click).
- Events mapped to `idle | loading | playing | paused | buffering | error` via
  `play/pause/waiting/canplay/ended/error`.
- Progress and duration come from `audio.currentTime` / `audio.duration`; `timeupdate` drives the
  progress bar, `seeked` reconciles after dragging. Tracks are VOD, so seeking is always enabled.
- Volume 0–100 ↔ `audio.volume`; mute toggles `audio.muted`.
- `ended` advances via `nextTrackIndex` (wraps within the station).
- A track that fails mid-play (`error` event) shows a toast and auto-advances. After all tracks
  in the station fail, show an error pill with Retry.
- If the trending fetch fails (offline/firewall), show an error pill: "Can't reach Audius" +
  Retry. Previously fetched queues for other stations remain playable.
- On stream start, set `audio.src` to `streamUrl(track)` and call `play()`.

## State and persistence

```ts
interface SavedPlayer {
  stationId: string; // 'lofi' | 'deep' | 'synth'
  trackIndex: number; // clamped to station queue length
  volume: number; // 0–100, default 70
  muted: boolean;
  expanded: boolean;
}
```

- Key: `localStorage['samundar-player']`.
- Restored on mount, always paused; the active station's queue is refetched (not persisted).
- Invalid JSON or unknown station falls back to `DEFAULT_PLAYER` (lofi, track 0, volume 70).
- Writes happen on station/track/volume/mute/expanded change.
- Session persistence is the in-memory queue Map; first fetch per station per page load.

## UI

### Collapsed pill (default)

- Fixed bottom-center, `z-30`, ~320 px, rounded-full.
- Contents: album art (Audius artwork or a gradient placeholder), marquee title, 4-bar equalizer
  (animates only while playing), play/pause, expand chevron.
- Style: `bg-zinc-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl`, amber accents.

### Expanded dock

- ~560 px wide, rounded-2xl glass card above the pill position; on `<md` it becomes a
  full-width bottom sheet that clears the floating mobile nav (`bottom: 5rem` + safe-area).
- Header: 96 px art with a blurred copy of the same art as amber-tinted glow, title, artist,
  station badge, "Open on Audius" link (`https://audius.co` + `track.permalink`), collapse button.
- Progress row: 3 px track that thickens on hover; elapsed/duration labels.
- Controls: previous, play/pause, next, volume slider with mute toggle.
- Station pills: Lofi / Synth / Deep work (active = amber).
- Queue: station tracks with active highlight (art, title, artist, duration); auto-scrolls to
  the active item; clicking an item plays it.
- Loading state: skeleton rows in the queue while the trending fetch is in flight.
- Error state: inline message + Retry button (replaces the queue).

### Aesthetics and motion

- Amber (`amber-400/500`) is the only accent; no Spotify green.
- framer-motion spring for expand/collapse; equalizer and marquee are CSS keyframes.
- `prefers-reduced-motion` (via `useReducedMotion`) disables the spring, equalizer, and marquee.
- Focus-visible rings on every control; `aria-label`s; the progress bar is a real
  `<input type="range">`.

## Edge cases

- Navigation between dashboard pages must not interrupt playback (layout mount).
- Switching station keeps playing if audio was already playing, starting at that station's
  track 0 once its queue arrives; otherwise loads paused.
- Volume/mute/expanded persist.
- Audius track with no artwork → gradient placeholder with a music glyph.
- Track switching while a fetch is in flight ignores the stale response (station-id guard).
- Modals/palette (z-50) render above the dock; the dock never blocks the mobile nav.
- No audio overlap handling with the Focus page player (user-controlled, out of scope).

## Testing and verification

- Vitest: `nextTrackIndex` wraps; `readSavedPlayer` handles null/garbage/unknown
  station/clamping; `formatTime` for m:ss and h:mm:ss; `fetchStationTracks` normalizes the
  Audius payload (mocked fetch), drops non-streamable/gated tracks, and builds stream URLs.
- Manual smoke: play → navigate pages → song continues; pause/seek/volume; station switching;
  reload restores station, paused; offline → Audius error + Retry; broken track skips.
- Commands: `npm run test`, `npm run typecheck`, `npm run lint`.

## Risks

- Audius is a third-party service; discovery-node or CDN failures degrade to the error pill.
  Different devices may be routed to different discovery nodes.
- Trending content is community-uploaded; an occasional track may be explicit or low quality.
- Hotlinked artwork depends on Audius CDNs allowing public access (verified today).
- If the whole network is whitelist-only, no foreign API can work; local files would be the only
  offline option (explicitly out of scope).
