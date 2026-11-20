import type { AgentAction } from './types';

const CANDIDATE_SELECTOR = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"]';
const MAX_ACTIONS = 80;

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
  const style = getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function inChrome(el: HTMLElement): boolean {
  if (el.closest('main, nav, header, aside')) return true;
  return !document.querySelector('main, nav');
}

function labelFor(el: HTMLElement): string {
  const explicit = el.dataset.agentLabel || el.getAttribute('aria-label') || el.getAttribute('title');
  return normalize(explicit || el.textContent || '').slice(0, 80);
}

function slug(text: string): string {
  return normalize(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function scanActions(root: ParentNode = document): AgentAction[] {
  const seen = new Map<string, AgentAction>();

  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-agent-action]'))) {
    if (!isVisible(el)) continue;
    const id = el.dataset.agentAction as string;
    seen.set(id, {
      id,
      label: labelFor(el) || id,
      dangerous: el.hasAttribute('data-agent-danger') || undefined,
    });
  }

  for (const el of Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR))) {
    if (el.dataset.agentAction) continue;
    if (el.closest('[data-agent-ignore]')) continue;
    if (!inChrome(el)) continue;
    if (!isVisible(el)) continue;
    const label = labelFor(el);
    if (label.length < 2) continue;
    const id = `dom:${slug(label)}`;
    if (seen.has(id)) continue;
    seen.set(id, {
      id,
      label,
      dangerous: el.hasAttribute('data-agent-danger') || undefined,
    });
    if (seen.size >= MAX_ACTIONS) break;
  }

  return Array.from(seen.values());
}

// ponytail: label token overlap picks the best visible match; swap for explicit data-agent-action on ambiguous screens.
function findDomAction(id: string): HTMLElement | null {
  const wanted = id.slice(4);
  const wantedTokens = new Set(wanted.split('-').filter(Boolean));
  let best: { el: HTMLElement; score: number } | null = null;

  for (const el of Array.from(document.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR))) {
    if (el.closest('[data-agent-ignore]')) continue;
    if (!isVisible(el)) continue;
    const candidate = slug(labelFor(el));
    if (!candidate) continue;
    if (candidate === wanted) return el;
    const tokens = candidate.split('-').filter(Boolean);
    const hits = tokens.filter((token) => wantedTokens.has(token)).length;
    if (!tokens.length || hits / tokens.length < 0.5) continue;
    if (!best || hits > best.score) best = { el, score: hits };
  }

  return best?.el ?? null;
}

export function runAction(id: string, options: { allowDangerous?: boolean } = {}): { ok: boolean; error?: string } {
  const el = id.startsWith('dom:')
    ? findDomAction(id)
    : document.querySelector<HTMLElement>(`[data-agent-action="${CSS.escape(id)}"]`);
  if (!el) return { ok: false, error: 'Action not visible on this screen' };
  if (el.hasAttribute('data-agent-danger') && !options.allowDangerous) {
    return { ok: false, error: 'Dangerous action needs explicit confirmation' };
  }
  el.click();
  return { ok: true };
}

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'you', 'your', 'can', 'please', 'what', 'open', 'show', 'my']);

export function pickActions(actions: AgentAction[], message: string): AgentAction[] {
  if (actions.length <= 60) return actions;
  const tokens = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  const scored = actions
    .map((action) => {
      const label = action.label.toLowerCase();
      const score = tokens.filter((token) => label.includes(token)).length;
      return { action, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40)
    .map((entry) => entry.action);
  const pinned = actions.filter((action) => action.id.startsWith('nav') || action.dangerous);
  const out: AgentAction[] = [];
  for (const action of [...pinned, ...scored]) {
    if (!out.some((item) => item.id === action.id)) out.push(action);
  }
  return out.slice(0, 60);
}
