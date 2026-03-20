# ROI Intelligence — Blank

A production-quality marketing profitability dashboard for the **Blank** Shopify clothing store.
Understand true marketing ROI across 10 active campaigns in under 30 seconds.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest unit tests
```

> **Node requirement:** Node.js 20+

---

## Metric Definitions

| Metric | Formula | Why it matters |
|---|---|---|
| **ROAS** | Revenue ÷ Ad Spend | Platform-reported. Ignores all costs. |
| **True ROI** | `(Revenue − COGS − Shipping − Refunds − Payment Fee − Ad Spend) / Ad Spend × 100` | Actual profitability after every cost. |
| **Net Profit** | Revenue − COGS − Shipping − Refunds − Payment Fee − Ad Spend | Real take-home dollar amount. |
| **Blended ROAS** | Total Revenue ÷ Total Spend (all campaigns) | High-level efficiency signal. |

### Why ROAS ≠ ROI

A 4× ROAS sounds great. But if your COGS is 38%, shipping is $5.50/order, you refund 2.8%, and Shopify takes 2.9%, your real profit margin could be close to zero — or negative. True ROI accounts for all of those costs before measuring performance.

---

## Store Settings

| Setting | Default | Description |
|---|---|---|
| COGS % | 38% | Cost of goods as a % of revenue |
| Shipping per order | $5.50 | Average fulfilment cost per shipped order |
| Refund Rate | 2.8% | % of revenue lost to returns |
| Payment Fee | 2.9% | Shopify Payments / Stripe fee |

Settings persist to `localStorage` and are applied to all calculations immediately on save.

---

## How to Wire Real Twilio

1. Copy `.env.example` to `.env.local` and fill in your credentials.
2. Install Twilio: `npm install twilio`
3. In `app/api/notify/route.ts`, replace the `console.log` block with:

```ts
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await client.messages.create({
  from: process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
  to:   payload.to,
  body: payload.body,
});
```

4. Ensure your Twilio number is enabled for WhatsApp in the Twilio Console.

---

## How to Swap Mock Data for Prisma

1. Add `DATABASE_URL` to `.env.local`.
2. Run `npx prisma migrate dev --name init` (schema is at `prisma/schema.prisma`).
3. Replace `MOCK_CAMPAIGNS` imports in API routes with Prisma queries:

```ts
// Before (mock)
import { MOCK_CAMPAIGNS } from '@/lib/mockData';

// After (Prisma)
import { prisma } from '@/lib/prisma';
const dbCampaigns = await prisma.campaign.findMany({
  where: { storeId: 'your-store-id' },
  include: { snapshots: { orderBy: { date: 'asc' } } },
});
// Map snapshots to Campaign.dailySpend / dailyRevenue arrays
```

4. Replace `getSettings()` calls with:

```ts
const settings = await prisma.storeSettings.findUnique({ where: { storeId } });
```

5. Replace the in-memory `NotificationLog` with:

```ts
await prisma.notificationLog.create({ data: { storeId, body: payload.body, status: 'queued' } });
```

---

## Architecture

```
roi-intelligence/
├── types/             # Shared TypeScript types
├── lib/
│   ├── mockData.ts    # Seeded deterministic mock data (seed=42)
│   ├── metrics.ts     # Pure calculation engine
│   ├── insights.ts    # Rule engine + notification text
│   ├── notify.ts      # WhatsApp alert service
│   ├── settingsStore.ts # In-memory settings (swap for Prisma)
│   └── utils.ts       # cn(), formatCurrency(), etc.
├── hooks/             # SWR data hooks
├── store/             # Zustand UI state
├── app/
│   ├── api/           # Next.js route handlers
│   └── page.tsx       # Dashboard shell
├── components/
│   ├── dashboard/     # KPI cards, chart, table, alerts
│   ├── layout/        # Sidebar, Topbar
│   ├── settings/      # SettingsPanel
│   └── notifications/ # WhatsAppPreview
├── prisma/schema.prisma # Future-ready DB schema
└── __tests__/         # Vitest unit tests
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** lucide-react
- **Charts:** Recharts
- **Data fetching:** SWR (60s revalidation)
- **State:** Zustand
- **DB schema:** Prisma (no migrations yet)
- **Notifications:** Simulated Twilio / WhatsApp
- **Tests:** Vitest
