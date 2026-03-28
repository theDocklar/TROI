/**
 * shopifyData.ts
 *
 * Server-side data fetcher for Next.js API routes.
 * Merges real data from Shopify, Meta, and Google Ads when connected.
 * Falls back to mock data for any channel that is not yet connected.
 *
 * Channel resolution:
 *  - Meta connected    → real Meta campaigns replace mock Meta campaigns
 *  - Google connected  → real Google campaigns replace mock Google campaigns
 *  - Shopify connected → real order totals used for COGS/shipping/refund calcs;
 *                        Shopify revenue is distributed only across mock channels
 *  - Nothing connected → fully mock data
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

interface AdCampaignsResponse {
  campaigns: Campaign[];
  days: number;
}

async function fetchAdCampaigns(endpoint: string, token: string, days: number): Promise<Campaign[]> {
  try {
    const res = await fetch(`${EXPRESS_URL}${endpoint}?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`[shopifyData] ${endpoint} fetch failed: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as AdCampaignsResponse;
    return data.campaigns ?? [];
  } catch (err) {
    console.error(`[shopifyData] ${endpoint} fetch error:`, err);
    return [];
  }
}

/**
 * Distributes Shopify total daily revenue across mock campaigns for channels
 * that have no real ad-platform data, subtracting the revenue already claimed
 * by real ad-platform campaigns to avoid double-counting.
 */
function scaleRemainingMockCampaigns(
  shopifyData: ShopifyOrdersResponse,
  realCampaigns: Campaign[],         // Meta + Google real campaigns combined
  realChannels: Set<string>,         // channels covered by real data e.g. {'Meta','Google'}
): CampaignDataSet {
  const { dailyRevenue, dailyOrders, dailyRefundAmount, refundRate } = shopifyData;
  const days = dailyRevenue.length;

  const safeRevenue = Array.from({ length: days }, (_, i) => dailyRevenue[i] ?? 0);
  const safeOrders  = Array.from({ length: days }, (_, i) => dailyOrders[i] ?? 0);
  const safeRefunds = Array.from({ length: days }, (_, i) => dailyRefundAmount[i] ?? 0);

  // Mock campaigns for channels that are still on mock data
  const mockRemaining = MOCK_CAMPAIGNS.filter((c) => !realChannels.has(c.channel));

  if (mockRemaining.length === 0) {
    return { campaigns: realCampaigns, dailyOrders: safeOrders, dailyRefunds: safeRefunds, refundRate };
  }

  // Daily revenue already attributed to real ad-platform campaigns
  const realDailyRevenue = Array.from({ length: days }, (_, d) =>
    realCampaigns.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
  );

  const mockRemainingDailyTotal = Array.from({ length: days }, (_, d) =>
    mockRemaining.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
  );

  const scaledMock: Campaign[] = mockRemaining.map((c) => ({
    ...c,
    dailyRevenue: Array.from({ length: days }, (_, d) => {
      const available = Math.max(0, safeRevenue[d] - realDailyRevenue[d]);
      const mockTotal = mockRemainingDailyTotal[d];
      const share = mockTotal > 0
        ? (c.dailyRevenue[d] ?? 0) / mockTotal
        : 1 / mockRemaining.length;
      return available * share;
    }),
  }));

  return {
    campaigns: [...scaledMock, ...realCampaigns],
    dailyOrders: safeOrders,
    dailyRefunds: safeRefunds,
    refundRate,
  };
}

/**
 * Distributes Shopify total daily revenue across ALL mock campaigns.
 * Used when Shopify is connected but no ad platform is connected.
 */
function scaleAllMockCampaigns(shopifyData: ShopifyOrdersResponse): CampaignDataSet {
  const { dailyRevenue, dailyOrders, dailyRefundAmount, refundRate } = shopifyData;
  const days = dailyRevenue.length;

  const safeRevenue = Array.from({ length: days }, (_, i) => dailyRevenue[i] ?? 0);
  const safeOrders  = Array.from({ length: days }, (_, i) => dailyOrders[i] ?? 0);
  const safeRefunds = Array.from({ length: days }, (_, i) => dailyRefundAmount[i] ?? 0);

  const mockDailyTotal = Array.from({ length: days }, (_, d) =>
    MOCK_CAMPAIGNS.reduce((sum, c) => sum + (c.dailyRevenue[d] ?? 0), 0),
  );

  const scaled: Campaign[] = MOCK_CAMPAIGNS.map((c) => ({
    ...c,
    dailyRevenue: Array.from({ length: days }, (_, d) => {
      const mockTotal = mockDailyTotal[d];
      const share = mockTotal > 0
        ? (c.dailyRevenue[d] ?? 0) / mockTotal
        : 1 / MOCK_CAMPAIGNS.length;
      return safeRevenue[d] * share;
    }),
  }));

  return { campaigns: scaled, dailyOrders: safeOrders, dailyRefunds: safeRefunds, refundRate };
}

/**
 * Returns campaign + order data for the metrics engine.
 *
 * @param shop           Shopify store domain (null = not connected)
 * @param token          JWT (null = not authenticated)
 * @param metaConnected  Whether Meta Ads is connected
 * @param googleConnected Whether Google Ads is connected
 */
export async function getCampaignData(
  shop: string | null,
  token: string | null,
  metaConnected: boolean = false,
  googleConnected: boolean = false,
): Promise<CampaignDataSet> {
  const DAYS = 60;

  // Fetch real ad-platform campaigns in parallel
  const [metaCampaigns, googleCampaigns] = await Promise.all([
    token && metaConnected   ? fetchAdCampaigns('/api/meta/campaigns',   token, DAYS) : Promise.resolve([]),
    token && googleConnected ? fetchAdCampaigns('/api/google/campaigns', token, DAYS) : Promise.resolve([]),
  ]);

  const realCampaigns = [...metaCampaigns, ...googleCampaigns] as Campaign[];
  const realChannels  = new Set<string>([
    ...metaCampaigns.map(() => 'Meta'),
    ...googleCampaigns.map(() => 'Google'),
  ]);

  const hasRealAds = realCampaigns.length > 0;

  // No Shopify — use mock orders but substitute any real ad-platform campaigns
  if (!shop || !token) {
    if (!hasRealAds) {
      return {
        campaigns: MOCK_CAMPAIGNS,
        dailyOrders: MOCK_DAILY_ORDERS,
        dailyRefunds: MOCK_DAILY_REFUNDS,
        refundRate: 0.028,
      };
    }
    const mockRemaining = MOCK_CAMPAIGNS.filter((c) => !realChannels.has(c.channel));
    return {
      campaigns: [...mockRemaining, ...realCampaigns],
      dailyOrders: MOCK_DAILY_ORDERS,
      dailyRefunds: MOCK_DAILY_REFUNDS,
      refundRate: 0.028,
    };
  }

  // Shopify connected — fetch real order data
  try {
    const res = await fetch(`${EXPRESS_URL}/api/shopify/orders?days=${DAYS}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.error(`[shopifyData] Shopify orders fetch failed: ${res.status} — falling back to mock`);
      const mockRemaining = MOCK_CAMPAIGNS.filter((c) => !realChannels.has(c.channel));
      return {
        campaigns: hasRealAds ? [...mockRemaining, ...realCampaigns] : MOCK_CAMPAIGNS,
        dailyOrders: MOCK_DAILY_ORDERS,
        dailyRefunds: MOCK_DAILY_REFUNDS,
        refundRate: 0.028,
      };
    }

    const shopifyData = (await res.json()) as ShopifyOrdersResponse;

    if (!hasRealAds) {
      return scaleAllMockCampaigns(shopifyData);
    }

    return scaleRemainingMockCampaigns(shopifyData, realCampaigns, realChannels);
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
