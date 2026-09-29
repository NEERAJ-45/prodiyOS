export type NotificationCategory =
  | 'chat'
  | 'revision'
  | 'tasks'
  | 'interviews'
  | 'schedule'
  | 'pomodoro';

export const NOTIFICATION_CATEGORIES: {
  id: NotificationCategory;
  label: string;
  description: string;
}[] = [
  { id: 'chat', label: 'Chat', description: 'New group messages while away' },
  { id: 'revision', label: 'Revisions', description: 'Spaced revisions due or overdue' },
  { id: 'tasks', label: 'Tasks', description: 'High-priority tasks due today' },
  { id: 'interviews', label: 'Interviews', description: 'Rounds scheduled within 24 hours' },
  { id: 'schedule', label: 'Schedule', description: 'Study slots starting or missed' },
  { id: 'pomodoro', label: 'Pomodoro', description: 'Focus and break sessions' },
];

const ENABLED_KEY = 'notif-categories';
const SENT_KEY = 'notif-sent';
const SENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!notificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getEnabledCategories(): Record<NotificationCategory, boolean> {
  const stored = readJson<Partial<Record<NotificationCategory, boolean>>>(ENABLED_KEY, {});
  const result = {} as Record<NotificationCategory, boolean>;
  for (const cat of NOTIFICATION_CATEGORIES) {
    result[cat.id] = stored[cat.id] ?? true;
  }
  return result;
}

export function setCategoryEnabled(category: NotificationCategory, on: boolean) {
  const current = getEnabledCategories();
  current[category] = on;
  writeJson(ENABLED_KEY, current);
  return current;
}

export function toggleCategory(category: NotificationCategory): Record<NotificationCategory, boolean> {
  const current = getEnabledCategories();
  return setCategoryEnabled(category, !current[category]);
}

interface NotifyOptions {
  body?: string;
  tag?: string;
  dedupeKey?: string;
}

function pruneSent(map: Record<string, number>) {
  const cutoff = Date.now() - SENT_TTL_MS;
  for (const key of Object.keys(map)) {
    if (map[key] < cutoff) delete map[key];
  }
}

export function notify(category: NotificationCategory, title: string, options: NotifyOptions = {}): boolean {
  if (!notificationSupported() || Notification.permission !== 'granted') return false;
  if (!getEnabledCategories()[category]) return false;

  const { body, tag, dedupeKey } = options;

  if (dedupeKey) {
    const sent = readJson<Record<string, number>>(SENT_KEY, {});
    pruneSent(sent);
    if (sent[dedupeKey]) return false;
    sent[dedupeKey] = Date.now();
    writeJson(SENT_KEY, sent);
  }

  try {
    const n = new Notification(title, {
      body,
      tag: tag ?? dedupeKey ?? category,
      icon: '/globe.svg',
      badge: '/globe.svg',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function sendTestNotification(): boolean {
  if (!notificationSupported() || Notification.permission !== 'granted') return false;
  try {
    const n = new Notification('Samundar', { body: 'Browser notifications are working.', tag: 'test' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
