import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

export interface BarChartProps {
  data: {
    xAxisData: string[];
    series: {
      name: string;
      data: number[];
      type?: 'bar' | 'line';
      stack?: string;
      itemStyle?: Record<string, any>;
    }[];
  };
  title?: string;
  subTitle?: string;
  height?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisName?: string;
  yAxisName?: string;
  horizontal?: boolean;
  className?: string;
  option?: Partial<EChartsOption>;
  loading?: boolean;
}

const colorPalette = [
  '#165DFF',
  '#00B42A',
  '#FF7D00',
  '#F53F3F',
  '#722ED1',
  '#14C9C9',
  '#FF9A2E',
  '#F7BA1E',
];

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subTitle,
  height = 300,
  showLegend = true,
  showTooltip = true,
  xAxisName,
  yAxisName,
  horizontal = false,
  className,
  option,
  loading,
}) => {
  const chartOption = useMemo((): EChartsOption => {
    return {
      color: colorPalette,
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
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: {
          color: '#1D2129',
        },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border-radius: 4px;',
      },
      legend: {
        show: showLegend,
        top: title ? 30 : 0,
        right: 0,
        icon: 'rect',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: title ? 60 : 40,
        containLabel: true,
      },
      xAxis: horizontal ? {
        type: 'value',
        name: xAxisName,
        splitLine: {
          lineStyle: {
            color: 'var(--border-color, #E5E6EB)',
            type: 'dashed',
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
        },
      } : {
        type: 'category',
        data: data.xAxisData,
        name: xAxisName,
        axisLine: {
          lineStyle: {
            color: 'var(--border-color, #E5E6EB)',
          },
        },
        axisLabel: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
          rotate: data.xAxisData.length > 6 ? 30 : 0,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: horizontal ? {
        type: 'category',
        data: data.xAxisData,
        name: yAxisName,
        axisLine: {
          lineStyle: {
            color: 'var(--border-color, #E5E6EB)',
          },
        },
        axisLabel: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
        },
        axisTick: {
          show: false,
        },
      } : {
        type: 'value',
        name: yAxisName,
        splitLine: {
          lineStyle: {
            color: 'var(--border-color, #E5E6EB)',
            type: 'dashed',
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
        },
      },
      series: data.series.map((s, index) => ({
        name: s.name,
        type: s.type || 'bar',
        data: s.data,
        stack: s.stack,
        barWidth: 'auto',
        barMaxWidth: 40,
        itemStyle: {
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: colorPalette[index % colorPalette.length] },
              { offset: 1, color: colorPalette[index % colorPalette.length] + 'CC' },
            ],
          },
          ...s.itemStyle,
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: colorPalette[index % colorPalette.length] + '4D',
          },
        },
      })),
      ...option,
    };
  }, [data, title, subTitle, showLegend, showTooltip, xAxisName, yAxisName, horizontal, option]);

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
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default BarChart;
