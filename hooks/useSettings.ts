/**
 * SWR hook for reading and persisting StoreSettings.
 * Persists to localStorage on save; performs optimistic updates.
 */

'use client';

import useSWR from 'swr';
import type { StoreSettings } from '@/types';

const LS_KEY = 'roi_settings';

const fetcher = (url: string): Promise<StoreSettings> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<StoreSettings>;
  });

export function useSettings(): {
  settings: StoreSettings | undefined;
  isLoading: boolean;
  error: Error | undefined;
  save: (s: StoreSettings) => Promise<void>;
  reset: () => Promise<void>;
} {
  const { data, isLoading, error, mutate } = useSWR<StoreSettings>(
    '/api/settings',
    fetcher,
  );

  const save = async (updated: StoreSettings): Promise<void> => {
    // Optimistic update
    await mutate(updated, false);

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      const confirmed = await res.json() as StoreSettings;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LS_KEY, JSON.stringify(confirmed));
      }
      await mutate(confirmed);
    } else {
      // Revert
      await mutate();
    }
  };

  const reset = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LS_KEY);
    }
    const res = await fetch('/api/settings');
    const defaults = await res.json() as StoreSettings;
    await mutate(defaults);
  };

  return { settings: data, isLoading, error, save, reset };
}
