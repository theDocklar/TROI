'use client';

/**
 * LTVTrackerV2 — Interactive LTV cohort chart.
 * Supports 4 metric views: LTV, CAC, LTV:CAC ratio, and Repeat rate.
 * Each cohort bar is colour-coded by threshold with a CSS height transition.
 * An SVG polyline trend line shows direction across the 6 cohort months.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { MOCK_LTV_COHORTS } from '@/lib/mockData';
import type { LTVCohort } from '@/types';

type LTVMetric = 'ltv' | 'cac' | 'ltvCacRatio' | 'repeatRate';

interface MetricConfig {
  key: LTVMetric;
  label: string;
  format: (v: number) => string;
  color: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'ltv',
    label: 'LTV',
    format: (v) => `$${v}`,
    color: (v) => v > 120 ? 'bg-green-500' : v >= 80 ? 'bg-amber-400' : 'bg-red-400',
  },
  {
    key: 'cac',
    label: 'CAC',
    format: (v) => `$${v}`,
    // lower is better
    color: (v) => v < 20 ? 'bg-green-500' : v <= 28 ? 'bg-amber-400' : 'bg-red-400',
  },
  {
    key: 'ltvCacRatio',
    label: 'LTV:CAC',
    format: (v) => `${v.toFixed(1)}×`,
    color: (v) => v > 3.5 ? 'bg-green-500' : v >= 2.5 ? 'bg-amber-400' : 'bg-red-400',
  },
  {
    key: 'repeatRate',
    label: 'Repeat rate',
    format: (v) => `${v}%`,
    color: (v) => v > 30 ? 'bg-green-500' : v >= 20 ? 'bg-amber-400' : 'bg-red-400',
  },
];

const MAX_BAR_H = 80; // px

function getValue(cohort: LTVCohort, key: LTVMetric): number {
  return cohort[key] as number;
}

/** LTV cohort chart with 4 metric toggles, animated bars, SVG trend line, and summary row. */
export default function LTVTrackerV2(): React.JSX.Element {
  const [metric, setMetric] = useState<LTVMetric>('ltv');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cfg = METRICS.find((m) => m.key === metric)!;
  const values = MOCK_LTV_COHORTS.map((c) => getValue(c, metric));
  const maxVal = Math.max(...values, 1);
  const barWidth = 40;
  const gap = 20;
  const svgW = MOCK_LTV_COHORTS.length * (barWidth + gap) - gap;
  const svgH = MAX_BAR_H + 4;

  // Trend line: connect top centres of bars
  const points = values.map((v, i) => {
    const x = i * (barWidth + gap) + barWidth / 2;
    const barH = (v / maxVal) * MAX_BAR_H;
    const y = MAX_BAR_H - barH;
    return `${x},${y}`;
  });
  const trendColor = values[values.length - 1] > values[0] ? '#22c55e' : '#ef4444';

  const allVals = values;
  const best = MOCK_LTV_COHORTS[allVals.indexOf(Math.max(...allVals))];
  const worst = MOCK_LTV_COHORTS[allVals.indexOf(Math.min(...allVals))];
  const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle>LTV Cohort Analysis</CardTitle>
          <ToggleGroup
            type="single"
            value={metric}
            onValueChange={(v) => { if (v) setMetric(v as LTVMetric); }}
          >
            {METRICS.map((m) => (
              <ToggleGroupItem key={m.key} value={m.key} size="sm" className="text-xs">
                {m.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <TooltipProvider>
          <div className="relative">
            {/* Trend line SVG */}
            <svg
              width={svgW}
              height={svgH}
              className="absolute left-0 top-0 pointer-events-none"
            >
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke={trendColor}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                opacity={0.7}
              />
            </svg>

            {/* Bars */}
            <div className="flex items-end gap-5">
              {MOCK_LTV_COHORTS.map((cohort, i) => {
                const val = getValue(cohort, metric);
                const barH = (val / maxVal) * MAX_BAR_H;
                return (
                  <Tooltip key={cohort.month} open={hoveredIdx === i}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex flex-col items-center gap-1 cursor-default"
                        style={{ width: barWidth }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        <div
                          className={cn('w-full rounded-t-md transition-all duration-500', cfg.color(val))}
                          style={{ height: barH }}
                        />
                        <span className="text-[11px] text-muted-foreground">{cohort.month}</span>
                        <span className="text-[11px] font-medium">{cfg.format(val)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs space-y-0.5 p-3">
                      <p className="font-semibold mb-1">{cohort.month}</p>
                      <p>LTV: ${cohort.ltv}</p>
                      <p>CAC: ${cohort.cac}</p>
                      <p>LTV:CAC: {cohort.ltvCacRatio.toFixed(1)}×</p>
                      <p>Repeat rate: {cohort.repeatRate}%</p>
                      <p>Customers: {cohort.customers}</p>
                      <p>Orders: {cohort.orders}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </TooltipProvider>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Best cohort', value: `${best.month} — ${cfg.format(getValue(best, metric))}` },
            { label: 'Worst cohort', value: `${worst.month} — ${cfg.format(getValue(worst, metric))}` },
            { label: 'Average', value: cfg.format(Math.round(avg * 10) / 10) },
          ].map(({ label, value }) => (
            <Card key={label} className="p-3">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold text-sm mt-0.5">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
