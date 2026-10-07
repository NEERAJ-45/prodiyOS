'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Users, MessageCircle, Trash2, ArrowDown, Lock, Reply, SmilePlus, X } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { toggleReaction as applyToggle } from '@/lib/chat-reactions';
import { prefersReducedMotion } from '@/lib/anim';
import { cn } from '@/lib/utils';
import type { ChatMsg } from './types';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Props {
  username: string;
  onLock?: () => void;
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const label = isToday
    ? 'Today'
    : isYesterday
      ? 'Yesterday'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex justify-center my-3 px-4" role="separator" aria-label={label}>
      <span className="rounded-full bg-muted px-2.5 py-[3px] text-[13px] font-medium text-muted-foreground select-none">
        {label}
      </span>
    </div>
  );
}

function isNearBottom(el: HTMLElement) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}

function SheetButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 h-12 rounded-xl text-[15px] transition-colors cursor-pointer',
        'hover:bg-muted',
        danger ? 'text-destructive' : 'text-foreground'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function ChatThread({ username, onLock }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [replyTo, setReplyTo] = useState<ChatMsg | null>(null);
  const [sheetFor, setSheetFor] = useState<ChatMsg | null>(null);
  const [pickerFor, setPickerFor] = useState<ChatMsg | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const messagesRef = useRef<ChatMsg[]>([]);
  const animatedRef = useRef<Set<string>>(new Set());
  const loadedOnceRef = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
    });
  }, []);

  const commit = useCallback((next: ChatMsg[]) => {
    messagesRef.current = next;
    setMessages(next);
  }, []);

  const loadMessages = useCallback(async () => {
    if (pausedRef.current) return;
    try {
      const res = await fetch('/api/chat/messages');
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMsg[] = (data.messages ?? []).map((m: Partial<ChatMsg>) => ({
        ...m,
        reactions: m.reactions ?? [],
        replyTo: m.replyTo ?? null,
      }));

      const prev = messagesRef.current;
      const prevIds = new Set(prev.map((m) => m.id));
      const unchanged =
        prev.length === msgs.length &&
        msgs.every((m, i) => prev[i] && JSON.stringify(prev[i]) === JSON.stringify(m));
      if (unchanged) return;

      const fresh = msgs.filter((m) => !prevIds.has(m.id));
      const scrollEl = scrollRef.current;
      const wasAtBottom = scrollEl ? isNearBottom(scrollEl) : true;

      commit(msgs);

      if (fresh.length > 0) {
        if (wasAtBottom) scrollToBottom();
        else setNewCount((c) => c + fresh.length);

        const viewingChat =
          !document.hidden &&
          document.hasFocus() &&
          window.location.pathname.startsWith('/chat');
        if (loadedOnceRef.current && !viewingChat) {
          const last = fresh[fresh.length - 1];
          notify('chat', last.from === username ? 'New chat message' : `Message from ${last.from}`, {
            body: last.text.slice(0, 140),
            tag: 'chat',
          });
        }
      } else if (!scrollEl || wasAtBottom) {
        scrollToBottom(false);
      }
      loadedOnceRef.current = true;
    } catch {
      // silent
    }
  }, [commit, scrollToBottom, username]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = isNearBottom(el);
    setAtBottom(bottom);
    if (bottom && newCount > 0) setNewCount(0);
  };

  // Poll — pause when tab hidden
  useEffect(() => {
    const kick = setTimeout(loadMessages, 0);
    const interval = setInterval(loadMessages, 5000);

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) loadMessages();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(kick);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadMessages]);

  // GSAP enter: staggered on first load, per-message for later arrivals
  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-msg-id]'));
    const fresh = rows.filter((r) => !animatedRef.current.has(r.dataset.msgId!));
    if (fresh.length === 0) return;
    fresh.forEach((r) => animatedRef.current.add(r.dataset.msgId!));
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      fresh,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.28,
        ease: 'power2.out',
        stagger: Math.min(0.03, 0.6 / fresh.length),
        clearProps: 'opacity,transform',
      }
    );
  }, [messages]);

  const handleSend = async (text: string) => {
    setSending(true);
    try {
      const payload: Record<string, unknown> = { from: username, text };
      if (replyTo) {
        payload.replyTo = { id: replyTo.id, from: replyTo.from, text: replyTo.text.slice(0, 200) };
      }
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) setReplyTo(null);
      await loadMessages();
    } catch {
      console.error('Send failed');
    } finally {
      setSending(false);
    }
  };

  const flushMessages = async () => {
    if (!confirm('Delete all messages?')) return;
    await fetch('/api/chat/messages', { method: 'DELETE' });
    commit([]);
    setNewCount(0);
    setReplyTo(null);
    animatedRef.current = new Set();
  };

  const latest = (m: ChatMsg): ChatMsg => messagesRef.current.find((x) => x.id === m.id) ?? m;

  const deleteMessage = async (m: ChatMsg) => {
    setSheetFor(null);
    const before = messagesRef.current;
    commit(before.filter((x) => x.id !== m.id));
    if (replyTo?.id === m.id) setReplyTo(null);
    try {
      const res = await fetch(`/api/chat/messages/${m.id}`, { method: 'DELETE' });
      if (!res.ok) commit(before);
    } catch {
      commit(before);
    }
  };

  const toggleReaction = async (m: ChatMsg, emoji: string) => {
    const target = latest(m);
    const before = messagesRef.current;
    commit(before.map((x) => (x.id === target.id ? { ...x, reactions: applyToggle(x.reactions, username, emoji) } : x)));
    try {
      const res = await fetch(`/api/chat/messages/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, emoji }),
      });
      if (!res.ok) throw new Error('reaction failed');
      const data = await res.json();
      commit(
        messagesRef.current.map((x) => (x.id === target.id ? { ...x, reactions: data.reactions } : x))
      );
    } catch {
      commit(before);
    }
  };

  const jumpTo = (id: string) => {
    const row = scrollRef.current?.querySelector<HTMLElement>(`[data-msg-id="${id}"]`);
    if (!row) return;
    row.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        row,
        { backgroundColor: 'rgba(120, 160, 255, 0.28)' },
        { backgroundColor: 'rgba(120, 160, 255, 0)', duration: 1.2, ease: 'power1.out' }
      );
    }
  };

  const shouldShowDate = (msgs: ChatMsg[], idx: number) => {
    if (idx === 0) return true;
    const prev = new Date(msgs[idx - 1].createdAt);
    const curr = new Date(msgs[idx].createdAt);
    return prev.toDateString() !== curr.toDateString();
  };

  // Telegram groups: name on the first message, avatar+tail on the last
  const sameDay = (a: string, b: string) =>
    new Date(a).toDateString() === new Date(b).toDateString();
  const isGroupStart = (msgs: ChatMsg[], idx: number) =>
    idx === 0 || msgs[idx].from !== msgs[idx - 1].from || !sameDay(msgs[idx].createdAt, msgs[idx - 1].createdAt);
  const isGroupEnd = (msgs: ChatMsg[], idx: number) =>
    idx === msgs.length - 1 || msgs[idx].from !== msgs[idx + 1].from || !sameDay(msgs[idx].createdAt, msgs[idx + 1].createdAt);

  return (
    <div
      className="flex flex-col h-full min-h-0 relative bg-background"
      role="main"
      aria-label="Group chat"
    >
      {/* Header — flat, Telegram-style */}
      <header className="shrink-0 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 pt-[env(safe-area-inset-top)] border-b border-border">
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] leading-tight truncate text-foreground">
            Group Chat
          </h1>
        </div>
        {onLock && (
          <button
            onClick={onLock}
            className="h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Lock chat"
            title="Lock chat"
          >
            <Lock className="h-4.5 w-4.5" />
          </button>
        )}
        <button
          onClick={flushMessages}
          className="h-10 w-10 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          aria-label="Delete all messages"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mb-4" aria-hidden="true">
              <MessageCircle className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-[15px] font-medium text-foreground/70 mb-1">No messages yet</p>
            <p className="text-[13px] text-muted-foreground/40">Send a message to start chatting.</p>
          </div>
        ) : (
          <div className="py-3 sm:py-4">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                {shouldShowDate(messages, idx) && (
                  <DateSeparator date={msg.createdAt} />
                )}
                <MessageBubble
                  msg={msg}
                  me={username}
                  isGroupStart={isGroupStart(messages, idx)}
                  isGroupEnd={isGroupEnd(messages, idx)}
                  onReply={() => setReplyTo(latest(msg))}
                  onReact={() => setPickerFor(latest(msg))}
                  onToggle={(emoji) => toggleReaction(msg, emoji)}
                  onDelete={() => deleteMessage(msg)}
                  onOpenSheet={() => setSheetFor(latest(msg))}
                  onJump={jumpTo}
                />
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Jump to bottom */}
      {!atBottom && messages.length > 0 && (
        <button
          onClick={() => {
            setNewCount(0);
            scrollToBottom();
          }}
          className="absolute bottom-24 right-4 z-20 flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 min-h-[40px] text-[13px] font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
          aria-label="Scroll to latest messages"
        >
          <ArrowDown className="h-4 w-4" />
          {newCount > 0 ? `${newCount} new` : 'Latest'}
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
        <MessageInput
          onSend={handleSend}
          disabled={sending}
          replyTo={replyTo ? { from: replyTo.from === username ? 'You' : replyTo.from, text: replyTo.text } : null}
          onCancelReply={() => setReplyTo(null)}
          onFocus={() => scrollToBottom()}
        />
      </div>

      {/* Long-press / right-click action sheet */}
      {sheetFor && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={() => setSheetFor(null)}
          role="presentation"
        >
          <div
            className="w-full sm:w-80 rounded-t-2xl sm:rounded-2xl bg-background border border-border p-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Message actions"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-1">
              <span className="text-[12px] text-muted-foreground truncate pr-2">
                {sheetFor.text}
              </span>
              <button
                type="button"
                onClick={() => setSheetFor(null)}
                className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SheetButton
              icon={<Reply className="h-5 w-5 text-muted-foreground" />}
              label="Reply"
              onClick={() => {
                setReplyTo(latest(sheetFor));
                setSheetFor(null);
              }}
            />
            <SheetButton
              icon={<SmilePlus className="h-5 w-5 text-muted-foreground" />}
              label="React"
              onClick={() => {
                setPickerFor(latest(sheetFor));
                setSheetFor(null);
              }}
            />
            <SheetButton
              icon={<Trash2 className="h-5 w-5" />}
              label="Delete"
              danger
              onClick={() => deleteMessage(sheetFor)}
            />
          </div>
        </div>
      )}

      {/* Reaction picker sheet */}
      {pickerFor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setPickerFor(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-muted border border-border overflow-hidden pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Pick a reaction"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-[13px] font-medium text-muted-foreground">React</span>
              <button
                type="button"
                onClick={() => setPickerFor(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close reaction picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[45vh] overflow-y-auto overscroll-contain [&_em-emoji-picker]:!bg-transparent [&_em-emoji-picker]:!shadow-none">
              <Picker
                data={data}
                theme="dark"
                previewPosition="none"
                skinTonePosition="search"
                maxFrequentRows={2}
                onEmojiSelect={(emoji: { native?: string }) => {
                  if (emoji.native) {
                    toggleReaction(pickerFor, emoji.native);
                    setPickerFor(null);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
