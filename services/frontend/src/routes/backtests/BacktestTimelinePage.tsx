import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { TimelineChart } from '@/components/charts/scichart';
import { ArrowLeft, Play, Pause, StopCircle, Activity, Calendar } from 'lucide-react';
import moment from 'moment-timezone';
import { DukascopyClient } from '@/lib/dukascopy';
import { getBacktest, listBacktestTrades } from '@/lib/api-client';
import { buildMarketDataRequestSymbol, resolveStoredAssetClass, resolveStoredProvider } from '@/lib/market';

const CHART_TIMEFRAMES = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1M', label: '1M' },
];

export function BacktestTimelinePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [backtest, setBacktest] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<{
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[]>([]);
  const [chartSettings, setChartSettings] = useState({
    showVolume: true,
    showGrid: true,
    showCrosshair: true,
    candlestickWidth: 0.8,
    volumeHeight: 20,
    theme: 'light' as 'light' | 'dark',
    animation: true
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeframe, setTimeframe] = useState('1d');
  const [viewMode, setViewMode] = useState<'live' | 'manual'>('manual');
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [tickData, setTickData] = useState<any[]>([]);
  const [loadingTicks, setLoadingTicks] = useState(false);
  const [tickError, setTickError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) throw new Error('Backtest not found');
        const backtestData = await getBacktest(id);

        if (backtestData.status !== 'completed') {
          setBacktest(backtestData);
          setTrades([]);
          setError(backtestData.status === 'failed'
            ? (backtestData.error_message || 'Backtest workflow failed')
            : 'Backtest is still running in Cloudflare Workflows. Timeline will be available after completion.');
          return;
        }

        const tradesData = await listBacktestTrades(id);

        setBacktest(backtestData);
        setTrades(tradesData || []);
        // Process trades into chart data
        const processedData = (tradesData || []).map((trade) => ({
          time: new Date(trade.entryTime),
          low: Math.min(trade.entryPrice, trade.exitPrice),
          open: trade.entryPrice,
          close: trade.exitPrice,
          high: Math.max(trade.entryPrice, trade.exitPrice),
          volume: 0,
        }));

        setChartData(processedData);
        setCurrentTime(tradesData?.[0] ? new Date(tradesData[0].entryTime).getTime() : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch backtest data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const aggregateDataByTimeframe = (data: any[], tf: string) => {
    const grouped = new Map();
    
    data.slice(1).forEach(tick => { // Skip header row
      const tickTime = new Date(tick[0]); // First element is the date
      let key: Date;
      
      // Determine the grouping key based on timeframe
      switch (tf) {
        case '1m':
          const minuteTime = new Date(tickTime);
          minuteTime.setSeconds(0, 0);
          key = minuteTime;
          break;
        case '5m':
          const fiveMinTime = new Date(tickTime);
          fiveMinTime.setMinutes(Math.floor(fiveMinTime.getMinutes() / 5) * 5, 0, 0);
          key = fiveMinTime;
          break;
        case '15m':
          const fifteenMinTime = new Date(tickTime);
          fifteenMinTime.setMinutes(Math.floor(fifteenMinTime.getMinutes() / 15) * 15, 0, 0);
          key = fifteenMinTime;
          break;
        case '1h':
          const hourTime = new Date(tickTime);
          hourTime.setMinutes(0, 0, 0);
          key = hourTime;
          break;
        case '4h':
          const fourHourTime = new Date(tickTime);
          fourHourTime.setHours(Math.floor(fourHourTime.getHours() / 4) * 4, 0, 0, 0);
          key = fourHourTime;
          break;
        case '1d':
          const dayTime = new Date(tickTime);
          dayTime.setHours(0, 0, 0, 0);
          key = dayTime;
          break;
        case '1w':
          const weekTime = new Date(tickTime);
          const dayOfWeek = weekTime.getDay();
          const diff = weekTime.getDate() - dayOfWeek;
          weekTime.setDate(diff);
          weekTime.setHours(0, 0, 0, 0);
          key = weekTime;
          break;
        case '1M':
          const monthTime = new Date(tickTime);
          monthTime.setDate(1);
          monthTime.setHours(0, 0, 0, 0);
          key = monthTime;
          break;
        default:
          key = tickTime;
      }
      
      if (!grouped.has(key.getTime())) {
        grouped.set(key.getTime(), {
          date: key,
          low: tick[1],
          open: tick[2],
          close: tick[3],
          high: tick[4],
          volume: tick[5] || 0,
          count: 1
        });
      } else {
        const group = grouped.get(key.getTime());
        group.low = Math.min(group.low, tick[1]);
        group.high = Math.max(group.high, tick[4]);
        group.close = tick[3];
        group.volume = (group.volume || 0) + (tick[5] || 0);
        group.count++;
      }
    });
    
    return Array.from(grouped.values()).map(group => [
      group.date,
      group.low,
      group.open,
      group.close,
      group.high,
      group.volume
    ]).sort((a, b) => a[0].getTime() - b[0].getTime());
  };

  // Fetch tick data whenever backtest or timeframe changes
  useEffect(() => {
    const fetchTickData = async () => {
      if (!backtest) return;
      
      setLoadingTicks(true);
      setTickError(null);
      
      try {
        const dukascopyClient = DukascopyClient.getInstance();
        const assetClass = resolveStoredAssetClass(backtest.parameters, backtest.symbol);
        const provider = resolveStoredProvider(backtest.parameters, backtest.symbol);
        const symbol = buildMarketDataRequestSymbol(backtest.symbol, assetClass);
        
        const ticks = await dukascopyClient.getTicks(
          symbol,
          new Date(backtest.start_date),
          new Date(backtest.end_date),
          timeframe,
          (progress) => {
            // Update progress if needed
          },
          {
            assetClass,
            provider,
          },
        );
        
        // Group ticks into candles based on timeframe
        const candles = new Map();
        
        ticks.forEach(tick => {
          const tickTime = new Date(tick.timestamp);
          let key: Date;
          
          // Determine the grouping key based on timeframe
          switch (timeframe) {
            case '1m':
              key = new Date(tickTime.setSeconds(0, 0));
              break;
            case '5m':
              key = new Date(tickTime.setMinutes(Math.floor(tickTime.getMinutes() / 5) * 5, 0, 0));
              break;
            case '15m':
              key = new Date(tickTime.setMinutes(Math.floor(tickTime.getMinutes() / 15) * 15, 0, 0));
              break;
            case '1h':
              key = new Date(tickTime.setMinutes(0, 0, 0));
              break;
            case '4h':
              key = new Date(tickTime.setHours(Math.floor(tickTime.getHours() / 4) * 4, 0, 0, 0));
              break;
            case '1d':
              key = new Date(tickTime.setHours(0, 0, 0, 0));
              break;
            default:
              key = new Date(tickTime.setMinutes(0, 0, 0));
          }
          
          const price = (tick.bid + tick.ask) / 2;
          
          if (!candles.has(key.getTime())) {
            candles.set(key.getTime(), {
              time: key,
              open: price,
              high: price,
              low: price,
              close: price,
              volume: tick.bidVolume + tick.askVolume
            });
          } else {
            const candle = candles.get(key.getTime());
            candle.high = Math.max(candle.high, price);
            candle.low = Math.min(candle.low, price);
            candle.close = price;
            candle.volume += tick.bidVolume + tick.askVolume;
          }
        });
        
        // Convert Map to array and sort by time
        const processedData = Array.from(candles.values())
          .sort((a, b) => a.time.getTime() - b.time.getTime());

        setChartData(processedData);
      } catch (err) {
        setTickError(err instanceof Error ? err.message : 'Failed to fetch market data');
      } finally {
        setLoadingTicks(false);
      }
    };

    fetchTickData();
  }, [backtest, timeframe]);

  useEffect(() => {
    let animationFrame: number;
    
    if (isPlaying && viewMode === 'live' && trades.length > 0) {
      const startTime = performance.now();
      const startDate = new Date(trades[0].entryTime).getTime();
      const endDate = new Date(trades[trades.length - 1].entryTime).getTime();
      const duration = endDate - startDate;
      const playbackSpeed = duration / 10000; // Complete playback in 10 seconds

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / 10000, 1); // 10 seconds total duration
        const currentDate = startDate + (duration * progress);
        
        setCurrentTime(currentDate);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      };

      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, viewMode, trades]);

  const handlePlay = () => {
    setViewMode('live');
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setViewMode('manual');
    setCurrentTime(trades[0] ? new Date(trades[0].entryTime).getTime() : null);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col">
        {/* Main Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate(`/backtest/${id}`)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{backtest?.symbol}</h1>
                <p className="text-sm text-gray-600">
                  {backtest?.strategy} • {backtest?.exchange}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePlay} size="sm" variant={isPlaying ? "secondary" : "default"}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button onClick={handleStop} size="sm" variant="outline">
                <StopCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="border-b bg-gray-50/50 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {CHART_TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeframe === tf.value
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {backtest && (
                <span>
                  {new Date(backtest.start_date).toLocaleDateString()} - {new Date(backtest.end_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div 
        className="flex-1 relative border-b p-4"
        onWheel={e => {
          // Prevent page scroll when interacting with chart
          if (e.target instanceof Element && e.target.closest('.google-visualization-container')) {
            e.preventDefault();
          }
        }}
      >
        <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-2 text-sm text-gray-600">
          <p>Drag to pan, scroll to zoom</p>
          <p>Right-click to reset view</p>
        </div>
        {loadingTicks ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-600">Loading market data...</p>
            </div>
          </div>
        ) : tickError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              {tickError}
            </div>
          </div>
        ) : (
        <TimelineChart
          data={chartData}
          trades={trades.map(trade => ({
            time: new Date(trade.entryTime),
            type: trade.type.toLowerCase() as 'buy' | 'sell',
            price: trade.entryPrice
          }))}
          timeframe={timeframe}
          height="calc(100vh - 150px)"
          width="100%"
          settings={chartSettings}
          onZoom={(start, end) => {
            // Handle zoom events if needed
          }}
        />
        )}
      </div>
    </div>
  );
}