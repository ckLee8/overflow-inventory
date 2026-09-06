# overflow-inventory

Stock tracker and weekly multi-vendor ordering PWA.

See DESIGN.md for architecture.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Postgres via Prisma
- Vendor adapter stubs
- PWA manifest for iPad install

## Prerequisites

- Node.js 20+
- Postgres database (optional: mock fallback if DATABASE_URL missing)

## How to run

1. npm install (postinstall runs prisma generate)
2. cp .env.example .env and set DATABASE_URL
3. npx prisma migrate dev
4. npm run prisma:seed
5. npm run dev — http://localhost:3000

Without DATABASE_URL, Inventory/Ordering/Vendors/Reports use lib/mock-data.ts. Ordering cell edits stay in-session only.

### Scripts

- npm run dev / build / start / lint
- npm run prisma:generate / prisma:migrate / prisma:deploy / prisma:seed

### App map

- /inventory — Prisma StockLevel (mock fallback)
- /ordering — WeeklyOrderPlan cells; blur saves via server action
- /approvals — DRAFT/APPROVED POs from DB
- /vendors — schedules from DB
- /reports — on-hand + below-min from DB

### Data layer

- lib/data.ts — server reads
- lib/actions/ordering.ts — updateOrderCell
- lib/mock-data.ts — fallback
- lib/db.ts — hasDatabase()

### License

MIT — see LICENSE
