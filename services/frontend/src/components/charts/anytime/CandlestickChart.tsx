import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';

interface CandlestickChartProps {
  data: Array<[Date | string | number, number, number, number, number, number]>;
  trades?: {
    time: Date;
    type: 'buy' | 'sell';
    price: number;
  }[];
  height?: string;
  width?: string;
  timeframe?: string;
  settings?: {
    showGrid: boolean;
    showCrosshair: boolean;
    candlestickWidth: number;
    theme: 'light' | 'dark';
    animation: boolean;
  };
  onZoom?: (start: Date, end: Date) => void;
}

export function CandlestickChart({
  data,
  trades,
  height = '400px',
  width = '100%',
  timeframe = '1d',
  settings = {
    showGrid: true,
    showCrosshair: true,
    candlestickWidth: 0.8,
    theme: 'light',
    animation: true
  },
  onZoom
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: settings.theme === 'dark' ? '#1a1a1a' : '#ffffff' },
        textColor: settings.theme === 'dark' ? '#d1d5db' : '#374151',
      },
      grid: {
        vertLines: { visible: settings.showGrid },
        horzLines: { visible: settings.showGrid },
      },
      crosshair: {
        mode: settings.showCrosshair ? CrosshairMode.Normal : CrosshairMode.None,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Format data for the chart
    const formattedData = data.map(([time, low, open, close, high]) => ({
      time: typeof time === 'string' ? new Date(time).getTime() / 1000 : 
            time instanceof Date ? time.getTime() / 1000 : 
            Number(time) / 1000,
      low,
      open,
      close,
      high,
    }));

    candlestickSeries.setData(formattedData);

    // Add trade markers
    if (trades?.length) {
      const markers = trades.map(trade => ({
        time: trade.time.getTime() / 1000,
        position: trade.type === 'buy' ? 'belowBar' : 'aboveBar',
        color: trade.type === 'buy' ? '#22c55e' : '#ef4444',
        shape: trade.type === 'buy' ? 'arrowUp' : 'arrowDown',
        text: trade.type.toUpperCase(),
      }));

      candlestickSeries.setMarkers(markers);
    }

    // Handle zoom events
    if (onZoom) {
      chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        if (range) {
          onZoom(
            new Date(range.from * 1000),
            new Date(range.to * 1000)
          );
        }
      });
    }

    // Handle resize
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        chart.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      chart.remove();
      resizeObserver.disconnect();
    };
  }, [data, trades, settings, onZoom]);

  return <div ref={containerRef} style={{ width, height }} />;
}