import React from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronRight, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STRATEGIES } from '@/lib/strategies';
import type { StoredBacktest } from '@/lib/types';
import { useFetchBacktests } from './backtests-hooks';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

const getBacktestName = (backtest: StoredBacktest) => {
  const startDate = new Date(backtest.start_date);
  const endDate = new Date(backtest.end_date);
  const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleString('en-US', { month: 'short' });
  const year = endDate.getFullYear();
  const strategyShortName = backtest.strategy.replace(' Strategy', '');
  return `${startMonth}-${endMonth} ${year} ${strategyShortName}`;
};

export function BacktestsPage() {
  const [, navigate] = useLocation();
  const { data: backtests, isLoading, error, run } = useFetchBacktests();
  const [expandedStrategies, setExpandedStrategies] = React.useState<string[]>([]);

  React.useEffect(() => {
    void run();
  }, [run]);

  const groupedBacktests = React.useMemo(() => {
    return STRATEGIES.reduce<Record<string, StoredBacktest[]>>((accumulator, strategy) => {
      const matches = backtests
        .filter((backtest) => backtest.strategy === strategy.name)
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

      if (matches.length > 0) {
        accumulator[strategy.name] = matches;
      }

      return accumulator;
    }, {});
  }, [backtests]);

  const toggleStrategy = (strategyName: string) => {
    setExpandedStrategies((current) => {
      return current.includes(strategyName)
        ? current.filter((value) => value !== strategyName)
        : [...current, strategyName];
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backtests</h1>
          <p className="mt-2 text-gray-600">Run, review, and compare your saved strategy results.</p>
        </div>
        <Button onClick={() => navigate('/backtest/new')}>Run a New Backtest</Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
          Loading backtests...
        </div>
      ) : Object.keys(groupedBacktests).length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center text-gray-500">
          No saved backtests yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBacktests).map(([strategyName, items]) => (
            <section key={strategyName} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <button
                className="flex w-full items-center justify-between border-b border-gray-200 px-5 py-4 text-left hover:bg-gray-50"
                onClick={() => toggleStrategy(strategyName)}
                type="button"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{strategyName}</h2>
                  <p className="text-sm text-gray-600">
                    {items.length} backtest{items.length === 1 ? '' : 's'}
                  </p>
                </div>
                {expandedStrategies.includes(strategyName) ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {expandedStrategies.includes(strategyName) ? (
                <div className="divide-y divide-gray-200">
                  {items.map((backtest) => {
                    const profit = backtest.final_balance - backtest.initial_balance;
                    const duration = Math.ceil(
                      (new Date(backtest.end_date).getTime() - new Date(backtest.start_date).getTime()) /
                        (1000 * 60 * 60 * 24),
                    );

                    return (
                      <article
                        key={backtest.id}
                        className="cursor-pointer px-5 py-4 transition-colors hover:bg-gray-50"
                        onClick={() => navigate(`/backtest/${backtest.id}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{getBacktestName(backtest)}</h3>
                            <p className="text-sm text-gray-600">
                              {backtest.symbol} on {backtest.exchange} · Created{' '}
                              {new Date(backtest.created_at).toLocaleString()}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Period: {new Date(backtest.start_date).toLocaleDateString()} -{' '}
                              {new Date(backtest.end_date).toLocaleDateString()}
                            </p>
                          </div>

                          <Button
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/backtest/${backtest.id}/timeline`);
                            }}
                            size="sm"
                            variant="ghost"
                          >
                            <Timer className="mr-2 h-4 w-4" />
                            Timeline
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-sm text-gray-600">Profit/Loss</p>
                            <p className={profit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                              {formatCurrency(profit)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Win Rate</p>
                            <p className="font-semibold text-gray-900">{formatPercent(backtest.win_rate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Final Balance</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(backtest.final_balance)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-semibold text-gray-900">{duration} days</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}