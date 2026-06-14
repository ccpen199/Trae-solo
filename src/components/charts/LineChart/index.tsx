import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

export interface LineChartData {
  name: string;
  value: number;
}

export interface LineChartProps {
  data: {
    xAxisData: string[];
    series: {
      name: string;
      data: number[];
      type?: 'line' | 'bar';
      smooth?: boolean;
      areaStyle?: Record<string, any>;
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

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  subTitle,
  height = 300,
  showLegend = true,
  showTooltip = true,
  xAxisName,
  yAxisName,
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
        icon: 'circle',
        itemWidth: 8,
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
      xAxis: {
        type: 'category',
        boundaryGap: false,
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
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
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
        type: s.type || 'line',
        smooth: s.smooth !== false,
        data: s.data,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(22, 93, 255, 0.3)',
          },
        },
        lineStyle: {
          width: 2,
          color: colorPalette[index % colorPalette.length],
        },
        areaStyle: s.areaStyle ?? {
          opacity: 0.1,
        },
        itemStyle: s.itemStyle,
      })),
      ...option,
    };
  }, [data, title, subTitle, showLegend, showTooltip, xAxisName, yAxisName, option]);

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

export default LineChart;
