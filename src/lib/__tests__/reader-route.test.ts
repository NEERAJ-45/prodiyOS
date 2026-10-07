import { describe, it, expect, vi } from 'vitest';

// Must run before the route module is imported: handlers call
// assertReaderKeyConfigured() per request when READER_KEY is missing.
vi.hoisted(() => {
  process.env.READER_KEY = 'correct-horse-battery';
});

const { POST } = await import('@/app/api/reader/read/route');

function post(body: unknown): Request {
  return new Request('http://localhost/api/reader/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/reader/read', () => {
  it('returns 403 for a wrong key', async () => {
    const res = await POST(post({ key: 'nope', url: 'https://medium.com/@u/a' }));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Invalid access key');
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('returns 400 for a non-medium host even with the right key', async () => {
    const res = await POST(post({ key: 'correct-horse-battery', url: 'https://evilmedium.com/x' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Only medium.com URLs are allowed');
  });

  it('returns 400 for medium.com.evil.com', async () => {
    const res = await POST(post({ key: 'correct-horse-battery', url: 'https://medium.com.evil.com/x' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed urls', async () => {
    const res = await POST(post({ key: 'correct-horse-battery', url: 'not-a-url' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 with the friendly message when fetch fails (no network)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('x', 'TimeoutError')));
    const res = await POST(post({ key: 'correct-horse-battery', url: 'https://medium.com/@u/a' }));
    expect(res.status).toBe(422);
    expect((await res.json()).error).toBe("Couldn't extract it, likely paywalled or blocked");
    vi.unstubAllGlobals();
  });

  it('never logs the submitted access key', async () => {
    const spies = (['log', 'warn', 'error'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {})
    );
    await POST(post({ key: 'correct-horse-battery', url: 'https://evilmedium.com/x' }));
    await POST(post({ key: 'wrong-key-should-not-appear', url: 'https://medium.com/x' }));
    const logged = spies.flatMap((s) => s.mock.calls.flat().map(String)).join('\n');
    expect(logged).not.toContain('correct-horse-battery');
    expect(logged).not.toContain('wrong-key-should-not-appear');
    spies.forEach((s) => s.mockRestore());
  });
});
