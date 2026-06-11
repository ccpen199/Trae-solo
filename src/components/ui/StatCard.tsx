import React from 'react';
import ReactECharts from 'echarts-for-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isUp: boolean;
  };
  miniChart?: {
    type: 'line' | 'bar';
    data: number[];
    color: string;
  };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, miniChart, color }) => {
  const chartOption = miniChart ? {
    grid: { left: 0, right: 0, top: 5, bottom: 0 },
    xAxis: {
      type: 'category',
      show: false,
      data: miniChart.data.map((_, i) => i),
    },
    yAxis: { type: 'value', show: false },
    series: [{
      type: miniChart.type,
      data: miniChart.data,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: miniChart.color, width: 2 },
      itemStyle: { color: miniChart.color },
      areaStyle: miniChart.type === 'line' ? {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: miniChart.color + '40' },
            { offset: 1, color: miniChart.color + '05' },
          ],
        },
      } : undefined,
    }],
  } : null;

  return (
    <div className="card chinese-border hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15', color }}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-medium ${trend.isUp ? 'text-green-600' : 'text-red-500'}`}>
            <span className="text-lg">{trend.isUp ? '↑' : '↓'}</span>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <h3 className="text-ink-500 text-sm font-medium mb-1">{title}</h3>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-ink-900">{value}</p>
        {miniChart && chartOption && (
          <div className="w-24 h-10">
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} notMerge={true} lazyUpdate={true} />
          </div>
        )}
      </div>
      {trend && <p className="text-xs text-ink-400 mt-2">{trend.label}</p>}
    </div>
  );
};

export default StatCard;
