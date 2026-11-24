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
