/**
 * Deterministic mock data for Blank clothing store.
 * Uses a seeded LCG (Linear Congruential Generator) with seed=42.
 * No random() calls — all values are reproducible across runs.
 */

import type { Campaign, Channel, Notification, Product, ProductGroup, Experiment, LTVCohort } from '@/types';

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
  { id: 'c10', name:
     'TikTok — Flash Sale',           channel: 'TikTok',  baseSpend: 165, baseRev: 380,  trend: -0.006 },
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

// ── Notifications (seeded with 88) ──────────────────────────────────────────
// seed 88 is consumed here — values are fully deterministic
const _rng88 = new SeededRNG(88);
void _rng88.next(); // advance once to avoid collisions with other seeds

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'TikTok OOTD UGC scaling signal',  body: 'Campaign hit 38% ROI — profitable scaling threshold crossed.', time: '2h ago',  severity: 'success', read: false },
  { id: 'n2', title: 'Google Shopping ROAS declining',   body: 'ROAS dropped 18% over 14 days. Review search term reports.',   time: '5h ago',  severity: 'warning', read: false },
  { id: 'n3', title: 'Merino Sweater — low margin',      body: 'Net margin at 9% after ad allocation. Pause paid traffic.',    time: '1d ago',  severity: 'danger',  read: false },
  { id: 'n4', title: 'Email is your top channel',        body: 'Abandoned Cart email averaging 420% ROI this week.',           time: '1d ago',  severity: 'success', read: false },
  { id: 'n5', title: 'TikTok holdout reached 94% confidence', body: 'Experiment result is statistically valid — act on it.',  time: '2d ago',  severity: 'success', read: true  },
  { id: 'n6', title: 'Klaviyo sync delayed',             body: 'Last successful sync was 3+ hours ago. Check API credentials.', time: '3d ago', severity: 'warning', read: true  },
  { id: 'n7', title: 'Meta spend +22% — no revenue lift', body: 'Spend increased without matching revenue growth.',            time: '3d ago',  severity: 'danger',  read: true  },
  { id: 'n8', title: 'Monthly P&L report ready',         body: 'June: $41.2k revenue, $9.8k net profit, 28.4% blended ROI.',  time: '5d ago',  severity: 'info',    read: true  },
];

// ── Product group defaults (hardcoded benchmarks, not randomised) ────────────
export const PRODUCT_GROUP_DEFAULTS: ProductGroup[] = [
  { category: 'Basics',      supplierCost: 8,  freight: 1.10, packaging: 0.70, avgSellingPrice: 38  },
  { category: 'Bottoms',     supplierCost: 28, freight: 3.20, packaging: 1.20, avgSellingPrice: 110 },
  { category: 'Outerwear',   supplierCost: 48, freight: 5.00, packaging: 1.80, avgSellingPrice: 150 },
  { category: 'Accessories', supplierCost: 6,  freight: 0.90, packaging: 0.50, avgSellingPrice: 33  },
  { category: 'Premium',     supplierCost: 58, freight: 5.50, packaging: 2.00, avgSellingPrice: 170 },
];

// ── Mock products (seeded, deterministic) ───────────────────────────────────
const _rng42b = new SeededRNG(420);

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Essential White Tee',   sku: 'BAS-001', category: 'Basics',      price: 38,  revenue: Math.round(_rng42b.range(4200, 5800)),  units: Math.round(_rng42b.range(110, 150)), cogs: 0.26, adSpend: Math.round(_rng42b.range(300, 600))  },
  { id: 'p2', name: 'Slim Chino Pant',       sku: 'BOT-002', category: 'Bottoms',     price: 110, revenue: Math.round(_rng42b.range(6800, 9200)),  units: Math.round(_rng42b.range(62, 84)),   cogs: 0.29, adSpend: Math.round(_rng42b.range(600, 1100)) },
  { id: 'p3', name: 'Merino Wool Sweater',   sku: 'PRE-003', category: 'Premium',     price: 170, revenue: Math.round(_rng42b.range(3200, 4800)),  units: Math.round(_rng42b.range(19, 28)),   cogs: 0.38, adSpend: Math.round(_rng42b.range(800, 1400)) },
  { id: 'p4', name: 'Canvas Tote Bag',       sku: 'ACC-004', category: 'Accessories', price: 33,  revenue: Math.round(_rng42b.range(1800, 2600)),  units: Math.round(_rng42b.range(55, 79)),   cogs: 0.22, adSpend: Math.round(_rng42b.range(100, 250))  },
  { id: 'p5', name: 'Wool Overcoat',         sku: 'OUT-005', category: 'Outerwear',   price: 150, revenue: Math.round(_rng42b.range(5500, 7500)),  units: Math.round(_rng42b.range(37, 50)),   cogs: 0.37, adSpend: Math.round(_rng42b.range(700, 1200)) },
  { id: 'p6', name: 'Relaxed Linen Shirt',   sku: 'BAS-006', category: 'Basics',      price: 65,  revenue: Math.round(_rng42b.range(3100, 4400)),  units: Math.round(_rng42b.range(48, 68)),   cogs: 0.30, adSpend: Math.round(_rng42b.range(250, 500))  },
  { id: 'p7', name: 'Wide Leg Trousers',     sku: 'BOT-007', category: 'Bottoms',     price: 120, revenue: Math.round(_rng42b.range(4800, 6800)),  units: Math.round(_rng42b.range(40, 57)),   cogs: 0.32, adSpend: Math.round(_rng42b.range(500, 900))  },
];

// ── LTV cohorts (seeded, 6 months) ──────────────────────────────────────────
const _rng99 = new SeededRNG(99);

export const MOCK_LTV_COHORTS: LTVCohort[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
].map((month) => {
  const customers = Math.round(_rng99.range(180, 320));
  const ltv       = Math.round(_rng99.range(72, 148));
  const cac       = Math.round(_rng99.range(16, 32));
  const repeatRate = Math.round(_rng99.range(18, 38));
  return {
    month,
    ltv,
    cac,
    ltvCacRatio: Math.round((ltv / cac) * 10) / 10,
    repeatRate,
    orders: Math.round(customers * (repeatRate / 100 + 1) * _rng99.range(0.9, 1.1)),
    customers,
  };
});

// ── Mock experiments ─────────────────────────────────────────────────────────
export const MOCK_EXPERIMENTS: Experiment[] = [
  { id: 'e1', name: 'TikTok UGC vs. Studio',      channel: 'TikTok',  status: 'completed', testRev: 18420, controlRev: 13980, spend: 2200, startDate: '15 May', endDate: '29 May', lift: 31.8, confidence: 94, hypothesis: 'UGC content will outperform studio creative for Gen-Z audience.' },
  { id: 'e2', name: 'Meta Broad vs. Lookalike',   channel: 'Meta',    status: 'running',   testRev: 9200,  controlRev: 8640,  spend: 3100, startDate: '10 Jun', endDate: '24 Jun', lift: 6.5,  confidence: 71, hypothesis: 'Broad targeting will find cheaper conversions at scale.' },
  { id: 'e3', name: 'Email Subject Line A/B',      channel: 'Email',   status: 'completed', testRev: 4310,  controlRev: 3690,  spend: 0,    startDate: '1 Jun',  endDate: '7 Jun',  lift: 16.8, confidence: 88, hypothesis: 'Emoji in subject line increases open rates.' },
  { id: 'e4', name: 'Google Smart vs. Manual CPC', channel: 'Google',  status: 'planned',   testRev: 0,     controlRev: 0,     spend: 1800, startDate: 'Upcoming', endDate: '+14d', lift: 0,    confidence: 0,  hypothesis: 'Smart bidding will lower CPA on brand terms.' },
];
