import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface LineChartProps {
  data: { date: string; count: number; amount: number }[];
  height?: number;
  title?: string;
}

export function LineChart({ data, height = 300, title }: LineChartProps) {
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
      formatter: (params: any) => {
        const date = params[0].axisValue;
        let html = `<div class="font-medium mb-1">${date}</div>`;
        params.forEach((item: any) => {
          const value =
            item.seriesName === '核销金额'
              ? `¥${item.value.toLocaleString()}`
              : item.value.toLocaleString();
          html += `<div class="flex items-center gap-2">
            <span style="background:${item.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span>
            <span>${item.seriesName}:</span>
            <span class="font-medium">${value}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      data: ['核销次数', '核销金额'],
      bottom: 0,
      textStyle: {
        color: '#6b7280',
        fontSize: 12,
      },
    },
    grid: {
      left: 40,
      right: 20,
      top: title ? 40 : 10,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        rotate: 45,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '次数',
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
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
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed',
          },
        },
      },
      {
        type: 'value',
        name: '金额(元)',
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 11,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(0) + 'w';
            }
            return value.toString();
          },
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '核销次数',
        type: 'line',
        data: data.map((d) => d.count),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#1E40AF',
        },
        itemStyle: {
          color: '#1E40AF',
          borderWidth: 2,
          borderColor: '#fff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 64, 175, 0.25)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.02)' },
            ],
          },
        },
      },
      {
        name: '核销金额',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d) => d.amount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#F97316',
        },
        itemStyle: {
          color: '#F97316',
          borderWidth: 2,
          borderColor: '#fff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.2)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0.02)' },
            ],
          },
        },
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
