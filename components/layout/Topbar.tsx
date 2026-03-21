/**
 * Top navigation bar: store badge, date-range pills, ROI/ROAS toggle, settings button.
 */

'use client';

import { Menu, Settings } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import type { RangeDays, ViewMode } from '@/types';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/layout/Sidebar';

const RANGES: RangeDays[] = [7, 30, 90];

/** Top bar with date range selection, view mode toggle, and settings access. */
export default function Topbar(): React.JSX.Element {
  const { range, viewMode, setRange, setViewMode, toggleSettings } = useUIStore();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
      {/* Mobile sidebar trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="Open navigation"
            className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu size={16} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[220px] p-0 flex flex-col">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      {/* Store badge */}
      <div className="flex items-center gap-2 mr-auto">
        <span className="font-semibold text-gray-900 dark:text-white text-sm">Blank</span>
        <span className="text-[10px] font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
          Shopify
        </span>
      </div>

      {/* Range pills */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-all',
              range === r
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            )}
          >
            {r}d
          </button>
        ))}
      </div>

      {/* ROI / ROAS toggle */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {(['roi', 'roas'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium uppercase transition-all',
              viewMode === mode
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700',
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Settings */}
      <button
        onClick={toggleSettings}
        aria-label="Open settings"
        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Settings size={16} />
      </button>
    </header>
  );
}
