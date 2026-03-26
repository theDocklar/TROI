import type { MetaAccountInfo } from '@/lib/api';

/** Reads Meta connection state from localStorage. Server-safe (returns null on SSR). */
export function getMetaContext(): { account: MetaAccountInfo | null } {
  if (typeof window === 'undefined') return { account: null };

  const raw = localStorage.getItem('troi_meta_account');
  if (!raw) return { account: null };

  try {
    return { account: JSON.parse(raw) as MetaAccountInfo };
  } catch {
    return { account: null };
  }
}
