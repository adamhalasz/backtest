import { AppError } from '../../lib/errors';
import type { BackendEnv } from '../../worker-types';
import type { BacktestRequestInput } from './backtests-types';
import {
  findBacktestById,
  insertBacktest,
  listBacktestsByUser,
  listTradesByBacktestId,
  updateBacktestWorkflowInstanceById,
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

export const createBacktest = async (env: BackendEnv, userId: string, payload: BacktestRequestInput) => {
  if (!env.BACKTEST_WORKFLOW) {
    throw new AppError('Backtest workflow binding is not configured', 500);
  }

  const createdBacktest = await insertBacktest(env, userId, payload);
  const instance = await env.BACKTEST_WORKFLOW.create({
    id: createdBacktest.id,
    params: { backtestId: createdBacktest.id },
  });
  const updatedBacktest = await updateBacktestWorkflowInstanceById(env, createdBacktest.id, instance.id);

  if (!updatedBacktest) {
    throw new AppError('Failed to queue backtest', 500);
  }

  return updatedBacktest;
};