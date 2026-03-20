/**
 * SWR hook for fetching campaign metrics sorted by ROI.
 */

'use client';

import useSWR from 'swr';
import type { CampaignMetrics, RangeDays } from '@/types';

const fetcher = (url: string): Promise<CampaignMetrics[]> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<CampaignMetrics[]>;
  });

export function useCampaigns(range: RangeDays): {
  campaigns: CampaignMetrics[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useSWR<CampaignMetrics[]>(
    `/api/campaigns?range=${range}`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  return { campaigns: data, isLoading, error };
}
