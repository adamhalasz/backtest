import React, { useState, useEffect } from 'react';
import { ASSET_CLASSES, CRYPTO_SYMBOLS, CURRENCIES, MARKET_DATA_PROVIDERS, STOCK_SYMBOLS, TIMEFRAMES } from '@/lib/constants';
import { TimelineChart } from '@/components/charts/TimelineChart';
import { Calendar, Clock, RefreshCw, Activity, AlertTriangle, ChevronDown, Settings } from 'lucide-react';
import moment, { Moment } from 'moment-timezone';
import { DukascopyClient } from '@/lib/dukascopy';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getDefaultProviderForAssetClass, type MarketAssetClass, type MarketDataProviderId } from '@/lib/market';

type DataExplorerFilters = {
  assetClass: MarketAssetClass;
  provider: MarketDataProviderId;
  symbol: string;
  baseCurrency: string;
  targetCurrency: string;
  timeframe: string;
  startDate: string;
  endDate: string;
};

export function DataExplorerPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Array<{ date: Date; rate: number }>>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [chartSettings, setChartSettings] = useState({
    showVolume: true,
    showGrid: true,
    showCrosshair: true,
    candlestickWidth: 0.8,
    volumeHeight: 20,
    theme: 'light' as 'light' | 'dark',
    animation: true
  });
  const [filters, setFilters] = useState<DataExplorerFilters>({
    assetClass: 'forex' as const,
    provider: getDefaultProviderForAssetClass('forex'),
    symbol: 'BTC-USD',
    baseCurrency: 'EUR',
    targetCurrency: 'USD',
    timeframe: 'all', // Default to All Time
    startDate: moment().subtract(10, 'years').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
  });
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [chartOptions, setChartOptions] = useState({
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
      format: 'HH:mm:ss',
      gridlines: { color: '#f3f4f6' }
    },
    vAxis: {
      0: {
        gridlines: { color: '#f3f4f6' },
        format: 'decimal'
      },
      1: {
        gridlines: { color: 'transparent' },
        textPosition: 'none'
      }
    },
    chartArea: { width: '90%', height: '80%' },
    vAxes: {
      0: { viewWindow: { min: undefined, max: undefined } },
      1: { viewWindow: { min: 0 } }
    },
    explorer: {
      actions: ['dragToZoom', 'rightClickToReset'],
      axis: 'horizontal',
      keepInBounds: true,
      maxZoomIn: 0.01
    }
  });

  // Adjust date range based on timeframe
  const getAdjustedDateRange = (timeframe: string) => {
    const end = moment();
    let start = moment();

    switch (timeframe) {
      case '1s':
      case '1m':
      case '10m':
      case '20m':
      case '30m':
      case '40m':
      case '50m':
      case '1h':
        start = end.clone().subtract(1, 'day');
        break;
      case '1d':
        start = end.clone().subtract(3, 'months');
        break;
      case '5d':
      case '1w':
        start = end.clone().subtract(6, 'months');
        break;
      case '1M':
        start = end.clone().subtract(1, 'year');
        break;
      case '1y':
        start = end.clone().subtract(2, 'years');
        break;
      case '2y':
        start = end.clone().subtract(3, 'years');
        break;
      case '3y':
        start = end.clone().subtract(4, 'years');
        break;
      case '4y':
        start = end.clone().subtract(5, 'years');
        break;
      case '5y':
        start = end.clone().subtract(6, 'years');
        break;
      case 'all':
        start = end.clone().subtract(10, 'years');
        break;
    }

    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD')
    };
  };

  const aggregateDataByTimeframe = (
    data: Array<{ date: Date; rate: number }>,
    timeframe: string
  ): Array<{ date: Date; rate: number }> => {
    const grouped: Array<{ date: Date; rate: number }> = [];
    let currentGroup: Array<number> = [];
    let currentDate = moment(data[0]?.date);

    const getNextInterval = (date: Moment, tf: string) => {
      const clone = date.clone();
      switch (tf) {
        case '1s': return clone.add(1, 'second');
        case '1m': return clone.add(1, 'minute');
        case '10m': return clone.add(10, 'minutes');
        case '20m': return clone.add(20, 'minutes');
        case '30m': return clone.add(30, 'minutes');
        case '40m': return clone.add(40, 'minutes');
        case '50m': return clone.add(50, 'minutes');
        case '1h': return clone.add(1, 'hour');
        case '5d': return clone.add(5, 'days');
        case '1w': return clone.add(1, 'week');
        case '1M': return clone.add(1, 'month');
        case '1y': return clone.add(1, 'year');
        case '2y': return clone.add(2, 'years');
        case '3y': return clone.add(3, 'years');
        case '4y': return clone.add(4, 'years');
        case '5y': return clone.add(5, 'years');
        default: return clone.add(1, 'day');
      }
    };

    data.forEach(item => {
      const itemDate = moment(item.date);
      if (itemDate.isBefore(getNextInterval(currentDate, timeframe))) {
        currentGroup.push(item.rate);
      } else {
        if (currentGroup.length > 0) {
          const avgRate = currentGroup.reduce((a, b) => a + b) / currentGroup.length;
          grouped.push({
            date: currentDate.toDate(),
            rate: avgRate,
          });
        }
        currentGroup = [item.rate];
        currentDate = itemDate;
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      const avgRate = currentGroup.reduce((a, b) => a + b) / currentGroup.length;
      grouped.push({
        date: currentDate.toDate(),
        rate: avgRate,
      });
    }

    return grouped;
  };

  // Update data aggregation when raw data or timeframe changes
  useEffect(() => {
    if (data.length > 0) {
      const aggregated = aggregateDataByTimeframe(data, filters.timeframe);
      const chartData = [
        ['Date', 'Low', 'Open', 'Close', 'High'], // Header
        ...aggregated.map(item => {
          const price = item.rate;
          return [
            new Date(item.date),
            price * 0.999, // Estimated low
            price,        // Open
            price,        // Close
            price * 1.001 // Estimated high
          ];
        })
      ];
      setChartData(chartData);
    }
  }, [data, filters.timeframe]);

  // Handle timeframe changes
  useEffect(() => {
    const { startDate, endDate } = getAdjustedDateRange(filters.timeframe);
    if (!isCustomDateRange) {
      setFilters(prev => ({ ...prev, startDate, endDate }));
    }
  }, [filters.timeframe, isCustomDateRange]);

  const handleTimeframeChange = (timeframe: string) => {
    setIsCustomDateRange(false);
    setFilters(prev => ({ ...prev, timeframe }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setIsCustomDateRange(true);
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dukascopyClient = DukascopyClient.getInstance();
        const symbol = filters.assetClass === 'forex'
          ? `${filters.baseCurrency}${filters.targetCurrency}`
          : filters.symbol.trim().toUpperCase();

        if (!symbol) {
          throw new Error('A market symbol is required.');
        }
        
        const ticks = await dukascopyClient.getTicks(
          symbol,
          new Date(filters.startDate),
          new Date(filters.endDate),
          filters.timeframe,
          (progress) => setProgress(progress),
          {
            assetClass: filters.assetClass,
            provider: filters.provider,
          },
        );
        
        // Convert ticks to chart data format
        const processedData = [
          ['Date', 'Low', 'Open', 'Close', 'High', 'Volume'],
          ...ticks.map(tick => {
            const time = moment(tick.timestamp).toDate();
            const midPrice = (tick.bid + tick.ask) / 2;
            
            return [
              time,
              tick.bid,
              midPrice,
              midPrice,
              tick.ask,
              tick.bidVolume + tick.askVolume
            ];
          })
        ];

        setChartData(processedData);
        setLastUpdate(new Date());
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
        setProgress(null);
      }
    };

    fetchData();

    // Refresh data every minute for intraday timeframes
    if (autoRefresh && ['1m', '5m', '15m', '1h'].includes(filters.timeframe)) {
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [filters, autoRefresh]);

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(rate);
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Market Data Explorer</h1>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Chart Settings
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h3 className="font-medium">Chart Settings</h3>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Volume</Label>
                    <Switch
                      checked={chartSettings.showVolume}
                      onCheckedChange={(checked) => 
                        setChartSettings(prev => ({ ...prev, showVolume: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Grid</Label>
                    <Switch
                      checked={chartSettings.showGrid}
                      onCheckedChange={(checked) => 
                        setChartSettings(prev => ({ ...prev, showGrid: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Show Crosshair</Label>
                    <Switch
                      checked={chartSettings.showCrosshair}
                      onCheckedChange={(checked) => 
                        setChartSettings(prev => ({ ...prev, showCrosshair: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enable Animations</Label>
                    <Switch
                      checked={chartSettings.animation}
                      onCheckedChange={(checked) => 
                        setChartSettings(prev => ({ ...prev, animation: checked }))
                      }
                    />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label>Candlestick Width</Label>
                    <Slider
                      value={[chartSettings.candlestickWidth * 100]}
                      onValueChange={([value]) => 
                        setChartSettings(prev => ({ ...prev, candlestickWidth: value / 100 }))
                      }
                      min={10}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Volume Height (%)</Label>
                    <Slider
                      value={[chartSettings.volumeHeight]}
                      onValueChange={([value]) => 
                        setChartSettings(prev => ({ ...prev, volumeHeight: value }))
                      }
                      min={10}
                      max={40}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {lastUpdate && (
            <span className="text-sm text-gray-600">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant={autoRefresh ? "secondary" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          {loading && (
            <div className="text-indigo-600">
              <Activity className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>
      </div>
      {/* Progress Indicator */}
      {progress !== null && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-700">
              Loading Market Data...
            </span>
            <span className="text-sm font-medium text-indigo-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Asset Class
              </label>
              <select
                value={filters.assetClass}
                onChange={(e) => {
                  const nextAssetClass = e.target.value as 'forex' | 'crypto' | 'stock';
                  const nextSymbol = nextAssetClass === 'crypto'
                    ? CRYPTO_SYMBOLS[0].value
                    : nextAssetClass === 'stock'
                      ? STOCK_SYMBOLS[0].value
                      : filters.symbol;

                  setFilters((current) => ({
                    ...current,
                    assetClass: nextAssetClass,
                    provider: getDefaultProviderForAssetClass(nextAssetClass),
                    symbol: nextSymbol,
                  }));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ASSET_CLASSES.map((assetClass) => (
                  <option key={assetClass.value} value={assetClass.value}>
                    {assetClass.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Provider
              </label>
              <select
                value={filters.provider}
                onChange={(e) => setFilters((current) => ({ ...current, provider: e.target.value as MarketDataProviderId }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MARKET_DATA_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filters.assetClass === 'forex' ? (
            <>
          <div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Base Currency
              </label>
              <select
                value={filters.baseCurrency}
                onChange={(e) => setFilters({ ...filters, baseCurrency: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Target Currency
              </label>
              <select
                value={filters.targetCurrency}
                onChange={(e) => setFilters({ ...filters, targetCurrency: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CURRENCIES.map((currency) => (
                  <option 
                    key={currency.code} 
                    value={currency.code}
                    disabled={currency.code === filters.baseCurrency}
                  >
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filters.assetClass === 'crypto' ? 'Crypto Symbol' : 'Stock Symbol'}
                </label>
                <div className="space-y-2">
                  <select
                    value={filters.symbol}
                    onChange={(e) => setFilters((current) => ({ ...current, symbol: e.target.value.toUpperCase() }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(filters.assetClass === 'crypto' ? CRYPTO_SYMBOLS : STOCK_SYMBOLS).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={filters.symbol}
                    onChange={(e) => setFilters((current) => ({ ...current, symbol: e.target.value.toUpperCase() }))}
                    placeholder={filters.assetClass === 'crypto' ? 'BTC-USD' : 'AAPL'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe
            </label>
            <select
              value={filters.timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                max={filters.endDate}
                className="w-full rounded-lg border border-gray-300 pl-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full relative">
          <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-2 text-sm text-gray-600">
            <p>Drag to pan, scroll to zoom</p>
            <p>Right-click to reset view</p>
          </div>
          <TimelineChart
            data={chartData.slice(1).map(([time, low, open, close, high, volume]) => ({
              time: new Date(time),
              open,
              high,
              low,
              close,
              volume: volume || 0
            }))}
            timeframe={filters.timeframe}
            height="400px"
            width="100%"
            settings={chartSettings}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historical Rates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {chartData.length - 1} data points
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Time', 'Low', 'Open', 'Close', 'High', 'Volume'].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.slice(1).map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {moment(item[0]).format(
                      filters.timeframe.includes('y')
                        ? 'YYYY'
                        : filters.timeframe === '1M'
                        ? 'MMMM YYYY'
                        : filters.timeframe.includes('m') || filters.timeframe.includes('h')
                        ? 'MMMM DD, YYYY HH:mm'
                        : 'MMMM DD, YYYY'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item[1])}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item[2])}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item[3])}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item[4])}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item[5] ? item[5].toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}