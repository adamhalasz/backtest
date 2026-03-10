import type { MarketAssetClass } from '../market-data-types';

export type IngestionTimeframe = '1m' | '1h' | '1d';
export type IngestionSource = 'histdata' | 'yahoo' | 'ccxt';
export type IngestionWorkflowType = 'bulk-historical' | 'incremental-sync' | 'symbol-backfill';

export interface IngestionSymbolDefinition {
  symbol: string;
  assetType: MarketAssetClass;
  source: IngestionSource;
  availableFrom: string;
  sourceSymbol: string;
  supportedTimeframes: IngestionTimeframe[];
  exchangeId?: string;
  rateLimitMs?: number;
}

export interface OHLCVRow {
  symbol: string;
  asset_type: MarketAssetClass;
  bar_time: string;
  timeframe: IngestionTimeframe;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IngestionRequest {
  symbol: string;
  assetType: MarketAssetClass;
  timeframe: IngestionTimeframe;
  workflowId: string;
  workflowType: IngestionWorkflowType;
  fromTime?: string;
  toTime?: string;
}