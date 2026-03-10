import { Hono } from 'hono';
import type { AppEnv } from '../../worker-types';

export const sessionRouter = new Hono<AppEnv>();

sessionRouter.get('/', (c) => {
  return c.json({
    session: c.get('session'),
    user: c.get('user'),
  });
});