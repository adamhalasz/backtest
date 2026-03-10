import { AppError } from '../../lib/errors';
import type { BackendEnv } from '../../worker-types';
import type { CreateBotInput, UpdateBotStatusInput } from './bots-types';
import { deleteBotById, insertBot, listBotsByUser, updateBotStatusById } from './bots-repository';

export const getBots = (env: BackendEnv, userId: string) => {
  return listBotsByUser(env, userId);
};

export const createBot = (env: BackendEnv, userId: string, payload: CreateBotInput) => {
  return insertBot(env, userId, payload);
};

export const updateBotStatus = async (
  env: BackendEnv,
  botId: string,
  userId: string,
  payload: UpdateBotStatusInput,
) => {
  const bot = await updateBotStatusById(env, botId, userId, payload);

  if (!bot) {
    throw new AppError('Bot not found', 404);
  }

  return bot;
};

export const deleteBot = async (env: BackendEnv, botId: string, userId: string) => {
  await deleteBotById(env, botId, userId);
};