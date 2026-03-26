'use client';

/**
 * Multi-step onboarding wizard — shown once on first visit before the dashboard.
 * Steps: 1) Shopify confirmation  2) Connect channels  3) COGS setup  4) Confirm costs
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useOnboardStore, isOnboarded } from '@/store/onboardStore';
import ConnectChannels from './components/ConnectChannels';
import CogsSetup from './components/CogsSetup';
import ConfirmCosts from './components/ConfirmCosts';
import { cn } from '@/lib/utils';
import { shopifyApi, type ShopInfo } from '@/lib/api';

const STEP_LABELS = [
  'Shopify',
  'Connect channels',
  'COGS setup',
  'Confirm costs',
];

/** Onboarding wizard page — renders the correct step based on Zustand store state. */
export default function OnboardPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { step, nextStep, prevStep, setCompleted, setSkipCogs, goToStep } = useOnboardStore();

  // Shopify connect state (Step 1)
  const [shopInput, setShopInput]         = useState('');
  const [shopConnected, setShopConnected] = useState<ShopInfo | null>(null);
  const [connecting, setConnecting]       = useState(false);
  const [connectError, setConnectError]   = useState<string | null>(null);
  const [shopifyRefundRate, setShopifyRefundRate] = useState<number | undefined>(undefined);
  const [metaError, setMetaError] = useState<string | null>(null);

  // If already onboarded, skip straight to dashboard
  useEffect(() => {
    if (isOnboarded()) {
      router.replace('/');
    }
  }, [router]);

  // On mount: restore connected store from localStorage + check for error/step from callback
  useEffect(() => {
    const raw = localStorage.getItem('troi_shopify_shop');
    if (raw) {
      try {
        setShopConnected(JSON.parse(raw) as ShopInfo);
        // Fetch real refund rate in the background for Step 4 pre-fill
        const t = localStorage.getItem('troi_token');
        if (t) {
          shopifyApi.getOrders(t, 60)
            .then((d) => setShopifyRefundRate(d.refundRate))
            .catch(() => { /* non-critical */ });
        }
      } catch { /* ignore */ }
    }
    if (searchParams.get('shopify_error')) {
      setConnectError('Shopify connection was denied or failed. Please try again.');
    }
    // Restore step when returning from an OAuth redirect (e.g. Meta callback)
    const stepParam = parseInt(searchParams.get('step') ?? '', 10) as 1 | 2 | 3 | 4;
    if ([1, 2, 3, 4].includes(stepParam)) {
      goToStep(stepParam);
    }
    // Show Meta error forwarded from callback
    const metaErr = searchParams.get('meta_error');
    if (metaErr) setMetaError(decodeURIComponent(metaErr));
  }, [searchParams, goToStep]);

  async function handleConnectShopify(): Promise<void> {
    setConnectError(null);
    // Normalise: strip https://, trailing slash, auto-append .myshopify.com if needed
    let domain = shopInput.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
    if (!domain.includes('.')) domain = `${domain}.myshopify.com`;

    if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/i.test(domain)) {
      setConnectError('Invalid store domain. Use format: your-store.myshopify.com');
      return;
    }

    const token = localStorage.getItem('troi_token');
    if (!token) { router.replace('/signin'); return; }

    setConnecting(true);
    try {
      const { url } = await shopifyApi.getConnectUrl(domain, token);
      window.location.href = url;
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to start Shopify connection');
      setConnecting(false);
    }
  }

  function handleDisconnectShopify(): void {
    localStorage.removeItem('troi_shopify_shop');
    setShopConnected(null);
    setShopInput('');
    const token = localStorage.getItem('troi_token');
    if (token) shopifyApi.disconnect(token).catch(() => {});
  }

  // Enter advances steps
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Enter' && step === 1) nextStep();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, nextStep]);

  function handleComplete(): void {
    setCompleted(true);
    router.replace('/');
  }

  function handleSkipCogs(): void {
    setSkipCogs(true);
    nextStep();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      {/* Step dots */}
      <div className="flex gap-2 mb-8">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all',
              i + 1 === step
                ? 'w-3 h-3 ring-2 ring-primary ring-offset-2 bg-primary/30'
                : i + 1 < step
                  ? 'w-3 h-3 bg-primary'
                  : 'w-3 h-3 bg-muted-foreground/30',
            )}
          />
        ))}
      </div>

      <Card className="w-full max-w-[600px] p-8 space-y-6">
        {/* Step heading */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Step {step} of 4</p>
          <h1 className="text-xl font-semibold">{STEP_LABELS[step - 1]}</h1>
        </div>

        {/* Step 1 — Shopify connect */}
        {step === 1 && (
          <div className="space-y-5">
            {shopConnected ? (
              /* ── Case A: store already connected ── */
              <>
                <div className="bg-muted rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">S</span>
                    <div>
                      <p className="font-medium text-sm">{shopConnected.shopName}</p>
                      <p className="text-xs text-muted-foreground">
                        {shopConnected.domain} · {shopConnected.plan} · {shopConnected.currency}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 pt-1">
                    Connected successfully. Your store data is ready.
                  </p>
                </div>
                <button
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium text-sm hover:bg-primary/90 transition-colors"
                  onClick={nextStep}
                >
                  Looks right — continue
                </button>
                <button
                  onClick={handleDisconnectShopify}
                  className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Not your store? Disconnect
                </button>
              </>
            ) : (
              /* ── Case B: no store connected ── */
              <>
                <p className="text-sm text-muted-foreground">
                  Enter your Shopify store domain to pull real order and revenue data.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground" htmlFor="shopDomain">
                    Store domain
                  </label>
                  <input
                    id="shopDomain"
                    type="text"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="your-store.myshopify.com"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnectShopify()}
                    disabled={connecting}
                  />
                  <p className="text-xs text-muted-foreground">Example: blank-store.myshopify.com</p>
                </div>
                {connectError && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    {connectError}
                  </p>
                )}
                <button
                  className={cn(
                    'w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium text-sm transition-colors',
                    (connecting || !shopInput.trim()) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary/90',
                  )}
                  onClick={handleConnectShopify}
                  disabled={connecting || !shopInput.trim()}
                >
                  {connecting ? 'Redirecting to Shopify…' : 'Connect Shopify'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2 — Connect channels */}
        {step === 2 && (
          <ConnectChannels onContinue={nextStep} onBack={prevStep} metaError={metaError} />
        )}

        {/* Step 3 — COGS setup */}
        {step === 3 && (
          <CogsSetup
            onContinue={nextStep}
            onBack={prevStep}
            onSkip={handleSkipCogs}
          />
        )}

        {/* Step 4 — Confirm costs */}
        {step === 4 && (
          <ConfirmCosts onComplete={handleComplete} onBack={prevStep} initialRefundRate={shopifyRefundRate} />
        )}
      </Card>
    </div>
  );
}
