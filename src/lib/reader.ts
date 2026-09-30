import crypto from 'crypto';

export const IMAGE_HOSTS = new Set(['miro.medium.com', 'cdn-images-1.medium.com']);

export function assertReaderKeyConfigured(): void {
  if (!process.env.READER_KEY) {
    throw new Error('READER_KEY environment variable is not set');
  }
}

export function checkKey(submitted: string): boolean {
  assertReaderKeyConfigured();
  // Hash both sides to fixed 32 bytes: timingSafeEqual never throws on length
  // mismatch and the comparison leaks nothing about key length or content.
  const a = crypto.createHash('sha256').update(submitted, 'utf8').digest();
  const b = crypto.createHash('sha256').update(process.env.READER_KEY!, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

export function isAllowedMediumUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  // hostname comes from the URL parser, so "medium.com@evil.com" already
  // resolves to evil.com and "medium.com.evil.com" fails both checks.
  return host === 'medium.com' || host.endsWith('.medium.com');
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isAllowedImageUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  return u.protocol === 'https:' && IMAGE_HOSTS.has(u.hostname.toLowerCase());
}

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function renderMarkdown(markdown: string): string {
  const out: string[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      out.push(`<h2>${escapeHtml(line.replace(/^#+\s*/, ''))}</h2>`);
      continue;
    }

    const img = line.match(IMAGE_LINE_RE);
    if (img) {
      // Disallowed host → silently dropped (spec); never fetched server-side.
      // Logging of drops is wired up in Task 4 (logger).
      if (isAllowedImageUrl(img[2])) {
        out.push(
          `<figure><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" loading="lazy" referrerpolicy="no-referrer"></figure>`
        );
      }
      continue;
    }

    out.push(`<p>${escapeHtml(line)}</p>`);
  }
  return out.join('\n');
}
