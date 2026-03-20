/**
 * In-memory settings store for the API layer.
 * In production this would be replaced by a Prisma DB call.
 */

import type { StoreSettings } from '@/types';

export const DEFAULT_SETTINGS: StoreSettings = {
  cogs: 0.38,
  shippingPerOrder: 5.50,
  refundRate: 0.028,
  paymentFee: 0.029,
};

const store = new Map<string, StoreSettings>();

export function getSettings(storeId = 'blank'): StoreSettings {
  return store.get(storeId) ?? DEFAULT_SETTINGS;
}

export function setSettings(settings: StoreSettings, storeId = 'blank'): void {
  store.set(storeId, settings);
}
