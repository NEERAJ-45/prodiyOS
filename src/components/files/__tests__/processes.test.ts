import { describe, expect, it } from 'vitest';
import { processReducer, type AppProcess } from '../processes';

describe('processReducer', () => {
  it('tracks a process from start to finish', () => {
    let state = processReducer([], {
      type: 'start',
      process: { id: 'p1', kind: 'upload', name: 'a.pdf', detail: 'Uploading…' },
    });
    expect(state).toHaveLength(1);
    expect(state[0].status).toBe('running');

    state = processReducer(state, { type: 'patch', id: 'p1', patch: { progress: 40 } });
    expect(state[0].progress).toBe(40);

    state = processReducer(state, { type: 'finish', id: 'p1', status: 'done', detail: 'Uploaded' });
    expect(state[0].status).toBe('done');
    expect(state[0].detail).toBe('Uploaded');
    expect(state[0].abort).toBeUndefined();

    state = processReducer(state, { type: 'clearFinished' });
    expect(state).toHaveLength(0);
  });

  it('restarts an existing id without duplicating it', () => {
    let state = processReducer([], {
      type: 'start',
      process: { id: 'pdf-1', kind: 'pdf', name: 'doc' },
    });
    state = processReducer(state, { type: 'finish', id: 'pdf-1', status: 'done' });
    state = processReducer(state, {
      type: 'start',
      process: { id: 'pdf-1', kind: 'pdf', name: 'doc' },
    });

    expect(state).toHaveLength(1);
    expect(state[0].status).toBe('running');
  });

  it('keeps finished jobs but drops the oldest beyond 50 entries', () => {
    let state: AppProcess[] = [];
    for (let i = 0; i < 55; i += 1) {
      state = processReducer(state, {
        type: 'start',
        process: { id: `p${i}`, kind: 'zip', name: `job ${i}` },
      });
    }
    expect(state).toHaveLength(50);
    expect(state[0].id).toBe('p54');
    expect(state.some((p) => p.id === 'p0')).toBe(false);

    state = processReducer(state, { type: 'remove', id: 'p54' });
    expect(state.some((p) => p.id === 'p54')).toBe(false);
  });
});
