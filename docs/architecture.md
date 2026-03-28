# TROI Frontend Architecture

## System Overview

```
Browser
  │
  ├── app/layout.tsx           (root layout, OnboardingGuard, SWRProvider)
  ├── app/page.tsx             (dashboard — 4 tabs)
  ├── app/onboard/             (4-step onboarding wizard)
  ├── app/signin|signup/       (auth pages)
  └── app/shopify|meta|google/ (OAuth callback pages)
        │
        ▼
  API Routes (app/api/)
  ├── metrics/route.ts   → lib/metrics.ts
  ├── insights/route.ts  → lib/insights.ts
  ├── campaigns/route.ts → lib/mockData.ts (or real backend)
  ├── settings/route.ts  → lib/settingsStore.ts
  └── notify/route.ts    → lib/notify.ts → Twilio (WhatsApp)
        │
        ▼
  External / Future
  ├── Shopify API
  ├── Meta Ads API
  ├── Google Ads API
  └── PostgreSQL (Prisma — schema defined, not yet migrated)
```

---

## Layer Separation

| Layer | Location | Rules |
|---|---|---|
| Pure business logic | `lib/metrics.ts`, `lib/insights.ts` | No React, no side effects, fully testable |
| Mock / seed data | `lib/mockData.ts` | Deterministic seeded LCG — never non-deterministic |
| Platform data merging | `lib/shopifyData.ts`, `lib/shopifyContext.ts`, `lib/metaContext.ts`, `lib/googleContext.ts` | Merges real + mock; real takes precedence when platform is connected |
| Server-side transient state | `lib/settingsStore.ts` | In-memory map; will be replaced by Prisma |
| API routes | `app/api/*/route.ts` | Input validation, typed JSON responses, no business logic |
| Data hooks | `hooks/useMetrics.ts`, `useInsights.ts`, `useSettings.ts`, `useCampaigns.ts` | SWR wrappers; 60s revalidation on dashboard data |
| UI state | `store/uiStore.ts`, `store/onboardStore.ts` | Zustand; UI-only concerns (active tab, notifications, onboarding step) |
| Components | `components/dashboard/`, `components/settings/`, `components/notifications/`, `components/layout/` | Presentational; consume hooks and stores |

---

## Data Flow

### Mock Mode (default — no platform connected)

```
lib/mockData.ts (seeded LCG)
  └── lib/shopifyData.ts (mergeShopifyOrders — returns mock orders)
        └── app/api/metrics/route.ts
              └── lib/metrics.ts (computePeriod, computeTrend, getDailyROI)
                    └── hooks/useMetrics.ts (SWR, 60s)
                          └── Dashboard components
```

Campaigns, LTV cohorts, experiments, and notifications are also fully seeded.

### Real Data Mode (platform connected)

```
Shopify / Meta / Google APIs
  └── lib/shopifyContext.ts / metaContext.ts / googleContext.ts
        └── lib/shopifyData.ts (mergeShopifyOrders — real orders take priority)
              └── (same pipeline as above)
```

The switch between mock and real is transparent to API routes and components — `shopifyData.ts` handles the merge.

---

## Auth Flow

```
User registers / signs in
  └── app/api/auth (external backend — JWT issued)
        └── JWT stored in localStorage["troi_token"]
              └── components/providers/OnboardingGuard.tsx
                    - Runs on every route render
                    - Validates token presence
                    - Redirects unauthenticated users to /onboard
                    - Redirects unauthenticated API calls
```

Token key: `troi_token`
Onboarding complete key: `troi_onboarded` (`"true"`)
COGS skip key: `troi_skip_cogs` (`"true"`)

---

## State Management

Two distinct layers — deliberately kept separate:

### SWR (server / async state)

| Hook | Endpoint | Revalidation |
|---|---|---|
| `useMetrics` | `/api/metrics` | 60s |
| `useInsights` | `/api/insights` | 60s |
| `useCampaigns` | `/api/campaigns` | 60s |
| `useSettings` | `/api/settings` (+ localStorage `roi_settings`) | on demand |

### Zustand (client / UI state)

| Store | File | Persisted? | Contents |
|---|---|---|---|
| `useUIStore` | `store/uiStore.ts` | No | `activeTab`, `settingsTab`, `settingsOpen`, `notifications` |
| `useOnboardStore` | `store/onboardStore.ts` | Yes (`localStorage`) | `step`, `completed`, `skipCogs` |

Rule: business data goes through SWR; UI-only state goes in Zustand. Never mix.

---

## Key Design Constraints

1. **Pure functions** — `lib/metrics.ts` and `lib/insights.ts` have zero side effects. All metric and insight logic lives here, not in components or routes.
2. **Deterministic mock data** — seeded LCG (`seed=42` campaigns, `seed=88` notifications, `seed=420` products, `seed=99` LTV cohorts). Tests depend on this stability.
3. **One Shopify store per user** — `shopifyData.ts` currently calls `findOne` without a domain filter. Multi-store support requires a schema change + domain-scoped lookup.
4. **Multi-tenant data isolation** — all data is scoped to `userId`. No cross-user data leakage is acceptable.
5. **Backward-compatible API contracts** — route response shapes must not change without explicit migration.
6. **No business logic in components** — calculations belong in `lib/`; components only render.

---

## SaaS Multi-Tenancy

TROI is multi-tenant by design. Each row in every future Prisma model will carry a `userId` foreign key. API routes must filter all queries by the authenticated user's ID extracted from the JWT. The current in-memory `settingsStore` uses a `userId` key map as a placeholder for this pattern.

Limitation as of v0.1: one Shopify store per user (see constraint 3 above).

---

## Prisma Migration Path

Schema is defined at `prisma/schema.prisma` (PostgreSQL). No migrations have been run — the app currently uses:

- `lib/settingsStore.ts` for settings (in-memory, per-process)
- `lib/mockData.ts` for all other data

Migration path:
1. Provision a PostgreSQL instance and set `DATABASE_URL`.
2. Run `npx prisma migrate dev` to apply the schema.
3. Replace `settingsStore.ts` reads/writes with Prisma client calls in `app/api/settings/route.ts`.
4. Replace mock data lookups in remaining routes with real DB queries, guarded by `userId`.

---

## Subagent Workflow

This project uses Claude Code subagents for development tasks. These are AI coding agents, not runtime software agents.

| Agent type | Used for |
|---|---|
| General-purpose | Day-to-day code edits, bug fixes, feature implementation |
| Explore | Reading and understanding unfamiliar parts of the codebase before changes |
| Plan | Designing multi-step changes, evaluating trade-offs, producing implementation plans |

Agents operate under the constraints in `CLAUDE.md` and `AGENTS.md`. The `docs/` folder (this file, `context.md`, `changelog.md`) is updated after meaningful changes so future agents have accurate project state without re-exploring from scratch.
