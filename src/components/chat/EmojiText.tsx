'use client';

import { memo } from 'react';

interface Props {
  text: string;
  className?: string;
}

export const EmojiText = memo(function EmojiText({ text, className }: Props) {
  return (
    <span className={className} style={{ lineHeight: '1.35', fontFamily: 'var(--font-geist-sans), Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}>
      {text}
    </span>
  );
});
