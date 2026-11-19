import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/db';
import { runAgent } from '@/lib/agent/run-agent';
import type { AgentAction, AgentMessage } from '@/lib/agent/types';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'agent_offline' }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { messages?: AgentMessage[]; actions?: AgentAction[]; today?: string } | null;
  const messages = Array.isArray(body?.messages) ? body!.messages : null;
  if (!messages?.length) return NextResponse.json({ error: 'messages are required' }, { status: 400 });
  const actions = Array.isArray(body?.actions)
    ? body!.actions.filter((a) => a && typeof a.id === 'string' && typeof a.label === 'string')
    : [];
  const today = typeof body?.today === 'string' && DATE_KEY.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);

  if (!(await connectToDatabase())) return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });

  try {
    return NextResponse.json(await runAgent({ messages, actions, email, apiKey, today }));
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : 'Agent failed' }, { status: 502 });
  }
}
