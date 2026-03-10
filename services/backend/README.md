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
3. Apply the app tables in `services/backend/src/db/migrations/0001_init.sql` to your Neon database.
4. Apply the Better Auth tables in `services/backend/src/db/migrations/0002_better_auth.sql` to your Neon database.
5. Start the worker with `cd services/backend && pnpm dev`.
6. Start the frontend with `cd services/frontend && pnpm dev`.

Use `http://localhost:8787` for `BETTER_AUTH_URL` in local development because Better Auth runs on the worker, not on the Vite frontend. Local loopback frontend ports such as `5173` and `5175` are also accepted during development so auth keeps working when Vite shifts ports.

## Auth Notes

- Better Auth is mounted at `/api/auth/*`.
- The frontend uses the React Better Auth client from `src/lib/auth-client.ts`.
- The app shell includes a basic email/password sign-in page at `/auth`.

## API Notes

- Frontend persistence is routed through `src/lib/api-client.ts`.
- Vite proxies `/api` to `http://localhost:8787` in local development.
- Market data requests are served through the worker so the browser no longer talks directly to the old database layer.