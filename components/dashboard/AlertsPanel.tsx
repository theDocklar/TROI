/**
 * Alert panel showing up to 3 alerts with dismiss, severity badge, and "View all" dialog.
 */

'use client';

import { useState } from 'react';
import { X, Bell } from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SEV_CLASSES = {
  green: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  amber: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  red:   'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
};

const SEV_BADGE = {
  green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  amber: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  red:   'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
};

function AlertRow({ alert, onDismiss }: { alert: Alert; onDismiss: (id: string) => void }): React.JSX.Element {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', SEV_CLASSES[alert.severity])}>
      <span className={cn('px-1.5 py-0.5 text-[10px] font-bold rounded uppercase shrink-0 mt-0.5', SEV_BADGE[alert.severity])}>
        {alert.severity}
      </span>
      <p className="flex-1 text-sm leading-relaxed">{alert.text}</p>
      <span className="text-xs opacity-60 shrink-0 mt-0.5">{alert.time}</span>
      <button
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss alert"
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Displays top 3 alerts with dismiss capability and a "View all" modal. */
export default function AlertsPanel(): React.JSX.Element {
  const range = useUIStore((s) => s.range);
  const { dismissedAlerts, dismissAlert } = useUIStore();
  const { alerts, isLoading } = useInsights(range);
  const [showAll, setShowAll] = useState(false);

  const visible = (alerts ?? []).filter((a) => !dismissedAlerts.includes(a.id));
  const shown = visible.slice(0, 3);
  const remaining = visible.length - 3;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-0">
        <Bell size={16} className="text-gray-500 dark:text-gray-400" />
        <CardTitle className="text-base font-semibold">Alerts</CardTitle>
        {visible.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300">
            {visible.length}
          </span>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">All clear — no active alerts.</p>
        ) : (
          <div className="space-y-2">
            {shown.map((a) => <AlertRow key={a.id} alert={a} onDismiss={dismissAlert} />)}
            {remaining > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View {remaining} more alert{remaining !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}
      </CardContent>

      {/* Dialog for all alerts */}
      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Alerts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {visible.map((a) => <AlertRow key={a.id} alert={a} onDismiss={(id) => { dismissAlert(id); if (visible.length <= 1) setShowAll(false); }} />)}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
