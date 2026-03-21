'use client';

/**
 * Client-side auth + onboarding guard.
 *
 * Redirect chain (evaluated on every navigation):
 *   not authed           → /signin
 *   authed + not onboarded → /onboard
 *   authed + onboarded   → pass through
 *
 * Auth pages (/signin, /signup, /forgot-password) and /onboard are exempt
 * from the full check so they never create redirect loops.
 */

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const AUTH_ROUTES    = ['/signin', '/signup', '/forgot-password'];
const EXEMPT_PREFIXES = ['/signin', '/signup', '/forgot-password', '/onboard'];

/** Guards the app: unauthenticated users go to /signin, un-onboarded users go to /onboard. */
export default function OnboardingGuard({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isExempt = EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

    const authed    = localStorage.getItem('troi_authed')    === 'true';
    const onboarded = localStorage.getItem('troi_onboarded') === 'true';

    if (!authed) {
      // Not signed in — go to sign-in unless already on an auth page
      if (!isExempt) {
        router.replace('/signin');
      }
      return;
    }

    // Signed in but on an auth page → redirect away
    if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      router.replace(onboarded ? '/' : '/onboard');
      return;
    }

    // Signed in, not onboarded, not on /onboard → redirect to onboard
    if (!onboarded && !pathname.startsWith('/onboard')) {
      router.replace('/onboard');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
