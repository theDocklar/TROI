/**
 * SWR hook for fetching campaign metrics sorted by ROI.
 * Passes shop domain + JWT when a Shopify store is connected.
 */

'use client';

import useSWR from 'swr';
import type { CampaignMetrics, RangeDays } from '@/types';
import { getShopifyContext } from '@/lib/shopifyContext';
import { getMetaContext } from '@/lib/metaContext';
import { getGoogleContext } from '@/lib/googleContext';

function buildKey(range: RangeDays): string {
  const { shop, token } = getShopifyContext();
  const { account: metaAccount }   = getMetaContext();
  const { account: googleAccount } = getGoogleContext();
  const metaParam   = metaAccount   ? `&meta=1&_m=${metaAccount.adAccountId.slice(-6)}`    : '';
  const googleParam = googleAccount ? `&google=1&_g=${googleAccount.customerId.slice(-6)}` : '';
  return shop
    ? `/api/campaigns?range=${range}&shop=${encodeURIComponent(shop)}&_t=${token?.slice(-8)}${metaParam}${googleParam}`
    : `/api/campaigns?range=${range}${metaParam}${googleParam}`;
}

function buildFetcher(range: RangeDays) {
  return (url: string): Promise<CampaignMetrics[]> => {
    const { token } = getShopifyContext();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { headers }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<CampaignMetrics[]>;
    });
  };
}

export function useCampaigns(range: RangeDays): {
  campaigns: CampaignMetrics[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useSWR<CampaignMetrics[]>(
    buildKey(range),
    buildFetcher(range),
    { refreshInterval: 60_000 },
  );

  return { campaigns: data, isLoading, error };
}
