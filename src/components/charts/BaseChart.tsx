import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { cn } from '../../lib/utils';

interface BaseChartProps {
  option: any;
  className?: string;
  style?: React.CSSProperties;
  theme?: 'dark' | 'light';
  onChartReady?: (chart: echarts.ECharts) => void;
}

export function BaseChart({ option, className, style, theme = 'dark', onChartReady }: BaseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, theme, {
      renderer: 'canvas',
    });

    chartInstance.current.setOption(option);

    if (onChartReady) {
      onChartReady(chartInstance.current);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(option, { notMerge: false });
    }
  }, [option]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full h-full', className)}
      style={{ minHeight: '200px', ...style }}
    />
  );
}
