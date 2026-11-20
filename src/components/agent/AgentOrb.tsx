'use client';

import { motion, useReducedMotion } from 'framer-motion';

export type OrbState = 'idle' | 'thinking' | 'responding';

export function AgentOrb({ state }: { state: OrbState }) {
  const reduce = useReducedMotion();
  const active = state !== 'idle';

  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 text-muted-foreground" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />

      <motion.g
        style={{ transformOrigin: '60px 60px' }}
        animate={reduce || !active ? { rotate: 0 } : { rotate: 360 }}
        transition={{ duration: state === 'thinking' ? 3 : 6, repeat: Infinity, ease: 'linear' }}
      >
        <circle
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke="hsl(var(--ring))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="40 236"
          opacity={active ? 1 : 0.5}
        />
      </motion.g>

      <motion.circle
        cx="60"
        cy="60"
        r="7"
        fill="hsl(var(--ring))"
        animate={reduce ? {} : { opacity: active ? 1 : 0.6 }}
        transition={{ duration: 0.25 }}
      />
    </svg>
  );
}
