import { auth } from '@/auth';
import { isChatAllowedUser } from '@/lib/chat-allowlist';

// Server-only: imports @/auth (mongoose) — never import this from client components.
export async function requireChatAccess(): Promise<{ ok: true; name: string } | { ok: false; response: Response }> {
  const session = await auth();
  const name = session?.user?.name || '';
  if (!isChatAllowedUser(name)) {
    return {
      ok: false,
      response: Response.json({ error: 'Chat is restricted to two users' }, { status: 403 }),
    };
  }
  return { ok: true, name };
}
