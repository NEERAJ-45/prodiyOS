import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    const cookie = request.headers.get('cookie') ?? '';
    console.warn('[prodigy] config unauthorized', {
      cookies: cookie.split(';').map((part) => part.trim().split('=')[0]).filter(Boolean),
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      forwardedProto: request.headers.get('x-forwarded-proto'),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    configured: Boolean(process.env.AGENTDOCK_TOKEN),
    url: process.env.AGENTDOCK_URL ?? 'http://127.0.0.1:8080',
    defaultWorkspace: process.env.AGENTDOCK_DEFAULT_WORKSPACE ?? '',
    defaultWorkspaceName: process.env.AGENTDOCK_DEFAULT_WORKSPACE_NAME ?? 'ProdigyOS',
  });
}
