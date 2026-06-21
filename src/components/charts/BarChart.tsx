import { BaseChart } from './BaseChart';

interface BarChartProps {
  data: {
    xAxis: string[];
    series: {
      name: string;
      data: number[];
      color?: string;
    }[];
  };
  title?: string;
  horizontal?: boolean;
  showLegend?: boolean;
  height?: number;
  className?: string;
}

export function BarChart({
  data,
  title,
  horizontal = false,
  showLegend = true,
  height = 300,
  className,
}: BarChartProps) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

  const option = {
    title: title ? {
      text: title,
      textStyle: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: 600,
      },
      left: 0,
      top: 0,
    } : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      borderWidth: 1,
      textStyle: {
        color: '#E2E8F0',
        fontSize: 12,
      },
      axisPointer: {
        type: horizontal ? 'shadow' : 'shadow',
      },
    },
    legend: showLegend && data.series.length > 1 ? {
      data: data.series.map(s => s.name),
      textStyle: {
        color: '#94A3B8',
        fontSize: 12,
      },
      icon: 'roundRect',
      right: 0,
      top: 0,
      itemWidth: 12,
      itemHeight: 8,
    } : undefined,
    grid: {
      left: 0,
      right: 10,
      top: title ? 40 : 10,
      bottom: 0,
      containLabel: true,
    },
    xAxis: horizontal ? {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 100000000) return (value / 100000000).toFixed(0) + '亿';
          if (value >= 10000) return (value / 10000).toFixed(0) + '万';
          return value.toString();
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.2)',
          type: 'dashed',
        },
      },
    } : {
      type: 'category',
      data: data.xAxis,
      axisLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11,
        rotate: data.xAxis.length > 6 ? 30 : 0,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: horizontal ? {
      type: 'category',
      data: data.xAxis,
      axisLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11,
      },
      axisTick: {
        show: false,
      },
    } : {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: '#64748B',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 100000000) return (value / 100000000).toFixed(0) + '亿';
          if (value >= 10000) return (value / 10000).toFixed(0) + '万';
          return value.toString();
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.2)',
          type: 'dashed',
        },
      },
    },
    series: data.series.map((s, index) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      barWidth: Math.min(20, 60 / data.series.length / data.xAxis.length * 100),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: horizontal ? 0 : 0,
          x2: horizontal ? 1 : 0,
          y2: horizontal ? 0 : 1,
          colorStops: [
            {
              offset: 0,
              color: s.color || colors[index % colors.length],
              opacity: 1,
            },
            {
              offset: 1,
              color: s.color || colors[index % colors.length],
              opacity: 0.6,
            },
          ],
        },
        borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
      },
    })),
  };

  return (
    <BaseChart
      option={option}
      className={className}
      style={{ height: `${height}px` }}
    />
  );
}
