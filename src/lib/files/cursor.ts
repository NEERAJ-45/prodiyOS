const toBase64Url = (value: string) =>
  Buffer.from(value, 'utf8').toString('base64url');

export function encodeCursor(value: unknown, id: string): string {
  return toBase64Url(JSON.stringify([value, id]));
}

export function decodeCursor(cursor: string): { value: unknown; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [value, id] = parsed;
    if (typeof id !== 'string' || !id) return null;
    return { value, id };
  } catch {
    return null;
  }
}
