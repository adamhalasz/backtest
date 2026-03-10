# Backend Setup

This project now uses a dedicated Cloudflare Workers backend under `services/backend/`.

## Stack

- `Hono` for the HTTP API
- `Neon` for PostgreSQL storage
- `Better Auth` for authentication
- `Cloudflare Workers` for deployment/runtime

## Local Development

1. Copy `services/backend/.dev.vars.example` to `services/backend/.dev.vars`.
2. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `FRONTEND_ORIGIN`.
3. For CLI-triggered ingestion, also set `INGESTION_ADMIN_SECRET`.
4. Apply the app tables in `services/backend/src/db/migrations/0001_init.sql` to your Neon database.
5. Apply the Better Auth tables in `services/backend/src/db/migrations/0002_better_auth.sql` to your Neon database.
6. Start the worker with `cd services/backend && pnpm dev`.
7. Start the frontend with `cd services/frontend && pnpm dev`.

Use `http://localhost:8787` for `BETTER_AUTH_URL` in local development because Better Auth runs on the worker, not on the Vite frontend. Local loopback frontend ports such as `5173` and `5175` are also accepted during development so auth keeps working when Vite shifts ports.

## Auth Notes

- Better Auth is mounted at `/api/auth/*`.
- The frontend uses the React Better Auth client from `src/lib/auth-client.ts`.
- The app shell includes a basic email/password sign-in page at `/auth`.

## API Notes

- Frontend persistence is routed through `src/lib/api-client.ts`.
- Vite proxies `/api` to `http://localhost:8787` in local development.
- Market data requests are served through the worker via a provider pattern. The default provider is Yahoo Finance and currently supports forex, crypto, and stock symbols while preserving the existing tick-shaped API response.
- Backtests are now queued onto a Cloudflare Workflow through `POST /api/backtests`. The request stores a pending backtest record immediately, the workflow runs the strategy server-side using provider-backed candles, and the record transitions through `pending`, `running`, `completed`, or `failed`.
- Bots now expose an authenticated on-demand runner at `POST /api/bots/:id/run`. The first implementation evaluates `Momentum Strategy`, uses the bot's stored `symbol`, `assetClass`, `provider`, and `timeframe`, and stores a `lastRun` summary in the bot `parameters` JSON.

## Ingestion

The ingestion pipeline stores OHLCV bars in ClickHouse and keeps ingestion metadata and logs in Neon.

- Forex minute data is ingested from FX-1-Minute-Data / HistData.
- Stock ingestion uses Yahoo-backed historical fetches.
- Crypto ingestion uses CCXT-backed exchange OHLCV fetches and writes the cached bars into ClickHouse.
- ClickHouse is the archive provider used by the backend for stored market-data reads.
- The default crypto archive source is Binance spot via CCXT. Symbols like `BTC-USD` are resolved to exchange pairs like `BTC/USDT` for ingestion.

Local CLI usage:

```bash
cd services/backend
pnpm ingest:schema
pnpm ingest:forex
pnpm ingest:logs
```

The general command is:

```bash
cd services/backend
pnpm ingest -- <command> [options]
```

Supported commands:

- `schema`
- `bulk --assetType forex|crypto|stock --timeframe 1m|1h|1d [--symbols EUR/USD,GBP/USD]`
- `incremental --assetType forex|crypto|stock --timeframe 1m|1h|1d [--symbols EUR/USD]`
- `backfill --symbol EUR/USD --assetType forex --timeframe 1m [--fromDate 2024-01-01T00:00:00.000Z]`
- `logs [--assetType forex|crypto|stock] [--symbol EUR/USD] [--limit 20]`
- `symbols`

The script reads `INGESTION_ADMIN_SECRET` from `.dev.vars` and sends it as `x-ingestion-admin-secret`, so you do not need a browser auth cookie for local runs.

CCXT is now part of the historical crypto ingestion path.

- The workflow uses one CCXT exchange instance per symbol fetch so the library's built-in rate limiter stays effective.
- Workflow throttling is source-aware: Yahoo and CCXT use separate delay and batch-cooldown settings.
- You can tune crypto ingestion with `CCXT_EXCHANGE`, `CCXT_DELAY_MS`, `CCXT_BATCH_COOLDOWN_MS`, and `CCXT_MAX_RETRIES`.
- If you need a non-default exchange or symbol mapping for a stored ingestion symbol, set `metadata.exchangeId`, `metadata.sourceSymbol`, `metadata.availableFrom`, `metadata.supportedTimeframes`, and optionally `metadata.rateLimitMs` through the ingestion symbol admin API.