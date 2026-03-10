# Backtest Monorepo

This repository is organized as separate services under `services/`.

## Layout

- `services/frontend` — Vite + React client
- `services/backend` — Cloudflare Workers + Hono API
- `shared` — shared types and non-UI utilities
- `docs` — repository-level docs and archived legacy assets

## Local Development

Frontend:

```bash
cd services/frontend
pnpm dev
```

Backend:

```bash
cd services/backend
pnpm dev
```

## Validation

Frontend:

```bash
cd services/frontend
pnpm check
```

Backend:

```bash
cd services/backend
pnpm check
```