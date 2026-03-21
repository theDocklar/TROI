import { describe, it, expect } from 'vitest';
import { computePeriod, computeTrend, getDailyROI, getSparkline } from '../lib/metrics';
import { generateInsights, generateNotificationText, generateAlerts } from '../lib/insights';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, PRODUCT_GROUP_DEFAULTS } from '../lib/mockData';
import type { Campaign, PeriodResult, StoreSettings, ProductGroup } from '../types';

const DEFAULT_SETTINGS: StoreSettings = {
  cogs: 0.38,
  shippingPerOrder: 5.50,
  refundRate: 0.028,
  paymentFee: 0.029,
};

// ── computePeriod ─────────────────────────────────────────────────────────────

describe('computePeriod', () => {
  it('returns a PeriodResult with all expected fields', () => {
    const result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    expect(result).toHaveProperty('totalRevenue');
    expect(result).toHaveProperty('totalSpend');
    expect(result).toHaveProperty('netProfit');
    expect(result).toHaveProperty('blendedROAS');
    expect(result).toHaveProperty('trueROI');
    expect(result).toHaveProperty('totalOrders');
    expect(result.campaigns).toHaveLength(MOCK_CAMPAIGNS.length);
  });

  it('totalRevenue equals sum of campaign revenues', () => {
    const result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const sumRev = result.campaigns.reduce((s, c) => s + c.revenue, 0);
    expect(result.totalRevenue).toBeCloseTo(sumRev, 4);
  });

  it('blendedROAS equals totalRevenue / totalSpend', () => {
    const result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const expectedROAS = result.totalRevenue / result.totalSpend;
    expect(result.blendedROAS).toBeCloseTo(expectedROAS, 4);
  });

  it('netProfit is less than totalRevenue (costs exist)', () => {
    const result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    expect(result.netProfit).toBeLessThan(result.totalRevenue);
  });

  it('campaign profit = revenue - COGS - shipping - refunds - fee - spend', () => {
    const result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const cm = result.campaigns[0];
    const expected =
      cm.revenue
      - cm.revenue * DEFAULT_SETTINGS.cogs
      - cm.orders * DEFAULT_SETTINGS.shippingPerOrder
      - cm.revenue * DEFAULT_SETTINGS.refundRate
      - cm.revenue * DEFAULT_SETTINGS.paymentFee
      - cm.spend;
    expect(cm.profit).toBeCloseTo(expected, 2);
  });

  it('trueROI = (netProfit / totalSpend) * 100', () => {
    const result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const expected = (result.netProfit / result.totalSpend) * 100;
    expect(result.trueROI).toBeCloseTo(expected, 4);
  });
});

// ── divide-by-zero guard ──────────────────────────────────────────────────────

describe('computePeriod divide-by-zero guard', () => {
  it('returns 0 for ROI/ROAS when spend is zero', () => {
    const zeroCampaigns: Campaign[] = MOCK_CAMPAIGNS.map((c) => ({
      ...c,
      dailySpend: c.dailySpend.map(() => 0),
    }));
    const result = computePeriod(zeroCampaigns, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    expect(result.blendedROAS).toBe(0);
    expect(result.trueROI).toBe(0);
    result.campaigns.forEach((cm) => {
      expect(cm.roi).toBe(0);
      expect(cm.roas).toBe(0);
    });
  });
});

// ── computeTrend ──────────────────────────────────────────────────────────────

describe('computeTrend', () => {
  it('computeTrend(100, 80) === 25', () => {
    expect(computeTrend(100, 80)).toBeCloseTo(25, 5);
  });

  it('returns 0 when previous is 0', () => {
    expect(computeTrend(50, 0)).toBe(0);
  });

  it('returns negative for a decline', () => {
    expect(computeTrend(80, 100)).toBeCloseTo(-20, 5);
  });

  it('returns 0 for no change', () => {
    expect(computeTrend(100, 100)).toBe(0);
  });
});

// ── getDailyROI ───────────────────────────────────────────────────────────────

describe('getDailyROI', () => {
  it('returns array of length equal to range', () => {
    const roi = getDailyROI(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, 30, DEFAULT_SETTINGS);
    expect(roi).toHaveLength(30);
  });

  it('all values are finite numbers', () => {
    const roi = getDailyROI(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, 7, DEFAULT_SETTINGS);
    roi.forEach((v) => expect(isFinite(v)).toBe(true));
  });
});

// ── getSparkline ──────────────────────────────────────────────────────────────

describe('getSparkline', () => {
  it('returns the last 14 values', () => {
    const data = Array.from({ length: 60 }, (_, i) => i);
    const spark = getSparkline(data, 30);
    expect(spark).toHaveLength(14);
    expect(spark[spark.length - 1]).toBe(59);
    expect(spark[0]).toBe(46);
  });
});

// ── generateInsights ──────────────────────────────────────────────────────────

describe('generateInsights', () => {
  it('returns at least 3 insights for valid input', () => {
    const current = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const shiftedCampaigns = MOCK_CAMPAIGNS.map((c) => ({
      ...c,
      dailySpend:   c.dailySpend.slice(0, -30),
      dailyRevenue: c.dailyRevenue.slice(0, -30),
    }));
    const previous = computePeriod(shiftedCampaigns, MOCK_DAILY_ORDERS.slice(0, -30), MOCK_DAILY_REFUNDS.slice(0, -30), 30, DEFAULT_SETTINGS);
    const insights = generateInsights(current, previous);
    expect(insights.length).toBeGreaterThanOrEqual(3);
  });

  it('each insight has color, text, and icon', () => {
    const current = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const previous = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    generateInsights(current, previous).forEach((ins) => {
      expect(['green', 'amber', 'red']).toContain(ins.color);
      expect(ins.text.length).toBeGreaterThan(10);
      expect(ins.icon).toBeTruthy();
    });
  });
});

// ── generateNotificationText ──────────────────────────────────────────────────

describe('generateNotificationText', () => {
  let result: PeriodResult;

  it('contains revenue', () => {
    result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const text = generateNotificationText(result, 30);
    expect(text).toMatch(/Revenue/i);
  });

  it('contains ROI', () => {
    result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const text = generateNotificationText(result, 30);
    expect(text).toMatch(/ROI/i);
  });

  it('contains a campaign name', () => {
    result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const text = generateNotificationText(result, 30);
    const hasCampaign = MOCK_CAMPAIGNS.some((c) => text.includes(c.name));
    expect(hasCampaign).toBe(true);
  });

  it('contains spend and profit', () => {
    result = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const text = generateNotificationText(result, 30);
    expect(text).toMatch(/Spend/i);
    expect(text).toMatch(/Profit/i);
  });
});

// ── generateAlerts ────────────────────────────────────────────────────────────

describe('generateAlerts', () => {
  it('returns an array (may be empty for neutral data)', () => {
    const current = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const previous = computePeriod(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS, 30, DEFAULT_SETTINGS);
    const dailyROI = getDailyROI(MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, 30, DEFAULT_SETTINGS);
    const alerts = generateAlerts(current, previous, dailyROI);
    expect(Array.isArray(alerts)).toBe(true);
  });
});

// ── Break-even ROAS ───────────────────────────────────────────────────────────

describe('break-even ROAS', () => {
  function calcBreakEvenROAS(
    price: number,
    cogsFraction: number,
    shippingPerOrder: number,
    refundRate: number,
    paymentFee: number,
  ): number {
    const denominator =
      price
      - price * cogsFraction
      - shippingPerOrder
      - price * refundRate
      - price * paymentFee;
    return denominator > 0 ? price / denominator : 0;
  }

  it('returns correct ROAS for a profitable product', () => {
    const roas = calcBreakEvenROAS(100, 0.38, 5.50, 0.028, 0.029);
    // denominator = 100 - 38 - 5.50 - 2.80 - 2.90 = 50.80
    expect(roas).toBeCloseTo(100 / 50.80, 3);
  });

  it('returns higher ROAS when COGS is higher (harder to break even)', () => {
    const roasLow  = calcBreakEvenROAS(100, 0.30, 5.50, 0.028, 0.029);
    const roasHigh = calcBreakEvenROAS(100, 0.55, 5.50, 0.028, 0.029);
    expect(roasHigh).toBeGreaterThan(roasLow);
  });

  it('returns 0 when costs exceed price (not viable)', () => {
    const roas = calcBreakEvenROAS(10, 0.90, 5.50, 0.028, 0.029);
    expect(roas).toBe(0);
  });

  it('ROAS always >= 1 for viable products', () => {
    const roas = calcBreakEvenROAS(150, 0.38, 5.50, 0.028, 0.029);
    expect(roas).toBeGreaterThanOrEqual(1);
  });
});

// ── Blended COGS from product groups ─────────────────────────────────────────

describe('blended COGS from product groups', () => {
  function blendedCogs(groups: ProductGroup[]): number {
    const totalRev = groups.reduce((s, g) => s + g.avgSellingPrice, 0);
    if (totalRev === 0) return 0;
    const totalCost = groups.reduce((s, g) => s + g.supplierCost + g.freight + g.packaging, 0);
    return totalCost / totalRev;
  }

  it('returns a value between 0 and 1', () => {
    const blended = blendedCogs(PRODUCT_GROUP_DEFAULTS);
    expect(blended).toBeGreaterThan(0);
    expect(blended).toBeLessThan(1);
  });

  it('defaults are in a realistic 18–60% range', () => {
    const pct = blendedCogs(PRODUCT_GROUP_DEFAULTS) * 100;
    expect(pct).toBeGreaterThan(18);
    expect(pct).toBeLessThan(60);
  });

  it('returns 0 when selling prices are all 0', () => {
    const zeroGroups = PRODUCT_GROUP_DEFAULTS.map((g) => ({ ...g, avgSellingPrice: 0 }));
    expect(blendedCogs(zeroGroups)).toBe(0);
  });

  it('single group returns cogsPct for that group', () => {
    const single: ProductGroup[] = [{ category: 'Test', supplierCost: 20, freight: 2, packaging: 1, avgSellingPrice: 100 }];
    expect(blendedCogs(single)).toBeCloseTo(0.23, 5);
  });
});

// ── Attribution weight calculations ──────────────────────────────────────────

describe('attribution weight calculations', () => {
  const ATTR_WEIGHTS = {
    first:  { Meta: 0.60, Google: 0.15, TikTok: 0.20, Email: 0.05 },
    last:   { Meta: 0.25, Google: 0.20, TikTok: 0.45, Email: 0.10 },
    linear: { Meta: 0.25, Google: 0.25, TikTok: 0.25, Email: 0.25 },
  };

  for (const [model, weights] of Object.entries(ATTR_WEIGHTS)) {
    it(`${model} model sums to 1.0`, () => {
      const total = Object.values(weights).reduce((s, v) => s + v, 0);
      expect(total).toBeCloseTo(1.0, 10);
    });

    it(`${model} model — all weights are between 0 and 1`, () => {
      Object.values(weights).forEach((w) => {
        expect(w).toBeGreaterThanOrEqual(0);
        expect(w).toBeLessThanOrEqual(1);
      });
    });
  }

  it('linear model has equal weights for all 4 channels', () => {
    const weights = Object.values(ATTR_WEIGHTS.linear);
    const first = weights[0];
    weights.forEach((w) => expect(w).toBeCloseTo(first, 10));
  });
});
