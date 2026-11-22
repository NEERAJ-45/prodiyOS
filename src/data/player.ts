export interface PlayerTrack {
  title: string;
  artist: string;
  album: string;
  videoId: string;
}

export interface PlayerStation {
  id: string;
  label: string;
  tracks: PlayerTrack[];
}

export const STATIONS: PlayerStation[] = [
  {
    id: 'lofi',
    label: 'Lofi',
    tracks: [
      { title: 'lofi hip hop radio', artist: 'Lofi Girl', album: 'beats to relax/study to', videoId: 'jfKfPfyJRdk' },
      { title: 'chillhop radio', artist: 'Chillhop Music', album: 'jazzy & lofi beats', videoId: '5yx6BWlEVcY' },
    ],
  },
  {
    id: 'synth',
    label: 'Synth',
    tracks: [
      { title: 'synthwave radio', artist: 'Lofi Girl', album: 'beats to chill/game to', videoId: '4xDzrJKXOOY' },
    ],
  },
  {
    id: 'deep',
    label: 'Deep work',
    tracks: [
      { title: 'deep focus', artist: 'Ambient', album: 'music for concentration', videoId: 'lTRiuFIWV54' },
      { title: 'rain & piano', artist: 'Study Ambience', album: 'rainy night study', videoId: 'n61ULEU7CO0' },
    ],
  },
];

export function extractVideoId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1, 12) || null;
    const v = url.searchParams.get('v');
    if (v) return v.slice(0, 11);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => ['embed', 'shorts', 'live'].includes(p));
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].slice(0, 11);
  } catch {
    return null;
  }
  return null;
}
