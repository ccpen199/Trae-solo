import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useTheme } from '@/hooks/useTheme';
import type { PricePoint } from '@/mock/data';
import type { PropertyType } from '@shared/types';

interface TransactionScatterProps {
  data: PricePoint[];
  housingType?: PropertyType;
  height?: number | string;
}

const COLORS: Record<PropertyType, string> = {
  secondhand: '#0A2463',
  new: '#2A9D8F',
  rental: '#D4AF37',
  overseas: '#E63946',
  vacation: '#7C3AED',
};

export default function TransactionScatter({
  data,
  housingType = 'secondhand',
  height = 400,
}: TransactionScatterProps) {
  const { isDark } = useTheme();

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filteredData = data
    .filter((d) => {
      const date = new Date(d.date);
      return date >= threeMonthsAgo && d.type === 'transaction';
    })
    .map((d) => [d.date, d.price, d.price]);

  const allPrices = filteredData.map((d) => d[1] as number);
  const avgPrice = allPrices.length > 0
    ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
    : 0;
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

  const textColor = isDark ? '#e5e7eb' : '#374151';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const chartColor = COLORS[housingType] || COLORS.secondhand;

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      textStyle: {
        color: textColor,
      },
      formatter: (params: unknown) => {
        const p = params as {
          value: [string, number, number];
          marker: string;
        };
        if (!p || !p.value) return '';
        const [date, price] = p.value;
        const deviation = avgPrice > 0 ? ((price - avgPrice) / avgPrice * 100).toFixed(1) : '0';
        const deviationSign = price >= avgPrice ? '+' : '';
        const deviationColor = price >= avgPrice ? '#E63946' : '#2A9D8F';
        return `
          <div style="padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${date}</div>
            <div style="margin: 4px 0;">${p.marker} 成交价: <span style="font-weight: 600;">¥${price.toLocaleString()}</span></div>
            <div style="margin: 4px 0;">均价偏差: <span style="font-weight: 600; color: ${deviationColor};">${deviationSign}${deviation}%</span></div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        color: textColor,
        formatter: (value: number) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
      splitLine: {
        lineStyle: {
          color: gridColor,
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '成交价 (元/㎡)',
      nameTextStyle: {
        color: textColor,
        padding: [0, 0, 0, 40],
      },
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: textColor,
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(0)}万`;
          }
          return `${value}`;
        },
      },
      splitLine: {
        lineStyle: {
          color: gridColor,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '成交均价',
        type: 'line',
        data: [
          [threeMonthsAgo.toISOString().split('T')[0], avgPrice],
          [new Date().toISOString().split('T')[0], avgPrice],
        ],
        symbol: 'none',
        lineStyle: {
          color: '#D4AF37',
          width: 2,
          type: 'dashed',
        },
        label: {
          show: true,
          position: 'right',
          formatter: `均价: ¥${Math.round(avgPrice).toLocaleString()}`,
          color: '#D4AF37',
          fontSize: 12,
          fontWeight: 600,
        },
        animationDuration: 1000,
        animationEasing: 'cubicOut',
      },
      {
        name: '成交价',
        type: 'scatter',
        data: filteredData,
        symbolSize: (data: unknown) => {
          const d = data as [string, number];
          const price = d[1];
          const normalized = maxPrice !== minPrice
            ? (price - minPrice) / (maxPrice - minPrice)
            : 0.5;
          return 8 + normalized * 16;
        },
        itemStyle: {
          color: {
            type: 'radial',
            x: 0.4,
            y: 0.3,
            r: 1,
            colorStops: [
              { offset: 0, color: chartColor },
              { offset: 1, color: `${chartColor}80` },
            ],
          },
          shadowBlur: 10,
          shadowColor: `${chartColor}40`,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: chartColor,
          },
        },
        animationDuration: 1500,
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 30,
      },
      {
        name: '趋势线',
        type: 'line',
        data: filteredData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: chartColor,
          width: 2,
          opacity: 0.6,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${chartColor}20` },
              { offset: 1, color: `${chartColor}00` },
            ],
          },
        },
        animationDuration: 2000,
        animationEasing: 'cubicOut',
        animationDelay: 500,
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
