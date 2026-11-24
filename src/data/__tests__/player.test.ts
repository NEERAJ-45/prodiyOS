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
