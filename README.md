# TaskGo Backend

Modular monolithic **Node.js (ESM)** / **Express 5** API with **Socket.IO**, **Joi** validation, **Pino** logging, and a **repository layer** (in-memory or MongoDB).

## Architecture

```
src/
├── config/              # env (Joi), JWT, database, repositories
├── container.js         # Dependency injection wiring
├── repositories/
│   ├── inMemory/        # Dev/test driver
│   └── mongo/           # MongoDB driver
├── migrations/          # Schema migration runner + versioned migrations
├── seed/                # Deterministic demo fixtures + idempotent upsert
├── models/              # Mongoose models
├── modules/             # auth, user, order, payment, earningTasker, chat, review
├── events/              # Async event bus + socket handler subscriptions
├── middlewares/         # auth, RBAC, validate, idempotency, errors
├── socket/              # Socket.IO hub, chat handlers
├── health/              # liveness / readiness
├── mock/seed.js         # Re-exports core seed (backward compat)
└── app.js               # HTTP + graceful shutdown
scripts/
├── migrate.js           # npm run migrate
├── seed.js              # npm run seed
└── reset-db.js          # npm run reset-db
```

## Quick start (in-memory)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

| Resource | URL |
|----------|-----|
| API base | `http://localhost:4000/api` |
| Swagger UI | `http://localhost:4000/api/docs` |
| Health | `GET /api/health` |
| Readiness | `GET /api/health/ready` |

## Quick start (MongoDB)

```bash
cd backend
cp .env.example .env
# Set MONGODB_URI and REPOSITORY_DRIVER=mongo
npm install
npm run migrate    # indexes + schema_migrations ledger
npm run seed       # idempotent demo data
npm run dev
```

Fresh database in one step:

```bash
npm run reset-db   # drop DB → migrate → full seed
```

## Environment

Configuration is validated at process startup (fail-fast). See [`.env.example`](.env.example).

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** (no default) | Signing key; min 16 chars, **min 32 in production** |
| `REPOSITORY_DRIVER` | No (default `inMemory`) | `inMemory` or `mongo` only |
| `MONGODB_URI` | **Yes when `REPOSITORY_DRIVER=mongo`** | Atlas/local URI; also required for `migrate` / `seed` / `reset-db` |
| `CORS_ORIGIN` | No (default `*` in dev/test) | **Cannot be `*` when `NODE_ENV=production`** |
| `PAYOS_CLIENT_ID` | For real checkout | payOS Merchant client ID |
| `PAYOS_API_KEY` | For real checkout | payOS API key |
| `PAYOS_CHECKSUM_KEY` | For real checkout | payOS checksum / webhook key |
| `PAYOS_RETURN_URL` | No | Return URL after checkout (default `taskgo://payment/return`) |
| `PAYOS_CANCEL_URL` | No | Cancel URL (default `taskgo://payment/cancel`) |
| `PAYOS_MOCK_FAIL_RATE` | No | Random failure probability (0–1) for mock `/orders/:id/pay` |
| `NEARBY_TASKER_RADIUS_KM` | No | Geo filter for `new_order` socket broadcast |

On boot the API logs **startup configuration** (no secrets): `nodeEnv`, `repositoryDriver`, `mongoEnabled`, `corsMode`.

## Database scripts

| Command | Description |
|---------|-------------|
| `npm run migrate` | Apply pending migrations (tracked in `schema_migrations`) |
| `npm run migrate -- --status` | Show applied / pending migrations |
| `npm run migrate -- --dry-run` | List pending without applying |
| `npm run migrate -- --rollback` | Roll back last migration (index migration is no-op on down) |
| `npm run seed` | **Idempotent** upsert of full demo dataset |
| `npm run seed -- --core` | Upsert only core accounts + pending order |
| `npm run seed -- --if-empty` | Skip if any users already exist |
| `npm run seed -- --dry-run` | Print counts only |
| `npm run reset-db` | **Drop database** → migrate → full seed |
| `npm run mongo:smoke` | Connectivity ping |

## Seed users (password: `password123`)

### Core accounts (always preserved)

| Email | Role | Notes |
|-------|------|-------|
| admin@taskgo.app | admin | |
| customer@taskgo.app | customer | |
| tasker1@taskgo.app | tasker | Online, near sample order |

### Additional demo accounts (`npm run seed`)

| Email | Role |
|-------|------|
| customer2@taskgo.app | customer |
| customer3@taskgo.app | customer |
| tasker2@taskgo.app | tasker |
| tasker3@taskgo.app | tasker (outside 10 km radius) |

**Sample orders:** `order-sample-pending`, `order-demo-accepted`, `order-demo-in-progress`, `order-demo-completed`, `order-demo-cancelled`

**Demo chats & reviews** are created by `npm run seed` (threads + messages on accepted/completed jobs; reviews on completed work).

## Order state machine

```
pending ──accept──► accepted ──arrive──► arrived ──start──► in_progress ──complete──► completed
   │                    │                      │                    │
   └──── cancel ────────┴──── cancel ──────────┴──── cancel ────────┘

pay (mock) may set pending_payment on failure; paymentStatus tracked separately
```

## API endpoints

All protected routes require `Authorization: Bearer <JWT>` unless noted.

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register (`customer` or `tasker`) |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create (`pending`) |
| POST | `/api/orders/:id/accept` | Accept (409 race; idempotent for same tasker) |
| POST | `/api/orders/:id/pay` | Mock PayOS |

### payOS (real gateway)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payment/create` | Customer / admin JWT | Create checkout link (`orderId`, `amount` VND); stores `payosOrderCode` on order |
| POST | `/api/payment/webhook` | **Public** (payOS server) | Verify signature, mark order `paymentStatus: paid` |
| GET | `/api/payment/status/:orderId` | Customer / admin JWT | Poll payment status after WebView closes |

Register webhook URL in payOS dashboard: `https://<your-api>/api/payment/webhook` (use `payos.webhooks.confirm()` once in dev).

**Idempotency:** `Idempotency-Key` on accept and pay.

See Swagger at `/api/docs` for the full surface.

## Socket.IO

Connect with `auth: { token: "<JWT>" }`. Events include `new_order`, `order_status_updated`, `tasker_assigned`, `payment_failed`, `chat:message`, `review_created`.

## Testing

```bash
npm test
```

Uses `REPOSITORY_DRIVER=inMemory` and core seed data automatically.

## Postman

Import [`docs/taskgo.postman_collection.json`](docs/taskgo.postman_collection.json).

## PM2

```bash
npm run pm2:start
```

## Local development workflow

1. Copy `.env.example` → `.env`.
2. **In-memory only:** `npm run dev` (no Mongo required).
3. **MongoDB:**
   - Set `REPOSITORY_DRIVER=mongo` and `MONGODB_URI` (startup fails immediately if either is missing).
   - First time: `npm run reset-db` or `npm run migrate && npm run seed`.
   - Day-to-day: `npm run dev` (auto-seeds core data if DB empty).
   - After schema changes: `npm run migrate`.
   - Refresh demo content without dropping: `npm run seed` (safe to re-run).

## Production deployment notes

1. Provision MongoDB (replica set recommended for payment/review transactions).
2. Set secrets via environment — never commit `.env`:
   - `JWT_SECRET` — cryptographically random, ≥ 32 characters
   - `MONGODB_URI` — with `REPOSITORY_DRIVER=mongo`
   - `CORS_ORIGIN` — explicit frontend origin(s), e.g. `https://app.taskgo.example` (wildcard `*` is **rejected**)
3. On deploy **before** traffic: `npm run migrate` (CI/CD step or init container).
4. Run `npm run seed` only for **staging/demo** environments; production should not auto-seed fake users unless intentional.
5. Verify `GET /api/health/ready` returns `mongodb` + `connected`.
6. Rollback: application code rollback does not reverse migrations; use `npm run migrate -- --rollback` only when a migration supports `down` (index migration is intentionally a no-op on rollback).

### Configuration verification checklist

| Check | Expected |
|-------|----------|
| Required vars set | `JWT_SECRET`; `MONGODB_URI` if `REPOSITORY_DRIVER=mongo` |
| Production CORS | `CORS_ORIGIN` is not `*` |
| Production JWT length | `JWT_SECRET` ≥ 32 characters |
| Startup log | `Startup configuration` with `repositoryDriver`, `mongoEnabled`, `corsMode` |
| Health | `GET /api/health/ready` matches driver state |

**Expected startup failures (by design):**

- Missing `JWT_SECRET` → `Environment validation failed`
- `REPOSITORY_DRIVER=mongo` without `MONGODB_URI` → `MONGODB_URI is required when REPOSITORY_DRIVER=mongo`
- `NODE_ENV=production` + `CORS_ORIGIN=*` → `CORS_ORIGIN cannot be "*"`
- `NODE_ENV=production` + short `JWT_SECRET` → `JWT_SECRET must be at least 32 characters`

**Successful startup examples:**

```bash
# In-memory local
JWT_SECRET=local-dev-only-change-me-min-32-chars!!
REPOSITORY_DRIVER=inMemory
npm run dev

# Mongo local/staging
JWT_SECRET=<random-32+-char-secret>
REPOSITORY_DRIVER=mongo
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://staging.taskgo.example
NODE_ENV=production
npm run migrate && npm start
```

**Migration compatibility:** unchanged — `npm run migrate` / `seed` / `reset-db` still require `MONGODB_URI` via CLI scripts; app mongo mode enforces the same URI at startup.

**Rollback plan:** revert deployment image; env hardening is backward-compatible if all required vars remain set. Removing `JWT_SECRET` or mongo URI will correctly prevent boot until fixed.
