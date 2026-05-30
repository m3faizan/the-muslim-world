# Product Requirements Document — The Muslim World

## 1. Original Problem Statement

> Clone this repository, along with all the data and information.
> Repo: https://github.com/m3faizan/the-muslim-world.git
>
> Follow-up: "migrate it" — meaning migrate the codebase from its original Replit stack to the Emergent-supported stack so it runs natively in this environment.

## 2. Application Overview

**The Muslim World — Heritage Intelligence Archive.**
An immersive, dark-mode "intelligence terminal" style web experience that catalogues 52 Islamic heritage sites across 12 regions. Visitors can:

- Explore an interactive Leaflet world map with categorised pins (Mosque, Shrine, Pilgrimage Site, Palace, Other).
- Open a Site Detail page that renders an interactive 3D model of the site (Three.js / React-Three-Fiber) with numbered hotspots that reveal architectural features (e.g., the Kaaba, Black Stone, Zamzam Well).
- Sign up / sign in and use a Tracker to mark which sites they have **visited** or **prayed at**, plus a personal **Collection** of saved sites.

## 3. Architecture (after migration)

| Layer        | Original (Replit)                                           | Migrated (Emergent)                                                    |
| ------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Frontend     | React 19 + Vite (pnpm workspace `artifacts/muslim-world`)  | React 19 + Vite at `/app/frontend` (yarn, runs `vite --port 3000`)     |
| Backend API  | Express 5 + TypeScript at `artifacts/api-server`           | FastAPI 0.115 + Motor (async) at `/app/backend/server.py`              |
| Database     | PostgreSQL + Drizzle ORM                                    | MongoDB (via supervisor-managed local instance)                        |
| Auth         | express-session cookies                                     | JWT Bearer tokens stored in `localStorage` (`muslim_world_token`)      |
| Seed Data    | `lib/db/seed.sql` (52 sites + 12 hotspots)                  | Converted to `/app/backend/seed_data.json` via `parse_seed.py`; loaded on first startup |
| API Client   | `@workspace/api-client-react` (orval-generated)             | Same package, aliased via Vite to `/app/lib/api-client-react/src/index.ts`; `setBaseUrl` + `setAuthTokenGetter` wired up |
| Assets       | `attached_assets/` (3D `.glb` models, region/category icons)| Same; aliased as `@assets` in Vite                                     |

## 4. Core User Personas

1. **Visitor (unauthenticated)** — browses Home, Explore map, and Site Detail pages.
2. **Pilgrim (registered user)** — logs visits/prayers per site and curates a personal Collection.
3. **Admin** (env-controlled via `ADMIN_EMAIL`) — can edit any site, place / remove hotspots, and lock camera framing on the 3D viewer.

## 5. Endpoints (all under `/api`)

### Public
- `GET /healthz`
- `GET /sites` · `GET /sites/featured` · `GET /sites/by-region`
- `GET /sites/{id}` (returns site + nested hotspots)
- `GET /sites/{id}/hotspots`

### Auth
- `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`

### Authenticated user
- `GET /auth/logs` · `POST /auth/logs/{site_id}`
- `GET /collections` · `POST /collections/{site_id}` · `DELETE /collections/{site_id}`

### Admin-only (requires `ADMIN_EMAIL` match)
- `PATCH /sites/{site_id}`
- `POST /sites/{site_id}/hotspots` · `DELETE /sites/{site_id}/hotspots/{hotspot_id}`

## 6. What's Implemented (2026-01-30)

- ✅ Full backend FastAPI rewrite with 14 routes, ObjectId-safe serialisation, idempotent seeding
- ✅ Admin user auto-seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- ✅ All 52 sites + 12 hotspots imported losslessly from Postgres seed
- ✅ Frontend ported into `/app/frontend` with standalone `yarn` (no pnpm workspace) and a `start` script that runs `vite --port 3000 --host 0.0.0.0`
- ✅ Vite aliases: `@`, `@assets`, `@workspace/api-client-react`
- ✅ Auth migrated to JWT Bearer tokens (`localStorage` key `muslim_world_token`)
- ✅ Orval-generated React Query hooks (`useListSites`, `useGetSite`, etc.) preserved; the custom-fetch is now configured to inject the Bearer header and prefix `REACT_APP_BACKEND_URL`
- ✅ Protected routes (`/tracker`, `/collection`) redirect to `/auth` when no user is signed in (`ProtectedRoute` component)
- ✅ `data-testid`s added to auth inputs and tracker toggles
- ✅ 25/25 backend tests green (pytest)
- ✅ End-to-end frontend flows verified via Playwright: Home, Explore (Leaflet), Site Detail (3D + hotspots), Auth, Tracker, Collection

## 7. Backlog / Next Steps

### P0
- Add `data-testid` on the bookmark/save button in Explore + Site Detail and on the nav Admin badge.

### P1
- Split `server.py` into routers (`auth.py`, `sites.py`, `hotspots.py`, `collections.py`) once it crosses ~700 lines.
- Lock down CORS `allow_origins` to the production host.
- Add bcrypt cost knob via env var.

### P2
- Multi-admin support (replace email-based check with `isAdmin` flag on user docs).
- Token revocation list for server-side logout.
- Pre-render the Leaflet map at edge to improve first-contentful-paint.
- Add an Arabic/RTL language toggle.
- Server-rendered Open Graph cards per site (great for shareability).

## 8. Files of Reference

- `/app/backend/server.py` — full FastAPI app
- `/app/backend/parse_seed.py` — one-shot Postgres → JSON seed converter
- `/app/backend/seed_data.json` — 52 sites + 12 hotspots
- `/app/frontend/src/main.tsx` — wires `setBaseUrl` + `setAuthTokenGetter`
- `/app/frontend/src/lib/api.ts` — `apiFetch`, `getAuthToken`, `setAuthToken`, `API_BASE_URL`
- `/app/frontend/src/context/AuthContext.tsx` · `CollectionContext.tsx`
- `/app/frontend/src/components/ProtectedRoute.tsx`
- `/app/frontend/vite.config.ts`
- `/app/memory/test_credentials.md` — admin + test-user credentials
