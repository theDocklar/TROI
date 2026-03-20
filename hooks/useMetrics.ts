/**
 * SWR hook for fetching current and previous period metrics.
 * Revalidates every 60 seconds.
 */

'use client';

import useSWR from 'swr';
import type { PeriodResult, RangeDays } from '@/types';

interface MetricsResponse {
  current: PeriodResult;
  previous: PeriodResult;
  range: RangeDays;
}

const fetcher = (url: string): Promise<MetricsResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<MetricsResponse>;
  });

export function useMetrics(range: RangeDays): {
  metrics: MetricsResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useSWR<MetricsResponse>(
    `/api/metrics?range=${range}`,
    fetcher,
    { refreshInterval: 60_000 },
  );

  return { metrics: data, isLoading, error };
}
