import React, { useEffect, useRef } from 'react';

interface TimelineChartProps {
  data: Array<{
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  trades?: {
    time: Date;
    type: 'buy' | 'sell';
    price: number;
  }[];
  timeframe?: string;
  height?: string;
  width?: string;
  settings?: {
    showVolume: boolean;
    showGrid: boolean;
    showCrosshair: boolean;
    candlestickWidth: number;
    volumeHeight: number;
    theme: 'light' | 'dark';
    animation: boolean;
  };
  onZoom?: (start: Date, end: Date) => void;
}

export function TimelineChart({
  data,
  trades,
  timeframe = '1d',
  height = '100%',
  width = '100%',
  settings = {
    showVolume: true,
    showGrid: true,
    showCrosshair: true,
    candlestickWidth: 0.8,
    volumeHeight: 20,
    theme: 'light',
    animation: true
  },
  onZoom
}: TimelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load TradingView library
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = initializeChart;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  const initializeChart = () => {
    if (!window.TradingView) return;

    try {
      // Create TradingView widget
      chartRef.current = new window.TradingView.widget({
        container_id: containerRef.current?.id,
        width: '100%',
        height: '100%',
        symbol: 'OANDA:EURUSD', // Example symbol
        interval: timeframe,
        timezone: 'Etc/UTC',
        theme: settings.theme,
        style: '1', // Candlesticks
        locale: 'en',
        toolbar_bg: settings.theme === 'light' ? '#f8f9fa' : '#1a1a1a',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        calendar: true,
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        withdateranges: true,
        hide_volume: !settings.showVolume,
        grid: settings.showGrid,
        studies: [
          { id: 'MASimple@tv-basicstudies', inputs: { length: 20 } },
          { id: 'MASimple@tv-basicstudies', inputs: { length: 50 } },
          { id: 'RSI@tv-basicstudies' }
        ],
        overrides: {
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        }
      });

      // Add trade markers
      if (trades && trades.length > 0) {
        chartRef.current.onChartReady(() => {
          trades.forEach(trade => {
            chartRef.current.chart().createShape({
              time: trade.time.getTime() / 1000,
              price: trade.price,
              text: trade.type.toUpperCase(),
              shape: trade.type === 'buy' ? 'arrow_up' : 'arrow_down',
              overrides: {
                backgroundColor: trade.type === 'buy' ? '#22c55e' : '#ef4444',
                borderColor: trade.type === 'buy' ? '#22c55e' : '#ef4444',
                textColor: '#ffffff'
              }
            });
          });
        });
      }

      // Handle zoom events
      if (onZoom) {
        chartRef.current.onChartReady(() => {
          chartRef.current.subscribe('onIntervalChanged', (interval: string) => {
            const visibleRange = chartRef.current.chart().getVisibleRange();
            onZoom(
              new Date(visibleRange.from * 1000),
              new Date(visibleRange.to * 1000)
            );
          });
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize TradingView chart');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      id="tradingview_chart"
      style={{ width, height }}
      className="relative"
    >
      <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-2 text-sm text-gray-600">
        <p>Drag to pan, scroll to zoom</p>
        <p>Right-click to reset view</p>
      </div>
    </div>
  );
}