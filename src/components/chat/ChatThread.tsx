'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Users, MessageCircle, Trash2, ArrowDown } from 'lucide-react';

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
    <div className="flex items-center gap-3 my-4 px-3 sm:px-4" role="separator" aria-label={label}>
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[11px] font-medium text-muted-foreground/70 select-none tracking-wide uppercase">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
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
        }
        lastFetchRef.current = msgs[msgs.length - 1].createdAt;

        if (wasAtBottom) scrollToBottom();
      }
    } catch {
      // silent
    }
  }, [scrollToBottom]);

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

  const shouldShowName = (msgs: ChatMsg[], idx: number) => {
    if (idx === 0) return true;
    return msgs[idx].from !== msgs[idx - 1].from;
  };

  const shouldShowDate = (msgs: ChatMsg[], idx: number) => {
    if (idx === 0) return true;
    const prev = new Date(msgs[idx - 1].createdAt);
    const curr = new Date(msgs[idx].createdAt);
    return prev.toDateString() !== curr.toDateString();
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative" role="main" aria-label="Group chat">
      {/* Header */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-md px-3 sm:px-4 py-3 flex items-center gap-3 pt-[env(safe-area-inset-top)]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm" aria-hidden="true">
          <Users className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] leading-tight truncate">Group Chat</h1>
          <p className="text-[11px] text-muted-foreground/60 leading-tight">
            {messages.length} message{messages.length === 1 ? '' : 's'} · Encrypted
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1" aria-label="Online">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="text-[11px] text-emerald-400 font-medium">Live</span>
        </div>
        <button
          onClick={flushMessages}
          className="ml-1 p-1.5 rounded-full text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
          aria-label="Delete all messages"
        >
          <Trash2 className="h-4 w-4" />
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
                  showName={shouldShowName(messages, idx)}
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
          className="absolute bottom-20 right-4 z-20 flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-lg hover:bg-muted transition-colors cursor-pointer"
          aria-label="Scroll to latest messages"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          {newCount > 0 ? `${newCount} new` : 'Latest'}
        </button>
      )}

      {/* Input */}
      <div className="shrink-0 border-t pb-[env(safe-area-inset-bottom)]">
        <MessageInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
