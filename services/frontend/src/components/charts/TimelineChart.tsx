import { TimelineChart as LocalTimelineChart } from './scichart/TimelineChart';

interface TimelineChartProps {
  data: {
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
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

export function TimelineChart(props: TimelineChartProps) {
  return <LocalTimelineChart {...props} />;
}