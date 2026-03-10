import type { Context } from 'hono';
import { getRequiredUser } from '../../auth/auth-middleware';
import { AppError } from '../../lib/errors';
import type { AppEnv } from '../../worker-types';
import { backtestInsertSchema } from './backtests-schema';
import { createBacktest, getBacktest, getBacktestTrades, getBacktests } from './backtests-service';

const getBacktestId = (c: Context<AppEnv>) => {
  const backtestId = c.req.param('id' as never);

  if (!backtestId) {
    throw new AppError('Backtest not found', 404);
  }

  return backtestId;
};

export const handleListBacktests = async (c: Context<AppEnv>) => {
  const user = getRequiredUser(c.get('user'));
  return c.json(await getBacktests(c.env, user.id));
};

export const handleGetBacktest = async (c: Context<AppEnv>) => {
  const user = getRequiredUser(c.get('user'));
  return c.json(await getBacktest(c.env, getBacktestId(c), user.id));
};

export const handleGetBacktestTrades = async (c: Context<AppEnv>) => {
  const user = getRequiredUser(c.get('user'));
  return c.json(await getBacktestTrades(c.env, getBacktestId(c), user.id));
};

export const handleCreateBacktest = async (c: Context<AppEnv>) => {
  const parsed = backtestInsertSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    throw new AppError('Invalid request body', 400, parsed.error.flatten());
  }

  const user = getRequiredUser(c.get('user'));
  const backtest = await createBacktest(c.env, user.id, parsed.data);
  return c.json(backtest, 201);
};