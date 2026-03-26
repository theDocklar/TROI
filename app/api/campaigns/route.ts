/**
 * GET /api/campaigns?range=30&shop=my-store.myshopify.com
 * Returns CampaignMetrics[] sorted by ROI descending.
 * Uses real Shopify data when shop + Authorization header are present.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignData } from '@/lib/shopifyData';
import { computePeriod } from '@/lib/metrics';
import { getSettings } from '@/lib/settingsStore';
import type { RangeDays } from '@/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rawRange = Number(req.nextUrl.searchParams.get('range') ?? '30');
  const range: RangeDays = ([7, 30, 90].includes(rawRange) ? rawRange : 30) as RangeDays;

  const shop         = req.nextUrl.searchParams.get('shop') ?? null;
  const token        = req.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const metaConnected = req.nextUrl.searchParams.get('meta') === '1';

  const { campaigns, dailyOrders, dailyRefunds, refundRate } = await getCampaignData(shop, token, metaConnected);

  const settings = getSettings();
  const effectiveSettings = shop ? { ...settings, refundRate } : settings;

  const result = computePeriod(campaigns, dailyOrders, dailyRefunds, range, effectiveSettings);

  const sorted = [...result.campaigns].sort((a, b) => b.roi - a.roi);
  return NextResponse.json(sorted);
}
