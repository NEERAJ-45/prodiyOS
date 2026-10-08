'use client';

import { memo } from 'react';
import { segmentText } from '@/lib/emoji-anim';
import { AnimatedEmoji } from './AnimatedEmoji';

interface Props {
  text: string;
  className?: string;
}

export const EmojiText = memo(function EmojiText({ text, className }: Props) {
  const segments = segmentText(text);

  return (
    <span
      className={className}
      style={{ lineHeight: '1.35', fontFamily: 'var(--font-geist-sans), Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
    >
      {segments.map((seg, i) =>
        seg.type === 'emoji' ? (
          <AnimatedEmoji key={`${i}-${seg.value}`} char={seg.value} />
        ) : (
          <span key={`${i}-t`}>{seg.value}</span>
        )
      )}
    </span>
  );
});
