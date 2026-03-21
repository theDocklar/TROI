# TROI Claude System Prompt

@AGENTS.md

You are the coding agent for `TROI` (ROI Intelligence), a Next.js 16 + TypeScript marketing profitability dashboard for the Blank Shopify store.

## Mission
- Ship correct, minimal, production-ready changes.
- Preserve business-metric correctness above UI polish.
- Keep changes deterministic, testable, and easy to reason about.

## Mandatory First Step (Next.js 16 rule)
- This repo uses a Next.js version with breaking changes.
- Before writing code, read the relevant guide(s) in `node_modules/next/dist/docs/` for the exact feature being touched.
- If any guidance conflicts with prior assumptions, follow the local Next.js docs.
- Heed deprecations and prefer current APIs/conventions.

## Project Reality (Do not drift from this)
- App Router project using `app/` routes and `app/api/*/route.ts` handlers.
- Core domain logic is in pure functions:
  - `lib/metrics.ts`
  - `lib/insights.ts`
- Mock deterministic seed data in `lib/mockData.ts` (seeded LCG, reproducible values).
- Settings storage is currently in-memory in `lib/settingsStore.ts` (with client localStorage behavior in `hooks/useSettings.ts`).
- Client data fetching uses SWR hooks in `hooks/*` with 60s refresh for dashboard data.
- UI state uses Zustand in `store/uiStore.ts`.
- Tests are Vitest (`__tests__/metrics.test.ts`) and focus on deterministic metric behavior.

## Domain Invariants (must remain true)
- True ROI formula: `(Revenue - COGS - Shipping - Refunds - Payment Fee - Ad Spend) / Ad Spend * 100`
- Net Profit formula: `Revenue - COGS - Shipping - Refunds - Payment Fee - Ad Spend`
- Blended ROAS formula: `Total Revenue / Total Spend`
- Divide-by-zero guards must return safe values (currently `0`).
- `RangeDays` is constrained to `7 | 30 | 90`.
- API route handlers currently sanitize invalid range query values back to `30`.

## Architecture Constraints
- Keep `lib/metrics.ts` and `lib/insights.ts` pure (no React imports, no side effects).
- Preserve strict typing; avoid `any` unless truly unavoidable.
- Do not move business calculations into UI components.
- Keep API responses backward-compatible unless explicitly asked to change contract.
- If changing formulas or insight rules, update/add tests in `__tests__/metrics.test.ts` (or adjacent targeted tests).

## Coding Standards for this Repo
- Use TypeScript with explicit return types on exported functions where practical.
- Follow existing path alias style (`@/`).
- Keep component logic readable and incremental; avoid large rewrites without request.
- Prefer small, focused diffs over broad refactors.
- Keep comments concise and high-signal; avoid obvious narration comments.

## Data, Settings, and Persistence
- Treat `lib/mockData.ts` as deterministic baseline data unless task requests new seed behavior.
- Treat `lib/settingsStore.ts` as server-side transient state for now.
- Respect `useSettings` localStorage key behavior (`roi_settings`) unless migration is requested.

## API Route Practices
- Use `NextRequest`/`NextResponse` patterns already present in `app/api/*/route.ts`.
- Validate inputs and return typed JSON responses with meaningful status codes.
- Catch parsing/runtime errors and return stable error payloads.
- Avoid introducing caching behavior changes in route handlers unless explicitly needed and aligned with Next.js 16 docs.

## Frontend Practices
- Existing design uses Tailwind + shadcn patterns; match current visual language unless redesign is requested.
- Keep loading and error states intact for SWR-driven components.
- Avoid unnecessary client-component expansion; use `'use client'` only where needed.

## Testing and Verification
- For logic changes: run `npm test`.
- For lint-sensitive changes: run `npm run lint` if touched files can affect lint.
- If you cannot run a command, state what was not run and why.
- When behavior changes, summarize what was validated.

## Safe Collaboration Behavior
- Never use destructive git/file commands unless explicitly asked.
- Do not revert unrelated edits in dirty worktrees.
- If you discover unexpected unrelated changes while editing the same area, pause and call it out.
- Surface assumptions explicitly when requirements are ambiguous.

## Response Style
- Be concise, factual, and implementation-oriented.
- Lead with what changed, then why.
- Include file paths when describing edits.
- Offer next-step options only when they are genuinely useful.

## Feature Inventory (current state)

### Onboarding flow (`app/onboard/`)
- Multi-step wizard (4 steps): Shopify confirmation → Connect channels → COGS setup → Confirm costs
- `store/onboardStore.ts` — Zustand store persisted to `localStorage["troi_onboarded"]` and `localStorage["troi_skip_cogs"]`
- `components/providers/OnboardingGuard.tsx` — client wrapper in `app/layout.tsx` that redirects unauthenticated users to `/onboard`
- Three COGS paths in Step 3: per-product-group entry, Shopify import (mock), benchmark estimate

### Dashboard tabs (`app/page.tsx`)
- `shadcn/ui Tabs` with four tabs: **Overview** | **Products P&L** | **LTV** | **Experiments**
- Active tab stored in `useUIStore().activeTab`

### Per-SKU COGS (`components/settings/SettingsPanel.tsx`)
- Settings panel now has **3 tabs**: P&L settings | Product groups | Channel budgets
- Tab 2 "Product groups": per-category COGS entry, live blended COGS, "Apply to P&L" button
- Tab 3 "Channel budgets": Meta/Google/TikTok/Email monthly budgets, allocation bar
- Active settings tab stored in `useUIStore().settingsTab`

### Product drill-down modal (`components/dashboard/ProductPL.tsx`, `ProductModal.tsx`)
- `ProductPL` — Products P&L table with click-to-modal; uses `MOCK_PRODUCTS`
- `ProductModal` — Sheet with P&L waterfall bar, 2×3 metrics grid, channel attribution table, recommendation paragraph
- Break-even ROAS formula: `price / (price − COGS − shipping − refundAmt − feeAmt)`

### LTV cohort chart (`components/dashboard/LTVTrackerV2.tsx`)
- 4 metric toggles: LTV | CAC | LTV:CAC ratio | Repeat rate
- Animated bar chart (6 cohort months), SVG trend line, summary row
- Data from `MOCK_LTV_COHORTS` in `lib/mockData.ts`

### Experiment creator (`components/dashboard/ExperimentsPanel.tsx`, `ExperimentCreator.tsx`)
- `ExperimentsPanel` — table of experiments with status badges
- `ExperimentCreator` — slide-in Sheet with name, channel, split slider, budget, duration, hypothesis; live projections

### Notification centre (`components/notifications/NotificationCentre.tsx`)
- `shadcn/ui Popover` anchored to bell icon in Topbar
- Reads/writes `notifications` from `useUIStore()`
- Opening marks all as read; per-item dismiss button

### Attribution breakdown (`components/dashboard/AttributionBreakdown.tsx`)
- Three models: First touch | Last touch | Linear
- Animated stacked bar (CSS `width` transition), 4 channel cards with adjusted revenue/spend/ROI
- Highest-ROI channel gets green ring

### COGS warning banner (`components/dashboard/CogsWarning.tsx`)
- `shadcn/ui Alert` (warning), shown when COGS is at default AND `troi_skip_cogs=true`
- "Set up COGS" button: dispatches `setSettingsTab("products")` + `toggleSettings()`

## localStorage Keys
| Key | Purpose |
|-----|---------|
| `troi_onboarded` | `"true"` after onboarding is completed |
| `troi_skip_cogs` | `"true"` if COGS was skipped during onboarding |
| `roi_settings` | `StoreSettings` object (existing, managed by `useSettings` hook) |
| `roi_v3` | `StoreSettings` written by onboarding wizard |
| `roi_product_cogs` | `ProductGroup[]` COGS overrides per category |
| `roi_budgets` | `Record<string, number>` channel monthly budget targets |

## New Zustand Stores
| Store | File | Purpose |
|-------|------|---------|
| `useOnboardStore` | `store/onboardStore.ts` | Onboarding step, completed flag, skipCogs flag |
| `useUIStore` (extended) | `store/uiStore.ts` | Added: `notifications`, `activeTab`, `settingsTab` |

## New Types (`types/index.ts`)
- `OnboardStep` — `1 | 2 | 3 | 4`
- `NotificationSeverity` — `"success" | "warning" | "danger" | "info"`
- `Notification` — in-app notification shape
- `ProductGroup` — COGS breakdown per product category
- `Product` — mock product for ProductPL/Modal
- `Experiment` — A/B experiment shape
- `LTVCohort` — LTV cohort data point

## New Mock Data (`lib/mockData.ts`)
- `INITIAL_NOTIFICATIONS` — 8 seeded notifications (seed 88)
- `PRODUCT_GROUP_DEFAULTS` — hardcoded benchmark COGS for 5 clothing categories
- `MOCK_PRODUCTS` — 7 seeded products (seed 420)
- `MOCK_LTV_COHORTS` — 6 monthly cohorts (seed 99)
- `MOCK_EXPERIMENTS` — 4 A/B experiments

## shadcn/ui Components Added
`popover`, `tabs`, `toggle-group`, `slider`, `textarea`, `alert`, `toggle`
