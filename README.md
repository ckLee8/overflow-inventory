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
- Postgres database

## How to run

Install packages, configure the database URL from the example env file, migrate the schema, then start the Next.js development server.

### Scripts

- npm run dev -- Start Next.js dev server
- npm run build / npm start -- Production build and serve
- npm run prisma:generate -- Generate Prisma Client
- npm run prisma:migrate -- Create/apply migrations (dev)
- npm run prisma:deploy -- Apply migrations (prod)

### App map

- /inventory -- Stock levels (mock data for now)
- /ordering -- Weekly ordering grid skeleton
- /approvals -- Per-day approval placeholder
- /vendors -- Vendor schedules and adapter types
- /reports -- Below-min and report placeholders

### Vendor adapters

Shared interface in lib/vendors/types.ts: canAcceptOrders, createOrder, getStatus.

Stubs under lib/vendors/: email-pdf-po.ts, shopify-wholesale.ts, amazon.ts

### License

MIT -- see LICENSE

### Setup commands

1. npm install
2. cp .env.example .env
3. Edit DATABASE_URL in .env
4. npx prisma migrate dev
5. npm run dev

Open http://localhost:3000
