'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EmojiText } from './EmojiText';

interface Props {
  from: string;
  text: string;
  ts: number;
  isOwn: boolean;
  showName?: boolean;
}

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600',
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600',
  'bg-violet-600', 'bg-teal-600', 'bg-pink-600',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const sameDay = new Date(ts).toDateString() === new Date().toDateString();
  if (sameDay && hrs < 24) return `${hrs}h`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ from, text, ts, isOwn, showName = true }: Props) {
  const exact = new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'flex gap-2 my-0.5 px-3 sm:px-4 group',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={`Message from ${from}`}
    >
      {/* Avatar — shown once per group, bottom-aligned; spacer keeps alignment */}
      {isOwn ? null : showName ? (
        <div
          className={cn(
            'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-[11px] font-semibold shrink-0 mt-auto ring-1 ring-background',
            getAvatarColor(from)
          )}
          aria-hidden="true"
        >
          {getInitials(from)}
        </div>
      ) : (
        <div className="w-7 sm:w-8 shrink-0" aria-hidden="true" />
      )}

      {/* Bubble */}
      <div className={cn('flex flex-col max-w-[80%] sm:max-w-[70%] min-w-0', isOwn ? 'items-end' : 'items-start')}>
        {showName && !isOwn && (
          <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mb-0.5 ml-1 select-none">
            {from}
          </span>
        )}
        <div
          className={cn(
            'rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-[17px] leading-[1.35] break-words',
            'transition-shadow duration-150',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md shadow-sm'
              : 'bg-muted/80 border border-border/40 rounded-bl-md',
            'hover:shadow-md'
          )}
        >
          <span className="whitespace-pre-wrap break-words">
            <EmojiText text={text} />
          </span>
        </div>
        <span
          className={cn(
            'text-[10px] text-muted-foreground/50 mt-0.5 mx-1 tabular-nums select-none',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
          )}
          title={exact}
          aria-label={`Sent ${exact}`}
        >
          {formatRelativeTime(ts)}
        </span>
      </div>
    </motion.div>
  );
}
