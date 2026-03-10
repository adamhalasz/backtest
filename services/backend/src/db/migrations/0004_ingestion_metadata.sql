CREATE TABLE IF NOT EXISTS ingestion_symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  source TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, asset_type)
);

CREATE INDEX IF NOT EXISTS ingestion_symbols_asset_type_idx ON ingestion_symbols (asset_type, enabled, symbol);

CREATE TABLE IF NOT EXISTS ingestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  workflow_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  from_time TIMESTAMPTZ,
  to_time TIMESTAMPTZ,
  rows_written INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ingestion_log_symbol_idx ON ingestion_log (symbol, timeframe, created_at DESC);
CREATE INDEX IF NOT EXISTS ingestion_log_status_idx ON ingestion_log (asset_type, status, created_at DESC);