#!/bin/bash
set -e

DOCS_PAGES_PROJECT="${DOCS_PAGES_PROJECT:-quantago-docs}"

echo "🚢 Deploying docs..."
echo "Building..."
pnpm --filter @quantago/docs build
echo "Ensuring Cloudflare Pages project exists..."
npx wrangler pages project create "$DOCS_PAGES_PROJECT" --production-branch main || true
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy services/docs/build --project-name="$DOCS_PAGES_PROJECT"
echo "✅ Docs deployed successfully!"