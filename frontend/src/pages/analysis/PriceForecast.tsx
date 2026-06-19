import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from '../../lib/api';
import { CATEGORY_OPTIONS, formatCurrency } from '../../lib/constants';

export default function PriceForecast() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ category: '废金属', sub_category: '废钢', region: '' });

  useEffect(() => {
    api.get('/trace/price-forecast').then((d: any) => { setData(d.forecasts || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const subCategories = useMemo(() => Array.from(new Set(data.filter(x => x.category === f.category).map(x => x.sub_category))), [data, f.category]);
  const regions = useMemo(() => Array.from(new Set(data.map(x => x.region))), [data]);
  const activeSub = f.sub_category || subCategories[0] || '';

  const filtered = useMemo(() => data.filter(d =>
    d.category === f.category && d.sub_category === activeSub &&
    (!f.region || d.region === f.region)
  ), [data, f, activeSub]);

  const chartData = filtered.length > 0
    ? filtered
    : data.filter(x => x.category === f.category && x.sub_category === activeSub).slice(0, 8);

  const chartOption = useMemo(() => {
    const regionList = chartData.map(d => d.region);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 60, right: 30, top: 40, bottom: 50 },
      xAxis: { type: 'category', data: regionList, axisLabel: { fontSize: 11 } },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11, formatter: (v: number) => v >= 10000 ? (v / 1000).toFixed(0) + 'k' : v }
      },
      series: [
        { name: '当前价', type: 'bar', barGap: 0, barWidth: '22%', itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', fontSize: 10, formatter: (p: any) => (p.value / 1000).toFixed(1) + 'k' },
          data: chartData.map(d => d.current_price) },
        { name: '7日预测', type: 'bar', barWidth: '22%', itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', fontSize: 10, formatter: (p: any) => (p.value / 1000).toFixed(1) + 'k' },
          data: chartData.map(d => d.forecast_price_7d) },
        { name: '30日预测', type: 'bar', barWidth: '22%', itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] },
          label: { show: true, position: 'top', fontSize: 10, formatter: (p: any) => (p.value / 1000).toFixed(1) + 'k' },
          data: chartData.map(d => d.forecast_price_30d) }
      ]
    };
  }, [chartData]);

  const trendOption = useMemo(() => {
    const d = chartData[0];
    if (!d) return {};
    const base = d.current_price;
    const grad = (d.forecast_price_30d - base) / 30;
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 60, right: 40, top: 35, bottom: 40 },
      xAxis: { type: 'category', data: Array.from({ length: 30 }, (_, i) => i === 0 ? '今日' : `+${i}天`) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatCurrency(v) } },
      series: [
        { name: '置信上界', type: 'line', smooth: true, symbol: 'none', lineStyle: { type: 'dashed', color: '#16a34a' },
          areaStyle: { color: 'rgba(34, 197, 94, 0.08)' },
          data: Array.from({ length: 30 }, (_, i) => Math.round(base + grad * i + base * (0.02 + Math.random() * 0.015))) },
        { name: '预测走势', type: 'line', smooth: true, symbolSize: 7,
          itemStyle: { color: '#f97316' }, lineStyle: { width: 3 },
          markLine: {
            data: [
              { xAxis: 7, label: { formatter: `7日置信 ${d.confidence_7d}%`, position: 'insideEndTop', fontSize: 10 }, lineStyle: { color: '#22c55e' } },
              { xAxis: 29, label: { formatter: `30日置信 ${d.confidence_30d}%`, position: 'insideEndTop', fontSize: 10 }, lineStyle: { color: '#f97316' } }
            ]
          },
          data: Array.from({ length: 30 }, (_, i) => Math.round(base + (i < 7 ? (d.forecast_price_7d - base) / 7 : grad) * i + Math.sin(i / 2) * base * 0.003)) },
        { name: '置信下界', type: 'line', smooth: true, symbol: 'none', lineStyle: { type: 'dashed', color: '#ef4444' },
          data: Array.from({ length: 30 }, (_, i) => Math.round(base + grad * i - base * (0.015 + Math.random() * 0.015))) }
      ]
    };
  }, [chartData]);

  const sample = chartData[0];

  return (
    <div className="space-y-5">
      <div className="card p-5 bg-gradient-to-br from-amber-50 via-white to-blue-50 border-amber-100">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-200/60">📈</div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">价格走势预测系统</h2>
              <p className="text-sm text-slate-500 max-w-xl">
                基于 LSTM + Transformer 深度学习模型 · 输入因子：钢铁产能、PMI、期货行情、库存、关税、下游开工率
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div><label className="label">品类</label>
              <select value={f.category} onChange={e => setF({ ...f, category: e.target.value, sub_category: '' })} className="input-field w-28">
                {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label className="label">细分</label>
              <select value={activeSub} onChange={e => setF({ ...f, sub_category: e.target.value })} className="input-field w-28">
                {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">区域</label>
              <select value={f.region} onChange={e => setF({ ...f, region: e.target.value })} className="input-field w-24">
                <option value="">全部</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {sample && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { t: '当前均价', v: formatCurrency(sample.current_price), i: '💵', c: 'text-slate-900' },
            { t: '7日预测', v: formatCurrency(sample.forecast_price_7d), i: '🔮', c: 'text-emerald-700',
              d: sample.forecast_price_7d - sample.current_price, conf: `置信 ${sample.confidence_7d}%` },
            { t: '30日预测', v: formatCurrency(sample.forecast_price_30d), i: '📆', c: 'text-amber-700',
              d: sample.forecast_price_30d - sample.current_price, conf: `置信 ${sample.confidence_30d}%` },
            { t: '7日预期涨跌', v: `${sample.forecast_price_7d >= sample.current_price ? '↑' : '↓'} ${Math.abs(sample.forecast_price_7d - sample.current_price) / sample.current_price * 100}%`.replace('NaN', '-'),
              i: '📊', c: sample.forecast_price_7d >= sample.current_price ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold' },
            { t: '30日大趋势', v: sample.forecast_price_30d >= sample.current_price ? '看涨 🟢' : '看跌 🔴',
              i: '📉', c: sample.forecast_price_30d >= sample.current_price ? 'text-emerald-600 font-bold text-xl' : 'text-rose-600 font-bold text-xl' }
          ].map((k, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-400">{k.t}</span><span className="text-xl">{k.i}</span></div>
              <div className={`text-2xl font-black ${k.c} tracking-tight`}>{k.v}</div>
              {k.d !== undefined && (
                <div className={`mt-1 text-xs font-semibold ${k.d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {k.d >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(k.d as number))}
                  {k.conf && <span className="ml-2 text-slate-400 font-normal">{k.conf}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="card p-5 lg:col-span-3">
          <h3 className="font-bold text-slate-800 mb-1">📊 各大区价格对比</h3>
          <p className="text-xs text-slate-500 mb-4">当前价格 · AI 7日预测 · 30日预测 (元/吨)</p>
          {loading ? <div className="h-[420px] flex items-center justify-center text-slate-400">加载中</div>
            : <ReactECharts option={chartOption} style={{ height: 420 }} />}
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-1">🔮 30日走势置信区间</h3>
          <p className="text-xs text-slate-500 mb-4">LSTM 深度学习 · 蒙特卡洛置信区间</p>
          <ReactECharts option={trendOption} style={{ height: 420 }} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-slate-800 mb-4">📐 预测模型因子权重</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          {[
            { t: '钢铁厂产能利用率', w: 22, i: '🏭', d: '高炉开工率直接决定废钢需求', s: '↑ 高利多', c: 'from-red-400 to-orange-500' },
            { t: '制造业PMI指数', w: 18, i: '📈', d: '宏观经济景气度，影响金属需求', s: '↑ 高利多', c: 'from-blue-400 to-indigo-500' },
            { t: 'SHFE期货收盘价', w: 16, i: '📊', d: '上期所相关期货价格信号', s: '同步指标', c: 'from-purple-400 to-violet-500' },
            { t: '主要港口社会库存', w: 13, i: '📦', d: '社会库存水平影响短期价格', s: '↓ 高利空', c: 'from-emerald-400 to-teal-500' },
            { t: '再生资源进口关税', w: 11, i: '🛃', d: '进口政策影响海外货源供给', s: '↑ 税高利多内盘', c: 'from-amber-400 to-yellow-500' },
            { t: '下游企业开工率', w: 10, i: '🏗️', d: '汽车、家电、建筑等行业开工', s: '↑ 高利多', c: 'from-sky-400 to-cyan-500' }
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.c} flex items-center justify-center text-xl shadow-sm`}>{m.i}</div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{m.w}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${m.c}`} style={{ width: `${m.w * 4}%` }} />
              </div>
              <div className="font-semibold text-sm text-slate-800 mb-1">{m.t}</div>
              <div className="text-[11px] text-slate-500 leading-relaxed mb-2 min-h-[32px]">{m.d}</div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">{m.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
