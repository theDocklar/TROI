'use client';

/**
 * ProductModal — drill-down sheet for a single product.
 * Shows P&L waterfall, metrics grid, channel performance table, and recommendation.
 * Opens as a right-side sheet on desktop, bottom sheet on mobile.
 */

import { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Product, StoreSettings } from '@/types';
import { MOCK_CAMPAIGNS } from '@/lib/mockData';

interface Props {
  product: Product | null;
  settings: StoreSettings;
  onClose: () => void;
}

interface WaterfallSegment {
  label: string;
  pct: number;
  color: string;
}

function buildWaterfall(product: Product, settings: StoreSettings): WaterfallSegment[] {
  const { price } = product;
  const cogsDollars     = price * product.cogs;
  const adSpendPct      = price > 0 ? product.adSpend / product.units / price : 0;
  const shippingPct     = price > 0 ? settings.shippingPerOrder / price : 0;
  const refundPct       = settings.refundRate;
  const feePct          = settings.paymentFee;
  const netPct          = Math.max(0, 1 - product.cogs - adSpendPct - shippingPct - refundPct - feePct);

  return [
    { label: 'COGS',       pct: product.cogs * 100,  color: '#F0997B' },
    { label: 'Ad spend',   pct: adSpendPct * 100,    color: '#f59e0b' },
    { label: 'Shipping',   pct: shippingPct * 100,   color: '#6366f1' },
    { label: 'Refunds',    pct: refundPct * 100,     color: '#ef4444' },
    { label: 'Fees',       pct: feePct * 100,        color: '#8b5cf6' },
    { label: 'Net profit', pct: netPct * 100,        color: '#22c55e' },
  ];
}

function getRecommendation(margin: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (margin > 40) return { label: 'Scale with ads', variant: 'default' };
  if (margin >= 20) return { label: 'Optimise first', variant: 'secondary' };
  return { label: 'Pause paid traffic', variant: 'destructive' };
}

function getRecommendationText(product: Product, margin: number, settings: StoreSettings): string {
  const minPrice = Math.ceil(
    (product.cogs * product.price + settings.shippingPerOrder +
     product.price * settings.refundRate + product.price * settings.paymentFee) /
    (1 - 0.30)
  );
  if (margin < 15) {
    return `${product.name} has only ${margin.toFixed(1)}% net margin after ad allocation. Paid traffic is not viable at current COGS. Consider organic-only or raise the price to at least $${minPrice}.`;
  }
  if (margin < 30) {
    return `Borderline profitable at ${margin.toFixed(1)}% margin. Reduce ad allocation or renegotiate COGS before scaling.`;
  }
  return `Healthy ${margin.toFixed(1)}% margin. Safe to scale paid traffic — prioritise channels with highest incremental lift.`;
}

/** Per-product drill-down sheet with P&L waterfall, metrics, and channel breakdown. */
export default function ProductModal({ product, settings, onClose }: Props): React.JSX.Element | null {
  if (!product) return null;

  const waterfall = useMemo(() => buildWaterfall(product, settings), [product, settings]);

  const adSpendPerUnit = product.units > 0 ? product.adSpend / product.units : 0;
  const grossMarginPct = ((product.price - product.price * product.cogs) / product.price) * 100;
  const netProfitPerUnit = product.price * (1 - product.cogs) - adSpendPerUnit - settings.shippingPerOrder
    - product.price * settings.refundRate - product.price * settings.paymentFee;
  const netMarginPct = (netProfitPerUnit / product.price) * 100;

  const breakEvenROAS = product.price / Math.max(
    0.01,
    product.price - product.price * product.cogs - settings.shippingPerOrder
    - product.price * settings.refundRate - product.price * settings.paymentFee,
  );

  const rec = getRecommendation(netMarginPct);

  // Estimate channel breakdown from campaign revenue shares
  const totalCampaignRev = MOCK_CAMPAIGNS
    .filter((c) => c.channel !== 'Email')
    .reduce((s, c) => s + c.dailyRevenue.slice(-30).reduce((a, b) => a + b, 0), 0);

  const channelGroups = (['Meta', 'Google', 'TikTok'] as const).map((ch) => {
    const chCampaigns = MOCK_CAMPAIGNS.filter((c) => c.channel === ch);
    const chRev = chCampaigns.reduce((s, c) => s + c.dailyRevenue.slice(-30).reduce((a, b) => a + b, 0), 0);
    const share = totalCampaignRev > 0 ? chRev / totalCampaignRev : 0;
    const estUnits = Math.round(product.units * share);
    const estRevenue = estUnits * product.price;
    const estSpend = chCampaigns.reduce((s, c) => s + c.dailySpend.slice(-30).reduce((a, b) => a + b, 0), 0) * share;
    const chROI = estSpend > 0 ? ((estRevenue - estSpend) / estSpend) * 100 : 0;
    return { channel: ch, estUnits, estRevenue, estSpend, chROI };
  });

  // Responsive: bottom sheet on mobile, right on desktop — resolved after mount to avoid SSR mismatch
  const [side, setSide] = useState<'right' | 'bottom'>('right');
  useEffect(() => {
    setSide(window.innerWidth < 640 ? 'bottom' : 'right');
  }, []);

  return (
    <Sheet open={!!product} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side={side} className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="flex flex-row items-start justify-between pr-8">
          <div className="space-y-1">
            <SheetTitle>{product.name}</SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>
              <Badge variant={rec.variant} className="text-xs">{rec.label}</Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* P&L waterfall bar */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Revenue breakdown per unit (${product.price})</p>
            <div className="flex h-12 rounded-lg overflow-hidden w-full">
              {waterfall.map((seg) => (
                <div
                  key={seg.label}
                  style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                  title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {waterfall.map((seg) => (
                <span key={seg.label} className="flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: seg.color }} />
                  {seg.label} {seg.pct.toFixed(1)}%
                  <span className="text-muted-foreground">
                    (${(product.price * seg.pct / 100).toFixed(2)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Metrics grid 2×3 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Revenue',          value: `$${product.revenue.toLocaleString()}` },
              { label: 'Units sold',        value: product.units.toLocaleString() },
              { label: 'Gross margin',      value: `${grossMarginPct.toFixed(1)}%` },
              { label: 'Ad spend (total)',  value: `$${product.adSpend.toLocaleString()}` },
              { label: 'Net profit / unit', value: `$${netProfitPerUnit.toFixed(2)}` },
              { label: 'Break-even ROAS',   value: `${breakEvenROAS.toFixed(2)}×` },
            ].map(({ label, value }) => (
              <Card key={label} className="p-3">
                <CardContent className="p-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-semibold text-sm mt-0.5">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Channel performance table */}
          <div>
            <p className="text-sm font-medium mb-2">Estimated channel attribution</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-1.5">Channel</th>
                  <th className="text-right pb-1.5">Units</th>
                  <th className="text-right pb-1.5">Revenue</th>
                  <th className="text-right pb-1.5">Ad spend</th>
                  <th className="text-right pb-1.5">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {channelGroups.map((g) => (
                  <tr key={g.channel} className="py-1">
                    <td className="py-1.5">{g.channel}</td>
                    <td className="text-right">{g.estUnits}</td>
                    <td className="text-right">${g.estRevenue.toLocaleString()}</td>
                    <td className="text-right">${Math.round(g.estSpend).toLocaleString()}</td>
                    <td className={cn('text-right', g.chROI > 20 ? 'text-green-600' : g.chROI > 5 ? 'text-amber-500' : 'text-red-500')}>
                      {g.chROI.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendation paragraph */}
          <div className="bg-muted rounded-lg p-4 text-sm">
            <p>{getRecommendationText(product, netMarginPct, settings)}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
