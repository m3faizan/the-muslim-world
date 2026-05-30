# Test Credentials — The Muslim World

## Admin User
- **Email:** `admin@muslimworld.app`
- **Password:** `Admin@MuslimWorld2026`
- **Role:** admin (granted via `ADMIN_EMAIL` env var in `/app/backend/.env`)
- Admin can edit sites, lock camera positions, and create/delete hotspots on site detail pages.

## Test Sign-up
- Any email + password (≥8 chars) + display name can register via `POST /api/auth/register` or the `/auth` page.
- Tokens are JWTs returned in the response `token` field; the frontend stores them in `localStorage` (`muslim_world_token`) and sends them as `Authorization: Bearer <token>`.

## Auth Endpoints
- `POST /api/auth/register` — `{ email, password, displayName }` → `{ id, email, displayName, isAdmin, token }`
- `POST /api/auth/login` — `{ email, password }` → `{ id, email, displayName, isAdmin, token }`
- `POST /api/auth/logout` — stateless; clears token on client
- `GET /api/auth/me` — Bearer token required; returns current user
- `GET /api/auth/logs` — list user's visited/prayed flags per site
- `POST /api/auth/logs/{site_id}` — `{ visited?, prayed? }` upsert
- `GET /api/collections` — list saved site IDs
- `POST /api/collections/{site_id}` — save site
- `DELETE /api/collections/{site_id}` — un-save site

## Admin-Only Endpoints
- `PATCH /api/sites/{site_id}` — edit any site field
- `POST /api/sites/{site_id}/hotspots` — add hotspot
- `DELETE /api/sites/{site_id}/hotspots/{hotspot_id}` — remove hotspot
