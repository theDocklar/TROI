/**
 * "Marketing Direction" panel — displays AI-generated insight cards
 * with color-coded recommendations (green/amber/red).
 */

'use client';

import {
  TrendingUp, Activity, AlertTriangle, Flame, Star, XCircle, Rocket, Mail, Compass,
} from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import type { Insight } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ICON_MAP: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp size={16} />,
  Activity:   <Activity size={16} />,
  AlertTriangle: <AlertTriangle size={16} />,
  Flame:      <Flame size={16} />,
  Star:       <Star size={16} />,
  XCircle:    <XCircle size={16} />,
  Rocket:     <Rocket size={16} />,
  Mail:       <Mail size={16} />,
};

const COLOR_CLASSES = {
  green: {
    border: 'border-green-200 dark:border-green-800',
    dot:    'bg-green-500',
    bg:     'bg-green-50 dark:bg-green-950/40',
    icon:   'text-green-600 dark:text-green-400',
    text:   'text-green-800 dark:text-green-200',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-800',
    dot:    'bg-amber-500',
    bg:     'bg-amber-50 dark:bg-amber-950/40',
    icon:   'text-amber-600 dark:text-amber-400',
    text:   'text-amber-800 dark:text-amber-200',
  },
  red: {
    border: 'border-red-200 dark:border-red-800',
    dot:    'bg-red-500',
    bg:     'bg-red-50 dark:bg-red-950/40',
    icon:   'text-red-600 dark:text-red-400',
    text:   'text-red-800 dark:text-red-200',
  },
};

function InsightCard({ insight }: { insight: Insight }): React.JSX.Element {
  const c = COLOR_CLASSES[insight.color];
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', c.border, c.bg)}>
      <span className={cn('mt-0.5 shrink-0', c.icon)}>{ICON_MAP[insight.icon] ?? <Activity size={16} />}</span>
      <div className="flex items-start gap-2 min-w-0">
        <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', c.dot)} />
        <p className={cn('text-sm leading-relaxed', c.text)}>{insight.text}</p>
      </div>
    </div>
  );
}

function SkeletonCard(): React.JSX.Element {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

/** Prominent panel showing plain-English marketing recommendations. */
export default function MarketingDirection(): React.JSX.Element {
  const range = useUIStore((s) => s.range);
  const { insights, isLoading } = useInsights(range);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Compass size={18} className="text-indigo-500" />
        <CardTitle className="text-base font-semibold">Marketing Direction</CardTitle>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{range}-day view</span>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {isLoading || !insights
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      </CardContent>
    </Card>
  );
}
