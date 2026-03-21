/** Core type definitions for ROI Intelligence */

export type Channel = 'Meta' | 'Google' | 'TikTok' | 'Email';

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  dailySpend: number[];   // 60 days
  dailyRevenue: number[]; // 60 days
}

export interface StoreSettings {
  cogs: number;             // fraction e.g. 0.38
  shippingPerOrder: number; // dollars e.g. 5.50
  refundRate: number;       // fraction e.g. 0.028
  paymentFee: number;       // fraction e.g. 0.029
}

export interface CampaignMetrics extends Campaign {
  spend: number;
  revenue: number;
  orders: number;
  profit: number;
  roi: number;
  roas: number;
}

export interface PeriodResult {
  totalRevenue: number;
  totalSpend: number;
  netProfit: number;
  blendedROAS: number;
  trueROI: number;
  totalOrders: number;
  campaigns: CampaignMetrics[];
}

export type InsightColor = 'green' | 'amber' | 'red';

export interface Insight {
  color: InsightColor;
  text: string;
  icon: string;
}

export interface Alert {
  id: string;
  severity: InsightColor;
  text: string;
  time: string;
}

export interface NotificationPayload {
  to: string;
  body: string;
  store: string;
  timestamp: string;
}

export type RangeDays = 7 | 30 | 90;
export type ViewMode = 'roi' | 'roas';

export type OnboardStep = 1 | 2 | 3 | 4;

export type NotificationSeverity = 'success' | 'warning' | 'danger' | 'info';

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  severity: NotificationSeverity;
  read: boolean;
}

export interface ProductGroup {
  category: string;
  supplierCost: number;
  freight: number;
  packaging: number;
  avgSellingPrice: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  units: number;
  cogs: number;        // fraction e.g. 0.38
  adSpend: number;
  price: number;
}

export interface Experiment {
  id: string;
  name: string;
  channel: Channel;
  status: 'running' | 'completed' | 'planned';
  testRev: number;
  controlRev: number;
  spend: number;
  startDate: string;
  endDate: string;
  lift: number;
  confidence: number;
  hypothesis?: string;
}

export interface LTVCohort {
  month: string;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  repeatRate: number;
  orders: number;
  customers: number;
}
