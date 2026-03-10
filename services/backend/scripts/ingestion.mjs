import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const devVarsPath = resolve(process.cwd(), '.dev.vars');

const parseDevVars = (source) => {
  const entries = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
};

const envFromFile = existsSync(devVarsPath) ? parseDevVars(readFileSync(devVarsPath, 'utf8')) : {};
const getEnv = (name, fallback) => process.env[name] ?? envFromFile[name] ?? fallback;

const apiBaseUrl = getEnv('INGESTION_API_BASE_URL', 'http://127.0.0.1:8787');

const [command = 'help', ...restArgs] = process.argv.slice(2);

const parseArgs = (args) => {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = 'true';
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
};

const args = parseArgs(restArgs);

const splitSymbols = (value) => {
  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const request = async (path, init = {}) => {
  const adminSecret = getEnv('INGESTION_ADMIN_SECRET');

  if (!adminSecret) {
    console.error('Missing INGESTION_ADMIN_SECRET in environment or .dev.vars');
    process.exit(1);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-ingestion-admin-secret': adminSecret,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error(JSON.stringify(data ?? { status: response.status }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
};

switch (command) {
  case 'schema': {
    await request('/api/admin/ingestion/schema/ensure', { method: 'POST' });
    break;
  }
  case 'bulk': {
    await request('/api/admin/ingestion/workflows/bulk', {
      method: 'POST',
      body: JSON.stringify({
        assetType: args.assetType,
        timeframe: args.timeframe,
        symbols: splitSymbols(args.symbols),
      }),
    });
    break;
  }
  case 'incremental': {
    await request('/api/admin/ingestion/workflows/incremental', {
      method: 'POST',
      body: JSON.stringify({
        assetType: args.assetType,
        timeframe: args.timeframe,
        symbols: splitSymbols(args.symbols),
      }),
    });
    break;
  }
  case 'backfill': {
    await request('/api/admin/ingestion/workflows/backfill', {
      method: 'POST',
      body: JSON.stringify({
        symbol: args.symbol,
        assetType: args.assetType,
        timeframe: args.timeframe,
        fromDate: args.fromDate,
      }),
    });
    break;
  }
  case 'logs': {
    const searchParams = new URLSearchParams();
    if (args.assetType) searchParams.set('assetType', args.assetType);
    if (args.symbol) searchParams.set('symbol', args.symbol);
    if (args.limit) searchParams.set('limit', args.limit);
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : '';
    await request(`/api/admin/ingestion/logs${suffix}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    break;
  }
  case 'symbols': {
    await request('/api/admin/ingestion/symbols', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    break;
  }
  default: {
    console.log(`Usage:
  pnpm ingest:schema
  pnpm ingest:forex
  pnpm ingest:logs
  pnpm ingest -- bulk --assetType forex --timeframe 1m
  pnpm ingest -- incremental --assetType forex --timeframe 1m
  pnpm ingest -- backfill --symbol EUR/USD --assetType forex --timeframe 1m --fromDate 2024-01-01T00:00:00.000Z
  pnpm ingest -- symbols`);
  }
}