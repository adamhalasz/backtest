import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

interface CandlestickChartProps {
  data: {
    x: Date;
    y: [number, number, number, number]; // [Open, High, Low, Close]
  }[];
  trades?: {
    time: Date;
    type: 'buy' | 'sell';
    price: number;
  }[];
  height?: number | string;
  width?: number | string;
  timeframe?: string;
  chartId?: string;
  onZoom?: (start: Date, end: Date) => void;
}

export function CandlestickChart({
  data,
  trades,
  height = '400px',
  width = '100%',
  timeframe = '1d',
  chartId,
  onZoom
}: CandlestickChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ApexCharts | null>(null);

  // Ensure ApexCharts is loaded in browser environment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Dynamically import ApexCharts
    import('apexcharts').then(() => {
      // ApexCharts is now loaded and ready to use
    });
  }, []);

  useEffect(() => {
    if (!chartRef.current || typeof window === 'undefined') return;

    const options: ApexCharts.ApexOptions = {
      chart: {
        ...(chartId ? { id: chartId } : {}),
        type: 'candlestick',
        height: 350,
        animations: {
          enabled: false
        },
        toolbar: {
          show: true,
          tools: {
            download: false,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true
        }
      },
      series: [{
        name: 'candles',
        data: data.map(item => ({
          x: item.x.getTime(),
          y: item.y
        }))
      }],
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          format: (() => {
            switch (timeframe) {
              case '1m':
              case '5m':
              case '15m':
                return 'HH:mm';
              case '1h':
              case '4h':
                return 'MMM dd HH:mm';
              case '1d':
                return 'MMM dd';
              case '1w':
                return 'MMM dd yyyy';
              case '1M':
                return 'MMM yyyy';
              default:
                return 'MMM dd HH:mm';
            }
          })()
        }
      },
      yaxis: {
        tooltip: {
          enabled: true
        },
        labels: {
          formatter: (value) => value.toFixed(5)
        }
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: '#22c55e',
            downward: '#ef4444'
          },
          wick: {
            useFillColor: true
          }
        }
      },
      annotations: trades ? {
        points: trades.map(trade => ({
          x: trade.time.getTime(),
          y: trade.price,
          marker: {
            size: 6,
            fillColor: trade.type === 'buy' ? '#22c55e' : '#ef4444',
            strokeColor: '#fff',
            radius: 2
          },
          label: {
            borderColor: trade.type === 'buy' ? '#22c55e' : '#ef4444',
            style: {
              color: '#fff',
              background: trade.type === 'buy' ? '#22c55e' : '#ef4444'
            },
            text: trade.type === 'buy' ? 'Buy' : 'Sell'
          }
        }))
      } : undefined,
      tooltip: {
        enabled: true,
        theme: 'light',
        x: {
          format: 'MMM dd HH:mm'
        }
      },
      grid: {
        borderColor: '#f3f4f6'
      }
    };

    if (!chartInstance.current) {
      chartInstance.current = new ApexCharts(chartRef.current, options);
      chartInstance.current.render();
    } else {
      chartInstance.current.updateOptions(options);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartId, data, trades, timeframe]);

  return (
    <div className="w-full h-full">
      <div ref={chartRef} style={{ height, width }} />
    </div>
  );
}