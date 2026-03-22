'use client';

/**
 * Onboarding Step 3 — COGS setup.
 * Three paths: per-product-group entry, Shopify import, or benchmark estimate.
 * Saves COGS config to localStorage "roi_product_cogs" and "roi_v3".
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PRODUCT_GROUP_DEFAULTS } from '@/lib/mockData';
import { shopifyApi, type ShopifyProduct } from '@/lib/api';
import type { ProductGroup } from '@/types';

type CogsPath = 'product' | 'shopify' | 'benchmark' | null;

const BENCHMARK_MODELS = [
  { id: 'aliexpress',  label: 'AliExpress / Alibaba direct',     range: '30–38%', pct: 34, desc: 'Low supplier cost but higher duty risk.' },
  { id: 'pod',         label: 'Local / Print-on-demand',          range: '37–44%', pct: 40, desc: 'Fast fulfilment, no inventory risk.' },
  { id: 'premium',     label: 'Premium overseas factory (MOQ)',   range: '32–40%', pct: 36, desc: 'Better margins at volume.' },
  { id: '3pl',         label: '3PL warehouse',                    range: '40–46%', pct: 43, desc: 'Freight savings via consolidated shipping.' },
  { id: 'dropship',    label: 'Dropship',                         range: '50–60%', pct: 55, desc: 'High COGS — margins only work at premium price points.' },
];

interface Props {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function totalCogs(g: ProductGroup): number {
  return g.supplierCost + g.freight + g.packaging;
}
function cogsPct(g: ProductGroup): number {
  return (totalCogs(g) / g.avgSellingPrice) * 100;
}
function blendedCogs(groups: ProductGroup[]): number {
  const totalRev = groups.reduce((s, g) => s + g.avgSellingPrice, 0);
  return (groups.reduce((s, g) => s + totalCogs(g), 0) / totalRev) * 100;
}

/** Step 3 of onboarding: configure COGS via three paths. */
export default function CogsSetup({ onContinue, onBack, onSkip }: Props): React.JSX.Element {
  const [path, setPath] = useState<CogsPath>(null);
  const [groups, setGroups] = useState<ProductGroup[]>(structuredClone(PRODUCT_GROUP_DEFAULTS));
  const [shopifyImporting, setShopifyImporting] = useState(false);
  const [shopifyDone, setShopifyDone] = useState(false);
  const [shopifyImportedCount, setShopifyImportedCount] = useState(0);
  const [shopifyBlendedCogs, setShopifyBlendedCogs] = useState(0.36);
  const [shopifyImportError, setShopifyImportError] = useState<string | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);

  function updateGroup(idx: number, field: keyof ProductGroup, value: number): void {
    setGroups((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function saveAndContinue(cogsDecimal: number): void {
    // Save to "roi_product_cogs" (product groups) and update "roi_v3" COGS field
    if (typeof window !== 'undefined') {
      localStorage.setItem('roi_product_cogs', JSON.stringify(groups));
      const existing = JSON.parse(localStorage.getItem('roi_v3') ?? '{}');
      localStorage.setItem('roi_v3', JSON.stringify({ ...existing, cogs: cogsDecimal }));
    }
    onContinue();
  }

  async function handleShopifyImport(): Promise<void> {
    setShopifyImportError(null);
    setShopifyImporting(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('troi_token') : null;
    if (!token) { setShopifyImporting(false); setShopifyImportError('Not signed in.'); return; }

    try {
      const { products } = await shopifyApi.getProducts(token);
      // Group products by productType, compute avg selling price per group
      const grouped = new Map<string, number[]>();
      for (const p of products) {
        const type = p.productType || 'Other';
        const prices = p.variants.map((v) => v.price).filter((x) => x > 0);
        if (!grouped.has(type)) grouped.set(type, []);
        grouped.get(type)!.push(...prices);
      }
      // Build updated ProductGroups using real avg selling prices
      const updatedGroups: ProductGroup[] = [...grouped.entries()].slice(0, 5).map(([cat, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const existing = PRODUCT_GROUP_DEFAULTS.find((g) => g.category.toLowerCase() === cat.toLowerCase());
        return existing
          ? { ...existing, avgSellingPrice: avg }
          : { category: cat, supplierCost: avg * 0.3, freight: avg * 0.04, packaging: avg * 0.02, avgSellingPrice: avg };
      });

      if (updatedGroups.length > 0) setGroups(updatedGroups);

      // Compute blended COGS from updated groups
      const totalRev = updatedGroups.reduce((s, g) => s + g.avgSellingPrice, 0);
      const totalCost = updatedGroups.reduce((s, g) => s + g.supplierCost + g.freight + g.packaging, 0);
      const computed = totalRev > 0 ? totalCost / totalRev : 0.36;

      setShopifyImportedCount(products.length);
      setShopifyBlendedCogs(computed);
      setShopifyDone(true);
    } catch (err) {
      setShopifyImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setShopifyImporting(false);
    }
  }

  const blended = blendedCogs(groups);

  return (
    <div className="space-y-5">
      {/* Path selector */}
      {!path && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Choose how to set up your cost of goods:</p>
          {[
            { id: 'product' as CogsPath,   label: 'Enter costs per product group', badge: 'Recommended' },
            { id: 'shopify' as CogsPath,   label: 'Import from Shopify Cost per item' },
            { id: 'benchmark' as CogsPath, label: 'Use a benchmark estimate' },
          ].map((opt) => (
            <Card
              key={opt.id!}
              className="p-4 cursor-pointer hover:border-primary transition-colors flex items-center justify-between"
              onClick={() => setPath(opt.id)}
            >
              <span className="font-medium text-sm">{opt.label}</span>
              {opt.badge && <Badge variant="secondary">{opt.badge}</Badge>}
            </Card>
          ))}
          <button className="text-xs text-muted-foreground hover:underline block pt-1" onClick={onSkip}>
            I'll set this up later
          </button>
        </div>
      )}

      {/* PATH A — per product group */}
      {path === 'product' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th className="text-left pb-2 pr-2">Category</th>
                  <th className="text-right pb-2 px-1">Supplier $</th>
                  <th className="text-right pb-2 px-1">Freight $</th>
                  <th className="text-right pb-2 px-1">Pack $</th>
                  <th className="text-right pb-2 pl-1">COGS %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groups.map((g, i) => {
                  const pct = cogsPct(g);
                  const warn = pct < 18 ? 'too low — check freight' : pct > 65 ? 'margins too thin' : null;
                  return (
                    <tr key={g.category}>
                      <td className="py-2 pr-2 font-medium">{g.category}</td>
                      {(['supplierCost', 'freight', 'packaging'] as const).map((field) => (
                        <td key={field} className="py-2 px-1">
                          <Input
                            type="number"
                            step="0.10"
                            min="0"
                            className="w-20 text-right h-7 text-xs"
                            value={g[field]}
                            onChange={(e) => updateGroup(i, field, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      ))}
                      <td className="py-2 pl-1 text-right">
                        <span className={cn('font-mono text-xs', warn ? 'text-amber-500' : 'text-foreground')}>
                          {pct.toFixed(1)}%
                        </span>
                        {warn && <p className="text-[10px] text-amber-500">{warn}</p>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Blended COGS */}
          <div className="flex items-center justify-between text-sm bg-muted rounded-lg px-4 py-2">
            <span className="text-muted-foreground">Blended COGS</span>
            <span className="font-bold">{blended.toFixed(1)}%</span>
          </div>

          {/* Benchmark bar */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Industry benchmark</p>
            <div className="flex h-2 rounded-full overflow-hidden">
              <div className="bg-green-400 flex-1" title="Budget basics 25–30%" />
              <div className="bg-amber-400 flex-1" title="Mid-market 35–42%" />
              <div className="bg-blue-400 flex-1" title="Premium DTC 45–55%" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Budget 25–30%</span><span>Mid 35–42%</span><span>Premium 45–55%</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setPath(null)}>Back</Button>
            <Button size="sm" onClick={() => saveAndContinue(blended / 100)}>
              Use {blended.toFixed(1)}% blended COGS
            </Button>
          </div>
        </div>
      )}

      {/* PATH B — Shopify import */}
      {path === 'shopify' && (
        <div className="space-y-4">
          {!shopifyDone ? (
            <div className="text-center py-6 space-y-3">
              {shopifyImportError && (
                <p className="text-xs text-red-500">{shopifyImportError}</p>
              )}
              <Button onClick={handleShopifyImport} disabled={shopifyImporting}>
                {shopifyImporting ? 'Importing…' : 'Import from Shopify'}
              </Button>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setPath(null)}>Back</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm font-medium">{shopifyImportedCount} products imported</p>
                <p className="text-sm text-muted-foreground">
                  Blended COGS from Shopify: <strong>{(shopifyBlendedCogs * 100).toFixed(1)}%</strong>
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setPath(null)}>Back</Button>
                <Button size="sm" onClick={() => saveAndContinue(shopifyBlendedCogs)}>
                  Use {(shopifyBlendedCogs * 100).toFixed(1)}%
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PATH C — benchmark estimate */}
      {path === 'benchmark' && (
        <div className="space-y-3">
          {BENCHMARK_MODELS.map((m) => (
            <Card
              key={m.id}
              className={cn(
                'p-4 cursor-pointer hover:border-primary transition-colors',
                selectedBenchmark === m.id && 'border-primary ring-1 ring-primary',
              )}
              onClick={() => setSelectedBenchmark(m.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-xs text-muted-foreground">{m.range}</p>
                  <p className="font-bold text-sm">{m.pct}%</p>
                </div>
              </div>
            </Card>
          ))}
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setPath(null)}>Back</Button>
            <Button
              size="sm"
              disabled={!selectedBenchmark}
              onClick={() => {
                const m = BENCHMARK_MODELS.find((x) => x.id === selectedBenchmark)!;
                saveAndContinue(m.pct / 100);
              }}
            >
              {selectedBenchmark
                ? `Use ${BENCHMARK_MODELS.find((x) => x.id === selectedBenchmark)!.pct}%`
                : 'Select a model'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
