// Hardcoded two-person chat allowlist (matched case-insensitively on display name)
// Pure module — safe to import from client components.
export const CHAT_ALLOWED_USERS = ['neeraj', 'revati'];

export function isChatAllowedUser(name?: string | null): boolean {
  if (!name) return false;
  return CHAT_ALLOWED_USERS.includes(name.trim().toLowerCase());
}
