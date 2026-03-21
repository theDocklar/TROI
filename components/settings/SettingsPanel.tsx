/**
 * Slide-in settings panel (right side sheet).
 * Four tabs: P&L settings, Product groups (COGS), Channel budgets, Channels (connections).
 * Footer includes a "Re-run setup wizard" link to restart onboarding.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, Info, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/store/uiStore';
import { useOnboardStore } from '@/store/onboardStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StoreSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRODUCT_GROUP_DEFAULTS } from '@/lib/mockData';
import { CHANNEL_DEFINITIONS, getStoredChannels } from '@/app/onboard/components/ConnectChannels';

interface FieldConfig {
  key: keyof StoreSettings;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  toDisplay: (v: number) => number;
  fromDisplay: (v: number) => number;
}

const FIELDS: FieldConfig[] = [
  {
    key: 'cogs',
    label: 'Cost of Goods (COGS)',
    unit: '%',
    min: 0, max: 100, step: 0.1,
    hint: 'The % of revenue it costs to make/buy the product.',
    toDisplay: (v) => parseFloat((v * 100).toFixed(2)),
    fromDisplay: (v) => v / 100,
  },
  {
    key: 'shippingPerOrder',
    label: 'Shipping per Order',
    unit: '$',
    min: 0, max: 999, step: 0.01,
    hint: 'Average fulfilment cost per shipped order.',
    toDisplay: (v) => v,
    fromDisplay: (v) => v,
  },
  {
    key: 'refundRate',
    label: 'Refund Rate',
    unit: '%',
    min: 0, max: 100, step: 0.1,
    hint: 'Percentage of revenue lost to returns and refunds.',
    toDisplay: (v) => parseFloat((v * 100).toFixed(2)),
    fromDisplay: (v) => v / 100,
  },
  {
    key: 'paymentFee',
    label: 'Payment Processing Fee',
    unit: '%',
    min: 0, max: 10, step: 0.01,
    hint: 'Shopify Payments / Stripe fee as % of revenue.',
    toDisplay: (v) => parseFloat((v * 100).toFixed(2)),
    fromDisplay: (v) => v / 100,
  },
];

const CHANNEL_DEFAULTS = { Meta: 8000, Google: 4500, TikTok: 9000, Email: 500 };

function getStoredProductGroups() {
  if (typeof window === 'undefined') return structuredClone(PRODUCT_GROUP_DEFAULTS);
  try {
    const stored = localStorage.getItem('roi_product_cogs');
    return stored ? JSON.parse(stored) : structuredClone(PRODUCT_GROUP_DEFAULTS);
  } catch {
    return structuredClone(PRODUCT_GROUP_DEFAULTS);
  }
}

function getStoredBudgets(): Record<string, number> {
  if (typeof window === 'undefined') return { ...CHANNEL_DEFAULTS };
  try {
    const stored = localStorage.getItem('roi_budgets');
    return stored ? JSON.parse(stored) : { ...CHANNEL_DEFAULTS };
  } catch {
    return { ...CHANNEL_DEFAULTS };
  }
}

const CATEGORY_COLORS: string[] = ['bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-rose-400', 'bg-amber-400'];

/** Right-side slide-in panel with P&L settings, product group COGS, channel budgets, and channel connections. */
export default function SettingsPanel(): React.JSX.Element {
  const router = useRouter();
  const { settingsOpen, toggleSettings, settingsTab, setSettingsTab } = useUIStore();
  const { settings, save, reset } = useSettings();
  const { resetOnboarding } = useOnboardStore();

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [productGroups, setProductGroups] = useState(getStoredProductGroups);
  const [budgets, setBudgets] = useState<Record<string, number>>(getStoredBudgets);
  const [channels, setChannels] = useState<Record<string, boolean>>({});
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const f of FIELDS) {
        initial[f.key] = f.toDisplay(settings[f.key]).toString();
      }
      setDraft(initial);
    }
  }, [settings]);

  // Sync all localStorage-backed state when panel opens
  useEffect(() => {
    if (settingsOpen) {
      setProductGroups(getStoredProductGroups());
      setBudgets(getStoredBudgets());
      setChannels(getStoredChannels());
    }
  }, [settingsOpen]);

  const handleSave = async (): Promise<void> => {
    const updated: Partial<StoreSettings> = {};
    for (const f of FIELDS) {
      const raw = parseFloat(draft[f.key] ?? '0');
      if (isNaN(raw) || raw < f.min || raw > f.max) {
        toast.error(`${f.label}: value must be between ${f.min} and ${f.max}`);
        return;
      }
      updated[f.key] = f.fromDisplay(raw) as never;
    }
    await save(updated as StoreSettings);
    toast.success('Settings saved');
  };

  const handleReset = async (): Promise<void> => {
    await reset();
    toast.info('Settings reset to defaults');
  };

  function handleApplyProductGroups(): void {
    // Compute blended COGS and update main settings
    const totalRev = productGroups.reduce((s: number, g: typeof PRODUCT_GROUP_DEFAULTS[0]) => s + g.avgSellingPrice, 0);
    const totalCogs = productGroups.reduce((s: number, g: typeof PRODUCT_GROUP_DEFAULTS[0]) => s + g.supplierCost + g.freight + g.packaging, 0);
    const blended = totalCogs / totalRev;

    localStorage.setItem('roi_product_cogs', JSON.stringify(productGroups));
    setDraft((d) => ({ ...d, cogs: parseFloat((blended * 100).toFixed(2)).toString() }));
    toast.success(`Blended COGS applied: ${(blended * 100).toFixed(1)}%`);
    setSettingsTab('pl');
  }

  function handleSaveBudgets(): void {
    localStorage.setItem('roi_budgets', JSON.stringify(budgets));
    toast.success('Channel budgets saved');
  }

  function handleToggleChannel(id: string): void {
    if (channels[id]) {
      // Disconnect
      const next = { ...channels, [id]: false };
      setChannels(next);
      localStorage.setItem('troi_channels', JSON.stringify(next));
      toast.info(`${CHANNEL_DEFINITIONS.find((c) => c.id === id)?.name} disconnected`);
    } else {
      // Simulate connect
      setConnectingId(id);
      setTimeout(() => {
        const next = { ...channels, [id]: true };
        setChannels(next);
        localStorage.setItem('troi_channels', JSON.stringify(next));
        setConnectingId(null);
        toast.success(`${CHANNEL_DEFINITIONS.find((c) => c.id === id)?.name} connected`);
      }, 1500);
    }
  }

  function handleRerunWizard(): void {
    resetOnboarding();
    toggleSettings();
    router.push('/onboard');
  }

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const connectedCount = Object.values(channels).filter(Boolean).length;

  if (!settingsOpen) return <></>;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={toggleSettings} />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Store Settings</h2>
          <button onClick={toggleSettings} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as typeof settingsTab)} className="h-full flex flex-col">
            <TabsList className="mx-5 mt-4 grid w-auto grid-cols-4">
              <TabsTrigger value="pl" className="text-xs">P&amp;L</TabsTrigger>
              <TabsTrigger value="products" className="text-xs">COGS</TabsTrigger>
              <TabsTrigger value="budgets" className="text-xs">Budgets</TabsTrigger>
              <TabsTrigger value="channels" className="text-xs relative">
                Channels
                {connectedCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center leading-none">
                    {connectedCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab 1 — P&L settings */}
            <TabsContent value="pl" className="px-5 py-5 space-y-5 flex-1">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <Label className="mb-1 text-sm text-gray-700 dark:text-gray-300">{f.label}</Label>
                  <div className="relative">
                    {f.unit === '$' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    )}
                    <Input
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={draft[f.key] ?? ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                      className={cn('h-9 pr-8', f.unit === '$' ? 'pl-7' : 'pl-3')}
                    />
                    {f.unit === '%' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{f.hint}</p>
                </div>
              ))}

              <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 p-4">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">Why ROAS ≠ ROI</p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 leading-relaxed">
                      ROAS only divides revenue by ad spend. A 4× ROAS sounds great — but if your product costs 40% to make,
                      shipping costs $5, you refund 3%, and Shopify takes 2.9%, you might be barely breaking even.
                      True ROI deducts all of these before measuring profitability.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pb-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                >
                  <Save size={14} />
                  Save Settings
                </button>
              </div>
            </TabsContent>

            {/* Tab 2 — Product groups */}
            <TabsContent value="products" className="px-5 py-5 space-y-4 flex-1">
              <p className="text-xs text-muted-foreground">Set COGS per product category. Click "Apply to P&amp;L" to update the blended rate.</p>
              <div className="space-y-3">
                {productGroups.map((g: typeof PRODUCT_GROUP_DEFAULTS[0], i: number) => {
                  const totalCogs = g.supplierCost + g.freight + g.packaging;
                  const pct = g.avgSellingPrice > 0 ? (totalCogs / g.avgSellingPrice) * 100 : 0;
                  return (
                    <div key={g.category} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2.5 h-2.5 rounded-full', CATEGORY_COLORS[i % CATEGORY_COLORS.length])} />
                        <span className="font-medium text-sm">{g.category}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {pct.toFixed(1)}% margin: ${(g.avgSellingPrice - totalCogs).toFixed(0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {([['supplierCost', 'Supplier $'], ['freight', 'Freight $'], ['packaging', 'Pack $']] as const).map(([field, label]) => (
                          <div key={field}>
                            <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                            <Input
                              type="number"
                              step="0.10"
                              min="0"
                              className="h-7 text-xs text-right"
                              value={g[field]}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setProductGroups((prev: typeof PRODUCT_GROUP_DEFAULTS) => {
                                  const next = [...prev];
                                  next[i] = { ...next[i], [field]: val };
                                  return next;
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Blended COGS */}
              <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-2 text-sm">
                <span className="text-muted-foreground">Blended COGS</span>
                <span className="font-bold">
                  {(() => {
                    const totalRev = productGroups.reduce((s: number, g: typeof PRODUCT_GROUP_DEFAULTS[0]) => s + g.avgSellingPrice, 0);
                    const totalC = productGroups.reduce((s: number, g: typeof PRODUCT_GROUP_DEFAULTS[0]) => s + g.supplierCost + g.freight + g.packaging, 0);
                    return totalRev > 0 ? ((totalC / totalRev) * 100).toFixed(1) + '%' : '—';
                  })()}
                </span>
              </div>

              <button
                onClick={handleApplyProductGroups}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                Apply to P&amp;L
              </button>
            </TabsContent>

            {/* Tab 3 — Channel budgets */}
            <TabsContent value="budgets" className="px-5 py-5 space-y-4 flex-1">
              <p className="text-xs text-muted-foreground">Set monthly budget targets per channel. Pace indicators update in real time.</p>

              {Object.entries(budgets).map(([ch, budget]) => (
                <div key={ch} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{ch}</Label>
                    <span className="text-xs text-muted-foreground">
                      {totalBudget > 0 ? ((budget / totalBudget) * 100).toFixed(0) : 0}% of total
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      className="pl-7 h-9"
                      value={budget}
                      onChange={(e) => setBudgets((prev) => ({ ...prev, [ch]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              ))}

              {/* Budget allocation bar */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Budget allocation</p>
                <div className="h-3 rounded-full overflow-hidden flex">
                  {[
                    { ch: 'Meta',   color: 'bg-blue-500' },
                    { ch: 'Google', color: 'bg-red-400' },
                    { ch: 'TikTok', color: 'bg-gray-700' },
                    { ch: 'Email',  color: 'bg-orange-400' },
                  ].map(({ ch, color }) => (
                    <div
                      key={ch}
                      className={cn('transition-all duration-300', color)}
                      style={{ width: totalBudget > 0 ? `${((budgets[ch] ?? 0) / totalBudget) * 100}%` : '25%' }}
                      title={`${ch}: $${(budgets[ch] ?? 0).toLocaleString()}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveBudgets}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
              >
                <Save size={14} />
                Save Budgets
              </button>
            </TabsContent>

            {/* Tab 4 — Channel connections */}
            <TabsContent value="channels" className="px-5 py-5 space-y-4 flex-1">
              <p className="text-xs text-muted-foreground">
                Manage your ad channel connections. These were set during onboarding and can be changed here.
              </p>

              <div className="space-y-3">
                {CHANNEL_DEFINITIONS.map((ch) => {
                  const isConnected = !!channels[ch.id];
                  const isConnecting = connectingId === ch.id;
                  return (
                    <div
                      key={ch.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition-colors',
                        isConnected
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                          : 'border-gray-200 dark:border-gray-700',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs',
                            ch.color,
                          )}
                        >
                          {ch.initial}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{ch.name}</p>
                          {isConnected ? (
                            <Badge variant="outline" className="text-green-600 border-green-400 text-[10px] mt-0.5 h-4">
                              Connected
                            </Badge>
                          ) : (
                            <p className="text-xs text-muted-foreground">Not connected</p>
                          )}
                        </div>
                      </div>
                      <button
                        disabled={isConnecting}
                        onClick={() => handleToggleChannel(ch.id)}
                        className={cn(
                          'text-xs font-medium px-3 py-1.5 rounded-md border transition-colors',
                          isConnected
                            ? 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                            : 'border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/40',
                          isConnecting && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        {isConnecting ? 'Connecting…' : isConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-muted/50 rounded-lg px-4 py-3 text-xs text-muted-foreground">
                {connectedCount === 0
                  ? 'No channels connected. Connect at least one to enable attribution data.'
                  : `${connectedCount} of ${CHANNEL_DEFINITIONS.length} channels connected.`}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer — re-run wizard */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Want to reconfigure everything?</p>
          <button
            onClick={handleRerunWizard}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <RefreshCw size={12} />
            Re-run setup wizard
          </button>
        </div>
      </aside>
    </>
  );
}
