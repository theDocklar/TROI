/**
 * Fixed sidebar (220px) with logo, navigation, user avatar, and sign-out.
 */

'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

/** Shared nav content rendered in both the desktop aside and the mobile Sheet. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }): React.JSX.Element {
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const router = useRouter();

  function handleSignOut(): void {
    localStorage.removeItem('troi_token');
    localStorage.removeItem('troi_authed');
    localStorage.removeItem('troi_user_email');
    localStorage.removeItem('troi_user_name');
    localStorage.removeItem('troi_onboarded');
    router.replace('/signin');
  }

  // Read display name from localStorage after mount to avoid SSR/client mismatch
  const [email, setEmail] = useState('user@example.com');
  useEffect(() => {
    setEmail(localStorage.getItem('troi_user_email') ?? 'user@example.com');
  }, []);
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <div className="w-6 h-6 bg-indigo-500 rounded-md flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-xs">T</span>
        </div>
        <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">TROI</span>
        <span className="ml-auto text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Beta</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
        <button
          onClick={() => { toggleSettings(); onNavigate?.(); }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
          )}
        >
          <Settings size={16} />
          Settings
        </button>
      </nav>

      {/* Footer: user + sign out */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
        {/* ROAS ≠ ROI note */}
        <div className="px-1">
          <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
            <span className="font-semibold text-gray-500 dark:text-gray-400">ROAS ≠ ROI.</span>{' '}
            True ROI deducts COGS, shipping, refunds, and fees — ROAS ignores all of them.
          </p>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center shrink-0">
            <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">Blank Store</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{email}</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/** Left-side navigation sidebar for the ROI Intelligence dashboard. */
export default function Sidebar(): React.JSX.Element {
  return (
    <aside className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <SidebarNav />
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
