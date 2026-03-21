/**
 * Line chart showing daily True ROI% over the selected period.
 * Zero line is dashed. Tooltips show date + ROI%.
 */

'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useUIStore } from '@/store/uiStore';
import { getDailyROI } from '@/lib/metrics';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS } from '@/lib/mockData';
import { DEFAULT_SETTINGS } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function buildChartData(range: RangeDays): { date: string; roi: number }[] {
  const dailyROI = getDailyROI(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, range, DEFAULT_SETTINGS);
  const today = new Date();
  return dailyROI.map((roi, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (dailyROI.length - 1 - i));
    const date = d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    return { date, roi: parseFloat(roi.toFixed(2)) };
  });
}

interface TooltipPayload {
  payload: { date: string; roi: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }): React.JSX.Element | null {
  if (!active || !payload?.length) return null;
  const { date, roi } = payload[0].payload;
  const color = roi > 20 ? '#22c55e' : roi > 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-medium mb-0.5">{date}</p>
      <p style={{ color }}>ROI: {roi.toFixed(1)}%</p>
    </div>
  );
}

/** Recharts line chart visualising daily True ROI for the selected period. */
export default function ROITrendChart(): React.JSX.Element {
  const range = useUIStore((s) => s.range);
  const data = buildChartData(range);

  const tickEvery = range === 7 ? 1 : range === 30 ? 5 : 15;
  const xTicks = data
    .filter((_, i) => i % tickEvery === 0 || i === data.length - 1)
    .map((d) => d.date);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">True ROI Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="roi"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
