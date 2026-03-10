import type { IngestionSource, IngestionTimeframe } from '../../lib/ingestion/types';
import type { MarketAssetClass } from '../../lib/market-data-types';

export interface IngestionSymbolRow {
  id: string;
  symbol: string;
  asset_type: MarketAssetClass;
  source: IngestionSource;
  enabled: boolean;
  metadata: Record<string, unknown> | string;
  created_at: string;
  updated_at: string;
}

export interface IngestionLogRow {
  id: string;
  asset_type: MarketAssetClass;
  symbol: string;
  workflow_id: string;
  workflow_type: string;
  timeframe: IngestionTimeframe;
  from_time: string | null;
  to_time: string | null;
  rows_written: number;
  status: 'success' | 'partial' | 'failed';
  error_msg: string | null;
  created_at: string;
}