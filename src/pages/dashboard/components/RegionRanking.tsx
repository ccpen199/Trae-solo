import ReactECharts from 'echarts-for-react';
import type { RegionRankingItem } from '../../../services/api/analytics';

interface RegionRankingProps {
  data: RegionRankingItem[];
}

const RegionRanking = ({ data }: RegionRankingProps) => {
  const sortedData = [...data].sort((a, b) => b.placeCount - a.placeCount).slice(0, 10);

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '12%',
      top: '3%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(224, 230, 237, 0.7)',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 212, 255, 0.1)',
          type: 'dashed' as const,
        },
      },
    },
    yAxis: {
      type: 'category' as const,
      data: sortedData.map(d => d.regionName).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(224, 230, 237, 0.7)',
        fontSize: 11,
      },
    },
    series: [
      {
        type: 'bar' as const,
        data: sortedData.map(d => d.placeCount).reverse(),
        barWidth: 12,
        itemStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: 'rgba(0, 212, 255, 0.8)' },
              { offset: 1, color: 'rgba(0, 212, 255, 0.3)' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right' as const,
          color: 'rgba(224, 230, 237, 0.7)',
          fontSize: 11,
          formatter: '{c}家',
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
    />
  );
};

export default RegionRanking;
