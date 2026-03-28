# TROI Project Context

> Living document. Update this file after every meaningful change so agents and collaborators have an accurate snapshot of current project state without re-exploring from scratch.

**Last updated:** 2026-03-28
**Current version:** 0.1.0

---

## What Is Working Right Now

- Full dashboard renders with 4 tabs: Overview, Products P&L, LTV, Experiments
- 4-step onboarding wizard is functional end-to-end (all 3 COGS paths)
- Auth pages (sign up, sign in, forgot password) render and write JWT to localStorage
- OAuth callback pages exist for Shopify, Meta, and Google Ads
- All dashboard components render with deterministic mock data
- SWR hooks fetch from API routes; 60s revalidation is active
- Zustand stores manage UI state (tabs, notifications, settings panel, onboarding step)
- NotificationCentre popover with read/dismiss works
- SettingsPanel with 3 tabs (P&L, Product groups, Channel budgets) is functional
- AttributionBreakdown renders 3 attribution models with animated transitions
- ProductModal drill-down sheet renders per-product P&L waterfall and channel attribution
- LTVTrackerV2 renders 4 LTV metric views across 6 mock cohort months
- ExperimentsPanel and ExperimentCreator (slide-in sheet with live projections) work
- CogsWarning banner correctly detects default COGS + skipped state
- WhatsApp notification flow is wired through `lib/notify.ts` (mock by default)
- Vitest test suite passes for `lib/metrics.ts` deterministic behaviour

---

## What Is Mocked vs Real

| Concern | Status | Notes |
|---|---|---|
| Shopify orders | Mocked | `lib/shopifyData.ts` returns mock orders unless real store is connected |
| Meta Ads spend | Mocked | `lib/metaContext.ts` returns seeded spend data |
| Google Ads spend | Mocked | `lib/googleContext.ts` returns seeded spend data |
| Campaigns | Mocked | `lib/mockData.ts` seed=42 |
| Notifications | Mocked | `lib/mockData.ts` seed=88 |
| Products | Mocked | `lib/mockData.ts` seed=420 |
| LTV cohorts | Mocked | `lib/mockData.ts` seed=99 |
| WhatsApp alerts | Mocked | `lib/notify.ts` logs instead of calling Twilio unless `TWILIO_*` env vars are set |
| User settings | In-memory | `lib/settingsStore.ts` is a server-process Map — resets on restart |
| Database | Not active | Prisma schema defined; no migrations run; no DB queries in any route |
| Auth (JWT issuance) | Assumed external | Frontend stores token; issuance assumed to be handled by a backend not yet built |

---

## Known Limitations

1. **One Shopify store per user.** `lib/shopifyData.ts` calls `findOne` without a domain filter. Adding multi-store support requires a schema change + domain-scoped lookup.
2. **Prisma not yet active.** `prisma/schema.prisma` is defined for PostgreSQL but no migrations have been run. All persistence is in-memory or localStorage.
3. **`settingsStore.ts` is in-memory.** Settings are lost on server restart. Production will require migration to Prisma.
4. **No real backend for auth.** JWT token is expected in localStorage but there is no API route for issuance, refresh, or revocation yet.
5. **No real platform data.** All charts and metrics reflect seeded mock data until real OAuth tokens are stored and API calls are implemented in context modules.
6. **Multi-tenant isolation is architectural intent, not yet enforced.** No Prisma queries exist yet, so `userId` scoping cannot be verified in practice.

---

## Current Data Sources

| Data | Source file | Seed |
|---|---|---|
| Campaign metrics | `lib/mockData.ts` → `MOCK_CAMPAIGNS` | LCG seed=42 |
| Notifications | `lib/mockData.ts` → `INITIAL_NOTIFICATIONS` | LCG seed=88 |
| Products | `lib/mockData.ts` → `MOCK_PRODUCTS` | LCG seed=420 |
| LTV cohorts | `lib/mockData.ts` → `MOCK_LTV_COHORTS` | LCG seed=99 |
| A/B experiments | `lib/mockData.ts` → `MOCK_EXPERIMENTS` | Hardcoded |
| Product group COGS | `lib/mockData.ts` → `PRODUCT_GROUP_DEFAULTS` | Hardcoded benchmarks |
| Shopify orders | `lib/shopifyData.ts` | Mock fallback |
| Ad spend (Meta/Google) | `lib/metaContext.ts`, `lib/googleContext.ts` | Seeded |

---

## What's Next / Open Decisions

### Immediate priorities
- [ ] Run `npx prisma migrate dev` once a PostgreSQL instance is available
- [ ] Replace `lib/settingsStore.ts` with Prisma-backed persistence in `app/api/settings/route.ts`
- [ ] Implement real Shopify OAuth token exchange and order fetching in `lib/shopifyContext.ts`
- [ ] Implement real Meta Ads and Google Ads data fetching in context modules
- [ ] Build auth backend (JWT issuance, refresh, revocation)

### Open decisions
- Multi-store support: schema design for `stores` table scoped to `userId`
- Whether to keep `lib/settingsStore.ts` as a write-through cache or remove it entirely once Prisma is live
- Twilio WhatsApp: decide on threshold config (hardcoded vs user-configurable per-alert)
- Whether `ExperimentCreator` projections should be wired to real metric history
- Test coverage: currently only `lib/metrics.ts` — `lib/insights.ts` and hooks need coverage

---

## How to Update This File

After any meaningful change (new feature, architecture shift, migration step, known limitation resolved), update:

1. **Last updated** date at the top
2. **Current version** if the version bumped
3. The relevant section(s): Working, Mocked vs Real, Known Limitations, What's Next
4. Also append an entry to `docs/changelog.md`
