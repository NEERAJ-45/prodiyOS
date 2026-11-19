'use client';

import { motion, useReducedMotion } from 'framer-motion';

export type OrbState = 'idle' | 'thinking' | 'responding';

const STATE_LABEL: Record<OrbState, string> = {
  idle: 'Ready',
  thinking: 'Thinking',
  responding: 'Responding',
};

export function AgentOrb({ state }: { state: OrbState }) {
  const reduce = useReducedMotion();
  const active = state !== 'idle';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-border"
          animate={reduce || !active ? undefined : { rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ring" />
        </motion.span>
        <motion.span
          className="absolute inset-3 rounded-full border border-border/70"
          animate={reduce || !active ? undefined : { rotate: -360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="absolute inset-7 rounded-full border border-border/40"
          animate={reduce || !active ? undefined : { rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="h-3 w-3 rounded-full bg-ring"
          animate={reduce || !active ? undefined : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: state === 'thinking' ? 1.1 : 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{STATE_LABEL[state]}</span>
    </div>
  );
}
