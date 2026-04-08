# Workspace — Be Kind App

## Overview

"Be Kind" — Mobile-first Italian restaurant & lifestyle web app for Ristorante Be Kind, Cattolica (RN). pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **State**: Zustand (auth store)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **External integrations**: Wix (Table Reservations, site management)

## Modules

1. **Digital Menu** — Categories, allergens, dietary filters
2. **Table Reservations** — Calendar + time slots, Wix Table Reservations integration (fallback to local DB)
3. **Delivery/Takeaway** — Cart, ordering flow
4. **E-Commerce Shop** — Products, shop cart
5. **Events & Workshops** — Event catalog + registration
6. **Loyalty** — Points system (Seed/Sprout/Bloom/Tree tiers) + stamp cards
7. **Profile** — User dashboard, preferences, order history

## Authentication

- Email/password with custom token (Bearer)
- **Google Sign-In** ready — set `VITE_GOOGLE_CLIENT_ID` env var to activate
- Backend endpoint: `POST /api/auth/google` verifies Google credential and creates/finds user
- Users table supports `googleId` column; `passwordHash` is nullable for Google-only users

## Wix Integration

- **Site ID**: `3025aa6e-3b50-4fba-abcb-f11194028de3`
- **Cattolica Location ID**: `a151fa65-753a-402e-9e1a-9f3deb3527f2` (ONLY location used)
- **Status**: Wix Table Reservations app is installed on site but API key returns 404 — needs "Wix Restaurants - Table Reservations" permission on the API key
- **Fallback**: All reservation endpoints gracefully fall back to local PostgreSQL DB
- **Hours (local fallback)**: Breakfast/Brunch 08:30-12:00, Lunch 12:00-15:00, Cena 18:00-23:00, closed Monday
- **Max covers per slot**: 40

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session secret
- `WIX_API_KEY` — Wix API key (account-level)
- `WIX_ACCOUNT_ID` — Wix account ID
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth Client ID (optional, enables Google login)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Key Files

- `lib/db/src/schema/users.ts` — Users table (email, googleId, loyalty, preferences)
- `artifacts/api-server/src/routes/auth.ts` — Auth routes (login, register, Google)
- `artifacts/api-server/src/routes/reservations.ts` — Reservation routes + Wix fallback
- `artifacts/api-server/src/wix-bookings.ts` — Wix Table Reservations API wrapper
- `artifacts/be-kind/src/pages/login.tsx` — Login page with Google Sign-In
- `artifacts/be-kind/src/pages/new-reservation.tsx` — New reservation form
- `artifacts/be-kind/src/pages/reservations.tsx` — Reservation list

## App Language

All user-facing content is in **Italian**. Currency: EUR (€).
