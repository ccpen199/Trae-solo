import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

export interface MapChartData {
  name: string;
  value: number;
  adcode?: string;
}

export interface MapChartProps {
  data?: MapChartData[];
  title?: string;
  subTitle?: string;
  height?: number | string;
  showTooltip?: boolean;
  showLegend?: boolean;
  min?: number;
  max?: number;
  className?: string;
  option?: Partial<EChartsOption>;
  loading?: boolean;
  onRegionClick?: (params: MapChartData) => void;
}

const mockShandongData: MapChartData[] = [
  { name: '济南市', value: 1280, adcode: '370100' },
  { name: '青岛市', value: 2156, adcode: '370200' },
  { name: '淄博市', value: 856, adcode: '370300' },
  { name: '枣庄市', value: 423, adcode: '370400' },
  { name: '东营市', value: 356, adcode: '370500' },
  { name: '烟台市', value: 1234, adcode: '370600' },
  { name: '潍坊市', value: 1567, adcode: '370700' },
  { name: '济宁市', value: 1123, adcode: '370800' },
  { name: '泰安市', value: 789, adcode: '370900' },
  { name: '威海市', value: 892, adcode: '371000' },
  { name: '日照市', value: 567, adcode: '371100' },
  { name: '临沂市', value: 1456, adcode: '371300' },
  { name: '德州市', value: 876, adcode: '371400' },
  { name: '聊城市', value: 765, adcode: '371500' },
  { name: '滨州市', value: 543, adcode: '371600' },
  { name: '菏泽市', value: 987, adcode: '371700' },
];

const MapChart: React.FC<MapChartProps> = ({
  data = mockShandongData,
  title,
  subTitle,
  height = 400,
  showTooltip = true,
  showLegend = true,
  min,
  max,
  className,
  option,
  loading,
  onRegionClick,
}) => {
  const dataRange = useMemo(() => {
    const values = data.map(d => d.value);
    return {
      min: min ?? Math.min(...values),
      max: max ?? Math.max(...values),
    };
  }, [data, min, max]);

  const chartOption = useMemo((): EChartsOption => {
    return {
      title: title || subTitle ? {
        text: title,
        subtext: subTitle,
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary, #1D2129)',
        },
        subtextStyle: {
          fontSize: 12,
          color: 'var(--text-secondary, #86909C)',
        },
        left: 0,
        top: 0,
      } : undefined,
      tooltip: {
        show: showTooltip,
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>数量: ${params.value || 0}`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: {
          color: '#1D2129',
        },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border-radius: 4px;',
      },
      visualMap: {
        show: showLegend,
        min: dataRange.min,
        max: dataRange.max,
        left: 'left',
        bottom: 0,
        text: ['高', '低'],
        textStyle: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
        },
        calculable: true,
        inRange: {
          color: ['#E8F3FF', '#BEDAFF', '#6AA3FF', '#165DFF', '#0E42D2'],
        },
      },
      geo: {
        map: 'shandong',
        roam: true,
        zoom: 1.2,
        label: {
          show: true,
          fontSize: 10,
          color: 'var(--text-primary, #1D2129)',
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
          },
          itemStyle: {
            areaColor: '#165DFF',
            shadowBlur: 10,
            shadowColor: 'rgba(22, 93, 255, 0.5)',
          },
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
          areaColor: '#E8F3FF',
        },
      },
      series: [
        {
          name: '文旅场所数量',
          type: 'map',
          map: 'shandong',
          roam: true,
          zoom: 1.2,
          label: {
            show: true,
            fontSize: 10,
          },
          emphasis: {
            label: {
              show: true,
              color: '#fff',
              fontSize: 12,
            },
            itemStyle: {
              areaColor: '#165DFF',
              shadowBlur: 10,
              shadowColor: 'rgba(22, 93, 255, 0.5)',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          data: data,
        },
        {
          name: '标点',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: data.slice(0, 5).map(d => ({
            name: d.name,
            value: [120, 36, d.value],
          })),
          symbolSize: (val: number[]) => Math.sqrt(val[2]) / 5,
          rippleEffect: {
            brushType: 'stroke',
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            fontSize: 10,
          },
          itemStyle: {
            color: '#F53F3F',
            shadowBlur: 10,
            shadowColor: '#F53F3F',
          },
        },
      ],
      ...option,
    };
  }, [data, title, subTitle, showTooltip, showLegend, dataRange, option]);

  const onChartClick = (params: any) => {
    if (params.componentType === 'series' && onRegionClick) {
      const clickedData = data.find(d => d.name === params.name);
      if (clickedData) {
        onRegionClick(clickedData);
      }
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <ReactECharts
        option={chartOption}
        style={{ height, width: '100%' }}
        showLoading={loading}
        loadingOption={{
          text: '加载中...',
          color: '#165DFF',
          textColor: '#86909C',
          maskColor: 'rgba(255, 255, 255, 0.8)',
        }}
        onEvents={{
          click: onChartClick,
        }}
        notMerge={true}
        lazyUpdate={true}
      />
      <div className="text-center text-xs text-neutral-400 mt-2">
        * 地图数据为模拟数据，实际使用需接入高德/百度地图API
      </div>
    </div>
  );
};

export default MapChart;
