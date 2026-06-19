import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface PieChartProps {
  data: { name: string; value: number }[];
  height?: number;
  title?: string;
  colors?: string[];
}

const defaultColors = ['#1E40AF', '#F97316', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export function PieChart({
  data,
  height = 300,
  title,
  colors = defaultColors,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: any) => {
        const percent = ((params.value / total) * 100).toFixed(1);
        return `<div class="font-medium mb-1">${params.name}</div>
          <div class="flex items-center gap-2">
            <span style="background:${params.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
            <span>${params.value} (${percent}%)</span>
          </div>`;
      },
    },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: {
        color: '#6b7280',
        fontSize: 12,
      },
      formatter: (name: string) => {
        const item = data.find((d) => d.name === name);
        if (item) {
          const percent = ((item.value / total) * 100).toFixed(1);
          return `${name}  ${percent}%`;
        }
        return name;
      },
    },
    color: colors,
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1f2937',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
        labelLine: {
          show: false,
        },
        data: data,
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
