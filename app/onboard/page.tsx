'use client';

/**
 * Multi-step onboarding wizard — shown once on first visit before the dashboard.
 * Steps: 1) Shopify confirmation  2) Connect channels  3) COGS setup  4) Confirm costs
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useOnboardStore, isOnboarded } from '@/store/onboardStore';
import ConnectChannels from './components/ConnectChannels';
import CogsSetup from './components/CogsSetup';
import ConfirmCosts from './components/ConfirmCosts';
import { cn } from '@/lib/utils';

const STEP_LABELS = [
  'Shopify',
  'Connect channels',
  'COGS setup',
  'Confirm costs',
];

/** Onboarding wizard page — renders the correct step based on Zustand store state. */
export default function OnboardPage(): React.JSX.Element {
  const router = useRouter();
  const { step, nextStep, prevStep, setCompleted, setSkipCogs } = useOnboardStore();

  // If already onboarded, skip straight to dashboard
  useEffect(() => {
    if (isOnboarded()) {
      router.replace('/');
    }
  }, [router]);

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

        {/* Step 1 — Shopify confirmation (informational) */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="bg-muted rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">S</span>
                <div>
                  <p className="font-medium text-sm">Blank Store</p>
                  <p className="text-xs text-muted-foreground">shopify.com · Shopify Basic · AUD</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Connected successfully. Your store data is ready.
              </p>
            </div>
            <button
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium text-sm hover:bg-primary/90 transition-colors"
              onClick={nextStep}
            >
              Looks right — continue
            </button>
          </div>
        )}

        {/* Step 2 — Connect channels */}
        {step === 2 && (
          <ConnectChannels onContinue={nextStep} onBack={prevStep} />
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
          <ConfirmCosts onComplete={handleComplete} onBack={prevStep} />
        )}
      </Card>
    </div>
  );
}
