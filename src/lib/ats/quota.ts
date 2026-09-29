export const ANALYZE_LIMIT = 10;
export const OPTIMIZE_LIMIT = 5;
export const HUMANIZE_LIMIT = 5;

export function limitForAction(action: 'analyze' | 'optimize' | 'humanize'): number {
  if (action === 'optimize') return OPTIMIZE_LIMIT;
  if (action === 'humanize') return HUMANIZE_LIMIT;
  return ANALYZE_LIMIT;
}
