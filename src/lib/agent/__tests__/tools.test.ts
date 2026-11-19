import { beforeEach, describe, expect, it, vi } from 'vitest';

const planDoc = {
  events: [{ id: 'e1', title: 'DSA', completed: false, status: 'Pending', date: '2026-11-20' }],
  save: vi.fn(),
};

vi.mock('@/lib/models/SchedulePlan', () => ({
  default: {
    find: vi.fn(() => ({ lean: () => Promise.resolve([{ name: 'Comeback', scheduleId: 's1', events: planDoc.events }]) })),
    findOne: vi.fn(() => Promise.resolve(planDoc)),
  },
}));

vi.mock('@/lib/models/DailyRecord', () => ({
  default: { findOne: vi.fn(() => ({ lean: () => Promise.resolve({ completedTaskIds: ['x'] }) })) },
}));

import { executeTool } from '@/lib/agent/tools';

const ctx = { email: 'a@b.c', today: '2026-11-20' };

describe('executeTool', () => {
  beforeEach(() => {
    planDoc.events = [{ id: 'e1', title: 'DSA', completed: false, status: 'Pending', date: '2026-11-20' }];
    planDoc.save.mockClear();
  });

  it('rejects unknown tools', async () => {
    expect(await executeTool('nope', {}, ctx)).toEqual({ ok: false, error: 'Unknown tool nope' });
  });

  it('returns today plan with calendar events', async () => {
    const result = await executeTool('get_today_plan', {}, ctx);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as { date: string; completedTaskIds: string[]; calendar: { eventId: string }[] };
    expect(data.date).toBe('2026-11-20');
    expect(data.completedTaskIds).toEqual(['x']);
    expect(data.calendar[0].eventId).toBe('e1');
  });

  it('ticks a calendar event', async () => {
    const result = await executeTool('set_event_done', { eventId: 'e1', done: true }, ctx);
    expect(result).toEqual({ ok: true, data: { eventId: 'e1', title: 'DSA', done: true } });
    expect(planDoc.events[0].completed).toBe(true);
    expect(planDoc.events[0].status).toBe('Done');
    expect(planDoc.save).toHaveBeenCalledOnce();
  });

  it('fails on missing event', async () => {
    expect(await executeTool('add_event_note', { eventId: 'zz', note: 'hi' }, ctx)).toEqual({ ok: false, error: 'Event not found' });
  });
});
