import ReactECharts from 'echarts-for-react';
import type { PlaceTypeItem } from '../../../services/api/analytics';

interface PlaceTypePieProps {
  data: PlaceTypeItem[];
}

const colorPalette = [
  '#00d4ff',
  '#00ff88',
  '#ffd700',
  '#ff4757',
  '#a855f7',
  '#ff9a2e',
];

const PlaceTypePie = ({ data }: PlaceTypePieProps) => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: 'rgba(13, 33, 55, 0.95)',
      borderColor: 'rgba(0, 212, 255, 0.5)',
      borderWidth: 1,
      textStyle: {
        color: '#e0e6ed',
        fontSize: 12,
      },
      formatter: '{b}: {c}家 ({d}%)',
    },
    legend: {
      orient: 'vertical' as const,
      right: 0,
      top: 'center' as const,
      textStyle: {
        color: 'rgba(224, 230, 237, 0.7)',
        fontSize: 11,
      },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '65%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: 'transparent',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold',
            color: '#e0e6ed',
          },
        },
        data: data.map((item, index) => ({
          value: item.count,
          name: item.typeName,
          itemStyle: {
            color: colorPalette[index % colorPalette.length],
          },
        })),
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

export default PlaceTypePie;
