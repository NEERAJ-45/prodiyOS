export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function timeAgo(ts: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function statusTone(status: string): string {
  switch (status) {
    case 'running':
    case 'done':
      return 'text-emerald-400';
    case 'queued':
    case 'created':
    case 'switching':
      return 'text-amber-400';
    case 'blocked':
    case 'interrupted':
      return 'text-orange-400';
    case 'failed':
    case 'cancelled':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}
