import type { GoogleAccountInfo } from '@/lib/api';

/** Reads Google Ads connection state from localStorage. Server-safe (returns null on SSR). */
export function getGoogleContext(): { account: GoogleAccountInfo | null } {
  if (typeof window === 'undefined') return { account: null };

  const raw = localStorage.getItem('troi_google_account');
  if (!raw) return { account: null };

  try {
    return { account: JSON.parse(raw) as GoogleAccountInfo };
  } catch {
    return { account: null };
  }
}
