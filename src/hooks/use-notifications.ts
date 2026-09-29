'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getEnabledCategories,
  getPermission,
  requestPermission,
  toggleCategory,
  notificationSupported,
  type NotificationCategory,
} from '@/lib/notifications';

export function useNotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [enabled, setEnabled] = useState<Record<NotificationCategory, boolean>>(() => getEnabledCategories());

  useEffect(() => {
    // Defer past hydration so SSR (unsupported) and client renders match
    const t = window.setTimeout(() => {
      setSupported(notificationSupported());
      setPermission(getPermission());
      setEnabled(getEnabledCategories());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const request = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    return result;
  }, []);

  const toggle = useCallback((category: NotificationCategory) => {
    setEnabled(toggleCategory(category));
  }, []);

  return { supported, permission, enabled, request, toggle };
}
