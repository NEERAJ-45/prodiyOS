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
