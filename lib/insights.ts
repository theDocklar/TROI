/**
 * Deterministic rule engine for generating insights and alerts.
 * Pure functions — no side effects, no React imports.
 */

import type { Alert, Insight, PeriodResult } from '@/types';
import { computeTrend } from './metrics';

// ── Insights ──────────────────────────────────────────────────────────────────

/**
 * Generates a prioritised list of plain-English marketing insights.
 * Rules are evaluated in order; duplicates are prevented by topic tracking.
 */
export function generateInsights(
  current: PeriodResult,
  previous: PeriodResult,
): Insight[] {
  const insights: Insight[] = [];

  // 1. Overall ROI health
  if (current.trueROI > 30) {
    insights.push({ color: 'green', icon: 'TrendingUp', text: `Your blended ROI is ${current.trueROI.toFixed(1)}% — strong performance. Consider scaling your best campaigns.` });
  } else if (current.trueROI >= 10) {
    insights.push({ color: 'amber', icon: 'Activity', text: `Blended ROI is ${current.trueROI.toFixed(1)}% — decent but has room to grow. Review underperformers and reallocate budget.` });
  } else {
    insights.push({ color: 'red', icon: 'AlertTriangle', text: `Blended ROI is only ${current.trueROI.toFixed(1)}% — costs are eating into profits. Audit spend urgently.` });
  }

  // 2. Spend vs revenue change — waste risk
  const spendTrend   = computeTrend(current.totalSpend,   previous.totalSpend);
  const revTrend     = computeTrend(current.totalRevenue, previous.totalRevenue);
  if (spendTrend >= 15 && revTrend < 5) {
    insights.push({ color: 'red', icon: 'Flame', text: `Ad spend rose ${spendTrend.toFixed(0)}% while revenue stayed flat. You may be wasting budget — pause scale and investigate.` });
  }

  // 3. Best channel by total profit
  const channelProfits: Record<string, number> = {};
  for (const cm of current.campaigns) {
    channelProfits[cm.channel] = (channelProfits[cm.channel] ?? 0) + cm.profit;
  }
  const bestChannel = Object.entries(channelProfits).sort((a, b) => b[1] - a[1])[0];
  if (bestChannel) {
    insights.push({ color: 'green', icon: 'Star', text: `${bestChannel[0]} is your most profitable channel ($${bestChannel[1].toFixed(0)} profit). Prioritise budget here first.` });
  }

  // 4. Worst campaign — pause signal
  const sorted = [...current.campaigns].sort((a, b) => a.roi - b.roi);
  const worst = sorted[0];
  if (worst && worst.roi < 5) {
    insights.push({ color: 'red', icon: 'XCircle', text: `"${worst.name}" has a ${worst.roi.toFixed(1)}% ROI — below breakeven. Pause or rework this campaign immediately.` });
  }

  // 5. Best campaign — scale signal
  const best = sorted[sorted.length - 1];
  if (best && best.roi > 30) {
    insights.push({ color: 'green', icon: 'Rocket', text: `"${best.name}" is your top performer at ${best.roi.toFixed(1)}% ROI. Increase its daily budget by 20–30% this week.` });
  }

  // 6. Email channel efficiency (low spend, decent return)
  const emailCampaigns = current.campaigns.filter((c) => c.channel === 'Email');
  const emailROAS = emailCampaigns.reduce((s, c) => s + c.roas, 0) / (emailCampaigns.length || 1);
  if (emailROAS > 8) {
    insights.push({ color: 'green', icon: 'Mail', text: `Email delivers ${emailROAS.toFixed(1)}x ROAS at minimal cost — your highest-leverage channel for profit margin.` });
  }

  return insights;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

/**
 * Generates time-stamped alerts based on period-over-period changes and daily ROI.
 */
export function generateAlerts(
  current: PeriodResult,
  previous: PeriodResult,
  dailyROI: number[],
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  const fmt = (offsetMinutes: number): string => {
    const d = new Date(now.getTime() - offsetMinutes * 60 * 1000);
    return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  };

  // Alert 1: Overall ROI direction
  const roiTrend = computeTrend(current.trueROI, previous.trueROI);
  if (roiTrend < -10) {
    alerts.push({ id: 'a1', severity: 'red', text: `Blended ROI dropped ${Math.abs(roiTrend).toFixed(0)}% vs previous period. Immediate review needed.`, time: fmt(5) });
  } else if (roiTrend > 10) {
    alerts.push({ id: 'a1', severity: 'green', text: `Blended ROI improved ${roiTrend.toFixed(0)}% vs previous period. Keep current strategy.`, time: fmt(5) });
  }

  // Alert 2: Worst campaign
  const worstCampaign = [...current.campaigns].sort((a, b) => a.roi - b.roi)[0];
  if (worstCampaign && worstCampaign.roi < 5) {
    alerts.push({ id: 'a2', severity: 'red', text: `"${worstCampaign.name}" ROI is ${worstCampaign.roi.toFixed(1)}% — losing money. Pause immediately.`, time: fmt(12) });
  }

  // Alert 3: Spend efficiency
  const spendTrend = computeTrend(current.totalSpend, previous.totalSpend);
  const revTrend   = computeTrend(current.totalRevenue, previous.totalRevenue);
  if (spendTrend > 20 && revTrend < spendTrend / 2) {
    alerts.push({ id: 'a3', severity: 'amber', text: `Spend up ${spendTrend.toFixed(0)}% but revenue only up ${revTrend.toFixed(0)}%. Diminishing returns detected.`, time: fmt(30) });
  }

  // Alert 4: Recent ROI 3-day average vs overall
  const last3 = dailyROI.slice(-3).reduce((a, b) => a + b, 0) / 3;
  if (last3 < current.trueROI * 0.8) {
    alerts.push({ id: 'a4', severity: 'amber', text: `Last 3-day ROI (${last3.toFixed(1)}%) is trending below your period average. Momentum slowing.`, time: fmt(60) });
  } else if (last3 > current.trueROI * 1.2) {
    alerts.push({ id: 'a4', severity: 'green', text: `Last 3-day ROI (${last3.toFixed(1)}%) is above your period average. Good recent momentum.`, time: fmt(60) });
  }

  // Alert 5: Best performer
  const best = [...current.campaigns].sort((a, b) => b.roi - a.roi)[0];
  if (best && best.roi > 30) {
    alerts.push({ id: 'a5', severity: 'green', text: `"${best.name}" hit ${best.roi.toFixed(1)}% ROI — ready to scale. Increase budget 20%.`, time: fmt(120) });
  }

  return alerts;
}

// ── Notification text ─────────────────────────────────────────────────────────

/**
 * Generates a plain-English WhatsApp message summarising the period.
 */
export function generateNotificationText(
  current: PeriodResult,
  range: number,
): string {
  const best  = [...current.campaigns].sort((a, b) => b.roi - a.roi)[0];
  const worst = [...current.campaigns].sort((a, b) => a.roi - b.roi)[0];

  const fmtCurrency = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  const action =
    worst && worst.roi < 5
      ? `Pause "${worst.name}" immediately — it's losing money.`
      : best && best.roi > 30
      ? `Scale "${best.name}" — increase its budget 20%.`
      : `Review spend efficiency across all campaigns.`;

  return [
    `*Blank — ${range}-Day Marketing Report*`,
    ``,
    `Revenue: ${fmtCurrency(current.totalRevenue)}`,
    `Ad Spend: ${fmtCurrency(current.totalSpend)}`,
    `Net Profit: ${fmtCurrency(current.netProfit)}`,
    `True ROI: ${current.trueROI.toFixed(1)}%`,
    `Blended ROAS: ${current.blendedROAS.toFixed(2)}x`,
    ``,
    `Best: ${best?.name ?? 'N/A'} (${best?.roi.toFixed(1) ?? '0'}% ROI)`,
    `Worst: ${worst?.name ?? 'N/A'} (${worst?.roi.toFixed(1) ?? '0'}% ROI)`,
    ``,
    `Action: ${action}`,
  ].join('\n');
}
