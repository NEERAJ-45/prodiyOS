import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAction, scanActions } from '@/lib/agent/actions';

afterEach(() => {
  document.body.innerHTML = '';
});

function addAction(id: string, label: string, attrs = '') {
  const el = document.createElement('button');
  el.setAttribute('data-agent-action', id);
  el.setAttribute('data-agent-label', label);
  if (attrs) el.setAttribute('data-agent-danger', '');
  document.body.appendChild(el);
  return el;
}

describe('scanActions', () => {
  it('lists labelled controls', () => {
    addAction('nav-daily', 'Open Daily Planner');
    expect(scanActions()).toEqual([{ id: 'nav-daily', label: 'Open Daily Planner', dangerous: undefined }]);
  });

  it('marks dangerous controls', () => {
    addAction('delete-plan', 'Delete plan', 'danger');
    expect(scanActions()[0].dangerous).toBe(true);
  });
});

describe('runAction', () => {
  it('clicks the matching control', () => {
    const el = addAction('focus-start', 'Start focus');
    const spy = vi.fn();
    el.addEventListener('click', spy);
    expect(runAction('focus-start')).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('blocks dangerous controls unless allowed', () => {
    const el = addAction('delete-plan', 'Delete plan', 'danger');
    const spy = vi.fn();
    el.addEventListener('click', spy);
    expect(runAction('delete-plan')).toEqual({ ok: false, error: 'Dangerous action needs explicit confirmation' });
    expect(spy).not.toHaveBeenCalled();
    expect(runAction('delete-plan', { allowDangerous: true })).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('reports missing controls', () => {
    expect(runAction('nope')).toEqual({ ok: false, error: 'Action not visible on this screen' });
  });
});
