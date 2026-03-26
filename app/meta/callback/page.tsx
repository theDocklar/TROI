'use client';

/**
 * /meta/callback
 * Handles the Meta (Facebook) OAuth redirect. Always redirects back to
 * onboarding step 2 — on success or failure. Errors are forwarded as
 * a URL param so the Connect Channels step can display them in context.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { metaApi } from '@/lib/api';

export default function MetaCallbackPage(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const redirectError = (msg: string) =>
      router.replace(`/onboard?step=2&meta_error=${encodeURIComponent(msg)}`);

    if (params.get('error')) {
      redirectError('Connection denied. Please try again.');
      return;
    }

    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      redirectError('Missing OAuth parameters. Please try again.');
      return;
    }

    const token = localStorage.getItem('troi_token');
    if (!token) {
      router.replace('/signin');
      return;
    }

    metaApi
      .callback({ code, state }, token)
      .then(({ account }) => {
        localStorage.setItem('troi_meta_account', JSON.stringify(account));
        router.replace('/onboard?step=2');
      })
      .catch((err: Error) => {
        redirectError(err.message ?? 'Failed to connect Meta. Please try again.');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-950">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Completing Meta connection…</p>
    </div>
  );
}
