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
- **External integrations**: Wix (Table Reservations, Events sync, site management)

## Modules

1. **Digital Menu** — Categories, allergens, dietary filters
2. **Table Reservations** — Calendar + time slots, Wix Table Reservations integration (fallback to local DB)
3. **Delivery/Takeaway** — Cart, ordering flow
4. **E-Commerce Shop** — Products, shop cart
5. **Events & Workshops** — Event catalog + registration, auto-synced from Wix Events with ticketing links
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
- **Wix Events**: Auto-synced every 5 min via `GET /api/events` or manually via `POST /api/events/sync-wix`
- **Wix Site URL**: `https://www.bekindcommunity.it`
- **Events Ticketing**: Wix events redirect to `bekindcommunity.it/event-details/{slug}` for booking/payment
- **Events Schema**: `wixEventId`, `wixSlug`, `wixTicketUrl`, `wixStatus` fields on events table
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

## Admin Panel

- **Access**: Admin users (is_admin=true in users table) see "Pannello Admin" link on profile page
- **Dashboard**: Live stats (pending orders, today reservations, counts), organized by Contenuti / Operazioni / Persone
- **Content Management**:
  - Piatti: CRUD at `/admin/piatti`, `/admin/piatti/:id` (new/edit)
  - Eventi: CRUD at `/admin/eventi`, `/admin/eventi/:id`
  - Prodotti: CRUD at `/admin/prodotti`, `/admin/prodotti/:id`
  - Categorie: Menu & product categories at `/admin/categorie` (inline create/edit/delete)
- **Operations**:
  - Ordini Ristorante: `/admin/ordini` — view, filter (attivi/completati/annullati), change status
  - Ordini Bottega: `/admin/ordini-bottega` — same + tracking
  - Prenotazioni: `/admin/prenotazioni` — filter (oggi/prossime/passate), confirm/complete/cancel
- **Users**: `/admin/utenti` — search, view loyalty info, toggle admin privileges
- **Backend**: All at `/api/admin/*` with `requireAdmin` middleware
- **Auth gate**: All admin API routes verify `isAdmin` flag. Frontend shows "Accesso Riservato" for non-admin users.

## UI Design System

- **Reference**: Google AI Studio-inspired clean mobile-first design
- **Colors**: Primary = terracotta (#C6957C / hsl 15 60% 50%), Secondary = olive (#676959 / hsl 75 30% 40%), Background = warm cream (#FAF8F5)
- **Cards**: Pure white (`bg-white`), `rounded-2xl`/`rounded-3xl`, `shadow-soft` (0 2px 15px rgba(0,0,0,0.06))
- **Buttons**: Circular back buttons (`w-10 h-10 bg-white rounded-full shadow-soft`), primary CTA (`bg-primary text-white rounded-2xl`)
- **Typography**: Serif headings (font-serif font-bold), clean sans-serif body
- **Logo**: "BE KIND" in Fredoka font, color #C6957C, inline SVG
- **Bottom Nav**: 5 tabs — Home, Menù, Be Kind (loyalty/Star), Bottega, Profilo; white bg, active tab shows label
- **Image fallbacks**: Null `imageUrl` renders icon placeholder (UtensilsCrossed for dishes, Calendar for events) on `bg-secondary/10`
- **CSS utilities**: `shadow-soft`, `shadow-card`, `no-scrollbar`, `active-elevate`

## Key Files

- `lib/db/src/schema/users.ts` — Users table (email, googleId, loyalty, preferences, isAdmin)
- `artifacts/api-server/src/routes/auth.ts` — Auth routes (login, register, Google)
- `artifacts/api-server/src/routes/admin.ts` — Admin CRUD routes (dishes, events, products)
- `artifacts/api-server/src/routes/reservations.ts` — Reservation routes + Wix fallback
- `artifacts/api-server/src/wix-bookings.ts` — Wix Table Reservations API wrapper
- `artifacts/api-server/src/wix-events.ts` — Wix Events API wrapper (sync, tickets, checkout)
- `artifacts/be-kind/src/pages/login.tsx` — Login page with Google Sign-In
- `artifacts/be-kind/src/pages/admin/` — Admin panel pages (dashboard, forms, lists)
- `artifacts/be-kind/src/hooks/use-admin.ts` — Admin hooks (queries + mutations)
- `artifacts/be-kind/src/pages/new-reservation.tsx` — New reservation form
- `artifacts/be-kind/src/pages/reservations.tsx` — Reservation list

## QR Code Loyalty System

- **User QR Code**: Each user gets a unique QR token (format: `BK-XXXXXXXXXXXX`) stored in `users.qr_token`, generated on first request to `GET /api/loyalty/qr-data`
- **Admin Scanner**: `/admin/scanner` page with camera-based QR scanner (html5-qrcode) + manual code entry fallback
- **Scan Flow**: Admin scans QR → `GET /api/admin/loyalty/scan/:qrToken` returns user info, stamps, recent history → admin can award points or stamps
- **Award Points**: `POST /api/admin/loyalty/award-points` with `{ userId, points, reason }`
- **Award Stamps**: `POST /api/admin/loyalty/award-stamp` with `{ userId, stampId }`; 8 stamps available (st1-st8)
- **Stamps Table**: `user_stamps` (id, user_id, stamp_id, awarded_by, created_at)
- **Frontend packages**: `qrcode.react` (QR display), `html5-qrcode` (camera scanner)

## App Language

All user-facing content is in **Italian**. Currency: EUR (€).
