/**
 * GET  /api/settings     — returns current StoreSettings
 * PUT  /api/settings     — validates and persists updated StoreSettings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, setSettings, DEFAULT_SETTINGS } from '@/lib/settingsStore';
import type { StoreSettings } from '@/types';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getSettings());
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  let body: Partial<StoreSettings>;

  try {
    body = await req.json() as Partial<StoreSettings>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validation helpers
  const inRange = (v: unknown, min: number, max: number): boolean =>
    typeof v === 'number' && v >= min && v <= max;

  const errors: string[] = [];

  if (!inRange(body.cogs, 0, 1))               errors.push('cogs must be 0–1 (e.g. 0.38 for 38%)');
  if (!inRange(body.shippingPerOrder, 0, 9999)) errors.push('shippingPerOrder must be ≥ 0');
  if (!inRange(body.refundRate, 0, 1))          errors.push('refundRate must be 0–1 (e.g. 0.028)');
  if (!inRange(body.paymentFee, 0, 1))          errors.push('paymentFee must be 0–1 (e.g. 0.029)');

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(', ') }, { status: 422 });
  }

  const merged: StoreSettings = {
    cogs:             body.cogs             ?? DEFAULT_SETTINGS.cogs,
    shippingPerOrder: body.shippingPerOrder  ?? DEFAULT_SETTINGS.shippingPerOrder,
    refundRate:       body.refundRate        ?? DEFAULT_SETTINGS.refundRate,
    paymentFee:       body.paymentFee        ?? DEFAULT_SETTINGS.paymentFee,
  };

  setSettings(merged);
  return NextResponse.json(merged);
}
