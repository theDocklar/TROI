/**
 * GET /api/campaigns?range=30
 * Returns CampaignMetrics[] sorted by ROI descending.
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS } from '@/lib/mockData';
import { computePeriod } from '@/lib/metrics';
import { getSettings } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rawRange = Number(req.nextUrl.searchParams.get('range') ?? '30');
  const range: RangeDays = ([7, 30, 90].includes(rawRange) ? rawRange : 30) as RangeDays;

  const settings = getSettings();
  const result = computePeriod(
    MOCK_CAMPAIGNS,
    MOCK_DAILY_ORDERS,
    MOCK_DAILY_REFUNDS,
    range,
    settings,
  );

  const sorted = [...result.campaigns].sort((a, b) => b.roi - a.roi);
  return NextResponse.json(sorted);
}
