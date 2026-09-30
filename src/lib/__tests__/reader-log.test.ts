import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { logReaderEvent } from '@/lib/reader-log';

let dir: string | undefined;

afterEach(() => {
  delete process.env.READER_LOG_DIR;
  if (dir && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

describe('logReaderEvent()', () => {
  it('appends a structured line to the file', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-log-'));
    process.env.READER_LOG_DIR = dir;
    logReaderEvent('warn', 'fetch', 'fetch failed', { reqId: 'abc123', reason: 'timeout' });
    const content = fs.readFileSync(path.join(dir, 'reader.log'), 'utf8');
    expect(content).toContain('WARN fetch: fetch failed');
    expect(content).toContain('reqId=abc123');
    expect(content).toContain('reason=timeout');
    expect(content).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
  });

  it('never throws when the log file path is unwritable', () => {
    process.env.READER_LOG_DIR = 'Z:\\definitely\\not\\a\\real\\path\u0000';
    expect(() => logReaderEvent('error', 'unexpected', 'boom', { stack: 'Error: x' })).not.toThrow();
  });

  it('collapses whitespace in meta values (single-line logs)', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reader-log-'));
    process.env.READER_LOG_DIR = dir;
    logReaderEvent('error', 'unexpected', 'boom', { stack: 'Error: x\n    at foo\n    at bar' });
    const content = fs.readFileSync(path.join(dir, 'reader.log'), 'utf8');
    expect(content.split('\n').filter(Boolean).length).toBe(1);
    expect(content).not.toContain('\n    at');
  });
});
