export const BOOK_CATEGORIES = [
  { value: 'system-design', label: 'System Design' },
  { value: 'dsa', label: 'DSA & Algorithms' },
  { value: 'architecture', label: 'Architecture & Patterns' },
  { value: 'languages', label: 'Language & Frameworks' },
  { value: 'devops', label: 'DevOps & Infrastructure' },
  { value: 'databases', label: 'Databases' },
  { value: 'soft-skills', label: 'Soft Skills' },
  { value: 'other', label: 'Other' },
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number]['value'];

export function getCategoryLabel(value: string): string {
  return BOOK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
