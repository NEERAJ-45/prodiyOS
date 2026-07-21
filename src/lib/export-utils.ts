import { toast } from '@/components/ui/toast';

export function escapeCsv(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function buildCsv(header: string[], rows: string[][]): string {
  const head = header.join(',');
  const body = rows.map((r) => r.join(',')).join('\n');
  return '\uFEFF' + head + '\n' + body;
}

export async function copyToClipboard(text: string, label = 'CSV'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error('Failed to copy to clipboard');
    throw new Error('Clipboard copy failed');
  }
}
