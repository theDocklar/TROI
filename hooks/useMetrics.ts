/**
 * SWR hook for fetching current and previous period metrics.
 * Passes shop domain + JWT when a Shopify store is connected.
 * Revalidates every 60 seconds.
 */

'use client';

import useSWR from 'swr';
import type { PeriodResult, RangeDays } from '@/types';
import { getShopifyContext } from '@/lib/shopifyContext';

interface MetricsResponse {
  current: PeriodResult;
  previous: PeriodResult;
  range: RangeDays;
}

function buildKey(range: RangeDays): string {
  const { shop, token } = getShopifyContext();
  return shop ? `/api/metrics?range=${range}&shop=${encodeURIComponent(shop)}&_t=${token?.slice(-8)}` : `/api/metrics?range=${range}`;
}

function buildFetcher(range: RangeDays) {
  return (url: string): Promise<MetricsResponse> => {
    const { token } = getShopifyContext();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<MetricsResponse>;
    });
  };
}

export function useMetrics(range: RangeDays): {
  metrics: MetricsResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useSWR<MetricsResponse>(
    buildKey(range),
    buildFetcher(range),
    { refreshInterval: 60_000 },
  );

  return { metrics: data, isLoading, error };
}
