CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS backtest_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  strategy TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_balance DOUBLE PRECISION NOT NULL,
  final_balance DOUBLE PRECISION NOT NULL,
  win_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  profit_factor DOUBLE PRECISION,
  max_drawdown DOUBLE PRECISION NOT NULL DEFAULT 0,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS backtest_results_user_id_idx ON backtest_results (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS backtest_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backtest_id UUID NOT NULL REFERENCES backtest_results(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  entry_price DOUBLE PRECISION NOT NULL,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_price DOUBLE PRECISION NOT NULL,
  exit_time TIMESTAMPTZ NOT NULL,
  profit DOUBLE PRECISION NOT NULL,
  signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS backtest_trades_backtest_id_idx ON backtest_trades (backtest_id, entry_time ASC);

CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  status TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_trade_at TIMESTAMPTZ,
  total_trades INTEGER NOT NULL DEFAULT 0,
  win_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_profit DOUBLE PRECISION NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS bots_user_id_idx ON bots (user_id, created_at DESC);