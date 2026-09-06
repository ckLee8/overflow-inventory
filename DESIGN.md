# overflow-inventory — Design

Living product and technical design. Update this file when decisions change.

## Goals

- **Stock tracker** as the source of truth for on-hand inventory across store locations
- **Multi-vendor ordering** to Amazon, Shopify/wholesale portals, and email/PDF purchase orders
- **Reports** backed by a real database (not spreadsheets)
- **Clients**: one web app that also installs as an **iPad PWA** (not a separate native app)

## Non-goals (for now)

- Native SwiftUI / Expo iPad apps
- Multi-tenant SaaS for many companies (start single-business)
- Full offline-first sync (optional later: read cache on iPad)

## Architecture

```
┌─────────────────────────────┐
│  Web / iPad PWA (Next.js)   │
│  inventory · weekly orders  │
│  approval · reports         │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  API (same app or service)  │
│  auth · domain logic        │
└──────┬─────────────┬────────┘
       │             │
┌──────▼──────┐ ┌────▼─────────────────────────────┐
│  Postgres   │ │  Jobs / queue                      │
│  stock, POs │ │  place orders · email PDF · poll │
│  audit      │ └────┬─────────────────────────────┘
└─────────────┘      │
              ┌──────▼──────────────────────────────┐
              │  Vendor adapters (pluggable)        │
              │  Amazon · ShopifyWholesale · EmailPdf│
              └─────────────────────────────────────┘
```

### Stack (recommended)

| Layer | Choice | Why |
|-------|--------|-----|
| UI | Next.js (App Router) + TypeScript | One codebase; PWA-friendly; good for touch layouts |
| API | Next.js route handlers or tRPC | Colocated with UI for MVP speed |
| DB | Postgres | Reports, relational stock/PO history |
| ORM | Prisma or Drizzle | Typed schema, migrations |
| Jobs | Inngest, Trigger.dev, or a simple worker + queue | Durable place/email/poll without blocking UI |
| Auth | Auth.js (NextAuth v5) Credentials + JWT | Roles for who can approve; admin-created users only |

Exact library picks can change; the boundaries above should not.

## Auth & roles

- **Provider**: Auth.js v5 Credentials (email + password); passwords hashed with bcryptjs
- **Sessions**: JWT (MVP); middleware protects all app routes except `/login` and static/PWA assets
- **No public signup**: only **ADMIN** creates users under `/admin/users`
- **Roles** (`Role` enum on `User`):
  - **ADMIN** — full access including `/admin` CRUD (users, products, vendors, locations) and approve
  - **MANAGER** — inventory / ordering / approvals; no user admin
  - **STAFF** — view + edit weekly grid / stock; approve UI soft-restricted (no approve actions)

Default seed admin (`admin@example.com` / `admin12345`) must be changed after first login.

## Domain model

### Core entities

- **User** — email, name, passwordHash, role, active
- **Product / SKU** — sellable or orderable item; links to preferred vendor(s)
- **Store location** — where stock lives; inventory and ordering are location-aware
- **Stock level** — on-hand, reserved, on-order per SKU × location; **min level** and optional **reorder qty**
- **Vendor** — Amazon, Shopify/wholesale account, or email/PDF target; credentials; **order-accepting schedule** (days of week + blackout dates)
- **Weekly order plan** — qty per SKU × location × calendar day for a given week
- **Purchase order** — one day’s approved slice for one vendor (or equivalent); line items; status
- **Stock movement** — audit trail (adjust, receive, sell, waste) for reports

### Sorting / grouping

Inventory and ordering UIs support **sort and group by vendor** and **by store location**.

## Ordering flow

### Main UI: weekly grid

- **Rows**: SKUs (filterable; sort/group by vendor or store location)
- **Columns**: days of the week (configurable week start)
- **Cells**: quantity to order that day
- Auto-suggest from min levels can **prefill** cells; users edit freely
- Days a vendor cannot accept orders are **blocked/greyed** from that vendor’s schedule

### Auto-reorder

When `on_hand + on_order < min_level` for a SKU × location, the system suggests quantities (using reorder qty when set). Suggestions respect vendor order windows.

### Approval and place (per day)

1. User (or auto-suggest) fills the weekly grid
2. For a given **day**, an approver reviews that day’s quantities
3. Approver edits if needed, then **approves that day**
4. System splits approved lines by vendor and invokes the right **adapter**
5. Future days stay editable; only approved days place
6. Closed vendor days never place

### Vendor adapters

Shared interface (illustrative):

- `canAcceptOrders(date) → boolean` (uses vendor schedule)
- `createOrder(po) → externalRef`
- `getStatus(externalRef) → status`
- Optional: `listCatalog`, `cancelOrder`

| Adapter | Behavior |
|---------|----------|
| **EmailPdfPoAdapter** | Generate PDF PO + email to vendor (MVP “order out”) |
| **ShopifyWholesaleAdapter** | Place via wholesale/portal API or scripted flow |
| **AmazonAdapter** | Place via Amazon APIs (heaviest auth; later in MVP) |

New vendors = new adapter; core ordering stays unchanged.

### Receiving

When goods arrive, receive against the PO (full or partial). Stock on-hand increases; movements recorded for reports.

## Reports

All reporting queries hit Postgres. Initial set:

- On-hand by location / vendor
- Below-min SKUs
- Open POs and expected receipts
- Stock movement history over a date range

## PWA / iPad

- Installable on iPad home screen
- Touch-friendly: large tap targets, weekly grid usable with finger
- Responsive layout shared with desktop web
- Later: optional offline read cache; not required for v1

## MVP path

1. Auth + products + locations + stock adjustments + basic stock report
2. Vendor schedules + weekly ordering grid + **per-day approval**
3. Email/PDF PO adapter
4. Receiving (including partial)
5. Shopify/wholesale adapter
6. Amazon adapter
7. iPad PWA polish

## Open decisions

- Exact Amazon API program (Seller / Vendor Central / Business)
- Shopify vs generic wholesale portal mechanics per vendor
- Week-start day and timezone for “order day”
- Whether one PO per vendor-per-day or finer splits

## Changelog

- **2026-09-05** — Auth.js Credentials + roles (ADMIN/MANAGER/STAFF); User model + migration; admin CRUD for users/products/vendors/locations; middleware route protection; seeded default admin.
- **2026-09-05** — Initial design from product planning: stock + multi-vendor orders + reports; web/iPad PWA; weekly grid; min levels; per-day approval; configurable vendor order days; sort by vendor/location.
