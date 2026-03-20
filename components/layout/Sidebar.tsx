/**
 * Fixed sidebar (220px) with logo, navigation, and an ROAS vs ROI explainer footer.
 */

'use client';

import { LayoutDashboard, Settings } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

/** Left-side navigation sidebar for the ROI Intelligence dashboard. */
export default function Sidebar(): React.JSX.Element {
  const toggleSettings = useUIStore((s) => s.toggleSettings);

  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Blank</span>
        <span className="ml-auto text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">store</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
        <button
          onClick={toggleSettings}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
          )}
        >
          <Settings size={16} />
          Settings
        </button>
      </nav>

      {/* Footer explainer */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
          <span className="font-semibold text-gray-500 dark:text-gray-400">ROAS ≠ ROI.</span>{' '}
          ROAS = Revenue ÷ Spend. It ignores product costs, shipping, refunds, and fees.
          True ROI accounts for all of those — it shows real profit.
        </p>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
        active
          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
      )}
    >
      {icon}
      {label}
    </div>
  );
}
