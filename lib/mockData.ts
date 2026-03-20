/**
 * Deterministic mock data for Blank clothing store.
 * Uses a seeded LCG (Linear Congruential Generator) with seed=42.
 * No random() calls — all values are reproducible across runs.
 */

import type { Campaign, Channel } from '@/types';

// ── Seeded RNG (LCG, seed = 42) ────────────────────────────────────────────
class SeededRNG {
  private state: number;
  constructor(seed: number) { this.state = seed; }

  /** Returns a deterministic float in [0, 1) */
  next(): number {
    // Park-Miller LCG
    this.state = (this.state * 16807 + 0) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  /** Returns a float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

const rng = new SeededRNG(42);

// ── Campaign seed config ────────────────────────────────────────────────────
interface CampaignSeed {
  id: string;
  name: string;
  channel: Channel;
  baseSpend: number;
  baseRev: number;
  trend: number; // daily revenue trend multiplier (e.g. 0.003 = +0.3%/day)
}

const CAMPAIGN_SEEDS: CampaignSeed[] = [
  { id: 'c1',  name: 'Meta — Summer Drop',           channel: 'Meta',    baseSpend: 180, baseRev: 720,  trend:  0.006 },
  { id: 'c2',  name: 'Meta — Restock Retargeting',    channel: 'Meta',    baseSpend: 95,  baseRev: 460,  trend:  0.004 },
  { id: 'c3',  name: 'Google — Brand Search',         channel: 'Google',  baseSpend: 60,  baseRev: 310,  trend:  0.002 },
  { id: 'c4',  name: 'Google — Shopping Ads',         channel: 'Google',  baseSpend: 130, baseRev: 520,  trend: -0.002 },
  { id: 'c5',  name: 'TikTok — OOTD UGC',             channel: 'TikTok',  baseSpend: 110, baseRev: 580,  trend:  0.008 },
  { id: 'c6',  name: 'TikTok — Spark Hoodie Drop',    channel: 'TikTok',  baseSpend: 200, baseRev: 840,  trend:  0.010 },
  { id: 'c7',  name: 'Email — Abandoned Cart',        channel: 'Email',   baseSpend: 20,  baseRev: 290,  trend:  0.001 },
  { id: 'c8',  name: 'Email — New Arrivals',          channel: 'Email',   baseSpend: 18,  baseRev: 220,  trend:  0.003 },
  { id: 'c9',  name: 'Meta — Lookalike 2%',           channel: 'Meta',    baseSpend: 145, baseRev: 430,  trend: -0.004 },
  { id: 'c10', name: 'TikTok — Flash Sale',           channel: 'TikTok',  baseSpend: 165, baseRev: 380,  trend: -0.006 },
];

// ── Generate 60 days of daily data ─────────────────────────────────────────
function generateDailySeries(
  base: number,
  trend: number,
  noiseAmp: number,
  days = 60,
): number[] {
  const result: number[] = [];
  for (let d = 0; d < days; d++) {
    const trendFactor = 1 + trend * d;
    const noise = 1 + rng.range(-noiseAmp, noiseAmp);
    result.push(Math.max(0, base * trendFactor * noise));
  }
  return result;
}

export const MOCK_CAMPAIGNS: Campaign[] = CAMPAIGN_SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  channel: seed.channel,
  dailySpend: generateDailySeries(seed.baseSpend, seed.trend * 0.3, 0.15),
  dailyRevenue: generateDailySeries(seed.baseRev, seed.trend, 0.20),
}));

// ── Store-level daily orders & refunds ─────────────────────────────────────
// Orders proportional to total daily revenue, ~1 order per $35 revenue
export const MOCK_DAILY_ORDERS: number[] = (() => {
  const orders: number[] = [];
  for (let d = 0; d < 60; d++) {
    const totalRev = MOCK_CAMPAIGNS.reduce((s, c) => s + c.dailyRevenue[d], 0);
    const noise = 1 + rng.range(-0.08, 0.08);
    orders.push(Math.round((totalRev / 35) * noise));
  }
  return orders;
})();

export const MOCK_DAILY_REFUNDS: number[] = MOCK_DAILY_ORDERS.map(
  (orders) => Math.round(orders * rng.range(0.02, 0.04)),
);
