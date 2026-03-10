import type { BackendEnv } from '../worker-types';

export interface ClickHouseOHLCVRow {
  symbol: string;
  asset_type: 'forex' | 'stock' | 'crypto';
  bar_time: string;
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const escapeSqlString = (value: string) => value.replace(/'/g, "''");

export const formatClickHouseDateTime = (value: string | Date) => {
  const iso = (value instanceof Date ? value : new Date(value)).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 23)}`;
};

const getClickHouseCredentials = (env: BackendEnv) => {
  if (env.CLICKHOUSE_API_KEY && env.CLICKHOUSE_API_SECRET) {
    return {
      user: env.CLICKHOUSE_API_KEY,
      password: env.CLICKHOUSE_API_SECRET,
    };
  }

  if (env.CLICKHOUSE_USERNAME && env.CLICKHOUSE_PASSWORD) {
    return {
      user: env.CLICKHOUSE_USERNAME,
      password: env.CLICKHOUSE_PASSWORD,
    };
  }

  throw new Error('ClickHouse is not configured');
};

const getClickHouseBaseUrl = (env: BackendEnv) => {
  if (!env.CLICKHOUSE_URL) {
    throw new Error('ClickHouse is not configured');
  }

  const url = new URL(env.CLICKHOUSE_URL);
  if (env.CLICKHOUSE_DB) {
    url.searchParams.set('database', env.CLICKHOUSE_DB);
  }
  return url.toString();
};

const getHeaders = (env: BackendEnv, contentType: string = 'text/plain; charset=utf-8') => {
  const credentials = getClickHouseCredentials(env);

  return {
    'X-ClickHouse-User': credentials.user,
    'X-ClickHouse-Key': credentials.password,
    'Content-Type': contentType,
  };
};

export const executeClickHouse = async (env: BackendEnv, query: string) => {
  const response = await fetch(getClickHouseBaseUrl(env), {
    method: 'POST',
    headers: getHeaders(env),
    body: query,
  });

  if (!response.ok) {
    throw new Error(`ClickHouse query failed: ${await response.text()}`);
  }
};

export const queryClickHouseJson = async <T>(env: BackendEnv, query: string): Promise<T[]> => {
  const response = await fetch(getClickHouseBaseUrl(env), {
    method: 'POST',
    headers: getHeaders(env),
    body: `${query}\nFORMAT JSON`,
  });

  if (!response.ok) {
    throw new Error(`ClickHouse query failed: ${await response.text()}`);
  }

  const payload = await response.json() as { data?: T[] };
  return payload.data ?? [];
};

export const ensureClickHouseSchema = async (env: BackendEnv) => {
  await executeClickHouse(env, `
    CREATE TABLE IF NOT EXISTS ohlcv (
      symbol String,
      asset_type LowCardinality(String),
      bar_time DateTime64(3, 'UTC'),
      timeframe LowCardinality(String),
      open Decimal64(8),
      high Decimal64(8),
      low Decimal64(8),
      close Decimal64(8),
      volume Decimal64(8),
      ingested_at DateTime DEFAULT now()
    )
    ENGINE = MergeTree()
    PARTITION BY (asset_type, toYYYYMM(bar_time))
    ORDER BY (asset_type, symbol, timeframe, bar_time)
    SETTINGS index_granularity = 8192
  `);
};

export const replaceOHLCVRange = async (
  env: BackendEnv,
  rows: ClickHouseOHLCVRow[],
  scope: {
    symbol: string;
    assetType: ClickHouseOHLCVRow['asset_type'];
    timeframe: string;
    fromTime: string;
    toTime: string;
  },
) => {
  await ensureClickHouseSchema(env);

  const fromTime = formatClickHouseDateTime(scope.fromTime);
  const toTime = formatClickHouseDateTime(scope.toTime);

  await executeClickHouse(
    env,
    `ALTER TABLE ohlcv DELETE WHERE symbol = '${escapeSqlString(scope.symbol)}' AND asset_type = '${escapeSqlString(scope.assetType)}' AND timeframe = '${escapeSqlString(scope.timeframe)}' AND bar_time >= toDateTime64('${escapeSqlString(fromTime)}', 3, 'UTC') AND bar_time <= toDateTime64('${escapeSqlString(toTime)}', 3, 'UTC')`,
  );

  if (rows.length === 0) {
    return;
  }

  const batchSize = 10_000;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const body = batch.map((row) => JSON.stringify(row)).join('\n');
    const response = await fetch(`${getClickHouseBaseUrl(env)}&query=${encodeURIComponent('INSERT INTO ohlcv FORMAT JSONEachRow')}`, {
      method: 'POST',
      headers: getHeaders(env, 'application/json'),
      body,
    });

    if (!response.ok) {
      throw new Error(`ClickHouse insert failed: ${await response.text()}`);
    }
  }
};