import { getSql } from '../../db/client';
import type { BackendEnv } from '../../worker-types';
import type { IngestionSource, IngestionTimeframe, IngestionWorkflowType } from '../../lib/ingestion/types';
import type { MarketAssetClass } from '../../lib/market-data-types';
import type { IngestionLogRow, IngestionSymbolRow } from './ingestion-types';

export const listIngestionSymbols = async (env: BackendEnv): Promise<IngestionSymbolRow[]> => {
  const sql = getSql(env);
  const rows = await sql`SELECT * FROM ingestion_symbols ORDER BY asset_type, symbol ASC`;
  return rows as IngestionSymbolRow[];
};

export const getIngestionSymbol = async (
  env: BackendEnv,
  symbol: string,
  assetType: MarketAssetClass,
): Promise<IngestionSymbolRow | null> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM ingestion_symbols
    WHERE asset_type = ${assetType}
      AND UPPER(symbol) = UPPER(${symbol})
    LIMIT 1
  `;

  return (rows[0] as IngestionSymbolRow | undefined) ?? null;
};

export const upsertIngestionSymbol = async (
  env: BackendEnv,
  input: {
    symbol: string;
    assetType: MarketAssetClass;
    source: IngestionSource;
    enabled: boolean;
    metadata: Record<string, unknown>;
  },
): Promise<IngestionSymbolRow> => {
  const sql = getSql(env);
  const rows = await sql`
    INSERT INTO ingestion_symbols (symbol, asset_type, source, enabled, metadata)
    VALUES (${input.symbol}, ${input.assetType}, ${input.source}, ${input.enabled}, ${JSON.stringify(input.metadata)}::jsonb)
    ON CONFLICT (symbol, asset_type)
    DO UPDATE SET source = EXCLUDED.source, enabled = EXCLUDED.enabled, metadata = EXCLUDED.metadata, updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as IngestionSymbolRow;
};

export const getLastSuccessfulIngestion = async (
  env: BackendEnv,
  symbol: string,
  timeframe: IngestionTimeframe,
): Promise<IngestionLogRow | null> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM ingestion_log
    WHERE symbol = ${symbol} AND timeframe = ${timeframe} AND status = 'success'
    ORDER BY to_time DESC NULLS LAST, created_at DESC
    LIMIT 1
  `;

  return (rows[0] as IngestionLogRow | undefined) ?? null;
};

export const insertIngestionLog = async (
  env: BackendEnv,
  input: {
    assetType: MarketAssetClass;
    symbol: string;
    workflowId: string;
    workflowType: IngestionWorkflowType;
    timeframe: IngestionTimeframe;
    fromTime?: string | null;
    toTime?: string | null;
    rowsWritten: number;
    status: 'success' | 'partial' | 'failed';
    errorMessage?: string | null;
  },
): Promise<void> => {
  const sql = getSql(env);
  await sql`
    INSERT INTO ingestion_log (
      asset_type, symbol, workflow_id, workflow_type, timeframe, from_time, to_time, rows_written, status, error_msg
    ) VALUES (
      ${input.assetType}, ${input.symbol}, ${input.workflowId}, ${input.workflowType}, ${input.timeframe},
      ${input.fromTime ?? null}, ${input.toTime ?? null}, ${input.rowsWritten}, ${input.status}, ${input.errorMessage ?? null}
    )
  `;
};

export const listIngestionLogs = async (
  env: BackendEnv,
  query: { assetType?: MarketAssetClass; symbol?: string; limit: number },
): Promise<IngestionLogRow[]> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM ingestion_log
    WHERE (${query.assetType ?? null}::text IS NULL OR asset_type = ${query.assetType ?? null})
      AND (${query.symbol ?? null}::text IS NULL OR symbol = ${query.symbol ?? null})
    ORDER BY created_at DESC
    LIMIT ${query.limit}
  `;

  return rows as IngestionLogRow[];
};