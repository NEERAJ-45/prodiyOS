import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const baseUrl = () => (process.env.AGENTDOCK_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');
const token = () => process.env.AGENTDOCK_TOKEN ?? '';

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(request: Request, ctx: Ctx) {
  const session = await auth();
  const bearer = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const authorized = !!session?.user?.email || (!!token() && bearer === token());
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!token()) {
    return NextResponse.json({ error: 'ProdigyAI is not configured (AGENTDOCK_TOKEN missing)' }, { status: 503 });
  }

  const { path } = await ctx.params;
  const search = new URL(request.url).search;
  const target = `${baseUrl()}/${path.join('/')}${search}`;

  const headers: Record<string, string> = {
    authorization: `Bearer ${token()}`,
    accept: request.headers.get('accept') ?? 'application/json',
  };
  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const init: RequestInit = { method: request.method, headers, cache: 'no-store' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    if (body) init.body = body;
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'ProdigyAI backend is offline' }, { status: 502 });
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
};
