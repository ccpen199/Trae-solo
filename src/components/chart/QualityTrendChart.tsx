import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';

interface QualityTrendChartProps {
  data: Array<{ month: string; passRate: number; sampling: number; risk: number }>;
  height?: number;
}

function QualityTrendChart({ data, height = 240 }: QualityTrendChartProps) {
  const option = useMemo<EChartsOption>(() => ({
    grid: {
      left: 40,
      right: 20,
      top: 30,
      bottom: 30,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 37, 38, 0.95)',
      borderColor: 'transparent',
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.month),
      axisLine: {
        lineStyle: { color: '#dce6e2' },
      },
      axisLabel: {
        color: '#66766f',
        fontSize: 11,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 96,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#e8f0ed',
          type: 'dashed' as const,
        },
      },
      axisLabel: {
        color: '#66766f',
        fontSize: 11,
        formatter: '{value}%',
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.passRate),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1e40af' },
              { offset: 1, color: '#10b981' },
            ],
          },
        },
        barWidth: 24,
      },
    ],
  }), [data]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}

export default QualityTrendChart;
