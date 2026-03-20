/**
 * GET /api/insights?range=30
 * Returns Insight[] and Alert[] for the selected period.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS } from '@/lib/mockData';
import { computePeriod, getDailyROI } from '@/lib/metrics';
import { generateInsights, generateAlerts } from '@/lib/insights';
import { getSettings } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rawRange = Number(req.nextUrl.searchParams.get('range') ?? '30');
  const range: RangeDays = ([7, 30, 90].includes(rawRange) ? rawRange : 30) as RangeDays;

  const settings = getSettings();

  const current = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, range, settings);

  const shiftedCampaigns = MOCK_CAMPAIGNS.map((c) => ({
    ...c,
    dailySpend:   c.dailySpend.slice(0, -range || undefined),
    dailyRevenue: c.dailyRevenue.slice(0, -range || undefined),
  }));
  const shiftedOrders  = MOCK_DAILY_ORDERS.slice(0, -range || undefined);
  const shiftedRefunds = MOCK_DAILY_REFUNDS.slice(0, -range || undefined);
  const previous = computePeriod(shiftedCampaigns, shiftedOrders, shiftedRefunds, range, settings);

  const dailyROI = getDailyROI(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, range, settings);

  const insights = generateInsights(current, previous);
  const alerts   = generateAlerts(current, previous, dailyROI);

  return NextResponse.json({ insights, alerts });
}
