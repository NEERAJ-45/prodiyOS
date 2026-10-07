'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { CheckCheck, Reply, SmilePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiText } from './EmojiText';
import { groupReactions } from '@/lib/chat-reactions';
import { useLongPress } from '@/hooks/use-long-press';
import { prefersReducedMotion } from '@/lib/anim';
import type { ChatMsg } from './types';

interface Props {
  msg: ChatMsg;
  me: string;
  isGroupStart: boolean;
  isGroupEnd: boolean;
  onReply: () => void;
  onReact: () => void;
  onToggle: (emoji: string) => void;
  onDelete: () => void;
  onOpenSheet: () => void;
  onJump: (id: string) => void;
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
          ? '-right-[8px] scale-x-[-1] text-primary'
          : '-left-[8px] text-muted'
      )}
    >
      <path d="M0.5 20V0c0 8 2.5 14 10.5 20H0.5z" fill="currentColor" />
    </svg>
  );
}

function ActionIcon({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-full bg-background/80 border border-border/60',
        'text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
        'transition-opacity duration-150 cursor-pointer hover:text-foreground',
        'shadow-sm backdrop-blur-sm',
        danger && 'hover:text-destructive hover:border-destructive/40'
      )}
    >
      {children}
    </button>
  );
}

export function MessageBubble({
  msg,
  me,
  isGroupStart,
  isGroupEnd,
  onReply,
  onReact,
  onToggle,
  onDelete,
  onOpenSheet,
  onJump,
}: Props) {
  const { from, text, createdAt, reactions, replyTo } = msg;
  const ts = new Date(createdAt).getTime();
  const isOwn = from === me;
  const color = getUserColor(from);
  const exact = new Date(ts).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const hasTail = isGroupEnd;
  const emojiOnly = isEmojiOnly(text);
  const grouped = groupReactions(reactions);
  const myReaction = reactions.find((r) => r.user === me)?.emoji;
  const chipsRef = useRef<HTMLDivElement>(null);

  // Pop the chip row whenever this message's reactions change
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !chipsRef.current) return;
    gsap.fromTo(
      chipsRef.current,
      { scale: 0.6, opacity: 0, transformOrigin: isOwn ? 'right center' : 'left center' },
      { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }
    );
  }, [reactions, isOwn]);

  const longPress = useLongPress(onOpenSheet);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenSheet();
  };

  return (
    <div
      className={cn(
        'group flex items-end gap-2 px-3 sm:px-4',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        isGroupStart ? 'mt-2.5' : 'mt-[2px]'
      )}
      role="article"
      aria-label={`Message from ${from}`}
      data-msg-id={msg.id}
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

      {/* Hover actions — desktop only; mobile uses long-press */}
      <div
        className={cn(
          'hidden sm:flex flex-col gap-1 pb-1 shrink-0',
          'opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150'
        )}
      >
        <ActionIcon label="Reply" onClick={onReply}>
          <Reply className="h-3.5 w-3.5" />
        </ActionIcon>
        <ActionIcon label="Add reaction" onClick={onReact}>
          <SmilePlus className="h-3.5 w-3.5" />
        </ActionIcon>
        <ActionIcon label="Delete message" onClick={onDelete} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </ActionIcon>
      </div>

      {/* Bubble + reaction chips */}
      <div className="flex flex-col max-w-[min(78%,480px)] min-w-0" data-bubble-col>
        <div
          className={cn(
            'relative px-2.5 py-[5px] text-[15px] cursor-default select-text',
            'rounded-[12px]',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
            hasTail && isOwn && 'rounded-br-[3px]',
            hasTail && !isOwn && 'rounded-bl-[3px]'
          )}
          {...longPress}
          onContextMenu={handleContextMenu}
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

          {/* Inline quote of the replied-to message */}
          {replyTo && (
            <button
              type="button"
              onClick={() => onJump(replyTo.id)}
              className={cn(
                'block w-full text-left mb-1 rounded-md px-2 py-1 border-l-[3px] transition-colors cursor-pointer',
                'bg-background/40 hover:bg-background/60',
                isOwn
                  ? 'border-primary-foreground/60'
                  : 'border-primary/70'
              )}
              aria-label={`Go to message from ${replyTo.from} being replied to`}
            >
              <span
                className="block text-[12px] font-semibold leading-tight truncate"
                style={{ color: isOwn ? undefined : getUserColor(replyTo.from) }}
              >
                {replyTo.from === me ? 'You' : replyTo.from}
              </span>
              <span className="block text-[13px] leading-snug line-clamp-2 opacity-80">
                {replyTo.text}
              </span>
            </button>
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
                ? 'text-primary-foreground/60'
                : 'text-muted-foreground/70'
            )}
            title={exact}
            aria-label={`Sent ${exact}`}
          >
            {formatTime(ts)}
            {isOwn && <CheckCheck className="h-3.5 w-3.5 -mr-0.5" strokeWidth={2} />}
          </span>
        </div>

        {/* Reaction chips — tap to toggle your own reaction */}
        {grouped.length > 0 && (
          <div
            ref={chipsRef}
            className={cn('flex flex-wrap gap-1 mt-0.5', isOwn ? 'justify-end px-1' : 'px-1')}
          >
            {grouped.map((g) => {
              const mine = myReaction === g.emoji;
              return (
                <button
                  key={g.emoji}
                  type="button"
                  onClick={() => onToggle(g.emoji)}
                  title={g.users.join(', ')}
                  aria-label={`React with ${g.emoji}, ${g.count} reaction${g.count === 1 ? '' : 's'}`}
                  className={cn(
                    'h-6 min-w-[34px] px-1.5 rounded-full flex items-center justify-center gap-1',
                    'text-[12px] leading-none border transition-colors cursor-pointer active:scale-95',
                    mine
                      ? 'bg-primary/20 border-primary/50 text-foreground'
                      : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span aria-hidden="true">{g.emoji}</span>
                  {g.count > 1 && <span className="tabular-nums">{g.count}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
