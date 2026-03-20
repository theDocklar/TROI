/**
 * GET /api/metrics?range=30
 * Returns current and previous PeriodResult for comparison.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS } from '@/lib/mockData';
import { computePeriod } from '@/lib/metrics';
import { getSettings } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const searchParams = req.nextUrl.searchParams;
  const rawRange = Number(searchParams.get('range') ?? '30');
  const range: RangeDays = ([7, 30, 90].includes(rawRange) ? rawRange : 30) as RangeDays;

  const settings = getSettings();

  // Current period — last `range` days
  const current = computePeriod(
    MOCK_CAMPAIGNS,
    MOCK_DAILY_ORDERS,
    MOCK_DAILY_REFUNDS,
    range,
    settings,
  );

  // Previous period — shift the data window back by `range` days
  // We simulate this by trimming the arrays to exclude the last `range` days
  const shiftedCampaigns = MOCK_CAMPAIGNS.map((c) => ({
    ...c,
    dailySpend:   c.dailySpend.slice(0, -range || undefined),
    dailyRevenue: c.dailyRevenue.slice(0, -range || undefined),
  }));
  const shiftedOrders  = MOCK_DAILY_ORDERS.slice(0, -range || undefined);
  const shiftedRefunds = MOCK_DAILY_REFUNDS.slice(0, -range || undefined);

  const previous = computePeriod(
    shiftedCampaigns,
    shiftedOrders,
    shiftedRefunds,
    range,
    settings,
  );

  return NextResponse.json({ current, previous, range });
}
