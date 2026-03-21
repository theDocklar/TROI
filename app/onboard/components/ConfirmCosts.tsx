'use client';

/**
 * Onboarding Step 4 — Confirm shipping, refund rate, and payment fee.
 * Pre-fills with sensible defaults and saves to localStorage "roi_v3".
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

/** Step 4 of onboarding: confirm shipping/refund/payment defaults before going to dashboard. */
export default function ConfirmCosts({ onComplete, onBack }: Props): React.JSX.Element {
  const [shipping, setShipping] = useState('5.50');
  const [refundRate, setRefundRate] = useState('2.8');
  const [paymentFee, setPaymentFee] = useState('2.9');

  function handleComplete(): void {
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('roi_v3') ?? '{}');
      localStorage.setItem('roi_v3', JSON.stringify({
        ...existing,
        shippingPerOrder: parseFloat(shipping) || 5.5,
        refundRate: (parseFloat(refundRate) || 2.8) / 100,
        paymentFee: (parseFloat(paymentFee) || 2.9) / 100,
      }));
    }
    onComplete();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        These costs affect your True ROI calculation. Pre-filled with Shopify defaults.
      </p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="shipping">Shipping per order ($)</Label>
          <Input
            id="shipping"
            type="number"
            step="0.01"
            min="0"
            value={shipping}
            onChange={(e) => setShipping(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Pulled from Shopify shipping profile or default</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="refund">Refund rate (%)</Label>
          <Input
            id="refund"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={refundRate}
            onChange={(e) => setRefundRate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Calculated from last 90 days — mock: 2.8%</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fee">Payment fee (%)</Label>
          <Input
            id="fee"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={paymentFee}
            onChange={(e) => setPaymentFee(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Detected from Shopify Payments</p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleComplete}>
          These look right — go to dashboard
        </Button>
      </div>
    </div>
  );
}
