import type { Bot } from '@/lib/types';
import { withLoading } from '@/store/asyncWrapper';
import * as api from './bots-api';

export const botsSlice = (set: any, get: any) => ({
  bots: [] as Bot[],

  fetchBots: async () => {
    return withLoading(
      'fetchBots',
      async (_set, _get, setKey) => {
        const bots = await api.fetchBots();
        setKey('bots', bots);
      },
      set,
      get,
    );
  },

  createBot: async (payload: api.CreateBotPayload) => {
    return withLoading(
      'createBot',
      async (_set, _get, setKey, _setError, requestPayload: api.CreateBotPayload) => {
        const createdBot = await api.createBot(requestPayload);
        setKey('bots', [createdBot, ...get().bots]);
      },
      set,
      get,
      payload,
    );
  },

  updateBotStatus: async (botId: string, status: Bot['status']) => {
    return withLoading(
      'updateBotStatus',
      async (_set, _get, setKey, _setError, id: string, nextStatus: Bot['status']) => {
        const updatedBot = await api.changeBotStatus(id, nextStatus);
        setKey(
          'bots',
          get().bots.map((bot: Bot) => (bot.id === updatedBot.id ? updatedBot : bot)),
        );
      },
      set,
      get,
      botId,
      status,
    );
  },

  deleteBot: async (botId: string) => {
    return withLoading(
      'deleteBot',
      async (_set, _get, setKey, _setError, id: string) => {
        await api.removeBot(id);
        setKey(
          'bots',
          get().bots.filter((bot: Bot) => bot.id !== id),
        );
      },
      set,
      get,
      botId,
    );
  },
});