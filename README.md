# SoYoung

Premium cosmetics e-commerce platform built with Next.js, Prisma, and PostgreSQL.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- Auth.js (credentials sessions)
- Stripe-ready checkout (mock mode without keys)
- Docker Compose for VPS deployment

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
# Set DATABASE_URL to your Postgres instance

# 3. Database
npx prisma db push
npm run db:seed

# 4. Dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@soyoung.com | Admin123! |
| Customer | customer@soyoung.com | Customer123! |

### Coupons

- `WELCOME10` — 10% off (min €30)
- `SAVE15` — €15 off (min €60)
- `FREESHIP` — shipping discount

## Docker

```bash
docker compose up --build
```

## Project structure

- `app/` — routes (storefront + `/admin`)
- `features/` — feature UI + server actions
- `server/services` — business logic
- `server/repositories` — data access
- `prisma/` — schema + seed
- `lib/` — auth, payments, storage, search adapters

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run db:seed` — seed catalogue
- `npm run db:studio` — Prisma Studio
