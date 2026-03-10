import React, { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

interface VolumeChartProps {
  data: {
    x: Date;
    y: number;
  }[];
  height?: number | string;
  width?: number | string;
  timeframe?: string;
  brushTargetId?: string;
}

export function VolumeChart({
  data,
  height = '100px',
  width = '100%',
  timeframe = '1d',
  brushTargetId,
}: VolumeChartProps) {
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
        type: 'bar',
        height: 100,
        ...(brushTargetId
          ? {
              brush: {
                enabled: true,
                target: brushTargetId,
              },
            }
          : {}),
        animations: {
          enabled: false
        }
      },
      series: [{
        name: 'volume',
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
        labels: {
          show: false
        }
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        x: {
          format: 'MMM dd HH:mm'
        }
      },
      grid: {
        show: false
      },
      plotOptions: {
        bar: {
          colors: {
            ranges: [{
              from: -1000000,
              to: 0,
              color: '#ef4444'
            }, {
              from: 1,
              to: 1000000,
              color: '#22c55e'
            }]
          }
        }
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
  }, [brushTargetId, data, timeframe]);

  return (
    <div className="w-full">
      <div ref={chartRef} style={{ height, width }} />
    </div>
  );
}