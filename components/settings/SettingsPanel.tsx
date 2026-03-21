/**
 * Slide-in settings panel (right side sheet).
 * Lets the owner adjust COGS%, shipping, refund rate, and payment fee.
 * Validates inputs before saving. Persists to localStorage via useSettings hook.
 */

'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Save, Info } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StoreSettings } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FieldConfig {
  key: keyof StoreSettings;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  /** Transform stored value → display value */
  toDisplay: (v: number) => number;
  /** Transform display value → stored value */
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

/** Right-side slide-in panel for configuring store profit settings. */
export default function SettingsPanel(): React.JSX.Element {
  const { settingsOpen, toggleSettings } = useUIStore();
  const { settings, save, reset } = useSettings();

  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      const initial: Record<string, string> = {};
      for (const f of FIELDS) {
        initial[f.key] = f.toDisplay(settings[f.key]).toString();
      }
      setDraft(initial);
    }
  }, [settings]);

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

  if (!settingsOpen) return <></>;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={toggleSettings} />

      {/* Panel */}
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Store Settings</h2>
          <button onClick={toggleSettings} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                {f.label}
              </Label>
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

          {/* ROI explainer box */}
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
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
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
      </aside>
    </>
  );
}
