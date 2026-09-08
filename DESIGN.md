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
│  inventory (unified table)  │
│  weekly orders · approval   │
│  reports                    │
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
  - **STAFF** — view inventory; edit **today’s** weekly grid cells; approve UI soft-restricted (no approve actions); cannot edit on-hand

Default seed admin (`admin@example.com` / `admin12345`) must be changed after first login.

## Domain model

### Core entities

- **User** — email, name, passwordHash, role, active
- **Product / SKU** — sellable or orderable item; links to preferred vendor(s)
- **Store location** — where stock lives; inventory and ordering are location-aware
- **Stock level** — on-hand, reserved, on-order per SKU × location; **min level** and optional **reorder qty**
- **Vendor** — Amazon, Shopify/wholesale account, or email/PDF target; credentials; **order-accepting schedule** (days of week + blackout dates)
- **Weekly order plan** — qty per SKU × location × calendar day for a given week
- **Purchase order** — one day’s approved slice for one vendor (or equivalent); line items; PO status + per-line `fulfillmentStatus` (ORDERED / SHIPPED / RECEIVED) + `markedReceived` (Receive checkbox) + optional `deliveryIssue` / `deliveryIssueNote`
- **Stock movement** — audit trail (adjust, receive, sell, waste) for reports

### Sorting / grouping

Inventory and ordering UIs support **sort and group by vendor** and **by store location**.

## Ordering flow

### Main UI: weekly grid

- **Rows**: SKUs (filterable; sort/group by vendor or store location)
- **Columns**: days of the week (configurable week start)
- **Cells**: quantity to order that day
- **Edit lock**: only the column for **today** (business timezone `APP_TIMEZONE`, default `America/New_York`) is editable. Past and future day columns are read-only / visually locked (mock grid included). Server action `updateOrderCell` rejects non-today `orderDate`.
- Auto-suggest from min levels can **prefill** cells; users edit today’s cells freely
- Days a vendor cannot accept orders are **blocked/greyed** from that vendor’s schedule

### Stock on hand

- Inventory page shows a single **today’s on-hand** count per SKU × location (not a day-column grid)
- **ADMIN** / **MANAGER** can edit on-hand; saves `StockLevel.onHand` and a `StockMovement` of type `ADJUST` with the delta
- **STAFF** can view on-hand; may still edit today’s weekly order cells

### Auto-reorder

When `on_hand + on_order < min_level` for a SKU × location, the system suggests quantities (using reorder qty when set). Suggestions respect vendor order windows.

### Approval and place (per day)

1. User (or auto-suggest) fills the weekly grid
2. For a given **day**, an approver reviews that day’s quantities
3. Approver edits if needed, then **approves that day**
4. System splits approved lines by vendor and invokes the right **adapter**
5. Only today’s cells stay editable in the grid; approved days place through the approval flow
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

**Inventory is a unified table** (one row per SKU × location) with in-row receive — no separate receiving panel and **no Receiving nav item**. `/receiving` may still redirect to `/inventory`.

Columns: SKU (+ name) | Location | On hand (editable today, ADMIN/MANAGER) | Min | Expected (read-only on-order) | Receive (two-way checkbox + delivery-issue flag). Rows with **unmarked** inbound are highlighted.

When multiple open PO lines exist for the same SKU × location, the row uses the **primary** line (prefer unmarked **SHIPPED** over **ORDERED**; marked lines stay available so the checkbox can be unchecked). No open inbound → no checkbox (dash).

**Receive checkbox** toggles `PurchaseOrderLine.markedReceived` (Boolean `@default(false)`): check → `true`, uncheck → `false`. It **does not** change `StockLevel.onHand`, `StockLevel.onOrder` / Expected, or `receivedQty`, and creates **no** stock movements. On hand stays independently editable; Expected stays a display of `onOrder`. Migration: `20260908020000_add_po_line_marked_received`. Server action: `setLineMarkedReceived(lineId, boolean)` (ADMIN/MANAGER). Legacy `receiveAgainstPo` / `reverseReceiveForLine` are gutted (no ledger) and forward to that setter.

**Delivery issue flag** (triangle icon to the right of the checkbox): toggles `PurchaseOrderLine.deliveryIssue` (Boolean, default false) and optional `deliveryIssueNote`. Independent of `markedReceived`. Gray when clear; amber when flagged. Click toggles for MVP (no modal required). Migration: `20260907051500_add_po_line_delivery_issue`.

**Line fulfillment** (`PurchaseOrderLine.fulfillmentStatus`):

- New lines default to **ORDERED**
- ADMIN/MANAGER can still mark ship via `updatePoLineFulfillmentStatus` (ORDERED → SHIPPED) when exposed elsewhere
- Receive checkbox does **not** invent stock; it only sets `markedReceived`. Optionally the PO header reflects marks: all lines marked → `RECEIVED`; some → `PARTIAL`; none after prior PARTIAL/RECEIVED → `SUBMITTED` (if any SHIPPED) else `APPROVED`

**STAFF** may view receive checkbox / flag state but cannot toggle; on-hand edit rules unchanged. **ADMIN/MANAGER** mark received + flag.

## Reports

All reporting queries hit Postgres. Initial set:

- On-hand by location / vendor
- Below-min SKUs
- Open POs and expected receipts
- Stock movement history over a date range

## PWA / iPad

- Installable on iPad home screen
- Touch-friendly: large tap targets, weekly grid usable with finger; locked cells use disabled / muted styling
- Responsive layout shared with desktop web
- Later: optional offline read cache; not required for v1

## MVP path

1. Auth + products + locations + stock adjustments + basic stock report
2. Vendor schedules + weekly ordering grid + **per-day approval**
3. Email/PDF PO adapter
4. Receiving — Inventory unified table; `markedReceived` checkbox via `setLineMarkedReceived` (no stock ledger from Receive)
5. Shopify/wholesale adapter
6. Amazon adapter
7. iPad PWA polish

## Open decisions

- Exact Amazon API program (Seller / Vendor Central / Business)
- Shopify vs generic wholesale portal mechanics per vendor
- Week-start day (Monday UTC for plan keys today); **business “today”** uses `APP_TIMEZONE` (default America/New_York)
- Whether one PO per vendor-per-day or finer splits

## Changelog

- **2026-09-07** — Receive = boolean only: `PurchaseOrderLine.markedReceived` + migration `20260908020000_add_po_line_marked_received`; `setLineMarkedReceived` replaces stock mutations in `receiveAgainstPo` / `reverseReceiveForLine`; on-hand / Expected / `receivedQty` unchanged by checkbox; delivery-issue flag stays independent.
- **2026-09-07** — Receive column: two-way checkbox (receive remaining; uncheck reverses the line); delivery-issue triangle flag on `PurchaseOrderLine` (`deliveryIssue`, `deliveryIssueNote`) + migration `20260907051500_add_po_line_delivery_issue`; remove Receiving from top nav (`/receiving` redirect optional).
- **2026-09-06** — Inventory unified table: one row per SKU×location with in-row Inbound / Receive / Mark ship; remove separate receiving panel; `/receiving` → `/inventory`; prefer SHIPPED primary when multiple open lines.
- **2026-09-06** — Receiving on Inventory: embed panel at `/inventory#receiving`; `/receiving` redirects; nav links to Inventory section. `PoLineFulfillmentStatus` (ORDERED|SHIPPED|RECEIVED) + migration; mark shipped without receive; auto RECEIVED on full receive; inbound badges on inventory rows; seed mixed statuses.
- **2026-09-06** — Receiving: `/receiving` UI for APPROVED/SUBMITTED/PARTIAL POs; partial line receives; stock onHand/onOrder + RECEIVE movements; PO status PARTIAL/RECEIVED; requires `storeLocationId` on PO; ADMIN/MANAGER only; seed APPROVED + SUBMITTED POs with matching onOrder.
- **2026-09-05** — Weekly grid: only today editable (past/future locked) via `APP_TIMEZONE`; `updateOrderCell` server guard; Inventory on-hand editable for ADMIN/MANAGER with ADJUST stock movements; mock grid respects today-only.
- **2026-09-05** — Auth.js Credentials + roles (ADMIN/MANAGER/STAFF); User model + migration; admin CRUD for users/products/vendors/locations; middleware route protection; seeded default admin.
- **2026-09-05** — Initial design from product planning: stock + multi-vendor orders + reports; web/iPad PWA; weekly grid; min levels; per-day approval; configurable vendor order days; sort by vendor/location.
