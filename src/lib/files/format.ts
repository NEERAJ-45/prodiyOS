const MAX_NAME_LENGTH = 255;

export function sanitizeName(input: string): string | null {
  const name = input
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]/g, '-')
    .trim();

  if (!name || name === '.' || name === '..') return null;
  const clamped = name.slice(0, MAX_NAME_LENGTH).trim();
  return clamped && clamped !== '.' && clamped !== '..' ? clamped : null;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function formatModified(value?: string | Date | null): string {
  if (!value) return '\u2014';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '\u2014';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

export function copyName(original: string): string {
  const dot = original.lastIndexOf('.');
  if (dot <= 0) return `${original} (copy)`;
  return `${original.slice(0, dot)} (copy)${original.slice(dot)}`;
}

export function numberedName(original: string, n: number): string {
  const dot = original.lastIndexOf('.');
  if (dot <= 0) return `${original} (${n})`;
  return `${original.slice(0, dot)} (${n})${original.slice(dot)}`;
}

export function isTextFileName(name: string): boolean {
  return /\.(md|markdown|txt|json|xml|html?|css|scss|js|mjs|cjs|jsx|ts|tsx|py|java|c|cpp|h|go|rs|rb|php|sh|bash|sql|ya?ml|toml|ini|log|env|csv)$/i.test(
    name
  );
}

export { MAX_NAME_LENGTH };
