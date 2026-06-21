import { BaseChart } from './BaseChart';

interface PieChartProps {
  data: {
    name: string;
    value: number;
    color?: string;
  }[];
  title?: string;
  type?: 'pie' | 'doughnut';
  showLegend?: boolean;
  height?: number;
  className?: string;
  centerLabel?: string;
  centerValue?: string | number;
}

export function PieChart({
  data,
  title,
  type = 'doughnut',
  showLegend = true,
  height = 250,
  className,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F472B6', '#14B8A6'];

  const option = {
    title: title ? {
      text: title,
      textStyle: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: 600,
      },
      left: 'center',
      top: 0,
    } : undefined,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      borderWidth: 1,
      textStyle: {
        color: '#E2E8F0',
        fontSize: 12,
      },
      formatter: (params: any) => {
        return `<div style="font-weight: 500;">${params.name}</div>
                <div style="margin-top: 4px;">
                  <span style="color: ${params.color}; font-weight: 600;">${params.value}</span>
                  <span style="color: #64748B; margin-left: 8px;">${params.percent}%</span>
                </div>`;
      },
    },
    legend: showLegend ? {
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: {
        color: '#94A3B8',
        fontSize: 11,
      },
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 10,
      formatter: (name: string) => {
        const item = data.find(d => d.name === name);
        return name;
      },
    } : undefined,
    series: [
      {
        type: 'pie',
        radius: type === 'doughnut' ? ['55%', '75%'] : '70%',
        center: showLegend ? ['35%', '55%'] : ['50%', '55%'],
        avoidLabel: {
          show: false,
        },
        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 5,
        },
        data: data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color || colors[index % colors.length],
          },
        })),
      },
    ],
    graphic: type === 'doughnut' && (centerLabel || centerValue) ? [
      centerValue ? {
        type: 'text',
        left: showLegend ? '35%' : '50%',
        top: centerLabel ? '50%' : '55%',
        style: {
          text: centerValue,
          textAlign: 'center',
          fill: '#E2E8F0',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'Roboto Mono, monospace',
        },
      } : undefined,
      centerLabel ? {
        type: 'text',
        left: showLegend ? '35%' : '50%',
        top: '62%',
        style: {
          text: centerLabel,
          textAlign: 'center',
          fill: '#64748B',
          fontSize: 11,
        },
      } : undefined,
    ].filter(Boolean) as any : undefined,
  };

  return (
    <BaseChart
      option={option}
      className={className}
      style={{ height: `${height}px` }}
    />
  );
}
