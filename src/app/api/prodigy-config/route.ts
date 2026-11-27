import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    configured: Boolean(process.env.AGENTDOCK_TOKEN),
    url: process.env.AGENTDOCK_URL ?? 'http://127.0.0.1:8080',
    defaultWorkspace: process.env.AGENTDOCK_DEFAULT_WORKSPACE ?? '',
    defaultWorkspaceName: process.env.AGENTDOCK_DEFAULT_WORKSPACE_NAME ?? 'ProdigyOS',
  });
}
