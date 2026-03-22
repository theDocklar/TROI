/**
 * GET /api/insights?range=30&shop=my-store.myshopify.com
 * Returns Insight[] and Alert[] for the selected period.
 * Uses real Shopify data when shop + Authorization header are present.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignData } from '@/lib/shopifyData';
import { computePeriod, getDailyROI } from '@/lib/metrics';
import { generateInsights, generateAlerts } from '@/lib/insights';
import { getSettings } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rawRange = Number(req.nextUrl.searchParams.get('range') ?? '30');
  const range: RangeDays = ([7, 30, 90].includes(rawRange) ? rawRange : 30) as RangeDays;

  const shop  = req.nextUrl.searchParams.get('shop') ?? null;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;

  const { campaigns, dailyOrders, dailyRefunds, refundRate } = await getCampaignData(shop, token);

  const settings = getSettings();
  const effectiveSettings = shop ? { ...settings, refundRate } : settings;

  const current = computePeriod(campaigns, dailyOrders, dailyRefunds, range, effectiveSettings);

  const shiftedCampaigns = campaigns.map((c) => ({
    ...c,
    dailySpend:   c.dailySpend.slice(0, -range || undefined),
    dailyRevenue: c.dailyRevenue.slice(0, -range || undefined),
  }));
  const shiftedOrders  = dailyOrders.slice(0, -range || undefined);
  const shiftedRefunds = dailyRefunds.slice(0, -range || undefined);
  const previous = computePeriod(shiftedCampaigns, shiftedOrders, shiftedRefunds, range, effectiveSettings);

  const dailyROI = getDailyROI(campaigns, dailyOrders, range, effectiveSettings);

  const insights = generateInsights(current, previous);
  const alerts   = generateAlerts(current, previous, dailyROI);

  return NextResponse.json({ insights, alerts });
}
