import { auth } from '@/auth';

// Hardcoded two-person chat allowlist (matched case-insensitively on display name)
export const CHAT_ALLOWED_USERS = ['neeraj', 'revati'];

export function isChatAllowedUser(name?: string | null): boolean {
  if (!name) return false;
  return CHAT_ALLOWED_USERS.includes(name.trim().toLowerCase());
}

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
