/**
 * SWR hook for fetching insights and alerts.
 */

'use client';

import useSWR from 'swr';
import type { Alert, Insight, RangeDays } from '@/types';

interface InsightsResponse {
  insights: Insight[];
  alerts: Alert[];
}

const fetcher = (url: string): Promise<InsightsResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<InsightsResponse>;
  });

export function useInsights(range: RangeDays): {
  insights: Insight[] | undefined;
  alerts: Alert[] | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useSWR<InsightsResponse>(
    `/api/insights?range=${range}`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  return { insights: data?.insights, alerts: data?.alerts, isLoading, error };
}
