export interface ChatReaction {
  user: string;
  emoji: string;
}

/**
 * One reaction per user per message: add, toggle off, or replace.
 * Returns a new array; never mutates the input.
 */
export function toggleReaction(list: ChatReaction[], user: string, emoji: string): ChatReaction[] {
  const existing = list.find((r) => r.user === user);
  if (!existing) return [...list, { user, emoji }];
  if (existing.emoji === emoji) return list.filter((r) => r.user !== user);
  return list.map((r) => (r.user === user ? { ...r, emoji } : r));
}

export interface GroupedReaction {
  emoji: string;
  count: number;
  users: string[];
}

/** Aggregate raw reactions into display chips, preserving first-seen emoji order. */
export function groupReactions(list: ChatReaction[]): GroupedReaction[] {
  const order: string[] = [];
  const byEmoji = new Map<string, GroupedReaction>();
  for (const r of list) {
    let g = byEmoji.get(r.emoji);
    if (!g) {
      g = { emoji: r.emoji, count: 0, users: [] };
      byEmoji.set(r.emoji, g);
      order.push(r.emoji);
    }
    g.count += 1;
    g.users.push(r.user);
  }
  return order.map((e) => byEmoji.get(e)!);
}
