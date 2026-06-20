import { useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { cn } from '@/lib/utils';

export interface HeatmapDataPoint {
  building: string;
  activity: string;
  value: number;
}

export interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  buildings?: string[];
  activities?: string[];
  title?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  onPointClick?: (data: HeatmapDataPoint) => void;
}

const defaultBuildings = [
  '1号楼',
  '2号楼',
  '3号楼',
  '4号楼',
  '5号楼',
  '6号楼',
  '7号楼',
  '8号楼',
];

const defaultActivities = [
  '社区活动',
  '志愿活动',
  '文化活动',
  '体育活动',
  '亲子活动',
  '老年活动',
];

export function HeatmapChart({
  data,
  buildings = defaultBuildings,
  activities = defaultActivities,
  title,
  height = 400,
  className,
  showLegend = true,
  onPointClick,
}: HeatmapChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const handleResize = () => {
      chartRef.current?.getEchartsInstance().resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = data.map((item) => {
    const xIndex = activities.indexOf(item.activity);
    const yIndex = buildings.indexOf(item.building);
    return [xIndex >= 0 ? xIndex : 0, yIndex >= 0 ? yIndex : 0, item.value];
  });

  const maxValue = Math.max(...data.map((d) => d.value), 0);

  const option: echarts.EChartsOption = {
    title: title
      ? {
          text: title,
          left: 'center',
          top: 0,
          textStyle: {
            color: '#F1F5F9',
            fontSize: 16,
            fontFamily: '"Noto Sans SC", sans-serif',
            fontWeight: 600,
          },
        }
      : undefined,

    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      textStyle: {
        color: '#F1F5F9',
        fontSize: 13,
      },
      formatter: function (params: unknown) {
        const p = params as { data: number[] };
        const [x, y, v] = p.data;
        const activityName = activities[x] || '';
        const buildingName = buildings[y] || '';
        return `
          <div style="padding: 4px 0;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #F1F5F9;">
              ${buildingName} - ${activityName}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #94A3B8;">参与人数：</span>
              <span style="color: #5889FF; font-weight: 600; font-size: 15px;">${v}</span>
              <span style="color: #64748B;">人</span>
            </div>
          </div>
        `;
      },
    },

    grid: {
      top: title ? 60 : 20,
      left: 80,
      right: showLegend ? 100 : 40,
      bottom: 40,
      containLabel: true,
    },

    xAxis: {
      type: 'category',
      data: activities,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: '#94A3B8',
        fontSize: 12,
        interval: 0,
        rotate: 0,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
      },
      splitLine: {
        show: false,
      },
    },

    yAxis: {
      type: 'category',
      data: buildings,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: '#94A3B8',
        fontSize: 12,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
      },
      splitLine: {
        show: false,
      },
    },

    visualMap: showLegend
      ? {
          min: 0,
          max: maxValue || 100,
          calculable: true,
          orient: 'vertical',
          right: 10,
          top: title ? 60 : 'center',
          itemWidth: 12,
          itemHeight: 140,
          text: ['高', '低'],
          textStyle: {
            color: '#64748B',
            fontSize: 11,
          },
          inRange: {
            color: [
              'rgba(51, 102, 255, 0.1)',
              'rgba(51, 102, 255, 0.3)',
              'rgba(51, 102, 255, 0.5)',
              'rgba(51, 102, 255, 0.7)',
              'rgba(51, 102, 255, 0.9)',
              'rgba(88, 137, 255, 1)',
            ],
          },
        }
      : undefined,

    series: [
      {
        name: '参与度',
        type: 'heatmap',
        data: chartData,
        label: {
          show: true,
          color: '#F1F5F9',
          fontSize: 11,
          formatter: function (params: unknown) {
            const p = params as { data: number[] };
            const v = p.data[2];
            return v > 0 ? v.toString() : '';
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(51, 102, 255, 0.5)',
            borderColor: '#5889FF',
            borderWidth: 2,
          },
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: 'rgba(148, 163, 184, 0.05)',
          borderWidth: 1,
        },
        progressive: 1000,
        animation: true,
        animationDuration: 600,
      },
    ],
  };

  const handleEvents: Record<string, (params: unknown) => void> = {};

  if (onPointClick) {
    handleEvents.click = (params: unknown) => {
      const p = params as { data: number[] };
      const [x, y, v] = p.data;
      onPointClick({
        activity: activities[x] || '',
        building: buildings[y] || '',
        value: v,
      });
    };
  }

  return (
    <div className={cn('glass-card p-4', className)}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height, width: '100%' }}
        notMerge
        onEvents={handleEvents}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
