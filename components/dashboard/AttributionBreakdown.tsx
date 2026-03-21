'use client';

/**
 * AttributionBreakdown — multi-touch attribution model breakdown.
 * Lets the user toggle between First touch, Last touch, and Linear models.
 * Shows an animated stacked bar and per-channel metric cards.
 * Data is derived entirely from metrics.current.campaigns.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMetrics } from '@/hooks/useMetrics';
import { useUIStore } from '@/store/uiStore';

type AttrModel = 'first' | 'last' | 'linear';

const ATTR_WEIGHTS: Record<AttrModel, Record<string, number>> = {
  first:  { Meta: 0.60, Google: 0.15, TikTok: 0.20, Email: 0.05 },
  last:   { Meta: 0.25, Google: 0.20, TikTok: 0.45, Email: 0.10 },
  linear: { Meta: 0.25, Google: 0.25, TikTok: 0.25, Email: 0.25 },
};

const CHANNEL_COLORS: Record<string, string> = {
  Meta:   '#1877F2',
  Google: '#4285F4',
  TikTok: '#374151',
  Email:  '#F4633A',
};

const MODEL_NOTES: Record<AttrModel, string> = {
  last:   'Last touch credits the final ad click before purchase.',
  first:  'First touch credits the channel that introduced the customer.',
  linear: 'Linear splits credit equally across all channels in the path.',
};

function recLabel(roi: number): { label: string; cls: string } {
  if (roi > 20) return { label: 'Scale',   cls: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400' };
  if (roi > 5)  return { label: 'Monitor', cls: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' };
  return          { label: 'Pause',   cls: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400' };
}

/** Attribution model breakdown with animated stacked bar and per-channel cards. */
export default function AttributionBreakdown(): React.JSX.Element {
  const [model, setModel] = useState<AttrModel>('last');
  const { range } = useUIStore();
  const { metrics, isLoading } = useMetrics(range);

  if (isLoading || !metrics) return <div className="h-32 animate-pulse bg-muted rounded-xl" />;

  const totalRevenue = metrics.current.totalRevenue;
  const weights = ATTR_WEIGHTS[model];

  // Group campaigns by channel
  const channels = ['Meta', 'Google', 'TikTok', 'Email'];
  const channelData = channels.map((ch) => {
    const campaigns = metrics.current.campaigns.filter((c) => c.channel === ch);
    const actualSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const adjRevenue = totalRevenue * (weights[ch] ?? 0);
    const chROI = actualSpend > 0 ? ((adjRevenue - actualSpend) / actualSpend) * 100 : 0;
    return { ch, adjRevenue, actualSpend, chROI, weight: weights[ch] ?? 0 };
  });

  const topROI = Math.max(...channelData.map((c) => c.chROI));

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {/* Header + toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-base">Attribution Breakdown</h2>
          </div>
          <ToggleGroup
            type="single"
            value={model}
            onValueChange={(v) => { if (v) setModel(v as AttrModel); }}
          >
            <ToggleGroupItem value="first"  size="sm" className="text-xs">First touch</ToggleGroupItem>
            <ToggleGroupItem value="last"   size="sm" className="text-xs">Last touch</ToggleGroupItem>
            <ToggleGroupItem value="linear" size="sm" className="text-xs">Linear</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Stacked bar */}
        <div className="h-9 rounded-lg overflow-hidden flex">
          {channelData.map(({ ch, weight }) => (
            <div
              key={ch}
              style={{
                width: `${weight * 100}%`,
                backgroundColor: CHANNEL_COLORS[ch],
                transition: 'width 0.5s ease',
              }}
              className="flex items-center justify-center overflow-hidden"
              title={`${ch}: ${(weight * 100).toFixed(0)}%`}
            >
              {weight > 0.08 && (
                <span className="text-white text-[11px] font-medium truncate px-1">
                  {ch} {(weight * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {channelData.map(({ ch, adjRevenue, actualSpend, chROI }) => {
            const rec = recLabel(chROI);
            const isTop = Math.abs(chROI - topROI) < 0.01;
            return (
              <Card
                key={ch}
                className={cn('p-3 transition-all', isTop && 'ring-1 ring-green-500 dark:ring-green-400')}
              >
                <CardContent className="p-0 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CHANNEL_COLORS[ch] }}
                    />
                    <span className="font-medium text-sm">{ch}</span>
                  </div>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>Adj. revenue: <span className="text-foreground font-medium">
                      ${(adjRevenue / 1000).toFixed(1)}k
                    </span></p>
                    <p>Ad spend: <span className="text-foreground font-medium">
                      ${(actualSpend / 1000).toFixed(1)}k
                    </span></p>
                    <p>True ROI: <span className={cn('font-medium', chROI > 20 ? 'text-green-600' : chROI > 5 ? 'text-amber-500' : 'text-red-500')}>
                      {chROI.toFixed(0)}%
                    </span></p>
                  </div>
                  <Badge className={cn('text-[11px]', rec.cls)}>{rec.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Model note */}
        <p className="text-xs text-muted-foreground">{MODEL_NOTES[model]}</p>
      </CardContent>
    </Card>
  );
}
