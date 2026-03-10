import { getSql } from '../../db/client';
import type { BacktestRunResult, Trade } from '../../lib/backtest-engine/types';
import type { BackendEnv } from '../../worker-types';
import type { BacktestRequestInput, StoredBacktestRow, StoredTradeRow } from './backtests-types';

export const listBacktestsByUser = async (env: BackendEnv, userId: string): Promise<StoredBacktestRow[]> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM backtest_results
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return rows as StoredBacktestRow[];
};

export const findBacktestById = async (
  env: BackendEnv,
  backtestId: string,
  userId: string,
): Promise<StoredBacktestRow | null> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM backtest_results
    WHERE id = ${backtestId} AND user_id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as StoredBacktestRow | undefined) ?? null;
};

export const findBacktestByIdForWorkflow = async (
  env: BackendEnv,
  backtestId: string,
): Promise<StoredBacktestRow | null> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM backtest_results
    WHERE id = ${backtestId}
    LIMIT 1
  `;

  return (rows[0] as StoredBacktestRow | undefined) ?? null;
};

export const listTradesByBacktestId = async (
  env: BackendEnv,
  backtestId: string,
  userId: string,
): Promise<StoredTradeRow[]> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM backtest_trades
    WHERE backtest_id = ${backtestId} AND user_id = ${userId}
    ORDER BY entry_time ASC
  `;

  return rows as StoredTradeRow[];
};

export const insertBacktest = async (
  env: BackendEnv,
  userId: string,
  payload: BacktestRequestInput,
): Promise<StoredBacktestRow> => {
  const sql = getSql(env);
  const insertedBacktests = await sql`
    INSERT INTO backtest_results (
      user_id,
      symbol,
      exchange,
      strategy,
      start_date,
      end_date,
      initial_balance,
      final_balance,
      win_rate,
      profit_factor,
      max_drawdown,
      status,
      parameters
    ) VALUES (
      ${userId},
      ${payload.backtest.symbol},
      ${payload.backtest.exchange},
      ${payload.backtest.strategy},
      ${payload.backtest.start_date},
      ${payload.backtest.end_date},
      ${payload.backtest.initial_balance},
      ${0},
      ${0},
      ${0},
      ${0},
      ${'pending'},
      ${JSON.stringify(payload.backtest.parameters)}::jsonb
    )
    RETURNING *
  `;

  return insertedBacktests[0] as StoredBacktestRow;
};

export const insertBacktestTrade = async (
  env: BackendEnv,
  input: {
    backtestId: string;
    userId: string;
    trade: Trade;
  },
): Promise<void> => {
  const sql = getSql(env);

  await sql`
    INSERT INTO backtest_trades (
      backtest_id,
      user_id,
      type,
      entry_price,
      entry_time,
      exit_price,
      exit_time,
      profit,
      signals,
      reason
    ) VALUES (
      ${input.backtestId},
      ${input.userId},
      ${input.trade.type},
      ${input.trade.entryPrice},
      ${input.trade.entryTime},
      ${input.trade.exitPrice},
      ${input.trade.exitTime},
      ${input.trade.profit},
      ${JSON.stringify(input.trade.signals || {})}::jsonb,
      ${input.trade.reason || null}
    )
  `;
};

export const updateBacktestWorkflowInstanceById = async (
  env: BackendEnv,
  backtestId: string,
  workflowInstanceId: string,
): Promise<StoredBacktestRow | null> => {
  const sql = getSql(env);
  const rows = await sql`
    UPDATE backtest_results
    SET workflow_instance_id = ${workflowInstanceId}, updated_at = NOW()
    WHERE id = ${backtestId}
    RETURNING *
  `;

  return (rows[0] as StoredBacktestRow | undefined) ?? null;
};

export const markBacktestRunningById = async (env: BackendEnv, backtestId: string): Promise<void> => {
  const sql = getSql(env);
  await sql`
    UPDATE backtest_results
    SET status = 'running', error_message = NULL, updated_at = NOW()
    WHERE id = ${backtestId}
  `;
};

export const markBacktestFailedById = async (
  env: BackendEnv,
  backtestId: string,
  errorMessage: string,
): Promise<void> => {
  const sql = getSql(env);
  await sql`
    UPDATE backtest_results
    SET status = 'failed', error_message = ${errorMessage}, updated_at = NOW()
    WHERE id = ${backtestId}
  `;
};

export const completeBacktestRunById = async (
  env: BackendEnv,
  backtestId: string,
  result: BacktestRunResult,
): Promise<void> => {
  const sql = getSql(env);
  const backtest = await findBacktestByIdForWorkflow(env, backtestId);

  if (!backtest) {
    return;
  }

  await sql`
    DELETE FROM backtest_trades
    WHERE backtest_id = ${backtestId}
  `;

  for (const trade of result.trades) {
    await insertBacktestTrade(env, {
      backtestId,
      userId: backtest.user_id,
      trade,
    });
  }

  await sql`
    UPDATE backtest_results
    SET final_balance = ${result.finalBalance},
        win_rate = ${result.metrics.winRate},
        profit_factor = ${Number.isFinite(result.metrics.profitFactor) ? result.metrics.profitFactor : 0},
        max_drawdown = ${result.metrics.maxDrawdown},
        status = 'completed',
        error_message = NULL,
        updated_at = NOW()
    WHERE id = ${backtestId}
  `;
};