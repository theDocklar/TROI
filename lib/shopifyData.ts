/**
 * shopifyData.ts
 *
 * Server-side data fetcher for Next.js API routes.
 * Returns real Shopify data when a store is connected, falls back to mock data otherwise.
 */

import type { Campaign } from '@/types';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS } from '@/lib/mockData';

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export interface CampaignDataSet {
  campaigns: Campaign[];
  dailyOrders: number[];
  dailyRefunds: number[];
  refundRate: number;
}

interface ShopifyOrdersResponse {
  dailyRevenue: number[];
  dailyOrders: number[];
  dailyRefundAmount: number[];
  refundRate: number;
  days: number;
}

function transformShopifyData(data: ShopifyOrdersResponse): CampaignDataSet {
  const { dailyRevenue, dailyOrders, dailyRefundAmount, refundRate } = data;
  const days = dailyRevenue.length;

  // Ensure arrays are exactly `days` long (pad with 0 if shorter)
  const safeRevenue = Array.from({ length: days }, (_, i) => dailyRevenue[i] ?? 0);
  const safeOrders  = Array.from({ length: days }, (_, i) => dailyOrders[i] ?? 0);
  const safeRefunds = Array.from({ length: days }, (_, i) => dailyRefundAmount[i] ?? 0);

  // Distribute real Shopify total revenue across mock campaigns
  // proportionally by each campaign's existing revenue share per day.
  // This preserves channel attribution ratios while using real total revenue figures.
  const mockDailyTotal = Array.from({ length: days }, (_, d) =>
    MOCK_CAMPAIGNS.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
  );

  const realCampaigns: Campaign[] = MOCK_CAMPAIGNS.map((c) => ({
    ...c,
    dailyRevenue: Array.from({ length: days }, (_, d) => {
      const mockTotal = mockDailyTotal[d];
      const share = mockTotal > 0 ? (c.dailyRevenue[d] ?? 0) / mockTotal : 1 / MOCK_CAMPAIGNS.length;
      return safeRevenue[d] * share;
    }),
  }));

  return {
    campaigns: realCampaigns,
    dailyOrders: safeOrders,
    dailyRefunds: safeRefunds,
    refundRate,
  };
}

/**
 * Returns campaign + order data for the metrics engine.
 * Uses real Shopify data when shop + token are provided, otherwise uses mock data.
 * Falls back gracefully to mock on any fetch error.
 */
export async function getCampaignData(
  shop: string | null,
  token: string | null,
): Promise<CampaignDataSet> {
  if (!shop || !token) {
    return {
      campaigns: MOCK_CAMPAIGNS,
      dailyOrders: MOCK_DAILY_ORDERS,
      dailyRefunds: MOCK_DAILY_REFUNDS,
      refundRate: 0.028, // default
    };
  }

  try {
    const res = await fetch(`${EXPRESS_URL}/api/shopify/orders?days=60`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(`[shopifyData] orders fetch failed: ${res.status} — falling back to mock`);
      return {
        campaigns: MOCK_CAMPAIGNS,
        dailyOrders: MOCK_DAILY_ORDERS,
        dailyRefunds: MOCK_DAILY_REFUNDS,
        refundRate: 0.028,
      };
    }

    const data = (await res.json()) as ShopifyOrdersResponse;
    return transformShopifyData(data);
  } catch (err) {
    console.error('[shopifyData] fetch error — falling back to mock:', err);
    return {
      campaigns: MOCK_CAMPAIGNS,
      dailyOrders: MOCK_DAILY_ORDERS,
      dailyRefunds: MOCK_DAILY_REFUNDS,
      refundRate: 0.028,
    };
  }
}
