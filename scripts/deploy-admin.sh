#!/bin/bash
set -e

ADMIN_PAGES_PROJECT="${ADMIN_PAGES_PROJECT:-quantago-admin}"

echo "🚢 Deploying admin..."
echo "Building..."
pnpm --filter @quantago/admin build
echo "Ensuring Cloudflare Pages project exists..."
npx wrangler pages project create "$ADMIN_PAGES_PROJECT" --production-branch main || true
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy services/admin/dist --project-name="$ADMIN_PAGES_PROJECT"
echo "✅ Admin deployed successfully!"
