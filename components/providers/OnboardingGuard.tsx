'use client';

/**
 * Client-side auth + onboarding guard.
 *
 * Validates the stored JWT against /api/auth/me on mount.
 * Redirect chain:
 *   no token / invalid token  → /signin  (clears stale localStorage)
 *   valid + not onboarded     → /onboard
 *   valid + onboarded         → pass through
 *
 * Auth pages and /onboard are exempt to prevent redirect loops.
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

const AUTH_ROUTES     = ['/signin', '/signup', '/forgot-password'];
const EXEMPT_PREFIXES = ['/signin', '/signup', '/forgot-password', '/onboard', '/shopify/callback'];

function clearAuth(): void {
  localStorage.removeItem('troi_authed');
  localStorage.removeItem('troi_token');
  localStorage.removeItem('troi_user_email');
  localStorage.removeItem('troi_user_name');
}

export default function OnboardingGuard({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isExempt = EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    const token    = localStorage.getItem('troi_token');

    if (!token) {
      clearAuth();
      if (!isExempt) router.replace('/signin');
      return;
    }

    // Validate token with the backend
    authApi.me(token)
      .then(({ user }) => {
        // Keep localStorage in sync with server state
        localStorage.setItem('troi_authed', 'true');
        localStorage.setItem('troi_user_email', user.email);
        localStorage.setItem('troi_user_name', user.name);
        if (user.onboarded) localStorage.setItem('troi_onboarded', 'true');

        const onboarded = user.onboarded || localStorage.getItem('troi_onboarded') === 'true';

        // Redirect away from auth pages if already signed in
        if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
          router.replace(onboarded ? '/' : '/onboard');
          return;
        }

        // Not onboarded → go to onboard
        if (!onboarded && !pathname.startsWith('/onboard')) {
          router.replace('/onboard');
        }
      })
      .catch(() => {
        // Token invalid or expired
        clearAuth();
        if (!isExempt) router.replace('/signin');
      });
  }, [pathname, router]);

  return <>{children}</>;
}
