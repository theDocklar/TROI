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
