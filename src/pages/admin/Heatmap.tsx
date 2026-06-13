import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Flame, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { api } from '../../lib/api';
import type { HeatmapDataPoint } from '../../../shared/types';

const METRICS = [
  { key: 'onTimeRate', label: '签收准时率', icon: CheckCircle2, unit: '%', color: ['#31C48D', '#16A34A'], invert: false },
  { key: 'responseTime', label: '平均响应时长', icon: Clock, unit: 'h', color: ['#3B82F6', '#1D4ED8'], invert: true },
  { key: 'complaintRate', label: '投诉率', icon: AlertTriangle, unit: '%', color: ['#F97316', '#DC2626'], invert: true },
];

export default function AdminHeatmap() {
  const [metric, setMetric] = useState('onTimeRate');
  const [data, setData] = useState<HeatmapDataPoint[]>([]);

  useEffect(() => {
    api.admin.heatmap(metric).then((d: any) => setData(d.data));
  }, [metric]);

  const currentMetric = METRICS.find((m) => m.key === metric)!;

  const heatmapData = data.map((d) => {
    const lngRange = [115.8, 117.0];
    const latRange = [39.6, 40.2];
    const x = ((d.lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * 100;
    const y = ((latRange[1] - d.lat) / (latRange[1] - latRange[0])) * 100;
    return [x, y, d.value, d];
  });

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => {
        const d = p.data[3];
        const val = currentMetric.invert ? d.value : d.value * 100;
        return `<b>${d.outletName}</b><br/>${currentMetric.label}: ${val.toFixed(currentMetric.unit === '%' ? 2 : 2)}${currentMetric.unit}`;
      },
    },
    grid: { top: 10, right: 10, bottom: 10, left: 10 },
    xAxis: { show: false, min: 0, max: 100, type: 'value' },
    yAxis: { show: false, min: 0, max: 100, type: 'value' },
    visualMap: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      min: currentMetric.invert ? 0 : 0.8,
      max: currentMetric.invert ? 3 : 1,
      text: ['高', '低'],
      textStyle: { color: '#86909C', fontSize: 12 },
      inRange: {
        color: currentMetric.key === 'onTimeRate'
          ? ['#FCA5A5', '#FCD34D', '#86EFAC', '#22C55E']
          : currentMetric.key === 'responseTime'
          ? ['#22C55E', '#FCD34D', '#FCA5A5', '#EF4444']
          : ['#22C55E', '#FCD34D', '#F97316', '#EF4444'],
      },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (val: number[]) => {
          const base = currentMetric.invert ? (3 - Math.min(val[2], 3)) / 3 : val[2];
          return 25 + base * 60;
        },
        data: heatmapData,
        itemStyle: {
          opacity: 0.75,
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.15)',
        },
        emphasis: {
          itemStyle: { opacity: 1, shadowBlur: 30 },
        },
      },
      {
        type: 'effectScatter',
        symbolSize: 12,
        rippleEffect: { period: 3, scale: 4, brushType: 'stroke' },
        data: heatmapData.slice(0, 5),
        itemStyle: { color: '#0058FF', opacity: 0.9 },
      },
    ],
    graphic: [
      { type: 'text', left: 20, top: 20, style: { text: '📍 北京市区域网点分布', fontSize: 13, fill: '#86909C' } },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-700 flex items-center gap-2">
            <Flame className="w-6 h-6 text-accent-500" />
            网点服务效能热力图
          </h1>
          <p className="text-sm text-neutral-500 mt-1">多维度评估各网点服务质量与运营效率</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              metric === m.key
                ? 'bg-neutral-700 text-white shadow-lg'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-neutral-700">{currentMetric.label} 热力分布</h3>
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <Info className="w-3.5 h-3.5" />
              气泡越大表示该指标表现越优异
            </div>
          </div>
          <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 50%, #FFF7ED 100%)' }}>
            <ReactECharts option={option} style={{ height: 520 }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
            <h3 className="font-bold text-neutral-700 mb-4">指标概览</h3>
            <div className="space-y-4">
              {METRICS.map((m) => {
                const avg = data.reduce((s, d) => s + d.value, 0) / Math.max(data.length, 1);
                const displayVal = m.invert ? avg : avg * 100;
                return (
                  <div key={m.key} className="p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <m.icon className={`w-4 h-4 ${metric === m.key ? 'text-brand-500' : 'text-neutral-400'}`} />
                      <span className="text-sm text-neutral-600">{m.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-neutral-700">
                      {displayVal.toFixed(m.unit === '%' ? 2 : 2)}
                      <span className="text-sm text-neutral-400 font-normal ml-1">{m.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
            <h3 className="font-bold text-neutral-700 mb-4">网点排名 TOP 5</h3>
            <div className="space-y-3">
              {[...data]
                .sort((a, b) => (currentMetric.invert ? a.value - b.value : b.value - a.value))
                .slice(0, 5)
                .map((d, i) => {
                  const val = currentMetric.invert ? d.value : d.value * 100;
                  return (
                    <div key={d.outletId} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-600' :
                        i === 1 ? 'bg-neutral-100 text-neutral-600' :
                        i === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-brand-50 text-brand-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-700 truncate">{d.outletName}</div>
                        <div className="text-xs text-neutral-400">{val.toFixed(2)}{currentMetric.unit}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
