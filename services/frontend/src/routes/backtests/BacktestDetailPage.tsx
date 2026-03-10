import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { StoredBacktest, Trade, Candle, EntryFrequency } from '@/lib/types';
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Calendar, Timer, RefreshCw, Settings } from 'lucide-react';
import { TradingBacktester } from '@/lib/backtest';
import { TradeHistoryItem } from '@/routes/backtests/components/trade-history-item';
import { STRATEGIES } from '@/lib/strategies';
import { TimelineChart } from '@/components/charts/scichart';
import { Button } from '@/components/ui/button';
import moment from 'moment-timezone';
import { DukascopyClient } from '@/lib/dukascopy';
import { getBacktest, listBacktestTrades, saveBacktestRun } from '@/lib/api-client';

export function BacktestDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [backtest, setBacktest] = useState<StoredBacktest | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tickData, setTickData] = useState<any[]>([]);
  const [loadingTicks, setLoadingTicks] = useState(false);
  const [tickError, setTickError] = useState<string | null>(null);
  
  const getBacktestName = (backtest: StoredBacktest) => {
    const startDate = new Date(backtest.start_date);
    const endDate = new Date(backtest.end_date);
    const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleString('en-US', { month: 'short' });
    const year = endDate.getFullYear();
    const strategyShortName = backtest.strategy.replace(' Strategy', '');
    return `${startMonth}-${endMonth} ${year} ${strategyShortName}`;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rerunning, setRerunning] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('1d');
  const [chartOptions, setChartOptions] = useState({
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true,
      maxZoomIn: 0.01
    },
    height: '100%',
    seriesType: 'candlesticks',
    series: {
      1: {
        type: 'bars',
        targetAxisIndex: 1,
        color: '#E0E0E0'
      }
    },
    bar: { groupWidth: '80%' },
    legend: 'none',
    backgroundColor: 'transparent',
    candlestick: {
      fallingColor: { strokeWidth: 0, fill: '#ef4444' }, // red
      risingColor: { strokeWidth: 0, fill: '#22c55e' }   // green
    },
    hAxis: {
      format: 'MMM d, HH:mm',
      gridlines: { color: '#f3f4f6' },
      textStyle: { fontSize: 11 }
    },
    vAxis: {
      0: {
        gridlines: { color: '#f3f4f6' },
        format: 'decimal',
        textStyle: { fontSize: 11 }
      },
      1: {
        gridlines: { color: 'transparent' },
        textPosition: 'none'
      }
    },
    chartArea: { width: '90%', height: '70%' },
    vAxes: {
      0: { viewWindow: { min: undefined, max: undefined } },
      1: { viewWindow: { min: 0 } }
    }
  });

  const [selectedTimeframe, setSelectedTimeframe] = React.useState('1d');

  useEffect(() => {
    const fetchBacktest = async () => {
      try {
        if (!id) throw new Error('Backtest not found');
        const backtestData = await getBacktest(id);
        const tradesData = await listBacktestTrades(id);

        setBacktest(backtestData);
        setTrades(tradesData || []);

        // Fetch market data
        if (backtestData) {
          setLoadingTicks(true);
          try {
            const dukascopyClient = DukascopyClient.getInstance();
            const [baseCurrency, targetCurrency] = backtestData.symbol.split('/');
            const symbol = `${baseCurrency}${targetCurrency}`;
            
            const ticks = await dukascopyClient.getTicks(
              symbol,
              new Date(backtestData.start_date),
              new Date(backtestData.end_date),
              selectedTimeframe
            );
            
            // Convert ticks to chart data format
            const processedData = [
              ['Date', 'Low', 'Open', 'Close', 'High'],
              ...ticks.map(tick => {
                const time = new Date(tick.timestamp);
                const midPrice = (tick.bid + tick.ask) / 2;
                
                // Check if there's a trade at this time
                const trade = tradesData.find(t => 
                  t.type === 'BUY' && 
                  Math.abs(new Date(t.entryTime).getTime() - time.getTime()) < 1000 * 60 // Within 1 minute
                );
                
                return [
                  time,
                  tick.bid,
                  midPrice,
                  midPrice,
                  tick.ask
                ];
              })
            ];

            setTickData(processedData);
            setChartData(processedData);
          } catch (err) {
            setTickError(err instanceof Error ? err.message : 'Failed to fetch market data');
          } finally {
            setLoadingTicks(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch backtest');
      } finally {
        setLoading(false);
      }
    };

    fetchBacktest();
  }, [id, selectedTimeframe]);

  const handleRerun = async () => {
    if (!backtest) return;
    setRerunning(true);
    try {
      const backtester = new TradingBacktester({
        symbol: backtest.symbol,
        exchange: backtest.exchange,
        strategy: backtest.strategy,
        timeframe: '1d',
        startDate: backtest.start_date,
        endDate: backtest.end_date,
        initialBalance: backtest.initial_balance,
        riskPerTrade: 2,
        maxTradeTime: 8,
        entryFrequency: STRATEGIES.find(s => s.name === backtest.strategy)?.defaultFrequency || EntryFrequency.DAILY
      });

      const results = await backtester.runBacktest();

      const newBacktest = await saveBacktestRun({
        backtest: {
          symbol: backtest.symbol,
          exchange: backtest.exchange,
          strategy: backtest.strategy,
          start_date: backtest.start_date,
          end_date: backtest.end_date,
          initial_balance: backtest.initial_balance,
          final_balance: results.finalBalance,
          win_rate: results.metrics.winRate,
          profit_factor: Number.isFinite(results.metrics.profitFactor) ? results.metrics.profitFactor : 0,
          max_drawdown: results.metrics.maxDrawdown,
          parameters: backtest.parameters,
        },
        trades: results.trades,
      });

      // Navigate to the new backtest result
      navigate(`/backtest/${newBacktest.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rerun backtest');
    } finally {
      setRerunning(false);
    }
  };

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


  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Activity className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Backtests
        </Button>
      </div>
    );
  }

  if (!backtest) return null;
  const profit = backtest.final_balance - backtest.initial_balance;
  const profitPercentage = ((profit / backtest.initial_balance) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Backtests
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/backtest/${id}/timeline`)}
            variant="secondary"
          >
            <Timer className="w-4 h-4 mr-2" />
            View Timeline
          </Button>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedTimeframe === tf
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            onClick={handleRerun}
            disabled={rerunning}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${rerunning ? 'animate-spin' : ''}`} />
            {rerunning ? 'Rerunning...' : 'Rerun Backtest'}
          </Button>
        </div>
        <span className="text-sm text-gray-500">
          Created on {new Date(backtest.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      {/* Strategy Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getBacktestName(backtest)}</h1>
        <p className="text-lg text-gray-600">{backtest.symbol} on {backtest.exchange}</p>
      </div>

      {/* Date Range Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-black bg-opacity-25 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="flex items-center space-x-4">
                <Calendar className="w-6 h-6" />
                <div>
                  <h2 className="text-sm font-medium opacity-75">Backtest Period</h2>
                  <p className="text-xl font-bold">
                    {`${new Date(backtest.start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })} — ${new Date(backtest.end_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}`}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-75">Duration</p>
                <p className="text-xl font-bold">
                  {`${Math.ceil((new Date(backtest.end_date).getTime() - new Date(backtest.start_date).getTime()) / (1000 * 60 * 60 * 24))} Days`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Strategy Configuration</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Risk Parameters */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Risk Parameters</h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Take Profit</span>
                  <span className="text-sm font-medium">{backtest.parameters?.takeProfitLevel || STRATEGIES.find(s => s.name === backtest.strategy)?.getDefaultConfig().takeProfitLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stop Loss</span>
                  <span className="text-sm font-medium">{backtest.parameters?.stopLossLevel || STRATEGIES.find(s => s.name === backtest.strategy)?.getDefaultConfig().stopLossLevel}%</span>
                </div>
              </div>
            </div>

            {/* Indicator Parameters */}
            {STRATEGIES.find(s => s.name === backtest.strategy)?.indicators.map((indicator) => (
              <div key={indicator}>
                <h3 className="text-sm font-medium text-gray-900 mb-4">{indicator} Parameters</h3>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  {indicator === 'RSI' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Overbought Level</span>
                        <span className="text-sm font-medium">{backtest.parameters?.rsiOverbought || 65}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Oversold Level</span>
                        <span className="text-sm font-medium">{backtest.parameters?.rsiOversold || 35}</span>
                      </div>
                    </>
                  )}
                  {indicator === 'MACD' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fast Period</span>
                        <span className="text-sm font-medium">{backtest.parameters?.macdFastPeriod || 12}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Slow Period</span>
                        <span className="text-sm font-medium">{backtest.parameters?.macdSlowPeriod || 26}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Signal Period</span>
                        <span className="text-sm font-medium">{backtest.parameters?.macdSignalPeriod || 9}</span>
                      </div>
                    </>
                  )}
                  {indicator === 'Bollinger Bands' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Period</span>
                        <span className="text-sm font-medium">{backtest.parameters?.bollingerPeriod || 20}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Standard Deviation</span>
                        <span className="text-sm font-medium">{backtest.parameters?.bollingerDeviation || 2}</span>
                      </div>
                    </>
                  )}
                  {indicator === 'EMA' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Period</span>
                      <span className="text-sm font-medium">{backtest.parameters?.emaPeriod || 14}</span>
                    </div>
                  )}
                  {indicator === 'VWAP' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Period</span>
                      <span className="text-sm font-medium">{backtest.parameters?.vwapPeriod || 14}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Value Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Value Over Time</h2>
        {loadingTicks ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-600">Loading market data...</p>
            </div>
          </div>
        ) : tickError ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              {tickError}
            </div>
          </div>
        ) : (
        <TimelineChart
          data={chartData.slice(1).map(([time, low, open, close, high, volume]) => ({
            time: new Date(time),
            open,
            high,
            low,
            close,
            volume: volume || 0
          }))}
          trades={trades.map(trade => ({
            time: new Date(trade.entryTime),
            type: trade.type.toLowerCase() as 'buy' | 'sell',
            price: trade.entryPrice
          }))}
          timeframe={selectedTimeframe}
          height="400px"
          width="100%"
        />
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Initial Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(backtest.initial_balance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Final Balance</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(backtest.final_balance)}
                </p>
                {profit > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profit/Loss</p>
              <p className={`text-2xl font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(profit)} ({profitPercentage >= 0 ? '+' : ''}{formatPercent(profitPercentage)})
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Win Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercent(backtest.win_rate)}
                </p>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Trade History</h2>
        {trades.map((trade, index) => <TradeHistoryItem key={index} trade={trade} />)}
      </div>
    </div>
  );
}