# Criminal Act Database Management System (CADMS) — Backend

Node.js + Express + PostgreSQL + Prisma REST API. Postman collection is in `postman/CADMS.postman_collection.json`; Vercel entry point is `api/index.js`.

## 1. Requirements

- Node.js 20 LTS or newer
- PostgreSQL 14+ (local or hosted)
- npm
- Postman
- A Vercel account for deployment

## 2. Install locally

```bash
npm install
```

Copy `.env.example` to `.env`, then update `DATABASE_URL`, `JWT_SECRET`, and seed-admin values. Never commit `.env`.

Example local database URL:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/cadms?schema=public"
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
JWT_EXPIRES_IN="8h"
PORT=5000
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

Create a PostgreSQL database named `cadms` first, or use a hosted PostgreSQL connection string.

## 3. Create the database schema

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

If Prisma reports a relation or migration error, resolve it before proceeding. Do not use `migrate reset` on a database containing records you need to keep.

Create the bootstrap administrator:

```bash
npm run seed
```

This reads the `SEED_ADMIN_*` variables from `.env`. The seed script hashes the password using bcrypt. Change the example password before running it.

Start the API:

```bash
npm run dev
```

Check `http://localhost:5000/api/health`.

## 4. Postman testing

Import `postman/CADMS.postman_collection.json` into Postman.

1. Set `baseUrl` to `http://localhost:5000`.
2. Run `Health`.
3. Run `Login` with the seeded administrator credentials.
4. Copy `data.token` from the response into the collection's `token` variable.
5. Run authorized endpoints. For a COMMON account, register a new user and log in with that account.
6. Create a police station before creating complaints. Example station code `CTG-001` must exist in the database.
7. Create an officer record before assigning an SI or recording an OC review.

For protected routes, use:
`Authorization: Bearer <token>`

## 5. API route overview

All routes are prefixed with `/api`.

### Health and authentication

| Method | Endpoint | Access |
|---|---|---|
| GET | `/health` | Public |
| POST | `/auth/register` | Public; creates COMMON role only |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |
| POST | `/auth/logout` | Authenticated; records logout, client must discard JWT |

### Users

| Method | Endpoint | Access |
|---|---|---|
| GET | `/users` | ADMIN |
| GET | `/users/:id` | ADMIN |
| POST | `/users` | ADMIN |
| PATCH | `/users/:id` | ADMIN |
| DELETE | `/users/:id` | ADMIN |

### Police stations

| Method | Endpoint | Access |
|---|---|---|
| GET | `/thanas` | Public |
| GET | `/thanas/:id` | Public |
| POST | `/thanas` | ADMIN |
| PATCH | `/thanas/:id` | ADMIN |
| DELETE | `/thanas/:id` | ADMIN |

### Officers

| Method | Endpoint | Access |
|---|---|---|
| GET | `/officers` | Authenticated |
| GET | `/officers/:id` | Authenticated |
| POST | `/officers` | ADMIN |
| PATCH | `/officers/:id` | ADMIN |
| DELETE | `/officers/:id` | ADMIN |

### Complaints

| Method | Endpoint | Access |
|---|---|---|
| GET | `/complaints?page=1&limit=20` | Authenticated; COMMON sees own |
| GET | `/complaints/:id` | Authenticated; COMMON sees own |
| POST | `/complaints` | Authenticated |
| PATCH | `/complaints/:id/status` | ADMIN, DUTYOFFICER, OC |
| DELETE | `/complaints/:id` | ADMIN or submitter under limited conditions |

Example complaint body:

```json
{
  "thana_code": "CTG-001",
  "area": "Example area",
  "crime_type": "theft",
  "case_description": "A sufficiently detailed description of the incident."
}
```

### Investigation workflow

| Method | Endpoint | Access |
|---|---|---|
| GET | `/dashboard` | ADMIN, DUTYOFFICER, OC, CRIMEANALYST |
| GET | `/evidence` | ADMIN, DUTYOFFICER, SI, OC |
| POST | `/evidence` | ADMIN, DUTYOFFICER, SI |
| GET | `/assignments` | ADMIN, DUTYOFFICER, OC, SI |
| POST | `/assignments` | ADMIN, DUTYOFFICER, OC |
| GET | `/investigations` | ADMIN, DUTYOFFICER, SI, OC |
| PATCH | `/investigations/:id/status` | ADMIN, SI, OC |
| GET | `/reviews` | ADMIN, DUTYOFFICER, OC |
| POST | `/reviews` | ADMIN, OC |
| GET | `/crime-analysis` | ADMIN, CRIMEANALYST, OC |
| POST | `/crime-analysis` | ADMIN, CRIMEANALYST |
| GET | `/audit-logs` | ADMIN |

Example SI assignment body:

```json
{
  "complaint_id": "UUID-FROM-A-COMPLAINT",
  "current_SI_id": "SI-EMPLOYEE-ID"
}
```

Example investigation status body:

```json
{
  "investigation_status": "solved"
}
```

Example OC review body:

```json
{
  "investigation_id": "UUID-FROM-AN-INVESTIGATION",
  "oc_id": "OC-EMPLOYEE-ID",
  "flag": "green"
}
```

Example crime-analysis body:

```json
{
  "thana_code": "CTG-001",
  "crime_type": "theft",
  "period_start": "2026-01-01T00:00:00.000Z",
  "period_end": "2026-01-31T23:59:59.000Z",
  "risk_level": "medium"
}
```

## 6. Role model

The `Role` enum in the provided schema is used for API permissions:
- `COMMON`: submit complaints and view their own complaints.
- `ADMIN`: administer accounts, stations, officers, and access system-wide management endpoints.
- `DUTYOFFICER`: view/manage complaint workflow and assign SI officers.
- `SI`: view investigation workflow and add evidence/update investigations.
- `OC`: review cases and manage authorized workflow actions.
- `CRIMEANALYST`: access crime-analysis endpoints.

These are initial project rules and should be confirmed with your lecturer/project requirements. The role attached to a user is separate from `Thana_officer.rank`; creating an officer does not automatically create a login account. An administrator can link them by setting `employee_code` to the officer's `employee_id`.

## 7. Vercel deployment

1. Push the project to a private or public Git repository.
2. Import the repository into Vercel.
3. Set environment variables in Vercel Project Settings:
   - `DATABASE_URL` — hosted PostgreSQL URL accessible from Vercel.
   - `JWT_SECRET` — strong random secret, at least 32 characters.
   - `JWT_EXPIRES_IN` — e.g. `8h`.
   - `NODE_ENV` — `production`.
   - `CORS_ORIGINS` — your deployed frontend origins, comma-separated.
4. Deploy.
5. Run migrations against the production database from your development machine/CI environment using the production database URL:
   `npx prisma migrate deploy`
6. Run the seed script securely once if you need to create the initial admin. Do not leave the seed password set to an example value.
7. Test `https://YOUR-VERCEL-DOMAIN/api/health` and then use that domain as Postman's `baseUrl`.

**Important:** Vercel functions are serverless. Use a hosted PostgreSQL provider with connection pooling or a provider-supported pooled URL when appropriate. Do not rely on a local database or local file uploads in production. The API currently stores evidence references only; configure private object storage and signed URLs if users must upload actual evidence files.

## 8. Schema design notes

The supplied schema was adapted for a consistent Prisma 6 setup:
- Generator uses `prisma-client-js`, with Prisma's default generated-client location.
- PostgreSQL connection URL is explicitly read from `DATABASE_URL`.
- User-to-officer relation uses `onDelete: SetNull` because `employee_code` is optional; deleting an officer should not unexpectedly delete a login account.
- Foreign-key deletion behavior is explicit for core relationships.
- Audit log indexes support user/time and action/entity queries.

The original schema's table names and intended entities are preserved. Review these decisions with your supervisor before using the schema for a final submission.

## 9. Before final submission

This is a functional starter backend, not a certified police information system. Before real deployment:
- Add tests for all authorization paths and workflow transitions.
- Restrict records by station and assignment where required; role-only access is not enough for sensitive records.
- Add password-reset and account-lockout procedures.
- Add actual private evidence storage, malware scanning, file-size limits, and signed access URLs if uploads are needed.
- Make audit logs tamper-resistant and define retention rules.
- Define formal complaint-status transition rules and the crime-risk scoring method.
- Add database backups, monitoring, and incident-response procedures.
- Avoid real citizen information in development or demonstrations.
