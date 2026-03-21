'use client';

/**
 * NotificationCentre — in-app notification popover anchored to the bell icon.
 * Shows unread/read notifications with severity colour coding, dismiss controls,
 * and a "Mark all read" action. Reads/writes from the Zustand UI store.
 */

import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import type { NotificationSeverity } from '@/types';

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-400',
  danger:  'bg-red-500',
  info:    'bg-blue-400',
};

interface Props {
  children: React.ReactNode; // the trigger element (bell button)
}

/** Notification popover panel with mark-all-read, per-item dismiss, and empty state. */
export default function NotificationCentre({ children }: Props): React.JSX.Element {
  const { notifications, dismissNotification, markAllRead } = useUIStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover onOpenChange={(open) => { if (open && unreadCount > 0) markAllRead(); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] max-h-[480px] overflow-y-auto p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notifications.length > 0 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'flex gap-3 px-4 py-3 border-b last:border-b-0 transition-colors group',
                  !n.read && 'bg-accent/40',
                )}
              >
                {/* Severity dot */}
                <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', SEVERITY_COLOR[n.severity])} />

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', !n.read ? 'font-medium' : 'font-normal')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{n.time}</p>
                </div>

                {/* Dismiss */}
                <button
                  className="shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => dismissNotification(n.id)}
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t">
            <button
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => console.log('View all notifications')}
            >
              View all
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
