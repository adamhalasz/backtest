import React from 'react';
import { CandlestickChart } from './CandlestickChart';
import { VolumeChart } from './VolumeChart';

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
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Format data for candlestick chart
  const formattedData = data.map(candle => {
    if (!candle || typeof candle !== 'object') return null;
    
    const time = candle.time ? (candle.time instanceof Date ? candle.time : new Date(candle.time)) : new Date();
    const open = Number(candle.open) || 0;
    const high = Number(candle.high) || 0;
    const low = Number(candle.low) || 0;
    const close = Number(candle.close) || 0;
    const volume = Number(candle.volume) || 0;

    // Ensure all values are valid numbers
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume)) {
      console.warn('Invalid data point:', { time, open, high, low, close, volume });
      return null;
    }

    // Ensure OHLC values make sense
    const validHigh = Math.max(open, high, low, close);
    const validLow = Math.min(open, high, low, close);

    return [
      time.getTime(),
      validLow,
      open,
      close,
      validHigh,
      volume
    ];
  }).filter(Boolean);

  // Format data for volume chart
  const volumeData = data.map(candle => {
    if (!candle || typeof candle !== 'object') return null;
    
    const time = candle.time ? (candle.time instanceof Date ? candle.time : new Date(candle.time)) : new Date();
    const volume = Number(candle.volume) || 0;

    // Ensure volume is a valid number
    if (isNaN(volume) || volume < 0) {
      console.warn('Invalid volume:', { time, volume });
      return null;
    }

    // Ensure volume is a valid number
    if (isNaN(volume) || volume < 0) {
      console.warn('Invalid volume:', { time, volume });
      return null;
    }

    return [
      time.getTime(),
      volume
    ];
  }).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <CandlestickChart
          data={formattedData}
          trades={trades}
          timeframe={timeframe}
          height={height}
          width={width}
          settings={settings}
          onZoom={onZoom}
        />
      </div>
      {settings.showVolume && (
        <div className={`h-[${settings.volumeHeight}%] mt-4`}>
          <VolumeChart
            data={volumeData}
            timeframe={timeframe}
            width={width}
            settings={settings}
          />
        </div>
      )}
    </div>
  );
}