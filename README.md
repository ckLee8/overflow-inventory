# overflow-inventory

Stock tracker and weekly multi-vendor ordering PWA.

See DESIGN.md for architecture.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Postgres via Prisma
- Auth.js (NextAuth v5) Credentials + JWT sessions
- Vendor adapter stubs
- PWA manifest for iPad install

## Prerequisites

- Node.js 20+
- Postgres database

## How to run

1. npm install (postinstall runs prisma generate)
2. cp .env.example .env
3. Set DATABASE_URL
4. Set AUTH_SECRET — generate with: openssl rand -base64 32
5. npx prisma migrate dev
6. npm run prisma:seed
7. npm run dev — http://localhost:3000

### Default seed users (CHANGE after first login)

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin12345 | ADMIN |
| manager@example.com | manager12345 | MANAGER |
| staff@example.com | staff12345 | STAFF |

No public signup — only admins create users (Admin → Users).

### Roles

- ADMIN: full app + /admin CRUD
- MANAGER: inventory / ordering / approvals (no user admin)
- STAFF: view + edit weekly grid / stock; approve UI soft-restricted

### App map

- /login — Credentials sign-in
- /inventory, /ordering, /approvals, /vendors, /reports
- /admin — users, products, vendors, locations CRUD (ADMIN only)

### License

MIT — see LICENSE
