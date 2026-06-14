import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

export interface PieChartData {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: PieChartData[];
  title?: string;
  subTitle?: string;
  height?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  isRing?: boolean;
  center?: string[];
  radius?: string[];
  className?: string;
  option?: Partial<EChartsOption>;
  loading?: boolean;
  totalLabel?: string;
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
  '#86909C',
];

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subTitle,
  height = 300,
  showLegend = true,
  showTooltip = true,
  isRing = false,
  center = ['50%', '50%'],
  radius,
  className,
  option,
  loading,
  totalLabel,
}) => {
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const chartOption = useMemo((): EChartsOption => {
    const defaultRadius = isRing ? ['45%', '70%'] : ['0%', '70%'];

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
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
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
        top: title ? 30 : 10,
        right: 0,
        orient: 'vertical',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: {
          color: 'var(--text-secondary, #86909C)',
          fontSize: 12,
        },
      },
      graphic: isRing && totalLabel ? {
        elements: [
          {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: totalLabel,
            fontSize: 12,
            fill: 'var(--text-secondary, #86909C)',
            align: 'center',
          } as any,
        },
          {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: total.toLocaleString(),
            fontSize: 24,
            fontWeight: 600,
            fill: 'var(--text-primary, #1D2129)',
            align: 'center',
            verticalAlign: 'bottom',
            dy: 15,
          } as any,
        }],
      } : undefined,
      series: [
        {
          name: title,
          type: 'pie',
          radius: radius || defaultRadius,
          center: center,
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 12,
            color: 'var(--text-secondary, #86909C)',
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          data: data.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: colorPalette[index % colorPalette.length],
            },
          })),
        },
      ],
      ...option,
    };
  }, [data, title, subTitle, showLegend, showTooltip, isRing, center, radius, option, total, totalLabel]);

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

export default PieChart;
