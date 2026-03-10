import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface VolumeChartProps {
  data: Array<[Date | string | number, number]>;
  height?: string;
  width?: string;
  timeframe?: string;
  settings?: {
    showGrid: boolean;
    theme: 'light' | 'dark';
    animation: boolean;
  };
}

export function VolumeChart({
  data,
  height = '100px',
  width = '100%',
  timeframe = '1d',
  settings = {
    showGrid: true,
    theme: 'light',
    animation: true
  }
}: VolumeChartProps) {
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
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#94a3b8',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Remove price scale
    });

    // Format data for the chart
    const formattedData = data.map(([time, volume]) => ({
      time: typeof time === 'string' ? new Date(time).getTime() / 1000 : 
            time instanceof Date ? time.getTime() / 1000 : 
            Number(time) / 1000,
      value: volume,
    }));

    volumeSeries.setData(formattedData);

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
  }, [data, settings]);

  return <div ref={containerRef} style={{ width, height }} />;
}