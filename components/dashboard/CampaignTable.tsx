/**
 * Campaign performance table with sortable columns, channel filters,
 * spend mini-bars, ROI color-coding, and recommendation badges.
 * First column is sticky on mobile for horizontal scroll.
 */

'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatPercent, formatROAS, cn } from '@/lib/utils';
import type { CampaignMetrics, Channel } from '@/types';

type SortKey = 'name' | 'channel' | 'spend' | 'revenue' | 'roas' | 'roi';
type SortDir = 'asc' | 'desc';

const CHANNELS: ('All' | Channel)[] = ['All', 'Meta', 'Google', 'TikTok', 'Email'];

const CHANNEL_COLORS: Record<Channel, string> = {
  Meta:   'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  Google: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  TikTok: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',
  Email:  'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
};

function roiColor(roi: number): string {
  if (roi > 20) return 'text-green-600 dark:text-green-400 font-semibold';
  if (roi >= 5) return 'text-amber-600 dark:text-amber-400 font-semibold';
  return 'text-red-600 dark:text-red-400 font-semibold';
}

function Badge({ roi }: { roi: number }): React.JSX.Element {
  if (roi > 20) return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Scale</span>;
  if (roi >= 5) return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">Monitor</span>;
  return <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">Pause</span>;
}

function SpendBar({ spend, max }: { spend: number; max: number }): React.JSX.Element {
  const pct = max === 0 ? 0 : (spend / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span>{formatCurrency(spend)}</span>
      <div className="w-12 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SortIcon({ col, sort }: { col: SortKey; sort: { key: SortKey; dir: SortDir } }): React.JSX.Element {
  if (sort.key !== col) return <ChevronsUpDown size={12} className="text-gray-300 dark:text-gray-600" />;
  return sort.dir === 'asc'
    ? <ChevronUp size={12} className="text-indigo-500" />
    : <ChevronDown size={12} className="text-indigo-500" />;
}

function SkeletonRow(): React.JSX.Element {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
      ))}
    </tr>
  );
}

/** Full campaign performance table with sort, filter, and recommendation badges. */
export default function CampaignTable(): React.JSX.Element {
  const range = useUIStore((s) => s.range);
  const { campaigns, isLoading } = useCampaigns(range);

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'roi', dir: 'desc' });
  const [channelFilter, setChannelFilter] = useState<'All' | Channel>('All');

  const maxSpend = useMemo(() => Math.max(...(campaigns ?? []).map((c) => c.spend)), [campaigns]);

  const sorted = useMemo(() => {
    if (!campaigns) return [];
    const filtered = channelFilter === 'All' ? campaigns : campaigns.filter((c) => c.channel === channelFilter);
    return [...filtered].sort((a, b) => {
      const av = a[sort.key as keyof CampaignMetrics];
      const bv = b[sort.key as keyof CampaignMetrics];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [campaigns, sort, channelFilter]);

  const toggleSort = (key: SortKey): void => {
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc' }));
  };

  const Th = ({ label, col }: { label: string; col: SortKey }): React.JSX.Element => (
    <th
      onClick={() => toggleSort(col)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none whitespace-nowrap"
    >
      <div className="flex items-center gap-1">{label}<SortIcon col={col} sort={sort} /></div>
    </th>
  );

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mr-3">Campaigns</h2>
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            onClick={() => setChannelFilter(ch)}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors',
              channelFilter === ch
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            )}
          >
            {ch}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <Th label="Campaign" col="name" />
              <Th label="Channel" col="channel" />
              <Th label="Spend" col="spend" />
              <Th label="Revenue" col="revenue" />
              <Th label="ROAS" col="roas" />
              <Th label="True ROI" col="roi" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-900 min-w-[180px]">
                    {c.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 text-[10px] font-semibold rounded-full', CHANNEL_COLORS[c.channel])}>
                      {c.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <SpendBar spend={c.spend} max={maxSpend} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(c.revenue)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatROAS(c.roas)}</td>
                  <td className={cn('px-4 py-3 text-sm', roiColor(c.roi))}>{formatPercent(c.roi)}</td>
                  <td className="px-4 py-3"><Badge roi={c.roi} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
