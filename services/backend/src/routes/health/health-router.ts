import { Hono } from 'hono';
import type { AppEnv } from '../../worker-types';

export const healthRouter = new Hono<AppEnv>();

healthRouter.get('/', (c) => c.json({ ok: true }));