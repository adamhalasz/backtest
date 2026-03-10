import { WorkflowEntrypoint } from 'cloudflare:workers';
import type { WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import type { BackendEnv } from '../../worker-types';
import { delayBetweenSymbols, getBatchCooldownMs, getBulkBatchSize, getWorkflowSymbols, ingestSymbolData } from './ingestion-service';
import type { IngestionTimeframe } from '../../lib/ingestion/types';
import type { MarketAssetClass } from '../../lib/market-data-types';

type BulkHistoricalParams = {
  assetType: MarketAssetClass;
  timeframe: IngestionTimeframe;
  symbols?: string[];
};

export class BulkHistoricalIngestionWorkflow extends WorkflowEntrypoint<BackendEnv, BulkHistoricalParams> {
  async run(event: WorkflowEvent<BulkHistoricalParams>, step: WorkflowStep) {
    const symbols = await step.do<string[]>('resolve bulk symbols', async () => {
      return getWorkflowSymbols(this.env, event.payload.assetType, event.payload.timeframe, event.payload.symbols);
    });

    const batchSize = getBulkBatchSize(event.payload.assetType, event.payload.timeframe);

    for (let batchStart = 0; batchStart < symbols.length; batchStart += batchSize) {
      const batch = symbols.slice(batchStart, batchStart + batchSize);

      for (const [index, symbol] of batch.entries()) {
        await step.do(`ingest ${symbol} ${event.payload.timeframe}`, { retries: { limit: 3, delay: '2 seconds', backoff: 'exponential' }, timeout: '10 minutes' }, async () => {
          return ingestSymbolData(this.env, {
            symbol,
            assetType: event.payload.assetType,
            timeframe: event.payload.timeframe,
            workflowId: event.instanceId,
            workflowType: 'bulk-historical',
          });
        });

        if (index < batch.length - 1) {
          await step.do(`throttle ${symbol}`, async () => {
            await delayBetweenSymbols(this.env, {
              symbol,
              assetType: event.payload.assetType,
              timeframe: event.payload.timeframe,
            });
            return true;
          });
        }
      }

      if (batchStart + batchSize < symbols.length) {
        const cooldownMs = await getBatchCooldownMs(this.env, {
          symbol: batch[0] ?? symbols[0],
          assetType: event.payload.assetType,
          timeframe: event.payload.timeframe,
        });
        await step.sleep(`cooldown batch ${batchStart / batchSize + 1}`, `${Math.floor(cooldownMs / 1000)} seconds`);
      }
    }

    return { symbols: symbols.length, timeframe: event.payload.timeframe, assetType: event.payload.assetType };
  }
}