/**
 * Five KPI summary cards: Revenue, Spend, ROI, ROAS, Profit.
 * Each shows the value, period-over-period trend, and a sparkline.
 * Renders skeleton loaders while SWR is fetching.
 */

'use client';

import { TrendingUp, TrendingDown, DollarSign, Target, BarChart2, Percent } from 'lucide-react';
import { useMetrics } from '@/hooks/useMetrics';
import { useUIStore } from '@/store/uiStore';
import { computeTrend, getSparkline } from '@/lib/metrics';
import { formatCurrency, formatPercent, formatROAS } from '@/lib/utils';
import { MOCK_CAMPAIGNS } from '@/lib/mockData';
import Sparkline from './Sparkline';
import { cn } from '@/lib/utils';

function SkeletonCard(): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

interface CardProps {
  label: string;
  value: string;
  trend: number;
  sparkData: number[];
  sparkColor: string;
  icon: React.ReactNode;
  tooltip: string;
}

function Card({ label, value, trend, sparkData, sparkColor, icon, tooltip }: CardProps): React.JSX.Element {
  const positive = trend >= 0;
  return (
    <div
      className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-shadow"
      title={tooltip}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <span className="text-gray-400 dark:text-gray-500">{icon}</span>
          {label}
        </span>
        <Sparkline data={sparkData} color={sparkColor} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <div className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400')}>
        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {positive ? '+' : ''}{trend.toFixed(1)}% vs prior period
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-xl pointer-events-none">
        {tooltip}
      </div>
    </div>
  );
}

/** Displays the five top-line KPI cards for the selected period. */
export default function SummaryCards(): React.JSX.Element {
  const range = useUIStore((s) => s.range);
  const { metrics, isLoading } = useMetrics(range);

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const { current, previous } = metrics;

  // Build sparklines from daily revenue of all campaigns combined
  const dailyRevenue = Array.from({ length: 60 }, (_, d) =>
    MOCK_CAMPAIGNS.reduce((s, c) => s + c.dailyRevenue[d], 0));
  const dailySpend = Array.from({ length: 60 }, (_, d) =>
    MOCK_CAMPAIGNS.reduce((s, c) => s + c.dailySpend[d], 0));
  const dailyProfit = dailyRevenue.map((r, i) => r - dailySpend[i]);

  const revSpark    = getSparkline(dailyRevenue, range);
  const spendSpark  = getSparkline(dailySpend, range);
  const profitSpark = getSparkline(dailyProfit, range);

  const cards: CardProps[] = [
    {
      label: 'Total Revenue',
      value: formatCurrency(current.totalRevenue),
      trend: computeTrend(current.totalRevenue, previous.totalRevenue),
      sparkData: revSpark,
      sparkColor: '#6366f1',
      icon: <DollarSign size={12} />,
      tooltip: 'Gross revenue from all ad-attributed sales in this period.',
    },
    {
      label: 'Ad Spend',
      value: formatCurrency(current.totalSpend),
      trend: computeTrend(current.totalSpend, previous.totalSpend),
      sparkData: spendSpark,
      sparkColor: '#f59e0b',
      icon: <BarChart2 size={12} />,
      tooltip: 'Total money spent across all active ad campaigns.',
    },
    {
      label: 'True ROI',
      value: formatPercent(current.trueROI),
      trend: computeTrend(current.trueROI, previous.trueROI),
      sparkData: getSparkline(dailyRevenue.map((r, i) => {
        const s = dailySpend[i];
        return s === 0 ? 0 : ((r * 0.62 - s) / s) * 100;
      }), range),
      sparkColor: current.trueROI > 20 ? '#22c55e' : current.trueROI > 5 ? '#f59e0b' : '#ef4444',
      icon: <Percent size={12} />,
      tooltip: 'Net profit after COGS, shipping, refunds, and payment fees — divided by ad spend. This is what actually matters.',
    },
    {
      label: 'Blended ROAS',
      value: formatROAS(current.blendedROAS),
      trend: computeTrend(current.blendedROAS, previous.blendedROAS),
      sparkData: getSparkline(dailyRevenue.map((r, i) => dailySpend[i] === 0 ? 0 : r / dailySpend[i]), range),
      sparkColor: '#8b5cf6',
      icon: <Target size={12} />,
      tooltip: 'Revenue ÷ Spend. Higher is better but does NOT account for your costs. Use ROI for profit decisions.',
    },
    {
      label: 'Net Profit',
      value: formatCurrency(current.netProfit),
      trend: computeTrend(current.netProfit, previous.netProfit),
      sparkData: profitSpark,
      sparkColor: current.netProfit > 0 ? '#22c55e' : '#ef4444',
      icon: <DollarSign size={12} />,
      tooltip: 'Revenue minus COGS, shipping, refunds, payment fees, and ad spend. Your actual take-home.',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((c) => <Card key={c.label} {...c} />)}
    </div>
  );
}
