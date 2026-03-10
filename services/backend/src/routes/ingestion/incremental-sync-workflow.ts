import { WorkflowEntrypoint } from 'cloudflare:workers';
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import type { BackendEnv } from '../../worker-types';
import type { IngestionTimeframe } from '../../lib/ingestion/types';
import type { MarketAssetClass } from '../../lib/market-data-types';
import { delayBetweenSymbols, getIncrementalFromTime, getWorkflowSymbols, ingestSymbolData, resolveIngestionDefinition } from './ingestion-service';

type IncrementalSyncParams = {
  assetType?: MarketAssetClass;
  timeframe: IngestionTimeframe;
  symbols?: string[];
};

export class IncrementalSyncWorkflow extends WorkflowEntrypoint<BackendEnv, IncrementalSyncParams> {
  async run(event: WorkflowEvent<IncrementalSyncParams>, step: WorkflowStep) {
    const assetType = event.payload.assetType ?? 'stock';
    const symbols = await step.do<string[]>('resolve incremental symbols', async () => {
      return getWorkflowSymbols(this.env, event.payload.assetType, event.payload.timeframe, event.payload.symbols);
    });

    for (const symbol of symbols) {
      const definition = await resolveIngestionDefinition(this.env, { symbol, assetType, timeframe: event.payload.timeframe });
      const fromTime = await step.do(`resolve delta ${symbol}`, async () => {
        return getIncrementalFromTime(this.env, symbol, event.payload.timeframe, new Date(definition.availableFrom).toISOString());
      });

      await step.do(`incremental ingest ${symbol}`, { retries: { limit: 3, delay: '2 seconds', backoff: 'exponential' }, timeout: '10 minutes' }, async () => {
        return ingestSymbolData(this.env, {
          symbol,
          assetType,
          timeframe: event.payload.timeframe,
          workflowId: event.instanceId,
          workflowType: 'incremental-sync',
          fromTime,
        });
      });

      await step.do(`incremental throttle ${symbol}`, async () => {
        await delayBetweenSymbols(this.env, { symbol, assetType, timeframe: event.payload.timeframe });
        return true;
      });
    }

    return { symbols: symbols.length, timeframe: event.payload.timeframe, assetType };
  }
}