import { Hono } from 'hono';
import { requireIngestionAccess } from '../../auth/auth-middleware';
import type { AppEnv } from '../../worker-types';
import {
  handleEnsureIngestionSchema,
  handleListIngestionLogs,
  handleListIngestionSymbols,
  handleRunSingleIngestion,
  handleTriggerBulkIngestion,
  handleTriggerIncrementalSync,
  handleTriggerSymbolBackfill,
  handleUpsertIngestionSymbol,
} from './ingestion-handlers';

export const ingestionRouter = new Hono<AppEnv>();

ingestionRouter.use('*', requireIngestionAccess);
ingestionRouter.post('/schema/ensure', handleEnsureIngestionSchema);
ingestionRouter.get('/symbols', handleListIngestionSymbols);
ingestionRouter.post('/symbols', handleUpsertIngestionSymbol);
ingestionRouter.get('/logs', handleListIngestionLogs);
ingestionRouter.post('/workflows/bulk', handleTriggerBulkIngestion);
ingestionRouter.post('/workflows/incremental', handleTriggerIncrementalSync);
ingestionRouter.post('/workflows/backfill', handleTriggerSymbolBackfill);
ingestionRouter.post('/run-once', handleRunSingleIngestion);