import { AppError } from '../../lib/errors';
import type { BackendEnv } from '../../worker-types';
import type { BacktestInsertInput } from './backtests-types';
import {
  findBacktestById,
  insertBacktest,
  insertBacktestTrade,
  listBacktestsByUser,
  listTradesByBacktestId,
} from './backtests-repository';

export const getBacktests = (env: BackendEnv, userId: string) => {
  return listBacktestsByUser(env, userId);
};

export const getBacktest = async (env: BackendEnv, backtestId: string, userId: string) => {
  const backtest = await findBacktestById(env, backtestId, userId);

  if (!backtest) {
    throw new AppError('Backtest not found', 404);
  }

  return backtest;
};

export const getBacktestTrades = async (env: BackendEnv, backtestId: string, userId: string) => {
  await getBacktest(env, backtestId, userId);
  return listTradesByBacktestId(env, backtestId, userId);
};

export const createBacktest = async (env: BackendEnv, userId: string, payload: BacktestInsertInput) => {
  const createdBacktest = await insertBacktest(env, userId, payload);

  await Promise.all(
    payload.trades.map((trade) => insertBacktestTrade(env, {
      backtestId: createdBacktest.id,
      userId,
      trade,
    })),
  );

  return createdBacktest;
};