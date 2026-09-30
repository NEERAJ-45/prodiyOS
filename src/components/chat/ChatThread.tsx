'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Users, MessageCircle, Trash2, ArrowDown } from 'lucide-react';
import { notify } from '@/lib/notifications';

interface ChatMsg {
  id: string;
  from: string;
  text: string;
  createdAt: string;
}

interface Props {
  username: string;
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

export function ChatThread({ username }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const messagesRef = useRef<ChatMsg[]>([]);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (pausedRef.current) return;
    try {
      const params = new URLSearchParams();
      if (lastFetchRef.current) params.set('since', lastFetchRef.current);
      const res = await fetch(`/api/chat/messages?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const msgs: ChatMsg[] = data.messages ?? [];
      if (msgs.length > 0) {
        const scrollEl = scrollRef.current;
        const wasAtBottom = scrollEl ? isNearBottom(scrollEl) : true;

        const existing = new Set(messagesRef.current.map((m) => m.id));
        const newMsgs = msgs.filter((m) => !existing.has(m.id));
        if (newMsgs.length > 0) {
          messagesRef.current = [...messagesRef.current, ...newMsgs];
          setMessages(messagesRef.current);
          if (!wasAtBottom) setNewCount((c) => c + newMsgs.length);

          const viewingChat =
            !document.hidden &&
            document.hasFocus() &&
            window.location.pathname.startsWith('/chat');
          if (!viewingChat) {
            const last = newMsgs[newMsgs.length - 1];
            notify('chat', last.from === username ? 'New chat message' : `Message from ${last.from}`, {
              body: last.text.slice(0, 140),
              tag: 'chat',
            });
          }
        }
        lastFetchRef.current = msgs[msgs.length - 1].createdAt;

        if (wasAtBottom) scrollToBottom();
      }
    } catch {
      // silent
    }
  }, [scrollToBottom, username]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = isNearBottom(el);
    setAtBottom(bottom);
    if (bottom && newCount > 0) setNewCount(0);
  };

  // Poll — pause when tab hidden
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) loadMessages();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadMessages]);

  const handleSend = async (text: string) => {
    setSending(true);
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: username, text }),
      });
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
    messagesRef.current = [];
    setMessages([]);
    setNewCount(0);
    lastFetchRef.current = '';
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
      <header className="shrink-0 px-3 sm:px-4 py-2.5 flex items-center gap-3 pt-[env(safe-area-inset-top)] border-b border-border">
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] leading-tight truncate text-foreground">
            Group Chat
          </h1>
          <p className="text-[13px] text-muted-foreground leading-tight">
            {messages.length} message{messages.length === 1 ? '' : 's'} · online
          </p>
        </div>
        <button
          onClick={flushMessages}
          className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
                  from={msg.from}
                  text={msg.text}
                  ts={new Date(msg.createdAt).getTime()}
                  isOwn={msg.from === username}
                  isGroupStart={isGroupStart(messages, idx)}
                  isGroupEnd={isGroupEnd(messages, idx)}
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
          className="absolute bottom-20 right-4 z-20 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
          aria-label="Scroll to latest messages"
        >
          <ArrowDown className="h-4 w-4" />
          {newCount > 0 ? `${newCount} new` : 'Latest'}
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
        <MessageInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
