import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cookieNames = (request: Request) =>
  (request.headers.get('cookie') ?? '')
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean);

export async function GET(request: Request) {
  const session = await auth();
  const cookies = cookieNames(request);
  const forwardedProto = (request.headers.get('x-forwarded-proto') ?? '').split(',')[0].trim();
  const url = (process.env.AGENTDOCK_URL ?? 'http://127.0.0.1:8080').replace(/\/+$/, '');

  let backend: { reachable: boolean; status: number | null; error?: string } = { reachable: false, status: null };
  try {
    const response = await fetch(`${url}/health`, { cache: 'no-store', signal: AbortSignal.timeout(3000) });
    backend = { reachable: response.ok, status: response.status };
  } catch (caught) {
    backend = { reachable: false, status: null, error: caught instanceof Error ? caught.message : 'fetch failed' };
  }

  return NextResponse.json({
    session: session?.user?.email ?? null,
    cookies,
    expectedSessionCookie: forwardedProto === 'https' ? '__Secure-authjs.session-token' : 'authjs.session-token',
    headers: {
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      forwardedProto,
    },
    env: {
      configured: Boolean(process.env.AGENTDOCK_TOKEN),
      url,
      defaultWorkspace: process.env.AGENTDOCK_DEFAULT_WORKSPACE ?? '',
      defaultWorkspaceName: process.env.AGENTDOCK_DEFAULT_WORKSPACE_NAME ?? '',
    },
    backend,
  });
}
