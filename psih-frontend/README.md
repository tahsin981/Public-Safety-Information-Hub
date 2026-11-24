# Public Safety Information Hub (PSIH): Frontend

React 18 + Vite + TypeScript client for the **CADMS backend** (Express/Prisma/PostgreSQL, JWT Bearer auth).

## Quick start
```bash
cp .env.example .env        # set VITE_API_URL (must end with /api)
npm install
npm run dev                 # http://localhost:5173 (already in backend CORS_ORIGINS)
npm run typecheck && npm run lint && npm test && npm run build
```

## Architecture decisions
| Concern | Choice | Why |
|---|---|---|
| Routing | React Router v6, lazy staff routes, `RequireRole` guard | Citizens never download staff code; backend still enforces roles |
| Server state | TanStack Query | Caching, retries (no retry on 4xx), polling every 30 s for staff views |
| Client state | React Context (auth only) | Only the session is global; everything else is server state |
| Styling | Plain CSS + design tokens (`src/styles/global.css`) | Zero runtime, easy to port to Tailwind later |
| Motion | Framer Motion, `MotionConfig reducedMotion="user"` | Respects OS "reduce motion" |
| Forms | Zod schemas mirroring backend rules + server `details[]` mapping | Instant feedback; server errors land on the right field |
| Map | Leaflet + OpenStreetMap, lazy-loaded | Uses `Thana.latitude/longitude`; "nearest station" via Geolocation API |
| Tests | Vitest + React Testing Library | Schemas and accessible-error behaviour covered |

## Repo structure
```
src/api        fetch client (Bearer token, ApiError, 401 handler) + React Query hooks
src/auth       AuthProvider, RequireRole
src/components Layout, Logo, UI kit (Button/Input/Select/Textarea/Pill/Modal), StationMap, AssignDialog, ReviewDialog
src/pages      Home, Login, Register, NewComplaint, Complaints, ComplaintDetail, Investigations, CrimeAnalysis, Dashboard, AuditLogs, AdminUsers, AdminOfficers, AdminStations
src/lib        types, zod schemas, geo helpers
src/styles     design tokens + global styles
```

## API contract used (from the provided backend)
Envelope: `{ success, message?, data, pagination?: {page,limit,total,pages} }`; errors: `{ success:false, message, details?: [{field,message}] }`.

| Screen | Calls | Roles |
|---|---|---|
| Sign in / register | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout` | public / any |
| Stations + map | `GET /thanas` | public |
| Report incident | `POST /complaints` | any signed-in (UI offers it to COMMON) |
| Complaints list | `GET /complaints?page&limit&status` (COMMON sees own) | any |
| Change status | `PATCH /complaints/:id/status` | ADMIN, DUTYOFFICER, OC |
| Withdraw | `DELETE /complaints/:id` | COMMON, only while PENDING |
| Dashboard | `GET /dashboard` | ADMIN, DUTYOFFICER, OC, CRIMEANALYST |
| Audit log | `GET /audit-logs` | ADMIN |
| Admin: users | `GET/POST /users`, `PATCH/DELETE /users/:id` | ADMIN |
| Admin: officers | `GET /officers`, `POST /officers`, `PATCH/DELETE /officers/:id` | ADMIN |
| Admin: stations | `POST /thanas`, `PATCH/DELETE /thanas/:id` (list is public) | ADMIN |
| Complaint detail (evidence, assignment history, reviews) | `GET /complaints/:id` | any (COMMON: own only) |
| Add evidence reference | `POST /evidence` | ADMIN, DUTYOFFICER, SI |
| Assign / reassign SI (opens investigation, sets complaint SUBMITTED) | `GET /officers?thana_code`, `POST /assignments` | ADMIN, DUTYOFFICER, OC |
| Investigations list + status | `GET /investigations`, `PATCH /investigations/:id/status` | list: ADMIN, DUTYOFFICER, SI, OC; edit: ADMIN, SI (own cases), OC |
| OC review (red/green flag) | `POST /reviews` | ADMIN, OC |
| Crime risk analysis | `GET /crime-analysis`, `POST /crime-analysis` | read: ADMIN, CRIMEANALYST, OC; write: ADMIN, CRIMEANALYST |

**Officer accounts must be linked.** Non-admin staff endpoints are scoped to the officer's own station, and the backend returns 403 ("Your account is not linked to a police officer", or "role does not match your officer rank") unless an ADMIN has set the user's `employee_code` to a `Thana_officer.employee_id` whose rank equals the user's role. The Admin > Users screen flags staff accounts that still need a link, and blocks saving a link whose officer rank differs from the chosen role. The UI shows backend messages as-is.

**Onboarding order for a new station:** Admin > Stations (create) → Officers (create, rank SI/OC/etc.) → Users (create or edit the account, set role = officer rank and pick the linked officer).

**Schema quirk to confirm with your supervisor:** `Thana_info.district` is `@unique` in the Prisma schema, so the database allows only one station per district. That is probably unintended (a district normally has many thanas). If so, remove `@unique` from `district` and migrate; the frontend needs no change. OCs review as their own `employee_code`; ADMINs pick an OC from the station.

**Not yet built (backend routes exist):** a standalone evidence list (`GET /evidence`; evidence is shown on each complaint detail page instead). Follow the same pattern: add a hook in `api/hooks.ts`, a page, and a `RequireRole` route.

## Security notes
- Backend returns a Bearer JWT (no cookie), so the token is kept in `sessionStorage`. Any XSS could read it; React escapes output and there is no `dangerouslySetInnerHTML`. If you can change the backend, prefer an httpOnly, SameSite cookie.
- Backend logout does not revoke the JWT; the client discards it. Expired/invalid tokens (401) clear the session automatically.
- Set a strict CSP at the host (`default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; style-src 'self' 'unsafe-inline'; connect-src 'self' <api-origin>`).
- Evidence upload is not implemented: the backend only stores a `file_path` string. Add private storage + signed URLs first.
- Role checks in the UI are cosmetic; the backend is the authority. Evidence references are rendered as plain text, never as links, so a stored `javascript:` or `file:` value cannot execute. The backend's own README still lists station restriction for complaints (not workflow endpoints) and tamper-resistant audit logs as open items.

## Deployment (Vercel)
1. Import repo, framework preset **Vite**, build `npm run build`, output `dist`.
2. Env var `VITE_API_URL=https://<backend-domain>/api`.
3. Add the deployed frontend origin to the backend's `CORS_ORIGINS`.
`vercel.json` rewrites all paths to `index.html` for client-side routing. Same idea for Netlify (`/* /index.html 200`).

## Branding
`Logo.tsx` / `public/favicon.svg`: original shield + laurel + red-on-green disc + gold star. It is **not** the official Bangladesh Police crest; obtain authorisation before using official insignia.

## Design tokens
Navy `#0b1f3a` / `#14305a`, gold `#c8a24b`, green `#006a4e`, red `#b3162b`, 10px radius, 44px minimum touch targets, visible 2-ring focus, status shown by text + colour.

## Performance & SEO
Route-level code splitting, lazy Leaflet, API caching. Public pages only (home) are indexable; `robots.txt` blocks staff paths. For richer SEO on public pages consider pre-rendering `/`. Add real OG image and Lighthouse-check before launch.

## Known gaps / next steps
i18n (Bangla), WebSocket/SSE if backend adds it, e2e tests (Playwright), Tailwind or component library if the team prefers.
