import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const MAX_BYTES = 1_000_000;

function logFilePath(): string {
  if (process.env.READER_LOG_DIR) return path.join(process.env.READER_LOG_DIR, 'reader.log');
  // Vercel's filesystem is read-only except /tmp (ephemeral per instance —
  // stdout below is the durable copy shown in the dashboard Logs view).
  if (process.env.VERCEL) return '/tmp/reader.log';
  return path.join(process.cwd(), 'logs', 'reader.log');
}

function flatten(v: string | number | undefined): string {
  if (v === undefined) return '';
  // One event = one line; keeps stack traces grep-able.
  return String(v).replace(/\s+/g, ' ');
}

function rotateIfNeeded(file: string): void {
  try {
    if (fs.statSync(file).size > MAX_BYTES) fs.renameSync(file, `${file}.1`);
  } catch {
    // File doesn't exist yet or stat failed — nothing to rotate.
  }
}

export function logReaderEvent(
  level: LogLevel,
  stage: string,
  message: string,
  meta: Record<string, string | number | undefined> = {}
): void {
  const parts = Object.entries(meta)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${flatten(v)}`);
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${stage}: ${message}${
    parts.length ? ' ' + parts.join(' ') : ''
  }`;

  // Durable sink (Vercel dashboard, local terminal). Callers must never pass secrets.
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  // Best-effort file sink — any failure is swallowed so logging can never
  // break an API request.
  try {
    const file = logFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    rotateIfNeeded(file);
    fs.appendFileSync(file, `${line}\n`, 'utf8');
  } catch {
    // ignore
  }
}
