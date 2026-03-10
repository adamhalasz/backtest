#!/bin/bash
set -e

echo "🚢 Deploying admin..."
echo "Building..."
pnpm --filter @backtest/admin build
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy services/admin/dist --project-name=backtest-admin
echo "✅ Admin deployed successfully!"
