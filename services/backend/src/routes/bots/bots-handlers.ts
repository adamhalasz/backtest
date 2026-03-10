import type { Context } from 'hono';
import { getRequiredUser } from '../../auth/auth-middleware';
import { AppError } from '../../lib/errors';
import type { AppEnv } from '../../worker-types';
import { botSchema, statusSchema } from './bots-schema';
import { createBot, deleteBot, getBots, runBot, updateBotStatus } from './bots-service';

const getBotId = (c: Context<AppEnv>) => {
  const botId = c.req.param('id' as never);

  if (!botId) {
    throw new AppError('Bot not found', 404);
  }

  return botId;
};

export const handleListBots = async (c: Context<AppEnv>) => {
  const user = getRequiredUser(c.get('user'));
  return c.json(await getBots(c.env, user.id));
};

export const handleCreateBot = async (c: Context<AppEnv>) => {
  const parsed = botSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    throw new AppError('Invalid request body', 400, parsed.error.flatten());
  }

  const user = getRequiredUser(c.get('user'));
  return c.json(await createBot(c.env, user.id, parsed.data), 201);
};

export const handleUpdateBotStatus = async (c: Context<AppEnv>) => {
  const parsed = statusSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    throw new AppError('Invalid request body', 400, parsed.error.flatten());
  }

  const user = getRequiredUser(c.get('user'));
  return c.json(await updateBotStatus(c.env, getBotId(c), user.id, parsed.data));
};

export const handleDeleteBot = async (c: Context<AppEnv>) => {
  const user = getRequiredUser(c.get('user'));
  await deleteBot(c.env, getBotId(c), user.id);
  return c.body(null, 204);
};

export const handleRunBot = async (c: Context<AppEnv>) => {
  const user = getRequiredUser(c.get('user'));
  return c.json(await runBot(c.env, getBotId(c), user.id));
};