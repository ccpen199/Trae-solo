import { BaseChart } from './BaseChart';

interface LineChartProps {
  data: {
    xAxis: string[];
    series: {
      name: string;
      data: number[];
      color?: string;
      type?: 'line' | 'bar';
      areaStyle?: boolean;
    }[];
  };
  title?: string;
  yAxisName?: string;
  showLegend?: boolean;
  height?: number;
  className?: string;
  smooth?: boolean;
}

export function LineChart({
  data,
  title,
  yAxisName,
  showLegend = true,
  height = 300,
  className,
  smooth = true,
}: LineChartProps) {
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
        type: 'line',
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.5)',
        },
      },
    },
    legend: showLegend ? {
      data: data.series.map(s => s.name),
      textStyle: {
        color: '#94A3B8',
        fontSize: 12,
      },
      icon: 'circle',
      right: 0,
      top: 0,
      itemWidth: 8,
      itemHeight: 8,
    } : undefined,
    grid: {
      left: 0,
      right: 10,
      top: title ? 40 : 10,
      bottom: 0,
      containLabel: true,
    },
    xAxis: {
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
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: {
        color: '#64748B',
        fontSize: 11,
      },
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
      type: s.type || 'line',
      data: s.data,
      smooth: s.type !== 'bar' ? smooth : undefined,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderWidth: 2,
        },
      },
      lineStyle: s.type !== 'bar' ? {
        width: 2,
        color: s.color || colors[index % colors.length],
      } : undefined,
      itemStyle: {
        color: s.color || colors[index % colors.length],
      },
      areaStyle: s.areaStyle ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: s.color || colors[index % colors.length],
              opacity: 0.3,
            },
            {
              offset: 1,
              color: s.color || colors[index % colors.length],
              opacity: 0,
            },
          ],
        },
      } : undefined,
      barWidth: s.type === 'bar' ? '40%' : undefined,
      barMaxWidth: s.type === 'bar' ? 30 : undefined,
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
