import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BarChartProps {
  data: { name: string; value: number }[];
  height?: number;
  title?: string;
  color?: string;
  horizontal?: boolean;
}

export function BarChart({
  data,
  height = 300,
  title,
  color = '#1E40AF',
  horizontal = false,
}: BarChartProps) {
  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          textStyle: {
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
          },
          left: 0,
          top: 0,
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const item = params[0];
        return `<div class="font-medium mb-1">${item.name}</div>
          <div class="flex items-center gap-2">
            <span style="background:${item.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
            <span>${item.value.toLocaleString()}</span>
          </div>`;
      },
    },
    grid: {
      left: horizontal ? 80 : 40,
      right: 20,
      top: title ? 40 : 10,
      bottom: 30,
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : data.map((d) => d.name),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        rotate: horizontal ? 0 : 45,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: horizontal,
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? data.map((d) => d.name) : undefined,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
      },
      splitLine: {
        show: !horizontal,
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => ({
          value: d.value,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 1,
              colorStops: [
                { offset: 0, color: color },
                { offset: 1, color: color + '99' },
              ],
            },
            borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          },
        })),
        barWidth: horizontal ? 20 : '50%',
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
