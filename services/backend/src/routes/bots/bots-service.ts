import { AppError } from '../../lib/errors';
import type { BackendEnv } from '../../worker-types';
import type { CreateBotInput, UpdateBotStatusInput } from './bots-types';
import { deleteBotById, findBotById, insertBot, listBotsByUser, updateBotLastRunById, updateBotStatusById } from './bots-repository';
import { executeBotRun } from './bot-runner';

export const getBots = (env: BackendEnv, userId: string) => {
  return listBotsByUser(env, userId);
};

export const createBot = (env: BackendEnv, userId: string, payload: CreateBotInput) => {
  return insertBot(env, userId, payload);
};

export const runBot = async (env: BackendEnv, botId: string, userId: string) => {
  const bot = await findBotById(env, botId, userId);

  if (!bot) {
    throw new AppError('Bot not found', 404);
  }

  const lastRun = await executeBotRun(bot);
  const updatedBot = await updateBotLastRunById(env, botId, userId, lastRun);

  if (!updatedBot) {
    throw new AppError('Bot not found', 404);
  }

  return {
    bot: updatedBot,
    lastRun,
  };
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