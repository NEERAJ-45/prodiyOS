import { describe, it, expect } from 'vitest';
import { emojiRgi, emojiCdnUrl, segmentText, isEmojiChar } from '@/lib/emoji-anim';

const CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

describe('emojiRgi()', () => {
  it('converts a simple emoji to its lowercase hex codepoint', () => {
    expect(emojiRgi('😀')).toBe('1f600');
    expect(emojiRgi('🙂')).toBe('1f642');
  });

  it('keeps the variation selector when present', () => {
    expect(emojiRgi('❤️')).toBe('2764_fe0f');
    expect(emojiRgi('❤')).toBe('2764');
  });

  it('joins ZWJ sequences', () => {
    expect(emojiRgi('👨‍👩‍👦')).toBe('1f468_200d_1f469_200d_1f466');
  });

  it('joins regional indicators for flags', () => {
    expect(emojiRgi('🇺🇸')).toBe('1f1fa_1f1f8');
  });

  it('keeps skin tone modifiers', () => {
    expect(emojiRgi('👍🏽')).toBe('1f44d_1f3fd');
  });

  it('returns null for non-emoji text', () => {
    expect(emojiRgi('hello')).toBeNull();
    expect(emojiRgi('')).toBeNull();
  });
});

describe('emojiCdnUrl()', () => {
  it('builds the CDN url for an emoji', () => {
    expect(emojiCdnUrl('🙂', '512.webp')).toBe(`${CDN}/1f642/512.webp`);
    expect(emojiCdnUrl('❤️', 'emoji.svg')).toBe(`${CDN}/2764_fe0f/emoji.svg`);
  });

  it('returns null for non-emoji text', () => {
    expect(emojiCdnUrl('hello', '512.webp')).toBeNull();
  });
});

describe('isEmojiChar()', () => {
  it('recognizes pictographic emoji', () => {
    expect(isEmojiChar('😀')).toBe(true);
    expect(isEmojiChar('❤️')).toBe(true);
  });

  it('recognizes flags (regional indicators)', () => {
    expect(isEmojiChar('🇺🇸')).toBe(true);
  });

  it('recognizes keycap sequences', () => {
    expect(isEmojiChar('1️⃣')).toBe(true);
  });

  it('rejects plain text', () => {
    expect(isEmojiChar('a')).toBe(false);
    expect(isEmojiChar(' ')).toBe(false);
    expect(isEmojiChar('👋x'.slice(1))).toBe(false);
  });
});

describe('segmentText()', () => {
  it('returns a single text segment for plain text', () => {
    expect(segmentText('hello world')).toEqual([{ type: 'text', value: 'hello world' }]);
  });

  it('splits emoji out of surrounding text', () => {
    expect(segmentText('hi 🙂 bye')).toEqual([
      { type: 'text', value: 'hi ' },
      { type: 'emoji', value: '🙂' },
      { type: 'text', value: ' bye' },
    ]);
  });

  it('keeps ZWJ sequences together as one emoji segment', () => {
    expect(segmentText('👨‍👩‍👦!')).toEqual([
      { type: 'emoji', value: '👨‍👩‍👦' },
      { type: 'text', value: '!' },
    ]);
  });

  it('treats flags as emoji', () => {
    expect(segmentText('🇺🇸')).toEqual([{ type: 'emoji', value: '🇺🇸' }]);
  });

  it('returns nothing for empty input', () => {
    expect(segmentText('')).toEqual([]);
  });
});
