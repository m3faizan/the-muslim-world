# The Muslim World

An immersive, interactive Islamic heritage web app — a 3D globe explorer with clickable markers for Islamic sites, and detailed site pages with 3D mosque models and annotated hotspots.

## Run & Operate

- `pnpm --filter @workspace/muslim-world run dev` — run the frontend (Vite dev server)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, wouter (routing)
- 3D Globe: react-globe.gl (Three.js globe)
- 3D Models: @react-three/fiber + @react-three/drei (procedural mosque models)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/sites.ts` — DB schema: sites + hotspots tables
- `artifacts/api-server/src/routes/sites.ts` — API routes: sites, hotspots, featured, by-region
- `artifacts/muslim-world/src/pages/Home.tsx` — Landing page
- `artifacts/muslim-world/src/pages/Explore.tsx` — 3D globe explorer
- `artifacts/muslim-world/src/pages/SiteDetail.tsx` — Site detail with 3D mosque model + hotspots

## Architecture decisions

- The 3D mosque on the site detail page is built procedurally from Three.js primitives (no GLTF files needed). Each hotspot is a glowing sphere in the 3D scene.
- react-globe.gl wraps Three.js — the globe uses night earth + space background textures from three-globe's unpkg CDN.
- All site data and hotspots are served from the Express API backed by PostgreSQL. No static JSON.
- Routes are ordered carefully in Express: `/sites/featured` and `/sites/by-region` come before `/sites/:id` to avoid the param catching those paths.

## Product

- **Home page**: Hero with stats, featured Islamic sites grid, region groupings, and CTA
- **Explore**: Full-screen 3D globe with golden markers for 14 Islamic heritage sites across 6 regions. Hover for tooltip, click to open site detail. Sidebar with filtering by region or featured.
- **Site Detail**: 3D procedural mosque model with glowing hotspot markers. Click any hotspot (minaret, dome, mihrab, etc.) to reveal detailed description. Full site info panel with significance, architectural style, and history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before using the updated types
- The `/sites/featured` and `/sites/by-region` routes MUST be registered before `/sites/:id` in Express or the param captures them
- react-globe.gl uses `window` — don't SSR it
- `useGetSite` requires `queryKey` in the query options (tanstack query constraint)
- **Sessions / cookies**: The Replit proxy terminates HTTPS but Express sees plain HTTP. `app.set("trust proxy", 1)` is required. Cookie must be `SameSite=None; Secure` (controlled by `needsSecureCookie` in `app.ts` which checks `REPLIT_DOMAINS`). Without `trust proxy`, express-session skips setting `Secure` cookies.
- **Session table**: `connect-pg-simple`'s `createTableIfMissing: true` is unreliable — `index.ts` calls `ensureSessionTable()` at startup which runs `CREATE TABLE IF NOT EXISTS "session" ...` via the pool before the server begins listening.
- **Admin email**: Set `ADMIN_EMAIL` env var to grant admin access (annotation editor on site detail pages). Checked at runtime via `isAdmin()` in `auth.ts`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
