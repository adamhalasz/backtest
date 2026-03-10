import React from 'react';
import { useLocation } from 'wouter';
import { Bot as BotIcon, Pause, Play, Plus, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXCHANGES } from '@/lib/constants';
import { useDeleteBot, useFetchBots, useUpdateBotStatus } from './bots-hooks';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export function BotsPage() {
  const [, navigate] = useLocation();
  const { data: bots, isLoading, error, run } = useFetchBots();
  const updateStatus = useUpdateBotStatus();
  const deleteBot = useDeleteBot();

  React.useEffect(() => {
    void run();
  }, [run]);

  const stateError = error ?? updateStatus.error ?? deleteBot.error;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trading Bots</h1>
          <p className="mt-2 text-gray-600">Manage the lifecycle of your automated strategies.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => navigate('/bots/new')}>
          <Plus className="h-4 w-4" />
          Create New Bot
        </Button>
      </div>

      {stateError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{stateError}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
          Loading bots...
        </div>
      ) : bots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
          <BotIcon className="mx-auto mb-4 h-10 w-10 text-gray-400" />
          No trading bots configured yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {bots.map((bot) => (
            <article key={bot.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{bot.name}</h2>
                    <p className="text-sm text-gray-600">
                      {bot.symbol} on {EXCHANGES.find((exchange) => exchange.id === bot.exchange)?.name || bot.exchange}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {bot.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-600">Total Trades</p>
                    <p className="font-semibold text-gray-900">{bot.total_trades}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-600">Win Rate</p>
                    <p className="font-semibold text-gray-900">{formatPercent(bot.win_rate)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-600">Total Profit</p>
                    <p className={bot.total_profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                      {formatCurrency(bot.total_profit)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-600">Last Trade</p>
                    <p className="font-semibold text-gray-900">{bot.last_trade_at ? new Date(bot.last_trade_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {bot.status === 'active' ? (
                      <Button
                        onClick={() => void updateStatus.run(bot.id, 'paused')}
                        size="sm"
                        variant="outline"
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void updateStatus.run(bot.id, 'active')}
                        size="sm"
                        variant="outline"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    )}

                    <Button onClick={() => navigate(`/bots/${bot.id}/settings`)} size="sm" variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </div>

                  <Button
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => void deleteBot.run(bot.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}