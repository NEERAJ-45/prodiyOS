import type { AgentAction } from './types';

export function scanActions(root: ParentNode = document): AgentAction[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-agent-action]')).map((el) => ({
    id: el.dataset.agentAction as string,
    label: el.dataset.agentLabel || el.textContent?.trim() || (el.dataset.agentAction as string),
    dangerous: el.hasAttribute('data-agent-danger') || undefined,
  }));
}

export function runAction(id: string, options: { allowDangerous?: boolean } = {}): { ok: boolean; error?: string } {
  const el = document.querySelector<HTMLElement>(`[data-agent-action="${CSS.escape(id)}"]`);
  if (!el) return { ok: false, error: 'Action not visible on this screen' };
  if (el.hasAttribute('data-agent-danger') && !options.allowDangerous) {
    return { ok: false, error: 'Dangerous action needs explicit confirmation' };
  }
  el.click();
  return { ok: true };
}
