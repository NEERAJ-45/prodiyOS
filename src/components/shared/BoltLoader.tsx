'use client';

import { useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

const BOLT_PATH =
  'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z';

interface BoltLoaderProps {
  label?: string;
  stage?: string;
  progress?: number;
}

export function BoltLoader({
  label = 'Loading',
  stage = 'Initializing',
  progress,
}: BoltLoaderProps) {
  const isDeterminate = typeof progress === 'number' && Number.isFinite(progress);
  const clamped = isDeterminate ? Math.min(100, Math.max(0, progress)) : 0;
  const reduceMotion = useReducedMotion();

  const rawProgress = useMotionValue(clamped);
  const spring = useSpring(rawProgress, { stiffness: 90, damping: 22, mass: 0.6 });
  const inset = useTransform(spring, (value) => 100 - value);
  const clipPath = useMotionTemplate`inset(${inset}% 0% 0% 0%)`;
  const percentText = useTransform(spring, (value) => `${String(Math.round(value)).padStart(2, '0')}%`);

  useEffect(() => {
    rawProgress.set(clamped);
  }, [clamped, rawProgress]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] px-6"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          aria-hidden
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.45, 0.8, 0.45], scale: [0.95, 1.06, 0.95] }
          }
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-16 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.18),transparent_70%)] blur-2xl md:-inset-20"
        />

        <div
          role={isDeterminate ? 'progressbar' : undefined}
          aria-valuemin={isDeterminate ? 0 : undefined}
          aria-valuemax={isDeterminate ? 100 : undefined}
          aria-valuenow={isDeterminate ? Math.round(clamped) : undefined}
          aria-label={isDeterminate ? label : undefined}
          className="relative h-28 w-28 md:h-36 md:w-36"
        >
          <Zap
            aria-hidden
            className="absolute inset-0 h-full w-full"
            stroke="#1a1a1a"
            strokeWidth={0.85}
            fill="#141414"
          />

          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={isDeterminate && !reduceMotion ? { clipPath } : undefined}
            animate={
              isDeterminate
                ? undefined
                : reduceMotion
                  ? { clipPath: 'inset(0% 0% 0% 0%)' }
                  : {
                      clipPath: [
                        'inset(100% 0% 0% 0%)',
                        'inset(0% 0% 0% 0%)',
                        'inset(0% 0% 0% 0%)',
                        'inset(100% 0% 0% 0%)',
                      ],
                    }
            }
            transition={
              isDeterminate
                ? undefined
                : { duration: 2.2, times: [0, 0.6, 0.8, 1], repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <Zap
              className="h-full w-full drop-shadow-[0_0_12px_rgba(250,204,21,0.45)]"
              stroke="#d4ad62"
              strokeWidth={0.85}
              fill="#d4ad62"
            />
          </motion.div>

          {!isDeterminate && !reduceMotion && (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              className="absolute inset-0 h-full w-full"
            >
              <motion.path
                d={BOLT_PATH}
                stroke="#e3c48c"
                strokeWidth={0.5}
                strokeLinecap="round"
                initial={{ pathLength: 0.18, pathOffset: 0 }}
                animate={{ pathOffset: [0, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8, ease: 'linear' }}
              />
            </svg>
          )}
        </div>

        <motion.p
          aria-hidden
          animate={reduceMotion ? undefined : { backgroundPosition: ['120% 0%', '-120% 0%'] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
          className="relative mt-8 pl-[0.7em] text-xs font-semibold uppercase tracking-[0.7em]"
          style={{
            backgroundImage: 'linear-gradient(90deg, #6c6c6c 20%, #d6d6d6 50%, #6c6c6c 80%)',
            backgroundSize: '220% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: reduceMotion ? '#8a8a8a' : 'transparent',
          }}
        >
          Samundar
        </motion.p>

        <div
          aria-hidden
          className="relative mt-5 flex w-44 items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-600"
        >
          <span>{stage}</span>
          {isDeterminate && (
            <motion.span className="tabular-nums text-[#d4ad62]">{percentText}</motion.span>
          )}
        </div>
      </div>

      <span className="sr-only">{`${label}: ${stage}`}</span>
    </motion.div>
  );
}
