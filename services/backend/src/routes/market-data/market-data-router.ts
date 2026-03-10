import { Hono } from 'hono';
import { handleGetMarketTicks } from './market-data-handlers';
import type { AppEnv } from '../../worker-types';

export const marketDataRouter = new Hono<AppEnv>();

marketDataRouter.get('/ticks', handleGetMarketTicks);