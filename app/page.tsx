/**
 * Dashboard shell — composes all sections in a sidebar + main layout.
 * Four tabs: Overview | Products | LTV | Experiments
 */

'use client';

import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import SummaryCards from '@/components/dashboard/SummaryCards';
import MarketingDirection from '@/components/dashboard/MarketingDirection';
import ROITrendChart from '@/components/dashboard/ROITrendChart';
import CampaignTable from '@/components/dashboard/CampaignTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import WhatsAppPreview from '@/components/notifications/WhatsAppPreview';
import SettingsPanel from '@/components/settings/SettingsPanel';
import AttributionBreakdown from '@/components/dashboard/AttributionBreakdown';
import CogsWarning from '@/components/dashboard/CogsWarning';
import ProductPL from '@/components/dashboard/ProductPL';
import LTVTrackerV2 from '@/components/dashboard/LTVTrackerV2';
import ExperimentsPanel from '@/components/dashboard/ExperimentsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/store/uiStore';

/** Main dashboard page. */
export default function DashboardPage(): React.JSX.Element {
  const { activeTab, setActiveTab } = useUIStore();

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Global COGS warning — appears across all tabs if COGS is unconfigured */}
          <CogsWarning />

          {/* KPI Cards */}
          <SummaryCards />

          {/* Dashboard tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products P&amp;L</TabsTrigger>
              <TabsTrigger value="ltv">LTV</TabsTrigger>
              <TabsTrigger value="experiments">Experiments</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Marketing Direction + Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MarketingDirection />
                </div>
                <div>
                  <AlertsPanel />
                </div>
              </div>

              {/* Attribution breakdown */}
              <AttributionBreakdown />

              {/* ROI Trend Chart */}
              <ROITrendChart />

              {/* Campaign Table */}
              <CampaignTable />

              {/* WhatsApp Notification Preview */}
              <WhatsAppPreview />
            </TabsContent>

            {/* Products P&L tab */}
            <TabsContent value="products" className="mt-6">
              <ProductPL />
            </TabsContent>

            {/* LTV tab */}
            <TabsContent value="ltv" className="space-y-6 mt-6">
              <CogsWarning />
              <LTVTrackerV2 />
            </TabsContent>

            {/* Experiments tab */}
            <TabsContent value="experiments" className="mt-6">
              <ExperimentsPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Settings slide-in panel */}
      <SettingsPanel />
    </div>
  );
}
