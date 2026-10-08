import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EmojiPreview } from '@/components/chat/EmojiPreview';

describe('<EmojiPreview />', () => {
  it('renders nothing when no emoji is selected', () => {
    expect(renderToStaticMarkup(<EmojiPreview emoji={null} />)).toBe('');
  });

  it('renders the emoji immediately from the animated CDN asset', () => {
    const html = renderToStaticMarkup(
      <EmojiPreview emoji={{ native: '🔥', name: 'Fire' }} />
    );
    expect(html).toContain(
      'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp'
    );
    expect(html).toContain('alt="🔥"');
  });

  it('shows the emoji name', () => {
    const html = renderToStaticMarkup(
      <EmojiPreview emoji={{ native: '🔥', name: 'Fire' }} />
    );
    expect(html).toContain('Fire');
  });

  it('renders without a name', () => {
    const html = renderToStaticMarkup(
      <EmojiPreview emoji={{ native: '🔥' }} />
    );
    expect(html).toContain('512.webp');
  });
});
