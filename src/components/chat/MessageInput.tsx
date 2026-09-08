'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Smile, X } from 'lucide-react';
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
    <div className="relative bg-background/95 backdrop-blur-md px-2.5 py-2 sm:px-4 sm:py-3">
      {/* Emoji Picker */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-full left-0 right-0 mb-2 mx-2.5 sm:mx-4 rounded-xl border border-border/50 overflow-y-auto overscroll-contain max-h-[40vh] sm:max-h-56 z-50"
          style={{ background: 'hsl(240 5% 16%)' }}
          role="dialog"
          aria-label="Emoji picker"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Emoji
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full cursor-pointer"
              onClick={closeEmoji}
              aria-label="Close emoji picker"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="[&_em-emoji-picker]:!bg-transparent [&_em-emoji-picker]:!shadow-none">
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => {
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

      {/* Input Row */}
      <div className="flex items-end gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEmoji(!showEmoji)}
          className={cn(
            'shrink-0 h-11 w-11 sm:h-10 sm:w-10 rounded-full cursor-pointer transition-colors duration-150',
            showEmoji ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={showEmoji ? 'Close emoji picker' : 'Open emoji picker'}
          aria-expanded={showEmoji}
        >
          <Smile className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative min-w-0">
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
            placeholder="Type a message..."
            disabled={disabled}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            className={cn(
              'w-full h-11 sm:h-10 rounded-full px-4 text-[15px] sm:text-[14.5px]',
              'bg-muted/40 border border-border/50',
              'placeholder:text-muted-foreground/40',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40',
              'transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          size="icon"
          className={cn(
            'shrink-0 h-11 w-11 sm:h-10 sm:w-10 rounded-full cursor-pointer transition-all duration-200',
            text.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              : 'bg-muted text-muted-foreground/50'
          )}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
