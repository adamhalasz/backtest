import { getSql } from '../../db/client';
import type { BackendEnv } from '../../worker-types';
import type { BacktestInsertInput, StoredBacktestRow, StoredTradeRow } from './backtests-types';

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
  payload: BacktestInsertInput,
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
      parameters
    ) VALUES (
      ${userId},
      ${payload.backtest.symbol},
      ${payload.backtest.exchange},
      ${payload.backtest.strategy},
      ${payload.backtest.start_date},
      ${payload.backtest.end_date},
      ${payload.backtest.initial_balance},
      ${payload.backtest.final_balance},
      ${payload.backtest.win_rate},
      ${payload.backtest.profit_factor},
      ${payload.backtest.max_drawdown},
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
    trade: BacktestInsertInput['trades'][number];
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