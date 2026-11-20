'use client';

import { motion, useReducedMotion } from 'framer-motion';

export type OrbState = 'idle' | 'thinking' | 'responding';

const ACCENT = '#22d3ee';

export function AgentOrb({ state }: { state: OrbState }) {
  const reduce = useReducedMotion();
  const active = state !== 'idle';
  const spin = (duration: number, direction = 1) =>
    reduce || !active ? undefined : { rotate: 360 * direction };

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <div
        className={`absolute inset-4 rounded-full blur-2xl transition-opacity duration-700 ${
          active ? 'opacity-40' : 'opacity-20'
        }`}
        style={{ background: `radial-gradient(circle, ${ACCENT}66, transparent 70%)` }}
      />

      <svg viewBox="0 0 200 200" className="relative h-44 w-44" aria-hidden>
        <circle cx="100" cy="100" r="94" fill="none" stroke={ACCENT} strokeOpacity="0.12" strokeWidth="1" />
        <circle cx="100" cy="100" r="94" fill="none" stroke={ACCENT} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="1 7" />

        <motion.g
          animate={spin(46)}
          transition={{ duration: 46, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <circle cx="100" cy="100" r="82" fill="none" stroke={ACCENT} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="52 310" strokeLinecap="round" />
        </motion.g>

        <motion.g
          animate={spin(18, -1)}
          transition={{ duration: active ? 9 : 18, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <circle cx="100" cy="100" r="70" fill="none" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="120 260" strokeLinecap="round" />
          <circle cx="100" cy="30" r="2.5" fill={ACCENT} fillOpacity="0.9" />
        </motion.g>

        <motion.g
          animate={spin(34)}
          transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <circle cx="100" cy="100" r="56" fill="none" stroke={ACCENT} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 8" />
        </motion.g>

        {[0, 90, 180, 270].map((angle) => (
          <motion.line
            key={angle}
            x1="100"
            y1="36"
            x2="100"
            y2="44"
            stroke={ACCENT}
            strokeOpacity="0.6"
            strokeWidth="1.5"
            style={{ transformOrigin: '100px 100px' }}
            animate={reduce || !active ? undefined : { rotate: [angle, angle + 360] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
          />
        ))}

        <motion.circle
          cx="100"
          cy="100"
          r="26"
          fill="none"
          stroke={ACCENT}
          strokeOpacity="0.55"
          strokeWidth="1"
          animate={reduce ? undefined : { r: active ? [24, 28, 24] : [25, 27, 25] }}
          transition={{ duration: state === 'thinking' ? 1.2 : 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.circle
          cx="100"
          cy="100"
          r="9"
          fill={ACCENT}
          animate={reduce ? undefined : { opacity: active ? [0.65, 1, 0.65] : [0.4, 0.65, 0.4] }}
          transition={{ duration: state === 'thinking' ? 0.9 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {state === 'responding' && !reduce && (
          <motion.circle
            cx="100"
            cy="100"
            r="30"
            fill="none"
            stroke={ACCENT}
            strokeWidth="2"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.35 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            style={{ transformOrigin: '100px 100px' }}
          />
        )}
      </svg>
    </div>
  );
}
