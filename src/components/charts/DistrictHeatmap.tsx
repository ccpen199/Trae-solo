import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useTheme } from '@/hooks/useTheme';
import type { DistrictPrice } from '@/mock/data';

interface DistrictHeatmapProps {
  data: DistrictPrice[];
  height?: number | string;
}

const COLOR_GRADIENT = {
  negative: '#2A9D8F',
  neutral: '#F5F5F5',
  positive: '#E63946',
};

export default function DistrictHeatmap({
  data,
  height = 400,
}: DistrictHeatmapProps) {
  const { isDark } = useTheme();

  const maxChange = Math.max(
    ...data.map((d) => Math.abs(d.change7d)),
    1
  );

  const heatmapData = data.map((d, index) => [
    index % 4,
    Math.floor(index / 4),
    d.change7d,
    d.districtName,
    d.avgPrice,
  ]);

  const xAxisData = ['A', 'B', 'C', 'D'];
  const yAxisData = Array.from(
    { length: Math.ceil(data.length / 4) },
    (_, i) => `${i + 1}`
  );

  const textColor = isDark ? '#e5e7eb' : '#374151';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      textStyle: {
        color: textColor,
      },
      formatter: (params: unknown) => {
        const p = params as {
          value: [number, number, number, string, number];
        };
        if (!p || !p.value) return '';
        const [, , change, name, avgPrice] = p.value;
        const changeColor = change >= 0 ? COLOR_GRADIENT.positive : COLOR_GRADIENT.negative;
        const changeSign = change >= 0 ? '+' : '';
        return `
          <div style="padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${name}</div>
            <div style="margin: 4px 0;">均价: <span style="font-weight: 600;">¥${avgPrice.toLocaleString()}/㎡</span></div>
            <div style="margin: 4px 0;">7日涨跌: <span style="font-weight: 600; color: ${changeColor};">${changeSign}${change}%</span></div>
          </div>
        `;
      },
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      splitArea: {
        show: true,
      },
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
      splitArea: {
        show: true,
      },
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        show: false,
      },
      axisTick: {
        show: false,
      },
    },
    visualMap: {
      min: -maxChange,
      max: maxChange,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      text: ['上涨', '下跌'],
      textStyle: {
        color: textColor,
      },
      inRange: {
        color: [
          COLOR_GRADIENT.negative,
          isDark ? '#374151' : COLOR_GRADIENT.neutral,
          COLOR_GRADIENT.positive,
        ],
      },
    },
    series: [
      {
        name: '7日价格变化',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          formatter: (params: unknown) => {
            const p = params as {
              value: [number, number, number, string];
            };
            return p.value[3];
          },
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 500,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 50,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
