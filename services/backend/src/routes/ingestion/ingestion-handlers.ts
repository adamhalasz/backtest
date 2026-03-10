import type { Context } from 'hono';
import { AppError } from '../../lib/errors';
import type { AppEnv } from '../../worker-types';
import { ingestionLogQuerySchema, ingestionSymbolSchema, ingestionTriggerSchema, symbolBackfillSchema } from './ingestion-schema';
import { ensureClickHouseSchema } from '../../lib/clickhouse';
import { ingestSymbolData, listLogs, listSymbols, saveSymbol } from './ingestion-service';

const ensureIngestionBindings = (c: Context<AppEnv>) => {
  if (!c.env.BULK_HISTORICAL_INGESTION_WORKFLOW || !c.env.INCREMENTAL_SYNC_WORKFLOW || !c.env.SYMBOL_BACKFILL_WORKFLOW) {
    throw new AppError('Ingestion workflows are not configured', 500);
  }
};

export const handleEnsureIngestionSchema = async (c: Context<AppEnv>) => {
  await ensureClickHouseSchema(c.env);
  return c.json({ ok: true });
};

export const handleListIngestionSymbols = async (c: Context<AppEnv>) => {
  return c.json(await listSymbols(c.env));
};

export const handleUpsertIngestionSymbol = async (c: Context<AppEnv>) => {
  const parsed = ingestionSymbolSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    throw new AppError('Invalid ingestion symbol payload', 400, parsed.error.flatten());
  }

  return c.json(await saveSymbol(c.env, parsed.data));
};

export const handleListIngestionLogs = async (c: Context<AppEnv>) => {
  const parsed = ingestionLogQuerySchema.safeParse({
    assetType: c.req.query('assetType') || undefined,
    symbol: c.req.query('symbol') || undefined,
    limit: c.req.query('limit') || 50,
  });
  if (!parsed.success) {
    throw new AppError('Invalid ingestion log query', 400, parsed.error.flatten());
  }

  return c.json(await listLogs(c.env, parsed.data));
};

export const handleTriggerBulkIngestion = async (c: Context<AppEnv>) => {
  ensureIngestionBindings(c);
  const parsed = ingestionTriggerSchema.safeParse(await c.req.json());
  if (!parsed.success || !parsed.data.assetType) {
    throw new AppError('Bulk ingestion requires assetType and timeframe', 400, parsed.success ? undefined : parsed.error.flatten());
  }

  const { assetType, timeframe, symbols } = parsed.data;

  const instance = await c.env.BULK_HISTORICAL_INGESTION_WORKFLOW!.create({
    params: {
      assetType,
      timeframe,
      symbols,
    },
  });
  return c.json({ workflowId: instance.id }, 202);
};

export const handleTriggerIncrementalSync = async (c: Context<AppEnv>) => {
  ensureIngestionBindings(c);
  const parsed = ingestionTriggerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    throw new AppError('Invalid incremental sync payload', 400, parsed.error.flatten());
  }

  const instance = await c.env.INCREMENTAL_SYNC_WORKFLOW!.create({ params: parsed.data });
  return c.json({ workflowId: instance.id }, 202);
};

export const handleTriggerSymbolBackfill = async (c: Context<AppEnv>) => {
  ensureIngestionBindings(c);
  const parsed = symbolBackfillSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    throw new AppError('Invalid symbol backfill payload', 400, parsed.error.flatten());
  }

  const instance = await c.env.SYMBOL_BACKFILL_WORKFLOW!.create({ params: parsed.data });
  return c.json({ workflowId: instance.id }, 202);
};

export const handleRunSingleIngestion = async (c: Context<AppEnv>) => {
  const parsed = symbolBackfillSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    throw new AppError('Invalid single ingestion payload', 400, parsed.error.flatten());
  }

  return c.json(await ingestSymbolData(c.env, {
    symbol: parsed.data.symbol,
    assetType: parsed.data.assetType,
    timeframe: parsed.data.timeframe,
    workflowId: `manual-${Date.now()}`,
    workflowType: 'symbol-backfill',
    fromTime: parsed.data.fromDate,
  }));
};