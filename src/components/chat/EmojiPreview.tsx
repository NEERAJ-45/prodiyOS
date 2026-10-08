'use client';

import { AnimatedEmoji } from './AnimatedEmoji';

// Animated preview of the emoji last picked from the emoji-mart picker.
// emoji-mart exposes no hover event, so the preview follows selection.
interface PreviewEmoji {
  native: string;
  name?: string;
}

export function EmojiPreview({ emoji }: { emoji: PreviewEmoji | null }) {
  if (!emoji) return null;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border">
      <AnimatedEmoji char={emoji.native} eager className="h-8 w-8 shrink-0" />
      <span className="text-[13px] text-muted-foreground truncate">
        {emoji.name}
      </span>
    </div>
  );
}
