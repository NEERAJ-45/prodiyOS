'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, CheckCircle2, Loader2 } from 'lucide-react';
import { useNotificationSettings } from '@/hooks/use-notifications';
import { NOTIFICATION_CATEGORIES, sendTestNotification } from '@/lib/notifications';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export function NotificationsBell() {
  const { supported, permission, enabled, request, toggle } = useNotificationSettings();
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!supported) return null;

  const granted = permission === 'granted';

  const handleEnable = async () => {
    setRequesting(true);
    const result = await request();
    setRequesting(false);
    if (result === 'granted') {
      toast({ variant: 'success', title: 'Browser notifications enabled' });
      sendTestNotification();
    } else if (result === 'denied') {
      toast({ variant: 'destructive', title: 'Permission denied — enable it in browser settings' });
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center justify-center rounded-lg border border-border p-1.5 transition-colors cursor-pointer',
          open
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        title="Notifications"
        aria-label="Notification settings"
        aria-expanded={open}
      >
        <Bell className="h-3.5 w-3.5" />
        {!granted && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 overflow-hidden"
          role="dialog"
          aria-label="Notification settings"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
            <span className="text-xs font-semibold">Notifications</span>
            <span
              className={cn(
                'text-[10px] font-medium',
                granted ? 'text-emerald-400' : permission === 'denied' ? 'text-red-400' : 'text-amber-400'
              )}
            >
              {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not enabled'}
            </span>
          </div>

          {!granted && (
            <div className="px-3.5 py-3 border-b border-border">
              {permission === 'denied' ? (
                <p className="text-[11px] text-muted-foreground">
                  Notifications are blocked. Allow them for this site in your browser&apos;s address bar settings.
                </p>
              ) : (
                <button
                  onClick={handleEnable}
                  disabled={requesting}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {requesting ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                  Enable browser notifications
                </button>
              )}
            </div>
          )}

          <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
            {NOTIFICATION_CATEGORIES.map((cat) => {
              const on = enabled[cat.id];
              return (
                <button
                  key={cat.id}
                  onClick={() => toggle(cat.id)}
                  className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent transition-colors cursor-pointer"
                  role="switch"
                  aria-checked={on}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{cat.description}</p>
                  </div>
                  <span
                    className={cn(
                      'relative shrink-0 w-8 h-4.5 rounded-full transition-colors',
                      on ? 'bg-primary' : 'bg-muted'
                    )}
                    style={{ height: '18px' }}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-background shadow transition-all',
                        on ? 'left-[16px]' : 'left-0.5'
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {granted && (
            <div className="border-t border-border p-2">
              <button
                onClick={() => {
                  if (sendTestNotification()) toast({ title: 'Test notification sent' });
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <CheckCircle2 size={12} />
                Send test notification
              </button>
            </div>
          )}

          {!granted && permission !== 'denied' && (
            <div className="border-t border-border px-3.5 py-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <BellOff size={11} />
              Enable to get revision, task, interview and chat alerts
            </div>
          )}
        </div>
      )}
    </div>
  );
}
