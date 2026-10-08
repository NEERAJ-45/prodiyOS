import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmojiText } from '@/components/chat/EmojiText';

describe('<EmojiText />', () => {
  it('renders plain text without images', () => {
    const html = renderToStaticMarkup(<EmojiText text="hello world" />);
    expect(html).toContain('hello world');
    expect(html).not.toContain('<img');
  });

  it('renders emoji as a CDN image with the emoji as alt text', () => {
    const html = renderToStaticMarkup(<EmojiText text="hi 🙂" />);
    expect(html).toContain(
      'src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f642/emoji.svg"'
    );
    expect(html).toContain('alt="🙂"');
  });

  it('keeps surrounding text intact around emoji', () => {
    const html = renderToStaticMarkup(<EmojiText text="a 🙂 b" />);
    expect(html).toContain('a ');
    expect(html).toContain(' b');
  });

  it('renders ZWJ sequences as a single image', () => {
    const html = renderToStaticMarkup(<EmojiText text="👨‍👩‍👦" />);
    expect(html).toContain('/1f468_200d_1f469_200d_1f466/');
    expect(html).toContain('alt="👨‍👩‍👦"');
  });
});
