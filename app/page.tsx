/**
 * Dashboard shell — composes all sections in a sidebar + main layout.
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

/** Main dashboard page — the single screen of the ROI Intelligence app. */
export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* KPI Cards */}
          <SummaryCards />

          {/* Marketing Direction + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MarketingDirection />
            </div>
            <div>
              <AlertsPanel />
            </div>
          </div>

          {/* ROI Trend Chart */}
          <ROITrendChart />

          {/* Campaign Table */}
          <CampaignTable />

          {/* WhatsApp Notification Preview */}
          <WhatsAppPreview />
        </main>
      </div>

      {/* Settings slide-in panel */}
      <SettingsPanel />
    </div>
  );
}
