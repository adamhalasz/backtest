import { Hono } from 'hono';
import { requireAuth } from '../../auth/auth-middleware';
import { handleCreateBot, handleDeleteBot, handleListBots, handleRunBot, handleUpdateBotStatus } from './bots-handlers';
import type { AppEnv } from '../../worker-types';

export const botsRouter = new Hono<AppEnv>();

botsRouter.use('*', requireAuth);
botsRouter.get('/', handleListBots);
botsRouter.post('/', handleCreateBot);
botsRouter.post('/:id/run', handleRunBot);
botsRouter.patch('/:id/status', handleUpdateBotStatus);
botsRouter.delete('/:id', handleDeleteBot);