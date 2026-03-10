import { Hono } from 'hono';
import { requireAuth } from '../../auth/auth-middleware';
import {
  handleCreateBacktest,
  handleGetBacktest,
  handleGetBacktestTrades,
  handleListBacktests,
} from './backtests-handlers';
import type { AppEnv } from '../../worker-types';

export const backtestsRouter = new Hono<AppEnv>();

backtestsRouter.use('*', requireAuth);
backtestsRouter.get('/', handleListBacktests);
backtestsRouter.get('/:id', handleGetBacktest);
backtestsRouter.get('/:id/trades', handleGetBacktestTrades);
backtestsRouter.post('/', handleCreateBacktest);