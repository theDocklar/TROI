/**
 * Zustand store for the onboarding wizard.
 * Persists completion state to localStorage key "troi_onboarded".
 */

'use client';

import { create } from 'zustand';
import type { OnboardStep } from '@/types';

interface OnboardState {
  step: OnboardStep;
  completed: boolean;
  skipCogs: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardStep) => void;
  setCompleted: (value: boolean) => void;
  setSkipCogs: (value: boolean) => void;
  resetOnboarding: () => void;
}

export const useOnboardStore = create<OnboardState>((set, get) => ({
  step: 1,
  completed: false,
  skipCogs: false,

  nextStep: () => {
    const next = Math.min(4, get().step + 1) as OnboardStep;
    set({ step: next });
  },

  prevStep: () => {
    const prev = Math.max(1, get().step - 1) as OnboardStep;
    set({ step: prev });
  },

  goToStep: (step: OnboardStep) => set({ step }),

  setCompleted: (value: boolean) => {
    set({ completed: value });
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('troi_onboarded', 'true');
      } else {
        localStorage.removeItem('troi_onboarded');
      }
    }
  },

  setSkipCogs: (value: boolean) => {
    set({ skipCogs: value });
    if (typeof window !== 'undefined') {
      localStorage.setItem('troi_skip_cogs', value ? 'true' : 'false');
    }
  },

  resetOnboarding: () => {
    set({ step: 1, completed: false, skipCogs: false });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('troi_onboarded');
      localStorage.removeItem('troi_skip_cogs');
    }
  },
}));

/** Returns true if the user has completed onboarding (reads localStorage). */
export function isOnboarded(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('troi_onboarded') === 'true';
}

/** Returns true if the user skipped COGS setup during onboarding. */
export function didSkipCogs(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('troi_skip_cogs') === 'true';
}
