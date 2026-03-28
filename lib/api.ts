const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Request failed');
  return data as T;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  onboarded: boolean;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: { name, email, password } }),

  signin: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/signin', { method: 'POST', body: { email, password } }),

  me: (token: string) =>
    request<{ user: AuthUser }>('/api/auth/me', { token }),
};

// ── Shopify types ────────────────────────────────────────────────────────────

export type ShopInfo = {
  domain: string;
  shopName: string;
  currency: string;
  plan: string;
};

export type ShopifyOrdersData = {
  dailyRevenue: number[];
  dailyOrders: number[];
  dailyRefundAmount: number[];
  refundRate: number;
  days: number;
};

export type ShopifyProduct = {
  id: string;
  title: string;
  productType: string;
  variants: { sku: string; price: number }[];
};

// ── Shopify API client ───────────────────────────────────────────────────────

export const shopifyApi = {
  getConnectUrl: (shop: string, token: string) =>
    request<{ url: string }>(`/api/shopify/connect?shop=${encodeURIComponent(shop)}`, { token }),

  callback: (
    params: Record<string, string>,
    token: string,
  ) => request<{ shop: ShopInfo }>('/api/shopify/callback', { method: 'POST', body: params, token }),

  status: (token: string) =>
    request<{ connected: boolean; shop?: ShopInfo }>('/api/shopify/status', { token }),

  getOrders: (token: string, days = 60) =>
    request<ShopifyOrdersData>(`/api/shopify/orders?days=${days}`, { token }),

  getProducts: (token: string) =>
    request<{ products: ShopifyProduct[] }>('/api/shopify/products', { token }),

  disconnect: (token: string) =>
    request<{ message: string }>('/api/shopify/disconnect', { method: 'POST', token }),
};

// ── Meta types ───────────────────────────────────────────────────────────────

export type MetaAccountInfo = {
  adAccountId: string;
  accountName: string;
  currency: string;
};

// ── Meta API client ───────────────────────────────────────────────────────────

export const metaApi = {
  getConnectUrl: (token: string) =>
    request<{ url: string }>('/api/meta/connect', { token }),

  callback: (params: { code: string; state: string }, token: string) =>
    request<{ account: MetaAccountInfo }>('/api/meta/callback', {
      method: 'POST',
      body: params,
      token,
    }),

  status: (token: string) =>
    request<{ connected: boolean; account?: MetaAccountInfo }>('/api/meta/status', { token }),

  disconnect: (token: string) =>
    request<{ message: string }>('/api/meta/disconnect', { method: 'POST', token }),
};

// ── Google Ads types ──────────────────────────────────────────────────────────

export type GoogleAccountInfo = {
  customerId: string;
  accountName: string;
  currency: string;
};

// ── Google Ads API client ─────────────────────────────────────────────────────

export const googleApi = {
  getConnectUrl: (token: string) =>
    request<{ url: string }>('/api/google/connect', { token }),

  callback: (params: { code: string; state: string }, token: string) =>
    request<{ account: GoogleAccountInfo }>('/api/google/callback', {
      method: 'POST',
      body: params,
      token,
    }),

  status: (token: string) =>
    request<{ connected: boolean; account?: GoogleAccountInfo }>('/api/google/status', { token }),

  disconnect: (token: string) =>
    request<{ message: string }>('/api/google/disconnect', { method: 'POST', token }),
};
