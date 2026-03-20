/**
 * Pure calculation engine — no React imports, no side effects.
 * All functions are deterministic given the same inputs.
 */

import type {
  Campaign,
  CampaignMetrics,
  PeriodResult,
  RangeDays,
  StoreSettings,
} from '@/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Safe division — returns 0 when denominator is 0. */
function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Sums a sub-array slice [start, end) */
function sumSlice(arr: number[], start: number, end: number): number {
  return arr.slice(start, end).reduce((a, b) => a + b, 0);
}

// ── Core period computation ──────────────────────────────────────────────────

/**
 * Computes aggregated metrics for a date range ending on the last day of the
 * provided arrays. `range` is the number of days to include.
 */
export function computePeriod(
  campaigns: Campaign[],
  dailyOrders: number[],
  _dailyRefunds: number[],  // reserved for future use
  range: RangeDays,
  settings: StoreSettings,
): PeriodResult {
  const totalDays = campaigns[0]?.dailySpend.length ?? 60;
  const end = totalDays;
  const start = Math.max(0, end - range);

  // Period orders (store-level)
  const periodOrders = dailyOrders.slice(start, end).reduce((a, b) => a + b, 0);

  // Campaign-level metrics
  const campaignMetrics: CampaignMetrics[] = campaigns.map((c) => {
    const spend = sumSlice(c.dailySpend, start, end);
    const revenue = sumSlice(c.dailyRevenue, start, end);

    // Distribute store orders proportionally by revenue share
    const totalRevForPeriod = campaigns.reduce(
      (s, cc) => s + sumSlice(cc.dailyRevenue, start, end),
      0,
    );
    const revenueShare = safeDivide(revenue, totalRevForPeriod);
    const orders = periodOrders * revenueShare;

    // Profit formula:
    // Rev - COGS(%) - Shipping(per order) - Refund(%) - Payment fee(%) - Spend
    const cogs        = revenue * settings.cogs;
    const shipping    = orders  * settings.shippingPerOrder;
    const refundCost  = revenue * settings.refundRate;
    const paymentFee  = revenue * settings.paymentFee;
    const profit      = revenue - cogs - shipping - refundCost - paymentFee - spend;

    const roi  = safeDivide(profit, spend) * 100;
    const roas = safeDivide(revenue, spend);

    return { ...c, spend, revenue, orders, profit, roi, roas };
  });

  // Roll up totals
  const totalRevenue = campaignMetrics.reduce((s, m) => s + m.revenue, 0);
  const totalSpend   = campaignMetrics.reduce((s, m) => s + m.spend, 0);
  const netProfit    = campaignMetrics.reduce((s, m) => s + m.profit, 0);
  const blendedROAS  = safeDivide(totalRevenue, totalSpend);
  const trueROI      = safeDivide(netProfit, totalSpend) * 100;
  const totalOrders  = periodOrders;

  return { totalRevenue, totalSpend, netProfit, blendedROAS, trueROI, totalOrders, campaigns: campaignMetrics };
}

// ── Trend ────────────────────────────────────────────────────────────────────

/**
 * Percentage change from previous to current.
 * Returns 0 when previous is 0 (divide-by-zero guard).
 */
export function computeTrend(current: number, previous: number): number {
  return safeDivide(current - previous, Math.abs(previous)) * 100;
}

// ── Daily ROI series ─────────────────────────────────────────────────────────

/**
 * Returns one blended-ROI value per day for the last `range` days.
 * Useful for the trend chart.
 */
export function getDailyROI(
  campaigns: Campaign[],
  dailyOrders: number[],
  range: RangeDays,
  settings: StoreSettings,
): number[] {
  const totalDays = campaigns[0]?.dailySpend.length ?? 60;
  const end = totalDays;
  const start = Math.max(0, end - range);

  return Array.from({ length: end - start }, (_, i) => {
    const day = start + i;
    const dayRevenue = campaigns.reduce((s, c) => s + c.dailyRevenue[day], 0);
    const daySpend   = campaigns.reduce((s, c) => s + c.dailySpend[day], 0);
    const dayOrders  = dailyOrders[day] ?? 0;

    const cogs       = dayRevenue * settings.cogs;
    const shipping   = dayOrders  * settings.shippingPerOrder;
    const refund     = dayRevenue * settings.refundRate;
    const fee        = dayRevenue * settings.paymentFee;
    const profit     = dayRevenue - cogs - shipping - refund - fee - daySpend;

    return safeDivide(profit, daySpend) * 100;
  });
}

// ── Sparkline ────────────────────────────────────────────────────────────────

/** Returns the last 14 values from a daily array. */
export function getSparkline(dailyValues: number[], _range: RangeDays): number[] {
  return dailyValues.slice(-14);
}
