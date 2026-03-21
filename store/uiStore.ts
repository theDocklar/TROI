/**
 * Zustand UI store.
 * Manages client-side UI state: date range, view mode, dismissed alerts,
 * settings panel, notifications, active dashboard tab, and settings tab.
 */

import { create } from 'zustand';
import type { RangeDays, ViewMode, Notification } from '@/types';
import { INITIAL_NOTIFICATIONS } from '@/lib/mockData';

export type DashboardTab = 'overview' | 'products' | 'ltv' | 'experiments';
export type SettingsTab = 'pl' | 'products' | 'budgets';

interface UIState {
  range: RangeDays;
  viewMode: ViewMode;
  dismissedAlerts: string[];
  settingsOpen: boolean;
  activeTab: DashboardTab;
  settingsTab: SettingsTab;
  notifications: Notification[];

  setRange: (range: RangeDays) => void;
  setViewMode: (mode: ViewMode) => void;
  dismissAlert: (id: string) => void;
  toggleSettings: () => void;
  setActiveTab: (tab: DashboardTab) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setNotifications: (notifications: Notification[]) => void;
  dismissNotification: (id: string) => void;
  markAllRead: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  range: 30,
  viewMode: 'roi',
  dismissedAlerts: [],
  settingsOpen: false,
  activeTab: 'overview',
  settingsTab: 'pl',
  notifications: INITIAL_NOTIFICATIONS,

  setRange: (range) => set({ range }),
  setViewMode: (viewMode) => set({ viewMode }),
  dismissAlert: (id) =>
    set((state) => ({
      dismissedAlerts: state.dismissedAlerts.includes(id)
        ? state.dismissedAlerts
        : [...state.dismissedAlerts, id],
    })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  setNotifications: (notifications) => set({ notifications }),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}));
