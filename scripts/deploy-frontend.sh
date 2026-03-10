#!/bin/bash
set -e

FRONTEND_PAGES_PROJECT="${FRONTEND_PAGES_PROJECT:-quantago-app}"

echo "🚢 Deploying frontend..."
echo "Building..."
pnpm --filter @quantago/frontend build
echo "Ensuring Cloudflare Pages project exists..."
npx wrangler pages project create "$FRONTEND_PAGES_PROJECT" --production-branch main || true
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy services/frontend/dist --project-name="$FRONTEND_PAGES_PROJECT"
echo "✅ Frontend deployed successfully!"
