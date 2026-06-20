import { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { useAppStore } from '@/store/useAppStore';
import { HeatmapDataPoint } from '@/types';

interface FishingHeatmapProps {
  data?: HeatmapDataPoint[];
  height?: number;
}

export default function FishingHeatmap({ data: propData, height = 520 }: FishingHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { heatmapData: storeHeatmapData, theme } = useAppStore();
  
  const heatmapData = propData || storeHeatmapData;
  
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return `${date.getMonth() + 1}/${date.getDate()}日`;
  }), []);
  
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`), []);
  
  const chartData = useMemo(() => heatmapData.map(item => [item.hour, item.day, item.score]), [heatmapData]);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    
    const chart = chartInstance.current;
    chart.resize();
    
    const option: echarts.EChartsOption = {
      tooltip: {
        position: 'top',
        backgroundColor: theme === 'dark' ? 'rgba(6, 26, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: theme === 'dark' ? 'rgba(0, 212, 170, 0.3)' : 'rgba(0, 212, 170, 0.5)',
        borderWidth: 1,
        textStyle: {
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          fontSize: 12,
        },
        formatter: (params: any) => {
          const hour = params.data[0];
          const day = params.data[1];
          const score = params.data[2];
          const level = score >= 80 ? '极佳' : score >= 65 ? '良好' : score >= 45 ? '一般' : '较差';
          const color = score >= 80 ? '#00d4aa' : score >= 65 ? '#0a84ff' : score >= 45 ? '#facc15' : '#ff6b35';
          return `
            <div style="padding: 4px 0;">
              <div style="font-weight: 600; margin-bottom: 4px;">${days[day]} ${hours[hour]}</div>
              <div style="color: ${color};">
                钓鱼指数: <span style="font-size: 16px; font-weight: 700;">${score}分</span>
              </div>
              <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">${level}</div>
            </div>
          `;
        },
      },
      animation: true,
      grid: {
        top: 30,
        right: 80,
        bottom: 80,
        left: 80,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: hours,
        splitArea: { show: true },
        axisLine: { show: true, lineStyle: { color: theme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)' } },
        axisTick: { show: false },
        axisLabel: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          fontSize: 10,
          interval: 0,
          rotate: 60,
          margin: 12,
          align: 'right',
          verticalAlign: 'top',
        },
        name: '时间（逐小时）',
        nameLocation: 'middle',
        nameGap: 65,
        nameTextStyle: {
          color: theme === 'dark' ? '#cbd5e1' : '#475569',
          fontSize: 13,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: 'category',
        data: days,
        splitArea: { show: true },
        axisLine: { show: true, lineStyle: { color: theme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)' } },
        axisTick: { show: false },
        axisLabel: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          fontSize: 11,
          margin: 12,
          fontWeight: 500,
        },
        name: '日期（14天）',
        nameLocation: 'middle',
        nameGap: 60,
        nameTextStyle: {
          color: theme === 'dark' ? '#cbd5e1' : '#475569',
          fontSize: 13,
          fontWeight: 500,
        },
        inverse: true,
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'vertical',
        right: 10,
        top: 'center',
        itemWidth: 16,
        itemHeight: 200,
        textGap: 10,
        inRange: {
          color: ['#1e3a5f', '#0e7490', '#06b6d4', '#34d399', '#10b981', '#facc15', '#f97316', '#ef4444'],
        },
        text: ['高', '低'],
        textStyle: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          fontSize: 11,
          fontWeight: 500,
        },
        formatter: (value: number) => String(Math.round(value)),
      },
      series: [
        {
          name: '钓鱼指数',
          type: 'heatmap',
          data: chartData,
          label: {
            show: false,
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(30, 58, 95, 0.5)' : 'rgba(241, 245, 249, 0.8)',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderColor: '#fff',
              borderWidth: 2,
            },
          },
          progressive: 1000,
          animation: true,
          animationDuration: 600,
        },
      ],
    };
    
    chart.setOption(option, true);
    
    setTimeout(() => chart.resize(), 50);
    
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartData, theme, days, hours]);
  
  return (
    <div className="w-full overflow-hidden rounded-lg" style={{ minHeight: `${height}px`, height: `${height}px` }}>
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
}
