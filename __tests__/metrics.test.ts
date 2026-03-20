import { describe, it, expect } from 'vitest';
import { computePeriod, computeTrend, getDailyROI, getSparkline } from '../lib/metrics';
import { generateInsights, generateNotificationText, generateAlerts } from '../lib/insights';
import { MOCK_CAMPAIGNS, MOCK_DAILY_ORDERS, MOCK_DAILY_REFUNDS } from '../lib/mockData';
import type { Campaign, PeriodResult, StoreSettings } from '../types';

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
