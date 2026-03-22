import type { ShopInfo } from '@/lib/api';

/** Reads Shopify connection state and JWT token from localStorage. Server-safe (returns nulls on SSR). */
export function getShopifyContext(): { shop: string | null; token: string | null } {
  if (typeof window === 'undefined') return { shop: null, token: null };

  const shopRaw = localStorage.getItem('troi_shopify_shop');
  let shop: string | null = null;
  if (shopRaw) {
    try {
      shop = (JSON.parse(shopRaw) as ShopInfo).domain ?? null;
    } catch {
      shop = null;
    }
  }

  const token = localStorage.getItem('troi_token') ?? null;
  return { shop, token };
}
