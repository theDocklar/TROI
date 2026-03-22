/**
 * GET /api/metrics?range=30&shop=my-store.myshopify.com
 * Returns current and previous PeriodResult for comparison.
 * Uses real Shopify data when shop + Authorization header are present.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignData } from '@/lib/shopifyData';
import { computePeriod } from '@/lib/metrics';
import { getSettings } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const searchParams = req.nextUrl.searchParams;
  const rawRange = Number(searchParams.get('range') ?? '30');
  const range: RangeDays = ([7, 30, 90].includes(rawRange) ? rawRange : 30) as RangeDays;

  const shop  = searchParams.get('shop') ?? null;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;

  const { campaigns, dailyOrders, dailyRefunds, refundRate } = await getCampaignData(shop, token);

  const settings = getSettings();
  const effectiveSettings = shop ? { ...settings, refundRate } : settings;

  // Current period — last `range` days
  const current = computePeriod(campaigns, dailyOrders, dailyRefunds, range, effectiveSettings);

  // Previous period — shift the data window back by `range` days
  const shiftedCampaigns = campaigns.map((c) => ({
    ...c,
    dailySpend:   c.dailySpend.slice(0, -range || undefined),
    dailyRevenue: c.dailyRevenue.slice(0, -range || undefined),
  }));
  const shiftedOrders  = dailyOrders.slice(0, -range || undefined);
  const shiftedRefunds = dailyRefunds.slice(0, -range || undefined);

  const previous = computePeriod(shiftedCampaigns, shiftedOrders, shiftedRefunds, range, effectiveSettings);

  return NextResponse.json({ current, previous, range });
}
