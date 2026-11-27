'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  ChevronDown,
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
  'border border-white/15 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150';
const GLASS_SHADOW =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(255,255,255,0.06),0_30px_80px_-24px_rgba(0,0,0,0.9)]';

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

  const queue = queues[stationId] ?? [];
  const track = queue[trackIndex] ?? null;

  React.useEffect(() => {
    stationRef.current = stationId;
    queueRef.current = queues[stationId] ?? [];
    trackRef.current = (queues[stationId] ?? [])[trackIndex] ?? null;
    indexRef.current = trackIndex;
  }, [stationId, queues, trackIndex]);

  const station = PLAYER_STATIONS.find((s) => s.id === stationId) ?? PLAYER_STATIONS[0];
  const playing = status === 'playing' || status === 'buffering';
  const shownDuration = Number.isFinite(duration) && duration > 0 ? duration : track?.duration ?? 0;

  React.useEffect(() => {
    const saved = readSavedPlayer(localStorage.getItem(STORAGE_KEYS.PLAYER));
    setStationId(saved.stationId);
    setTrackIndex(saved.trackIndex);
    setVolume(saved.volume);
    setMuted(saved.muted);
    setRestored(true);
  }, []);

  React.useEffect(() => {
    if (!restored) return;
    localStorage.setItem(
      STORAGE_KEYS.PLAYER,
      JSON.stringify({ stationId, trackIndex, volume, muted })
    );
  }, [restored, stationId, trackIndex, volume, muted]);

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

      <div className="relative">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Close music player' : 'Open music player'}
          aria-expanded={expanded}
          title="Music"
          className={cn(
            'relative flex items-center justify-center rounded-lg border p-1.5 backdrop-blur-md transition-colors',
            expanded
              ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10 hover:text-zinc-100'
          )}
        >
          <Music2 className="h-3.5 w-3.5" />
          {playing && (
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
              <motion.section
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: -8, scale: 0.94, borderRadius: 32, filter: 'blur(10px)' }
                }
                animate={{ opacity: 1, y: 0, scale: 1, borderRadius: 20, filter: 'blur(0px)' }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -8, scale: 0.94, borderRadius: 32, filter: 'blur(10px)' }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 340, damping: 28, mass: 0.7 }
                }
                style={{ transformOrigin: 'top right' }}
                className={cn(
                  'fixed left-2 right-2 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden rounded-[20px] ring-1 ring-inset ring-white/10 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]',
                  GLASS,
                  GLASS_SHADOW
                )}
                aria-label="Music player"
              >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.12] to-transparent"
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
                  aria-label="Close music player"
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
                  <motion.button
                    onClick={toggle}
                    whileTap={{ scale: 0.9 }}
                    aria-label={playing ? 'Pause' : 'Play'}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 transition-transform hover:scale-105"
                  >
                    {status === 'buffering' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : playing ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" />
                    )}
                  </motion.button>
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
                  {loading &&
                    queue.length === 0 &&
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
                    <motion.button
                      key={t.id}
                      ref={i === trackIndex ? activeItemRef : undefined}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.18, delay: Math.min(i, 8) * 0.025 }
                      }
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
                    </motion.button>
                  ))}
                </div>
              </div>
              </motion.section>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
