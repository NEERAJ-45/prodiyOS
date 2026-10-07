import { describe, it, expect } from 'vitest';
import { toggleReaction, groupReactions } from '@/lib/chat-reactions';

describe('toggleReaction', () => {
  it('adds a reaction when the user has none', () => {
    expect(toggleReaction([], 'alice', '👍')).toEqual([{ user: 'alice', emoji: '👍' }]);
  });

  it('removes the reaction when the same emoji is toggled again', () => {
    const list = [
      { user: 'alice', emoji: '👍' },
      { user: 'bob', emoji: '❤️' },
    ];
    expect(toggleReaction(list, 'alice', '👍')).toEqual([{ user: 'bob', emoji: '❤️' }]);
  });

  it('replaces the user reaction when a different emoji is chosen', () => {
    const list = [
      { user: 'alice', emoji: '👍' },
      { user: 'bob', emoji: '❤️' },
    ];
    expect(toggleReaction(list, 'alice', '😂')).toEqual([
      { user: 'alice', emoji: '😂' },
      { user: 'bob', emoji: '❤️' },
    ]);
  });

  it('keeps other users untouched', () => {
    const list = [
      { user: 'alice', emoji: '👍' },
      { user: 'bob', emoji: '👍' },
    ];
    expect(toggleReaction(list, 'carol', '👍')).toEqual([
      { user: 'alice', emoji: '👍' },
      { user: 'bob', emoji: '👍' },
      { user: 'carol', emoji: '👍' },
    ]);
  });
});

describe('groupReactions', () => {
  it('groups by emoji with counts and user lists', () => {
    const grouped = groupReactions([
      { user: 'alice', emoji: '👍' },
      { user: 'bob', emoji: '👍' },
      { user: 'carol', emoji: '😂' },
    ]);
    expect(grouped).toEqual([
      { emoji: '👍', count: 2, users: ['alice', 'bob'] },
      { emoji: '😂', count: 1, users: ['carol'] },
    ]);
  });

  it('returns empty array for no reactions', () => {
    expect(groupReactions([])).toEqual([]);
  });
});
