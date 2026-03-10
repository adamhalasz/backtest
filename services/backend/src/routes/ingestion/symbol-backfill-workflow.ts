import { WorkflowEntrypoint } from 'cloudflare:workers';
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import type { BackendEnv } from '../../worker-types';
import type { IngestionTimeframe } from '../../lib/ingestion/types';
import type { MarketAssetClass } from '../../lib/market-data-types';
import { ingestSymbolData } from './ingestion-service';

type SymbolBackfillParams = {
  symbol: string;
  assetType: MarketAssetClass;
  timeframe: IngestionTimeframe;
  fromDate?: string;
};

export class SymbolBackfillWorkflow extends WorkflowEntrypoint<BackendEnv, SymbolBackfillParams> {
  async run(event: WorkflowEvent<SymbolBackfillParams>, step: WorkflowStep) {
    return step.do(`backfill ${event.payload.symbol} ${event.payload.timeframe}`, { retries: { limit: 3, delay: '2 seconds', backoff: 'exponential' }, timeout: '10 minutes' }, async () => {
      return ingestSymbolData(this.env, {
        symbol: event.payload.symbol,
        assetType: event.payload.assetType,
        timeframe: event.payload.timeframe,
        workflowId: event.instanceId,
        workflowType: 'symbol-backfill',
        fromTime: event.payload.fromDate,
      });
    });
  }
}