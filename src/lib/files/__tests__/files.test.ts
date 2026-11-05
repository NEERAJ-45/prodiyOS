import { describe, expect, it } from 'vitest';
import { fileTypeOf, isTextMime, mimeForName } from '../mime';
import { formatBytes, formatModified, numberedName, sanitizeName, stripExtension } from '../format';
import { decodeCursor, encodeCursor } from '../cursor';

describe('file helpers', () => {
  it('maps extensions to mime types', () => {
    expect(mimeForName('Guide.PDF')).toBe('application/pdf');
    expect(mimeForName('notes.md')).toBe('text/markdown');
    expect(mimeForName('unknown.zzz')).toBe('application/octet-stream');
    expect(fileTypeOf('archive.tar.gz')).toBe('gz');
    expect(fileTypeOf('README')).toBe('file');
  });

  it('detects text mime types', () => {
    expect(isTextMime('application/json')).toBe(true);
    expect(isTextMime('image/svg+xml')).toBe(true);
    expect(isTextMime('text/plain')).toBe(true);
    expect(isTextMime('image/png')).toBe(false);
  });

  it('sanitizes names and builds numbered names', () => {
    expect(sanitizeName('/etc/passwd')).toBe('-etc-passwd');
    expect(sanitizeName('  ')).toBeNull();
    expect(sanitizeName('..')).toBeNull();
    expect(stripExtension('notes.md')).toBe('notes');
    expect(stripExtension('README')).toBe('README');
    expect(numberedName('notes.md', 2)).toBe('notes (2).md');
  });

  it('formats sizes and dates', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatModified(null)).toBe('\u2014');
  });

  it('round-trips pagination cursors', () => {
    const cursor = encodeCursor('2026-01-02T03:04:05.000Z', '507f1f77bcf86cd799439011');
    expect(decodeCursor(cursor)).toEqual({
      value: '2026-01-02T03:04:05.000Z',
      id: '507f1f77bcf86cd799439011',
    });
    expect(decodeCursor('not-a-cursor')).toBeNull();
  });
});
