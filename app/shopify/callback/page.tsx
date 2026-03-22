'use client';

/**
 * /shopify/callback
 * Handles the Shopify OAuth redirect. Exchanges the code for an access token
 * via the Express backend, stores the shop info in localStorage, then
 * redirects back to onboarding.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopifyApi } from '@/lib/api';

export default function ShopifyCallbackPage(): React.JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Shopify sends `error` param if the user denied the install
    if (params.get('error')) {
      router.replace('/onboard?shopify_error=denied');
      return;
    }

    const shop      = params.get('shop') ?? '';
    const code      = params.get('code') ?? '';
    const hmac      = params.get('hmac') ?? '';
    const state     = params.get('state') ?? '';
    const timestamp = params.get('timestamp') ?? '';

    if (!shop || !code || !hmac || !state || !timestamp) {
      setError('Missing OAuth parameters. Please try connecting your store again.');
      return;
    }

    const token = localStorage.getItem('troi_token');
    if (!token) {
      router.replace('/signin');
      return;
    }

    shopifyApi
      .callback({ shop, code, hmac, state, timestamp }, token)
      .then(({ shop: shopInfo }) => {
        localStorage.setItem('troi_shopify_shop', JSON.stringify(shopInfo));
        router.replace('/onboard');
      })
      .catch((err: Error) => {
        setError(err.message ?? 'Failed to connect Shopify store. Please try again.');
      });
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950 px-6">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 text-center max-w-xs">{error}</p>
        <button
          onClick={() => router.replace('/onboard')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Back to onboarding
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-950">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Completing Shopify connection…</p>
    </div>
  );
}
