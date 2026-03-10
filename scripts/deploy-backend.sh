#!/bin/bash
set -e

echo "🚢 Deploying backend..."
cd services/backend
npx wrangler deploy
cd ../..
echo "✅ Backend deployed successfully!"
