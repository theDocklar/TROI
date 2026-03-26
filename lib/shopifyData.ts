/**
 * shopifyData.ts
 *
 * Server-side data fetcher for Next.js API routes.
 * Returns real Shopify + Meta data when connections are present,
 * falls back to mock data otherwise.
 *
 * Meta campaigns (channel: 'Meta') are fetched from the Meta Marketing API
 * and replace the mock Meta campaigns. Their per-campaign spend and pixel
 * purchase revenue are used as-is. Non-Meta channels continue to use mock
 * campaign shapes with Shopify revenue scaled proportionally across them.
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

interface MetaCampaignsResponse {
  campaigns: Campaign[];
  days: number;
}

/** Fetch real Meta campaigns from the Express backend. Returns [] on any error. */
async function fetchMetaCampaigns(token: string, days: number): Promise<Campaign[]> {
  try {
    const res = await fetch(`${EXPRESS_URL}/api/meta/campaigns?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(`[shopifyData] meta campaigns fetch failed: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as MetaCampaignsResponse;
    return data.campaigns ?? [];
  } catch (err) {
    console.error('[shopifyData] meta campaigns fetch error:', err);
    return [];
  }
}

/**
 * Merge Shopify revenue data with campaigns.
 * - Real Meta campaigns keep their own pixel revenue.
 * - Non-Meta mock campaigns get Shopify total revenue distributed
 *   proportionally based on their existing revenue share.
 */
function mergeShopifyRevenue(
  shopifyData: ShopifyOrdersResponse,
  metaCampaigns: Campaign[],
): CampaignDataSet {
  const { dailyRevenue, dailyOrders, dailyRefundAmount, refundRate } = shopifyData;
  const days = dailyRevenue.length;

  const safeRevenue = Array.from({ length: days }, (_, i) => dailyRevenue[i] ?? 0);
  const safeOrders  = Array.from({ length: days }, (_, i) => dailyOrders[i] ?? 0);
  const safeRefunds = Array.from({ length: days }, (_, i) => dailyRefundAmount[i] ?? 0);

  // Non-Meta mock campaigns — scale their revenue by Shopify totals
  const nonMetaMock = MOCK_CAMPAIGNS.filter((c) => c.channel !== 'Meta');
  const mockNonMetaDailyTotal = Array.from({ length: days }, (_, d) =>
    nonMetaMock.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
  );

  // Daily Meta pixel revenue (to exclude from the Shopify revenue available
  // for non-Meta campaigns, avoiding double-counting where possible)
  const metaDailyRevenue = Array.from({ length: days }, (_, d) =>
    metaCampaigns.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
  );

  const scaledNonMeta: Campaign[] = nonMetaMock.map((c) => ({
    ...c,
    dailyRevenue: Array.from({ length: days }, (_, d) => {
      // Revenue available for non-Meta attribution = Shopify total − Meta pixel revenue
      const available = Math.max(0, safeRevenue[d] - metaDailyRevenue[d]);
      const mockTotal = mockNonMetaDailyTotal[d];
      const share = mockTotal > 0
        ? (c.dailyRevenue[d] ?? 0) / mockTotal
        : 1 / nonMetaMock.length;
      return available * share;
    }),
  }));

  return {
    campaigns: [...scaledNonMeta, ...metaCampaigns],
    dailyOrders: safeOrders,
    dailyRefunds: safeRefunds,
    refundRate,
  };
}

/**
 * Returns campaign + order data for the metrics engine.
 *
 * Resolution order:
 *  1. Shopify connected  → real order totals for COGS/shipping/refund calcs
 *  2. Meta connected     → real Meta campaigns replace mock Meta campaigns
 *  3. Neither connected  → fully mock data
 *
 * Falls back gracefully to mock on any fetch error.
 */
export async function getCampaignData(
  shop: string | null,
  token: string | null,
  metaConnected: boolean = false,
): Promise<CampaignDataSet> {
  const DAYS = 60;

  // Fetch real Meta campaigns when connected (uses JWT to look up stored Meta token)
  let metaCampaigns: Campaign[] = [];
  if (token && metaConnected) {
    metaCampaigns = await fetchMetaCampaigns(token, DAYS);
  }

  // No Shopify connection — use mock order data but substitute real Meta campaigns
  if (!shop || !token) {
    if (metaCampaigns.length === 0) {
      return {
        campaigns: MOCK_CAMPAIGNS,
        dailyOrders: MOCK_DAILY_ORDERS,
        dailyRefunds: MOCK_DAILY_REFUNDS,
        refundRate: 0.028,
      };
    }

    // Real Meta campaigns + mock non-Meta campaigns + mock order data
    const nonMetaMock = MOCK_CAMPAIGNS.filter((c) => c.channel !== 'Meta');
    return {
      campaigns: [...nonMetaMock, ...metaCampaigns],
      dailyOrders: MOCK_DAILY_ORDERS,
      dailyRefunds: MOCK_DAILY_REFUNDS,
      refundRate: 0.028,
    };
  }

  // Shopify is connected — fetch real order data
  try {
    const res = await fetch(`${EXPRESS_URL}/api/shopify/orders?days=${DAYS}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(`[shopifyData] orders fetch failed: ${res.status} — falling back to mock`);
      const nonMetaMock = MOCK_CAMPAIGNS.filter((c) => c.channel !== 'Meta');
      return {
        campaigns: metaCampaigns.length > 0
          ? [...nonMetaMock, ...metaCampaigns]
          : MOCK_CAMPAIGNS,
        dailyOrders: MOCK_DAILY_ORDERS,
        dailyRefunds: MOCK_DAILY_REFUNDS,
        refundRate: 0.028,
      };
    }

    const data = (await res.json()) as ShopifyOrdersResponse;

    if (metaCampaigns.length === 0) {
      // Shopify only — distribute total revenue across all mock campaigns
      const { dailyRevenue, dailyOrders, dailyRefundAmount, refundRate } = data;
      const days = dailyRevenue.length;
      const safeRevenue = Array.from({ length: days }, (_, i) => dailyRevenue[i] ?? 0);
      const safeOrders  = Array.from({ length: days }, (_, i) => dailyOrders[i] ?? 0);
      const safeRefunds = Array.from({ length: days }, (_, i) => dailyRefundAmount[i] ?? 0);

      const mockDailyTotal = Array.from({ length: days }, (_, d) =>
        MOCK_CAMPAIGNS.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
      );

      const realCampaigns: Campaign[] = MOCK_CAMPAIGNS.map((c) => ({
        ...c,
        dailyRevenue: Array.from({ length: days }, (_, d) => {
          const mockTotal = mockDailyTotal[d];
          const share = mockTotal > 0
            ? (c.dailyRevenue[d] ?? 0) / mockTotal
            : 1 / MOCK_CAMPAIGNS.length;
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

    // Both Shopify + Meta connected — merge intelligently
    return mergeShopifyRevenue(data, metaCampaigns);
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
