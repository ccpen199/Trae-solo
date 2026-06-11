import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useTheme } from '@/hooks/useTheme';
import type { PricePoint } from '@/mock/data';

interface PriceHistoryChartProps {
  data: PricePoint[];
  districtAvgPrice?: number;
  height?: number | string;
}

const COLORS = {
  listing: '#0A2463',
  transaction: '#2A9D8F',
  average: '#D4AF37',
};

export default function PriceHistoryChart({
  data,
  districtAvgPrice,
  height = 400,
}: PriceHistoryChartProps) {
  const { isDark } = useTheme();

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const listingData = sortedData
    .filter((d) => d.type === 'listing')
    .map((d) => [d.date, d.price]);

  const transactionData = sortedData
    .filter((d) => d.type === 'transaction')
    .map((d) => [d.date, d.price]);

  const averageData = sortedData.map((d) => [
    d.date,
    districtAvgPrice ?? d.price * 1.02,
  ]);

  const textColor = isDark ? '#e5e7eb' : '#374151';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      textStyle: {
        color: textColor,
      },
      formatter: (params: unknown) => {
        const p = params as Array<{
          axisValue: string;
          seriesName: string;
          value: [string, number];
          color: string;
        }>;
        if (!p || p.length === 0) return '';
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${p[0].axisValue}</div>`;
        p.forEach((item) => {
          if (item.value && item.value[1] !== undefined) {
            result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color};"></span>
              <span>${item.seriesName}:</span>
              <span style="font-weight: 600;">¥${item.value[1].toLocaleString()}</span>
            </div>`;
          }
        });
        return result;
      },
    },
    legend: {
      data: ['挂牌价', '成交价', '区域均价'],
      top: 0,
      textStyle: {
        color: textColor,
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
      boundaryGap: ['0', '0'],
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
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: textColor,
        formatter: (value: number) => {
          if (value >= 10000) {
            return `¥${(value / 10000).toFixed(0)}万`;
          }
          return `¥${value}`;
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
        name: '挂牌价',
        type: 'line',
        data: listingData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: COLORS.listing,
          width: 2,
        },
        itemStyle: {
          color: COLORS.listing,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${COLORS.listing}20` },
              { offset: 1, color: `${COLORS.listing}00` },
            ],
          },
        },
        animationDuration: 1500,
        animationEasing: 'cubicOut',
      },
      {
        name: '成交价',
        type: 'line',
        data: transactionData,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8,
        lineStyle: {
          color: COLORS.transaction,
          width: 3,
        },
        itemStyle: {
          color: COLORS.transaction,
        },
        animationDuration: 1500,
        animationEasing: 'cubicOut',
        animationDelay: 300,
      },
      {
        name: '区域均价',
        type: 'line',
        data: averageData,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: COLORS.average,
          width: 2,
          type: 'dashed',
        },
        itemStyle: {
          color: COLORS.average,
        },
        animationDuration: 1500,
        animationEasing: 'cubicOut',
        animationDelay: 600,
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
