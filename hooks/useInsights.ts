/**
 * SWR hook for fetching insights and alerts.
 * Passes shop domain + JWT when a Shopify store is connected.
 */

'use client';

import useSWR from 'swr';
import type { Alert, Insight, RangeDays } from '@/types';
import { getShopifyContext } from '@/lib/shopifyContext';

interface InsightsResponse {
  insights: Insight[];
  alerts: Alert[];
}

function buildKey(range: RangeDays): string {
  const { shop, token } = getShopifyContext();
  return shop ? `/api/insights?range=${range}&shop=${encodeURIComponent(shop)}&_t=${token?.slice(-8)}` : `/api/insights?range=${range}`;
}

function buildFetcher(range: RangeDays) {
  return (url: string): Promise<InsightsResponse> => {
    const { token } = getShopifyContext();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<InsightsResponse>;
    });
  };
}

export function useInsights(range: RangeDays): {
  insights: Insight[] | undefined;
  alerts: Alert[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useSWR<InsightsResponse>(
    buildKey(range),
    buildFetcher(range),
    { refreshInterval: 60_000 },
  );

  return { insights: data?.insights, alerts: data?.alerts, isLoading, error };
}
