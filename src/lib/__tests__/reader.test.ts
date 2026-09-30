import { describe, it, expect, beforeAll } from 'vitest';

// Env must be set before reader.ts functions are called; do it up front.
beforeAll(() => {
  process.env.READER_KEY = 'correct-horse-battery';
});

import { checkKey, assertReaderKeyConfigured, isAllowedMediumUrl } from '@/lib/reader';

describe('checkKey()', () => {
  it('accepts the exact key', () => {
    expect(checkKey('correct-horse-battery')).toBe(true);
  });

  it('rejects a wrong key', () => {
    expect(checkKey('wrong-key')).toBe(false);
    expect(checkKey('')).toBe(false);
  });

  it('throws when READER_KEY is unset', () => {
    const saved = process.env.READER_KEY;
    delete process.env.READER_KEY;
    expect(() => checkKey('anything')).toThrow(/READER_KEY/);
    expect(() => assertReaderKeyConfigured()).toThrow(/READER_KEY/);
    process.env.READER_KEY = saved;
  });
});

describe('isAllowedMediumUrl()', () => {
  it('accepts medium.com and subdomains over http/https', () => {
    expect(isAllowedMediumUrl('https://medium.com/@user/some-post-abc123')).toBe(true);
    expect(isAllowedMediumUrl('https://blog.medium.com/nice-article/')).toBe(true);
    expect(isAllowedMediumUrl('http://foo.medium.com/post')).toBe(true);
    expect(isAllowedMediumUrl('https://medium.com')).toBe(true);
  });

  it('rejects tricky non-medium hosts', () => {
    expect(isAllowedMediumUrl('https://evilmedium.com/post')).toBe(false);
    expect(isAllowedMediumUrl('https://medium.com.evil.com/post')).toBe(false);
    expect(isAllowedMediumUrl('https://notmedium.com/post')).toBe(false);
    expect(isAllowedMediumUrl('https://sub.medium.com.evil.com/x')).toBe(false);
    expect(isAllowedMediumUrl('https://evil.com/?x=medium.com')).toBe(false);
  });

  it('rejects non-http(s) schemes and garbage', () => {
    expect(isAllowedMediumUrl('ftp://medium.com/file')).toBe(false);
    expect(isAllowedMediumUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedMediumUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedMediumUrl('not a url')).toBe(false);
    expect(isAllowedMediumUrl('')).toBe(false);
  });

  it('rejects credentials-in-URL tricks', () => {
    // URL parser treats everything after @ as host → evil.com wins
    expect(isAllowedMediumUrl('https://medium.com@evil.com/post')).toBe(false);
  });
});

import { escapeHtml, renderMarkdown, isAllowedImageUrl } from '@/lib/reader';

describe('escapeHtml()', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<script>alert("x")&'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;'
    );
  });
});

describe('isAllowedImageUrl()', () => {
  it('accepts https on the two allowlisted hosts', () => {
    expect(isAllowedImageUrl('https://miro.medium.com/v2/resize:fit:800/x')).toBe(true);
    expect(isAllowedImageUrl('https://cdn-images-1.medium.com/v2/abc')).toBe(true);
  });

  it('rejects other hosts and non-https', () => {
    expect(isAllowedImageUrl('https://evil.com/x.png')).toBe(false);
    expect(isAllowedImageUrl('http://miro.medium.com/x')).toBe(false);
    expect(isAllowedImageUrl('https://sub.miro.medium.com/x')).toBe(false);
    expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedImageUrl('not-a-url')).toBe(false);
  });
});

describe('renderMarkdown()', () => {
  it('renders headings as h2 with escaped text', () => {
    const html = renderMarkdown('# Hello <script>alert(1)</script>');
    expect(html).toBe('<h2>Hello &lt;script&gt;alert(1)&lt;/script&gt;</h2>');
  });

  it('renders plain lines as escaped paragraphs', () => {
    const html = renderMarkdown('Buy <b>now</b> & more');
    expect(html).toBe('<p>Buy &lt;b&gt;now&lt;/b&gt; &amp; more</p>');
  });

  it('renders allowlisted images with lazy/no-referrer in a figure', () => {
    const html = renderMarkdown('![a "quoted" alt](https://miro.medium.com/v2/x)');
    expect(html).toBe(
      '<figure><img src="https://miro.medium.com/v2/x" alt="a &quot;quoted&quot; alt" loading="lazy" referrerpolicy="no-referrer"></figure>'
    );
  });

  it('drops images from non-allowlisted hosts entirely', () => {
    expect(renderMarkdown('![x](https://evil.com/x.png)')).toBe('');
    expect(renderMarkdown('![x](http://miro.medium.com/x)')).toBe('');
  });

  it('neutralizes attribute injection via image URL/alt', () => {
    const html = renderMarkdown('![x" onerror="alert(1)](https://miro.medium.com/x)');
    expect(html).not.toContain('onerror="alert');
    expect(html).toContain('alt="x&quot; onerror=&quot;alert(1)"');
  });

  it('skips empty lines and escapes a raw <img> in a paragraph line', () => {
    const html = renderMarkdown('line one\n\n<img src=x onerror=alert(1)>');
    expect(html).toBe('<p>line one</p>\n<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  });
});
