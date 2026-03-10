ALTER TABLE backtest_results
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS workflow_instance_id TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS backtest_results_status_idx ON backtest_results (user_id, status, created_at DESC);