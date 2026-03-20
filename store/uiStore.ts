/**
 * Zustand UI store.
 * Manages client-side UI state: date range, view mode, dismissed alerts, settings panel.
 */

import { create } from 'zustand';
import type { RangeDays, ViewMode } from '@/types';

interface UIState {
  range: RangeDays;
  viewMode: ViewMode;
  dismissedAlerts: string[];
  settingsOpen: boolean;

  setRange: (range: RangeDays) => void;
  setViewMode: (mode: ViewMode) => void;
  dismissAlert: (id: string) => void;
  toggleSettings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  range: 30,
  viewMode: 'roi',
  dismissedAlerts: [],
  settingsOpen: false,

  setRange: (range) => set({ range }),
  setViewMode: (viewMode) => set({ viewMode }),
  dismissAlert: (id) =>
    set((state) => ({
      dismissedAlerts: state.dismissedAlerts.includes(id)
        ? state.dismissedAlerts
        : [...state.dismissedAlerts, id],
    })),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
}));
