import React from 'react';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { VolumeChart } from '@/components/charts/VolumeChart';

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
  const chartId = React.useId().replace(/:/g, '-');

  const formattedCandles = data.map((candle) => ({
    x: candle.time,
    y: [candle.open, candle.high, candle.low, candle.close] as [number, number, number, number],
  }));

  const formattedVolume = data.map((candle) => ({
    x: candle.time,
    y: candle.volume,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <CandlestickChart
          data={formattedCandles}
          trades={trades}
          timeframe={timeframe}
          height={height}
          width={width}
          chartId={chartId}
          onZoom={onZoom}
        />
      </div>
      {settings.showVolume ? (
        <div style={{ height: `${settings.volumeHeight}%` }}>
          <VolumeChart
            data={formattedVolume}
            timeframe={timeframe}
            width={width}
            brushTargetId={chartId}
          />
        </div>
      ) : null}
    </div>
  );
}