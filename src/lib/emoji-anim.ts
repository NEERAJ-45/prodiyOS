// Animated Noto emoji assets from the official Google Fonts Emoji CDN.
// Animated Noto Emoji is licensed under CC BY 4.0 — https://noto-emoji-animation.appspot.com
const EMOJI_CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

export type EmojiSegment =
  | { type: 'emoji'; value: string }
  | { type: 'text'; value: string };

const PICTOGRAPHIC = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const KEYCAP = /\u20e3/u;

const segmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('en', { granularity: 'grapheme' })
    : null;

export function isEmojiChar(char: string): boolean {
  if (!char) return false;
  return PICTOGRAPHIC.test(char) || KEYCAP.test(char);
}

export function emojiRgi(char: string): string | null {
  if (!isEmojiChar(char)) return null;
  const hex = Array.from(char).map((c) =>
    c.codePointAt(0)!.toString(16).padStart(4, '0')
  );
  return hex.join('_');
}

export function emojiCdnUrl(char: string, file: string): string | null {
  const rgi = emojiRgi(char);
  if (!rgi) return null;
  return `${EMOJI_CDN}/${rgi}/${file}`;
}

export function segmentText(text: string): EmojiSegment[] {
  if (!text) return [];

  const graphemes = segmenter
    ? Array.from(segmenter.segment(text), (s) => s.segment)
    : Array.from(text);

  const segments: EmojiSegment[] = [];
  for (const value of graphemes) {
    const type = isEmojiChar(value) ? 'emoji' : 'text';
    const last = segments[segments.length - 1];
    if (type === 'text' && last && last.type === 'text') {
      last.value += value;
    } else {
      segments.push({ type, value });
    }
  }
  return segments;
}
