'use client';

/**
 * ProductPL — Products P&L table.
 * Lists all mock products with revenue, units, COGS%, ad spend, and gross margin.
 * Clicking a row opens the ProductModal drill-down sheet.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { useSettings } from '@/hooks/useSettings';
import ProductModal from './ProductModal';
import CogsWarning from './CogsWarning';
import type { Product, StoreSettings } from '@/types';

const DEFAULT_SETTINGS: StoreSettings = {
  cogs: 0.38,
  shippingPerOrder: 5.50,
  refundRate: 0.028,
  paymentFee: 0.029,
};

function grossMargin(p: Product): number {
  return ((p.price - p.price * p.cogs) / p.price) * 100;
}

function marginBadge(pct: number): { label: string; class: string } {
  if (pct > 40) return { label: 'Scale', class: 'text-green-700 bg-green-100 dark:bg-green-900/40 dark:text-green-400' };
  if (pct > 20) return { label: 'Optimise', class: 'text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400' };
  return { label: 'Pause ads', class: 'text-red-700 bg-red-100 dark:bg-red-900/40 dark:text-red-400' };
}

/** Table of all products with P&L breakdown; clicking a row opens the product drill-down. */
export default function ProductPL(): React.JSX.Element {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { settings } = useSettings();
  const s = settings ?? DEFAULT_SETTINGS;

  return (
    <>
      <CogsWarning />

      <Card>
        <CardHeader>
          <CardTitle>Products P&amp;L</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-right px-4 py-3">Revenue</th>
                  <th className="text-right px-4 py-3">Units</th>
                  <th className="text-right px-4 py-3">COGS%</th>
                  <th className="text-right px-4 py-3">Ad spend</th>
                  <th className="text-right px-4 py-3">Gross margin</th>
                  <th className="text-right px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {MOCK_PRODUCTS.map((p) => {
                  const margin = grossMargin(p);
                  const badge = marginBadge(margin);
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedProduct(p)}
                    >
                      <td className="px-6 py-3">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3">${p.revenue.toLocaleString()}</td>
                      <td className="text-right px-4 py-3">{p.units}</td>
                      <td className="text-right px-4 py-3">{(p.cogs * 100).toFixed(1)}%</td>
                      <td className="text-right px-4 py-3">${p.adSpend.toLocaleString()}</td>
                      <td className={cn('text-right px-4 py-3 font-medium', margin > 40 ? 'text-green-600' : margin > 20 ? 'text-amber-500' : 'text-red-500')}>
                        {margin.toFixed(1)}%
                      </td>
                      <td className="text-right px-6 py-3">
                        <Badge className={cn('text-xs', badge.class)}>{badge.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ProductModal product={selectedProduct} settings={s} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
