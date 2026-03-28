# Changelog

All notable changes to the TROI frontend will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.1.0] - 2026-03-28

### Added

- Initial dashboard with Overview, Products P&L, LTV, and Experiments tabs
- 4-step onboarding wizard (Shopify confirmation → Connect channels → COGS setup → Confirm costs)
- Auth flow: register, sign in, forgot password, JWT stored in `localStorage["troi_token"]`
- OnboardingGuard provider — redirects unauthenticated users on every route render
- Shopify, Meta, and Google Ads OAuth callback pages
- True ROI calculation engine (`lib/metrics.ts`): `computePeriod`, `computeTrend`, `getDailyROI`
- Insight and alert rule engine (`lib/insights.ts`): `generateInsights`, `generateAlerts`
- Deterministic mock data (`lib/mockData.ts`) using seeded LCG (seeds: 42, 88, 420, 99)
- Platform context modules: `lib/shopifyContext.ts`, `lib/metaContext.ts`, `lib/googleContext.ts`
- `lib/shopifyData.ts` — merges real Shopify orders with mock fallback
- Zustand UI store (`store/uiStore.ts`): active tab, settings tab, notifications, settings open state
- Zustand onboarding store (`store/onboardStore.ts`): step, completed, skipCogs — persisted to localStorage
- SWR data hooks: `useMetrics`, `useInsights`, `useSettings`, `useCampaigns` (60s revalidation)
- API routes: `/api/metrics`, `/api/insights`, `/api/campaigns`, `/api/settings`, `/api/notify`
- SummaryCards, ROITrendChart (Recharts), CampaignTable, AlertsPanel dashboard components
- MarketingDirection and AttributionBreakdown components (3 attribution models: first/last/linear)
- ProductPL table and ProductModal drill-down sheet (P&L waterfall, channel attribution, recommendation)
- LTVTrackerV2: animated bar chart for 4 LTV metrics across 6 cohort months
- ExperimentsPanel and ExperimentCreator: A/B experiment table + slide-in creator with live projections
- CogsWarning banner shown when COGS is at default and was skipped during onboarding
- NotificationCentre popover in Topbar; WhatsAppPreview component
- WhatsApp notification support via Twilio (`lib/notify.ts`), mock by default
- SettingsPanel with 3 tabs: P&L settings, Product groups (per-category COGS), Channel budgets
- Prisma schema for PostgreSQL (`prisma/schema.prisma`) — defined, not yet migrated
- Vitest test suite (`__tests__/metrics.test.ts`) covering deterministic metric and insight behaviour
- shadcn/ui components: popover, tabs, toggle-group, slider, textarea, alert, toggle
- `docs/` folder: `architecture.md`, `changelog.md`, `context.md`
