'use client';

import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiText } from './EmojiText';

interface Props {
  from: string;
  text: string;
  ts: number;
  isOwn: boolean;
  isGroupStart: boolean;
  isGroupEnd: boolean;
}

// Telegram's user-name palette — used for sender names and avatars
const USER_COLORS = [
  '#6AB2F3', '#E17076', '#7BC862',
  '#65AADD', '#A695E7', '#EE7AAE', '#FAA774',
];

function getUserColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const EMOJI_ONLY = /^[\p{Extended_Pictographic}\u200d\ufe0f\s]+$/u;

function isEmojiOnly(text: string) {
  const t = text.trim();
  return t.length > 0 && t.length <= 12 && EMOJI_ONLY.test(t);
}

// Telegram-style tail pointing toward the sender's avatar
function Tail({ own }: { own: boolean }) {
  return (
    <svg
      viewBox="0 0 11 20"
      width="11"
      height="20"
      aria-hidden="true"
      className={cn(
        'absolute bottom-0 h-5 w-[11px]',
        own
          ? '-right-[8px] scale-x-[-1] text-[#EFFDDE] dark:text-[#2B5278]'
          : '-left-[8px] text-white dark:text-[#182533]'
      )}
    >
      <path d="M0.5 20V0c0 8 2.5 14 10.5 20H0.5z" fill="currentColor" />
    </svg>
  );
}

export function MessageBubble({ from, text, ts, isOwn, isGroupStart, isGroupEnd }: Props) {
  const color = getUserColor(from);
  const exact = new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const hasTail = isGroupEnd;
  const emojiOnly = isEmojiOnly(text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'flex items-end gap-2 px-3 sm:px-4',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isGroupStart ? 'mt-2.5' : 'mt-[2px]'
      )}
      role="article"
      aria-label={`Message from ${from}`}
    >
      {/* Avatar sits beside the LAST message of an incoming group */}
      {!isOwn && (
        isGroupEnd ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-medium shrink-0 select-none"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          >
            {getInitials(from)}
          </div>
        ) : (
          <div className="w-9 shrink-0" aria-hidden="true" />
        )
      )}

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-[min(78%,480px)] px-2.5 py-[5px] text-[15px]',
          'rounded-[12px]',
          isOwn
            ? 'bg-[#EFFDDE] text-black dark:bg-[#2B5278] dark:text-white'
            : 'bg-white text-black shadow-[0_1px_2px_rgba(16,35,47,.15)] dark:bg-[#182533] dark:text-white dark:shadow-none',
          hasTail && isOwn && 'rounded-br-[3px]',
          hasTail && !isOwn && 'rounded-bl-[3px]'
        )}
      >
        {hasTail && <Tail own={isOwn} />}

        {/* Sender name inside the bubble (Telegram group style), first message only */}
        {isGroupStart && !isOwn && (
          <div
            className="text-[13px] font-medium leading-tight mb-0.5 select-none"
            style={{ color }}
          >
            {from}
          </div>
        )}

        <div className="leading-[19px]">
          {emojiOnly ? (
            <span className="text-[34px] leading-[42px] align-middle">
              <EmojiText text={text} />
            </span>
          ) : (
            <span className="whitespace-pre-wrap break-words">
              <EmojiText text={text} />
            </span>
          )}
          {/* reserves the bottom-right gutter so time never overlaps text */}
          <span className="inline-block w-[52px] h-[14px] align-bottom" />
        </div>

        {/* Time (+ delivery checks for own messages) — always visible, inside the bubble */}
        <span
          className={cn(
            'absolute bottom-[4px] right-[9px] flex items-center gap-[1px]',
            'text-[11px] tabular-nums select-none leading-none',
            isOwn
              ? 'text-black/40 dark:text-white/50'
              : 'text-black/35 dark:text-white/40'
          )}
          title={exact}
          aria-label={`Sent ${exact}`}
        >
          {formatTime(ts)}
          {isOwn && <CheckCheck className="h-3.5 w-3.5 -mr-0.5" strokeWidth={2} />}
        </span>
      </div>
    </motion.div>
  );
}
