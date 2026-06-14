# TaskGo ASR test suite

Automated checks for TaskGo **A**vailability, **S**ecurity, and **R**eliability (performance + usability) requirements.

## Layout

| Path | ASR focus |
|------|-----------|
| `integration/auth.test.js` | Security — JWT reject &lt; 100ms |
| `integration/pricing.test.js` | Security — server-side pricing only |
| `integration/concurrency.test.js` | Security — accept race 200/409 |
| `integration/payment.test.js` | Availability — PayOS timeout / `pending_payment` |
| `performance/load-test.js` | Performance — GET &lt; 500ms, POST &lt; 1.5s |
| `performance/socket-latency.js` | Performance — `new_job_available` &lt; 1s |
| `frontend/TaskerAccept.test.tsx` | Usability — `useOrderAcceptGuard` / `acceptingRef` double-tap |

## Prerequisites

- Node.js **18+**
- From repo root:

```bash
cd tests && npm install
```

Backend code is imported from `../backend` (no separate API process needed for integration tests).

### Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `JWT_SECRET` | recommended | set in `setup.integration.js` | Auth signing |
| `REPOSITORY_DRIVER` | no | `inMemory` | Persistence for API tests |
| `PAYOS_MOCK_TIMEOUT_MS` | no | `5000` | Payment timeout budget |
| `RUN_MONGO_TESTS` | for Mongo suite | — | Set `true` to run `concurrency` Mongo block |
| `MONGODB_URI` | if `RUN_MONGO_TESTS=true` | — | Real DB for atomic accept |
| `LOAD_TEST_SAMPLES` | no | `5` | Load-test iteration count |

Example Mongo concurrency run:

```bash
export RUN_MONGO_TESTS=true
export REPOSITORY_DRIVER=mongo
export MONGODB_URI=mongodb://127.0.0.1:27017/taskgo_test
cd tests && npm run test:integration -- integration/concurrency.test.js
```

## Kết quả test (lưu file)

Mỗi lần chạy (Jest hoặc performance scripts) **append thêm một dòng/lần** vào:

| File | Nội dung |
|------|----------|
| [`tests/results/test-runs.log`](results/test-runs.log) | Log dạng text, dễ đọc (có timestamp, suite, pass/fail) |
| [`tests/results/test-runs.jsonl`](results/test-runs.jsonl) | Một object JSON mỗi dòng — tiện parse / CI |
| [`tests/results/asr-metrics.jsonl`](results/asr-metrics.jsonl) | Metric từng kịch bản ASR (ms, trạng thái) |
| **[`tests/reports/asr_report.md`](reports/asr_report.md)** | **Báo cáo Utility Tree** — cập nhật sau mỗi lần chạy test |

Sau khi chạy, terminal in:
- `[test-results] Appended run → .../test-runs.log`
- `[asr-report] Written → .../reports/asr_report.md`

Sinh lại báo cáo thủ công: `npm run report:asr --prefix tests`

Các `suite` ghi nhận: `integration`, `frontend`, `performance:load`, `performance:socket`.

## Commands

From repository root:

```bash
npm test                    # all Jest projects (integration + frontend)
npm run test:integration --prefix tests
npm run test:frontend --prefix tests
npm run test:performance:load --prefix tests
npm run test:performance:socket --prefix tests
```

Or from `tests/`:

```bash
npm test
npm run test:performance:load
npm run test:performance:socket
```

## Notes

- **Auth &lt; 100ms** is measured with `performance.now()` around Supertest; run on a quiet machine for stable results.
- **Payment timeout** uses `POST /api/orders/:id/pay` with `{ "simulateTimeout": true }`, which exercises `Promise.race` in `backend/src/modules/payment/payment.service.js`.
- **Socket latency** starts 5 tasker Socket.IO clients, patches `services` to the order’s `serviceId`, then creates an order via HTTP and measures time until each client receives `new_job_available`.
- **Frontend test** targets `frontend/hooks/useOrderAcceptGuard.ts`, used by `OrderRequestDetailScreen`.
