import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from '../../lib/api';
import { CATEGORY_OPTIONS } from '../../lib/constants';

export default function Heatmap() {
  const [data, setData] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [f, setF] = useState({ category: '废金属', sub_category: '' });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'supply' | 'demand' | 'total' | 'price'>('total');

  useEffect(() => {
    api.get('/trace/heatmap').then((d: any) => {
      setData(d.data || []); setCats(d.categories || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(d =>
      (!f.category || d.category === f.category) &&
      (!f.sub_category || d.sub_category?.includes(f.sub_category))
    );
  }, [data, f]);

  const subCats = useMemo(() => {
    return Array.from(new Set(cats.filter(c => !f.category || c.category === f.category).map(c => c.sub_category)));
  }, [cats, f.category]);

  const scatterOption = useMemo(() => {
    const maxVol = Math.max(...filteredData.map(d => Math.max(d.supply_volume, d.demand_volume, d.total_volume || 0)), 1);
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => {
          const d = p.data[4];
          return `<div style="padding:4px 8px">
            <div style="font-weight:bold;margin-bottom:4px">${d.province} · ${d.city}</div>
            <div>品类: ${d.category}/${d.sub_category}</div>
            <div>供应量: <b style="color:#3b82f6">${d.supply_volume?.toFixed(0)}</b> 吨</div>
            <div>需求量: <b style="color:#10b981">${d.demand_volume?.toFixed(0)}</b> 吨</div>
            <div>均价: <b style="color:#f97316">¥${d.avg_price?.toLocaleString()}</b>/吨</div>
            <div>价格波动: <b style="color:${d.price_change_pct >= 0 ? '#16a34a' : '#dc2626'}">${d.price_change_pct >= 0 ? '+' : ''}${d.price_change_pct}%</b></div>
            ${d.steel_mill_capacity ? `<div>钢厂产能: ${d.steel_mill_capacity?.toFixed(0)}万吨/年 (利用率 ${d.steel_mill_utilization}%)</div>` : ''}
          </div>`;
        }
      },
      visualMap: [
        {
          left: 'left', top: 'bottom',
          text: ['高', '低'],
          calculable: true,
          min: 0, max: 100,
          inRange: { color: ['#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#15803d', '#f97316', '#dc2626'] },
          dimension: 5,
          show: true,
          textStyle: { fontSize: 11, color: '#64748b' },
          itemHeight: 120
        }
      ],
      geo: {
        map: 'china',
        roam: true,
        label: { show: true, fontSize: 9, color: '#475569' },
        itemStyle: {
          areaColor: '#f8fafc',
          borderColor: '#cbd5e1',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: { areaColor: '#fef9c3' },
          label: { color: '#1e293b', fontWeight: 'bold' }
        }
      },
      series: [{
        type: 'effectScatter',
        coordinateSystem: 'geo',
        rippleEffect: { scale: 5, brushType: 'stroke' },
        symbolSize: (val: number[]) => Math.max(8, Math.min(50, (val[2] || 500) / maxVol * 60)),
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(22, 163, 74, 0.3)' },
        data: filteredData.map(d => {
          const value = viewMode === 'supply' ? d.supply_volume : viewMode === 'demand' ? d.demand_volume : (d.supply_volume + d.demand_volume);
          const priceIdx = (() => {
            if (d.price_change_pct > 5) return 95; if (d.price_change_pct > 2) return 80;
            if (d.price_change_pct < -5) return 5; if (d.price_change_pct < -2) return 20;
            return 50;
          })();
          return [
            Number(d.longitude), Number(d.latitude),
            value,
            priceIdx,
            d,
            Math.abs(d.price_change_pct) * 10 + ((d.supply_volume + d.demand_volume) / maxVol) * 40
          ];
        })
      }]
    };
  }, [filteredData, viewMode]);

  const trendOption = useMemo(() => {
    const cities = Array.from(new Set(filteredData.map(d => d.city))).slice(0, 20);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 40, right: 20, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: cities, axisLabel: { rotate: 45, fontSize: 10, interval: 0 } },
      yAxis: [
        { type: 'value', name: '数量(吨)', axisLabel: { fontSize: 10 } },
        { type: 'value', name: '价格(元/吨)', axisLabel: { fontSize: 10 } }
      ],
      series: [
        { name: '供应量', type: 'bar', stack: 'vol', itemStyle: { color: '#60a5fa' },
          data: cities.map(c => filteredData.find(d => d.city === c)?.supply_volume || 0) },
        { name: '需求量', type: 'bar', stack: 'vol', itemStyle: { color: '#34d399' },
          data: cities.map(c => filteredData.find(d => d.city === c)?.demand_volume || 0) },
        { name: '均价', type: 'line', yAxisIndex: 1, smooth: true, itemStyle: { color: '#f97316' },
          lineStyle: { width: 3 },
          data: cities.map(c => filteredData.find(d => d.city === c)?.avg_price || 0) }
      ]
    };
  }, [filteredData]);

  const capacityOption = useMemo(() => {
    const steelCities = filteredData.filter(d => d.steel_mill_capacity).slice(0, 15);
    if (steelCities.length === 0) return null;
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 60, right: 60, top: 40, bottom: 60 },
      xAxis: { type: 'category', data: steelCities.map(d => d.city), axisLabel: { rotate: 45, fontSize: 10 } },
      yAxis: [
        { type: 'value', name: '产能(万吨/年)' },
        { type: 'value', name: '利用率(%)', max: 100 }
      ],
      series: [
        { name: '钢厂产能', type: 'bar', itemStyle: { color: '#8b5cf6' }, data: steelCities.map(d => d.steel_mill_capacity) },
        { name: '产能利用率', type: 'line', yAxisIndex: 1, smooth: true,
          itemStyle: { color: '#ef4444' }, lineStyle: { width: 3 },
          markLine: { data: [{ type: 'average', name: '平均利用率' }] },
          data: steelCities.map(d => d.steel_mill_utilization) }
      ]
    };
  }, [filteredData]);

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">🗺️ 区域供需热力图</h2>
            <p className="text-sm text-slate-500">结合钢铁厂产能数据 · 预测废钢等品类价格波动</p>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="label">品类</label>
              <select value={f.category} onChange={e => setF(x => ({ ...x, category: e.target.value, sub_category: '' }))} className="input-field w-32">
                {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">细分品类</label>
              <select value={f.sub_category} onChange={e => setF(x => ({ ...x, sub_category: e.target.value }))} className="input-field w-28">
                <option value="">全部</option>
                {subCats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">视图模式</label>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[
                  { v: 'total', l: '供需总量' }, { v: 'supply', l: '供应' },
                  { v: 'demand', l: '需求' }, { v: 'price', l: '价格波动' }
                ].map(m => (
                  <button key={m.v} onClick={() => setViewMode(m.v as any)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition ${
                      viewMode === m.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}>{m.l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? <div className="h-[600px] flex items-center justify-center text-slate-400">地图数据加载中...</div> : (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50">
            <ReactECharts option={scatterOption} style={{ height: '600px', width: '100%' }} notMerge lazyUpdate />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            { t: '覆盖城市', v: new Set(filteredData.map(d => d.city)).size, s: '个城市', i: '🏙️', c: 'from-blue-500 to-indigo-600' },
            { t: '供需总量', v: Math.round(filteredData.reduce((s, d) => s + d.supply_volume + d.demand_volume, 0) / 10000), s: '万吨', i: '📦', c: 'from-emerald-500 to-green-600' },
            { t: '平均价格', v: Math.round(filteredData.reduce((s, d) => s + d.avg_price, 0) / Math.max(filteredData.length, 1)).toLocaleString(), s: '元/吨', i: '💰', c: 'from-amber-500 to-orange-600' }
          ].map((k, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">{k.t}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{k.v}</span>
                    <span className="text-sm text-slate-500">{k.s}</span>
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${k.c} flex items-center justify-center text-3xl shadow-md shadow-black/10`}>{k.i}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-3">📊 重点城市供需 & 价格对比</h3>
          <ReactECharts option={trendOption} style={{ height: '380px' }} lazyUpdate />
        </div>
        {capacityOption ? (
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-3">🏭 主要钢铁基地产能分布（废钢预测因子）</h3>
            <ReactECharts option={capacityOption} style={{ height: '380px' }} lazyUpdate />
          </div>
        ) : (
          <div className="card p-5 flex items-center justify-center text-slate-400 text-sm bg-slate-50/50">
            选择"废钢"品类查看钢铁厂产能与废钢价格关联预测数据
          </div>
        )}
      </div>
    </div>
  );
}
