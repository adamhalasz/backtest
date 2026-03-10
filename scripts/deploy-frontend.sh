#!/bin/bash
set -e

echo "🚢 Deploying frontend..."
echo "Building..."
pnpm --filter @backtest/frontend build
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy services/frontend/dist --project-name=backtest-frontend
echo "✅ Frontend deployed successfully!"
