# TROI Frontend — Project Specification

## Overview

**TROI** (ROI Intelligence) is a marketing profitability dashboard for the **Blank** Shopify clothing store. Its core purpose is to surface true marketing ROI — accounting for all costs (COGS, shipping, refunds, payment fees, and ad spend) — rather than the inflated ROAS figures reported by ad platforms.

**Design Goals:**
- Understand true profitability across 10 active advertising campaigns in under 30 seconds
- Pure, testable calculation engines with no side effects
- Deterministic mock data (seeded LCG, seed=42) for reproducible testing
- Business-metric correctness over UI polish

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), TypeScript |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix UI |
| Charts | Recharts 3 |
| Icons | lucide-react, @hugeicons/react |
| Data Fetching | SWR 2 (60s revalidation) |
| State | Zustand 5 |
| Notifications | Sonner, Twilio (WhatsApp) |
| Database (future) | Prisma 7 + PostgreSQL (schema defined, not yet migrated) |
| Testing | Vitest 4 |
| Node | 20+ |

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                 # Root layout: SWRProvider, Toaster, OnboardingGuard
│   ├── page.tsx                   # Dashboard: Overview / Products / LTV / Experiments tabs
│   ├── api/
│   │   ├── metrics/route.ts       # GET current & previous period metrics
│   │   ├── insights/route.ts      # GET insights & alerts
│   │   ├── settings/route.ts      # GET/PUT store settings
│   │   ├── notify/route.ts        # POST WhatsApp alerts (mock or real Twilio)
│   │   └── campaigns/route.ts     # GET campaign metrics sorted by ROI
│   ├── onboard/page.tsx           # 4-step onboarding wizard
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── shopify/callback/page.tsx  # Shopify OAuth redirect handler
│   ├── meta/callback/page.tsx     # Meta Ads OAuth redirect handler
│   └── google/callback/page.tsx  # Google Ads OAuth redirect handler
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── dashboard/                 # Feature components (see Dashboard Features)
│   ├── settings/SettingsPanel.tsx # P&L | Product Groups | Budgets
│   ├── notifications/             # NotificationCentre, WhatsAppPreview
│   ├── layout/                    # Sidebar, Topbar
│   └── providers/                 # SWRProvider, OnboardingGuard
├── hooks/
│   ├── useMetrics.ts              # /api/metrics with SWR
│   ├── useInsights.ts             # /api/insights with SWR
│   ├── useSettings.ts             # /api/settings GET/PUT + localStorage
│   └── useCampaigns.ts            # /api/campaigns with SWR
├── store/
│   ├── uiStore.ts                 # Zustand: range, viewMode, alerts, tabs, notifications
│   └── onboardStore.ts            # Zustand: onboarding step, persisted to localStorage
├── lib/
│   ├── metrics.ts                 # Pure calculation engine
│   ├── insights.ts                # Alert & insight rule engine
│   ├── mockData.ts                # Deterministic mock (seed=42)
│   ├── settingsStore.ts           # In-memory settings (Prisma replacement target)
│   ├── shopifyData.ts             # Merges mock + real platform data
│   ├── shopifyContext.ts          # localStorage reader for Shopify connection
│   ├── metaContext.ts             # localStorage reader for Meta connection
│   ├── googleContext.ts           # localStorage reader for Google connection
│   ├── api.ts                     # HTTP client for auth + platform APIs
│   ├── notify.ts                  # WhatsApp notification service
│   └── utils.ts                   # formatCurrency, formatPercent, formatROAS, cn()
├── types/index.ts                 # All shared TypeScript types
├── prisma/schema.prisma           # DB schema (Store, Campaign, DailySnapshot, StoreSettings, NotificationLog)
└── __tests__/metrics.test.ts      # Vitest unit tests
```

---

## API Routes

All GET routes accept query parameters: `range=7|30|90`, `shop=`, `meta=1`, `google=1`.
Protected routes require `Authorization: Bearer <token>`.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/metrics` | GET | `{ current, previous, range }` period aggregates |
| `/api/insights` | GET | `{ insights, alerts }` from rule engine |
| `/api/settings` | GET/PUT | Store cost settings (COGS, shipping, refund rate, payment fee) |
| `/api/notify` | POST | Send WhatsApp alert via Twilio (or mock) |
| `/api/campaigns` | GET | Campaign metrics sorted by ROI descending |

---

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Main dashboard (protected) |
| `/onboard` | 4-step wizard: Shopify → Channels → COGS → Confirm |
| `/signin` | Email/password login |
| `/signup` | User registration |
| `/forgot-password` | Password reset |
| `/shopify/callback` | Shopify OAuth callback |
| `/meta/callback` | Meta Ads OAuth callback |
| `/google/callback` | Google Ads OAuth callback |

---

## Business Logic

### Metric Formulas (`lib/metrics.ts`)

All functions are **pure** and **side-effect free**.

| Metric | Formula |
|--------|---------|
| Net Profit | `Revenue − COGS% − Shipping − Refunds% − PaymentFee% − AdSpend` |
| True ROI | `Net Profit / AdSpend × 100` |
| Blended ROAS | `Total Revenue / Total Spend` |
| Campaign ROAS | `Campaign Revenue / Campaign Spend` |
| Period Trend | `(Current − Previous) / Previous × 100` |

Key functions: `computePeriod()`, `computeTrend()`, `getDailyROI()`, `getSparkline()`.
All divide-by-zero cases return `0`.

### Insight & Alert Rules (`lib/insights.ts`)

**Insights** (color-coded recommendations):
1. Overall ROI health (green/amber/red)
2. Spend vs revenue trend (waste risk)
3. Best channel by profit
4. Worst campaign pause signal
5. Best campaign scale signal
6. Email channel efficiency

**Alerts** (time-stamped, dismissible):
1. Overall ROI direction change
2. Worst campaign performance
3. Spend efficiency ratio
4. 3-day ROI vs period average
5. Best performer scale signal

---

## State Management

### Zustand Stores

**`useUIStore`** — Client UI state:
- `range: 7 | 30 | 90` — active date range
- `viewMode: 'roi' | 'roas'`
- `dismissedAlerts: string[]`
- `settingsOpen: boolean`
- `activeTab: 'overview' | 'products' | 'ltv' | 'experiments'`
- `settingsTab: 'pl' | 'products' | 'budgets'`
- `notifications: Notification[]`

**`useOnboardStore`** — persisted to localStorage:
- `step: 1–4`
- `completed: boolean`
- `skipCogs: boolean`

### SWR Hooks

All refresh every **60 seconds**:
- `useMetrics(range)` — `/api/metrics`
- `useInsights(range)` — `/api/insights`
- `useSettings()` — `/api/settings` with optimistic PUT
- `useCampaigns(range)` — `/api/campaigns`

---

## Authentication

1. User signs in → backend returns JWT
2. JWT stored at `localStorage.troi_token`
3. `OnboardingGuard` validates token on every route:
   - Invalid → `/signin`
   - Valid + not onboarded → `/onboard`
   - Valid + onboarded → dashboard

**localStorage keys:**
- `troi_token`, `troi_authed`, `troi_user_email`, `troi_user_name`
- `troi_onboarded`, `troi_skip_cogs`
- `roi_settings`
- `troi_shopify_shop`, `troi_meta_account`, `troi_google_account`

---

## Data Flow

**Mock mode (default):** Seeded LCG (seed=42) generates 10 campaigns × 60 days. Reproducible for tests and demos.

**Real data mode:** When a platform is connected, `shopifyData.ts` merges real API data from the backend with mock data for unconnected channels.

Backend URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:5000`).

---

## Database Schema (Prisma — future)

```prisma
model Store          { id, shopifyDomain @unique, campaigns[], settings?, notifications[] }
model Campaign       { id, storeId, name, channel, snapshots[] }
model DailySnapshot  { campaignId, date, spend, revenue, orders — @@unique([campaignId, date]) }
model StoreSettings  { storeId @unique, cogs, shippingPerOrder, refundRate, paymentFee }
model NotificationLog{ storeId, body, sentAt, status }
```

**To activate:** add `DATABASE_URL` to `.env.local`, run `npx prisma migrate dev --name init`, replace `lib/settingsStore.ts` with Prisma queries.

---

## Dashboard Features

### Overview Tab
- **Summary Cards** — Revenue, Spend, ROI, ROAS, Profit with trends & sparklines
- **Marketing Direction** — Spend vs Revenue change analysis
- **Alerts Panel** — Dismissible, time-stamped recommendations
- **Attribution Breakdown** — First / Last / Linear touch models
- **ROI Trend Chart** — Daily line chart
- **Campaign Table** — All campaigns with per-campaign drill-down modal
- **WhatsApp Preview** — Sample alert message

### Products P&L Tab
- Product-level table: Revenue, Units, COGS, Ad Spend
- Product modal: waterfall chart, metrics grid, channel attribution, break-even ROAS

### LTV Tab
- 6-month cohort bar chart (toggle: LTV / CAC / Ratio / Repeat Rate)
- Weighted averages summary

### Experiments Tab
- A/B experiment creator (slide-in sheet)
- Experiment table with status badges and live lift projections

### Settings Panel (slide-out)
- **P&L Settings** — COGS %, Shipping/order, Refund rate, Payment fee
- **Product Groups** — Per-category COGS, benchmark defaults
- **Channel Budgets** — Monthly allocation for Meta / Google / TikTok / Email

---

## Testing

**Framework:** Vitest 4

**File:** `__tests__/metrics.test.ts`

**Coverage:**
- `computePeriod()` — field presence, totals, formulas
- `computeTrend()` — percentage change
- `generateInsights()` / `generateAlerts()` — rule engine
- Divide-by-zero guards
- Mock data determinism

```bash
npm test
```

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:5000

# Optional — Twilio WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Optional — Database
DATABASE_URL=postgresql://user:password@localhost:5432/troi
```

---

## Scripts

```bash
npm run dev     # Dev server at http://localhost:3000
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
npm test        # Vitest suite
```

---

## Key Design Patterns

- **Pure functions** for all metrics and insights — no side effects
- **Deterministic mock data** — seeded LCG for reproducible test/demo runs
- **SWR + Zustand** — server data vs UI state cleanly separated
- **localStorage** for auth tokens, onboarding state, and settings persistence
- **`lib/api.ts`** centralises all HTTP calls to the backend
- **Context helpers** (`shopifyContext`, `metaContext`, `googleContext`) for SSR-safe localStorage reads
