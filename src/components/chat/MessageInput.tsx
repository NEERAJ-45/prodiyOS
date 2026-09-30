'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, Smile, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const closeEmoji = useCallback(() => setShowEmoji(false), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) closeEmoji();
    }
    if (showEmoji) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmoji, closeEmoji]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative px-3 sm:px-4 py-2.5 bg-background">
      {/* Emoji Picker */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-4 mb-2 rounded-xl border border-border overflow-y-auto overscroll-contain max-h-[40vh] sm:max-h-64 z-50 shadow-xl bg-muted"
          role="dialog"
          aria-label="Emoji picker"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Emoji
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={closeEmoji}
              aria-label="Close emoji picker"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="[&_em-emoji-picker]:!bg-transparent [&_em-emoji-picker]:!shadow-none">
            <Picker
              data={data}
              onEmojiSelect={(emoji: { native?: string }) => {
                if (emoji.native) {
                  setText(prev => prev + emoji.native);
                  inputRef.current?.focus();
                }
              }}
              theme="dark"
              previewPosition="none"
              skinTonePosition="search"
              maxFrequentRows={2}
            />
          </div>
        </div>
      )}

      {/* Input row — pill + send fused like Telegram desktop */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 h-11 rounded-full pl-3 pr-4 min-w-0 bg-muted transition-all duration-150 focus-within:ring-2 focus-within:ring-primary/30">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={cn(
              'shrink-0 -ml-1 p-1 rounded-full cursor-pointer transition-colors duration-150',
              showEmoji ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
            aria-label={showEmoji ? 'Close emoji picker' : 'Open emoji picker'}
            aria-expanded={showEmoji}
          >
            <Smile className="h-5 w-5" />
          </button>

          <label htmlFor="chat-input" className="sr-only">
            Type a message
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Message"
            disabled={disabled}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            className={cn(
              'flex-1 min-w-0 h-full bg-transparent text-[15px] text-foreground',
              'placeholder:text-muted-foreground/60 outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          size="icon"
          className={cn(
            'shrink-0 h-11 w-11 rounded-full cursor-pointer transition-all duration-200 active:scale-95 border-0',
            text.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'bg-muted text-muted-foreground/50'
          )}
          aria-label="Send message"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}
