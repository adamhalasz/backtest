# Admin Service

Admin dashboard for the backtest platform. Provides admin-only access to:
- Manual ingestion triggers
- Realtime ingestion monitoring
- System administration

## Admin Access

Only users with the `admin` role can access this service.

### Setting Up an Admin User

In development, a default admin user is auto-created (see backend `DEFAULT_ADMIN_EMAIL` env var).

In production, grant admin role via SQL:
```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (default port: 5174)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:8788
```

## Features

### Realtime Monitoring
The dashboard connects to a Server-Sent Events (SSE) endpoint at `/api/admin/ingestion/events` to receive live updates about:
- Ingestion job status
- Rows written
- Errors and warnings

### Manual Ingestion
Trigger data ingestion for specific symbols:
- Select symbol (e.g., BTC-USD)
- Choose date range
- Monitor progress in realtime

## Security

- All routes require admin authentication
- Session-based auth using better-auth
- Admin role is enforced at the API level
- No signup endpoint for admins (must be manually created)
