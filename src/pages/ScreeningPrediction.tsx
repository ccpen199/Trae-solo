import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Calendar, CalendarCheck, TrendingUp, Target, Sparkles, ArrowRight,
  Film, Users, Megaphone, Calendar as CalendarIcon, MessageCircle,
  Lightbulb, ChevronRight,
} from 'lucide-react';
import type { CompetitorInfo, SchedulePredictionRes } from 'shared/types';
import { formatNumber, formatCurrency } from '@/utils/format';
import type { EChartsOption } from 'echarts';

function clsx(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(' ');
}

const castLevelColor: Record<string, string> = { S: 'text-gold-400', A: 'text-chart-purple', B: 'text-chart-blue', C: 'text-slate-400' };
const castLevelBg: Record<string, string> = { S: 'bg-gold-500/15 border-gold-500/30', A: 'bg-chart-purple/15 border-chart-purple/30', B: 'bg-chart-blue/15 border-chart-blue/30', C: 'bg-space-700 border-space-600' };

export default function ScreeningPrediction() {
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([]);
  const [prediction, setPrediction] = useState<SchedulePredictionRes | null>(null);
  const [selectedFilm, setSelectedFilm] = useState(0);
  const [simulateValues, setSimulateValues] = useState({ screenPct: 18, priceAdj: 0, primeTimeBoost: 65 });

  useEffect(() => {
    Promise.all([
      fetch('/api/prediction/competitor').then(r => r.json()).then(j => j.data),
      fetch('/api/prediction/schedule', { method: 'POST' }).then(r => r.json()).then(j => j.data),
    ]).then(([comp, pred]) => {
      setCompetitors(comp);
      setPrediction(pred);
    });
  }, []);

  const selComp = competitors[selectedFilm];

  const radarOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1', fontSize: 12 } },
    legend: {
      data: competitors.slice(0, 4).map(c => c.filmName),
      bottom: 0, textStyle: { color: '#94a3b8', fontSize: 11 }, itemWidth: 14, itemHeight: 4, icon: 'roundRect',
    },
    radar: {
      indicator: [
        { name: '剧本质量', max: 100 }, { name: '阵容强度', max: 100 },
        { name: '宣发投入', max: 100 }, { name: '档期适配', max: 100 },
        { name: '口碑预期', max: 100 },
      ],
      center: ['50%', '45%'], radius: '65%',
      axisName: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.6)' } },
      splitArea: { areaStyle: { color: ['rgba(17, 29, 53, 0.2)', 'rgba(17, 29, 53, 0.4)'] } },
      axisLine: { lineStyle: { color: '#243B5E' } },
    },
    series: [{
      type: 'radar', symbol: 'circle', symbolSize: 5,
      data: competitors.slice(0, 4).map((c, i) => ({
        name: c.filmName,
        value: [c.radarScores.story, c.radarScores.cast, c.radarScores.marketing, c.radarScores.schedule, c.radarScores.wordOfMouth],
        lineStyle: { color: ['#D4AF37', '#C0392B', '#3B82F6', '#10B981'][i], width: 2 },
        areaStyle: { color: ['rgba(212,175,55,0.15)', 'rgba(192,57,43,0.12)', 'rgba(59,130,246,0.12)', 'rgba(16,185,129,0.12)'][i] },
        itemStyle: { color: ['#D4AF37', '#C0392B', '#3B82F6', '#10B981'][i] },
      })),
    }],
  };

  const scheduleChartOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1', fontSize: 12 },
      axisPointer: { type: 'shadow' },
    },
    legend: { data: ['预测票房(万)', '预测上座率(%)'], top: 0, textStyle: { color: '#94a3b8', fontSize: 11 }, icon: 'roundRect', itemWidth: 12, itemHeight: 4 },
    grid: { left: 8, right: 24, top: 40, bottom: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: prediction?.perTheaterPrediction.slice(0, 8).map(p => p.theaterName.slice(0, 4)) || [],
      axisLine: { lineStyle: { color: '#1A2A47' } }, axisLabel: { color: '#64748b', fontSize: 10, rotate: 20 },
    },
    yAxis: [
      { type: 'value', axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.5)', type: 'dashed' } } },
      { type: 'value', min: 0, max: 100, axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '预测票房(万)', type: 'bar', barWidth: 18,
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#E2BC30' }, { offset: 1, color: '#95751B' }] }, borderRadius: [4, 4, 0, 0] },
        data: prediction?.perTheaterPrediction.slice(0, 8).map(p => p.expectedBoxOffice) || [],
      },
      {
        name: '预测上座率(%)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { color: '#10B981', width: 2.5 }, itemStyle: { color: '#10B981', borderWidth: 2, borderColor: '#0A1628' },
        data: prediction?.perTheaterPrediction.slice(0, 8).map(p => p.expectedOccupancy) || [],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-gold-500 font-medium tracking-widest uppercase mb-1.5">Screening Prediction Engine</div>
        <h1 className="font-serif text-3xl font-bold text-slate-100">
          <span className="text-gradient-gold">智能排片预测</span> · 决策中心
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">档期热度分析 · 竞品多维对比 · AI排片方案模拟 · 收益预测置信区间</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '当前影片', value: selComp?.filmName || '-', icon: Film, tag: selComp?.type, sub: `阵容 ${selComp?.castLevel || '-'}级` },
          { label: '首周票房预测', value: formatNumber(selComp?.expectedOpening || 0), icon: Target, tag: '万元', sub: `置信度 ${92}%` },
          { label: '排片占比建议', value: `${simulateValues.screenPct}%`, icon: CalendarCheck, tag: '黄金档', sub: `最佳 +${simulateValues.primeTimeBoost - 50}%` },
          { label: '宣发投入指数', value: String(selComp?.marketingBudget || 0), icon: Megaphone, tag: '/100', sub: '行业Top 15%' },
        ].map((m, i) => (
          <div key={i} className="cip-card-hover p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-space-700/60 text-gold-400 flex items-center justify-center">
                <m.icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <span className="chip text-[10px] py-0.5 px-2">{m.tag}</span>
            </div>
            <div className="kpi-label mb-1.5">{m.label}</div>
            <div className="kpi-value text-xl mb-1 truncate">{m.value}</div>
            <div className="text-xs text-slate-500">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 cip-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-100">同档期竞品五维能力对比</h3>
              <p className="text-xs text-slate-500 mt-0.5">剧本 / 阵容 / 宣发 / 档期 / 口碑预期</p>
            </div>
            <div className="flex gap-1.5">
              {competitors.slice(0, 4).map((c, i) => (
                <button
                  key={c.filmId}
                  onClick={() => setSelectedFilm(i)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    selectedFilm === i
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {c.filmName.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>
          <ReactECharts option={radarOption} style={{ height: 360 }} />
        </div>

        <div className="cip-card p-5">
          <div className="mb-4">
            <h3 className="font-serif text-lg font-semibold text-slate-100">竞品信息卡</h3>
            <p className="text-xs text-slate-500 mt-0.5">档期核心影片详情</p>
          </div>
          <div className="space-y-3">
            {competitors.map((c, i) => (
              <div
                key={c.filmId}
                onClick={() => setSelectedFilm(i)}
                className={clsx(
                  'p-4 rounded-xl border transition-all cursor-pointer group',
                  selectedFilm === i
                    ? 'bg-gradient-to-br from-gold-500/15 to-transparent border-gold-500/40 shadow-glow-gold'
                    : 'bg-space-800/40 border-space-700/30 hover:border-space-600'
                )}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <div className={clsx('font-semibold', selectedFilm === i ? 'text-gold-400' : 'text-slate-200 group-hover:text-gold-400')}>
                      {c.filmName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.type}
                      <span className="mx-1 text-space-600">·</span>
                      首周预期 {formatNumber(c.expectedOpening)}万
                    </div>
                  </div>
                  <span className={clsx('badge border', castLevelBg[c.castLevel], castLevelColor[c.castLevel])}>
                    {c.castLevel}级阵容
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">宣发指数</span>
                    <span className="font-mono text-chart-orange">{c.marketingBudget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">口碑预期</span>
                    <span className="font-mono text-chart-green">{c.radarScores.wordOfMouth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="cip-card p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-orange/20 to-amber-500/10 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-chart-orange" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold text-slate-100">排片参数模拟器</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">调整参数 · 实时预测</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gold-400" />
                  整体排片占比
                </label>
                <span className="kpi-value text-base">{simulateValues.screenPct}%</span>
              </div>
              <input
                type="range" min={5} max={35} value={simulateValues.screenPct}
                onChange={e => setSimulateValues(s => ({ ...s, screenPct: Number(e.target.value) }))}
                className="w-full h-2 bg-space-700 rounded-full appearance-none cursor-pointer accent-gold-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>保守 5%</span><span>均衡</span><span>激进 35%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-chart-green" />
                  票价调整幅度
                </label>
                <span className="kpi-value text-base">{simulateValues.priceAdj > 0 ? '+' : ''}{simulateValues.priceAdj}%</span>
              </div>
              <input
                type="range" min={-15} max={20} value={simulateValues.priceAdj}
                onChange={e => setSimulateValues(s => ({ ...s, priceAdj: Number(e.target.value) }))}
                className="w-full h-2 bg-space-700 rounded-full appearance-none cursor-pointer accent-chart-green"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>-15% 折扣</span><span>原价</span><span>+20% 溢价</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-chart-purple" />
                  黄金场占比
                </label>
                <span className="kpi-value text-base">{simulateValues.primeTimeBoost}%</span>
              </div>
              <input
                type="range" min={40} max={85} value={simulateValues.primeTimeBoost}
                onChange={e => setSimulateValues(s => ({ ...s, primeTimeBoost: Number(e.target.value) }))}
                className="w-full h-2 bg-space-700 rounded-full appearance-none cursor-pointer accent-chart-purple"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>均衡分布</span><span>19-21点占比</span><span>强集中</span>
              </div>
            </div>
            <div className="pt-4 border-t border-space-700/50">
              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                运行AI排片优化算法
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 cip-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-100">重点院线排片预测结果</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                预测总票房：<span className="font-mono text-gold-400">{formatCurrency(prediction?.expectedTotalBoxOffice || 0)}</span>
                <span className="mx-2 text-space-600">·</span>
                95%置信区间：
                <span className="font-mono text-chart-blue">
                  {formatNumber(prediction?.confidenceInterval?.[0] || 0)}万 ~ {formatNumber(prediction?.confidenceInterval?.[1] || 0)}万
                </span>
              </p>
            </div>
            <span className="badge badge-online">模型版本 v3.2.1</span>
          </div>
          <ReactECharts option={scheduleChartOption} style={{ height: 260 }} />

          <div className="mt-5 space-y-2.5 max-h-52 overflow-y-auto scrollbar-thin">
            {prediction?.perTheaterPrediction.slice(0, 8).map((p, i) => (
              <div key={p.theaterId} className="flex items-center gap-4 p-3 rounded-xl bg-space-800/30 hover:bg-space-700/30 transition-colors group">
                <span className="w-6 h-6 rounded-md bg-space-700 text-slate-400 text-xs font-bold flex items-center justify-center group-hover:bg-gold-500/20 group-hover:text-gold-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-200 text-sm">{p.theaterName}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <Lightbulb className="w-3 h-3 text-chart-orange shrink-0" />
                    <span className="truncate">{p.suggestion}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-gold-400 text-sm">{formatNumber(p.expectedBoxOffice)}万</div>
                  <div className="text-[11px] text-slate-500">
                    上座率 <span className="text-chart-green">{p.expectedOccupancy}%</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-gold-400 shrink-0" strokeWidth={2} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cip-card p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-blue/20 to-cyan-500/10 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5 text-chart-blue" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-slate-100">2026暑期档 · 热度日历</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">影片上映分布 · 档期竞争强度热力</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['一', '二', '三', '四', '五', '六', '日'].map(w => (
            <div key={w} className="text-center text-xs text-slate-500 font-medium py-1">周{w}</div>
          ))}
          {Array.from({ length: 42 }).map((_, i) => {
            const day = i - 1;
            const inMonth = day >= 0 && day < 30;
            const intensity = inMonth ? Math.abs(Math.sin(day * 0.6)) : 0;
            const bgColor = !inMonth ? 'bg-space-800/20'
              : intensity > 0.85 ? 'bg-cine-500/40 border-cine-500/50'
              : intensity > 0.6 ? 'bg-gold-500/30 border-gold-500/40'
              : intensity > 0.35 ? 'bg-chart-orange/25 border-chart-orange/35'
              : 'bg-space-700/40 border-space-700';
            const films = intensity > 0.7 ? ['星河长明', '山海谣', '长安诡事录'][day % 3]
              : intensity > 0.45 ? ['霓虹夜色', '逆战苍穹', '小镇来信'][day % 3] : '';
            return (
              <div
                key={i}
                className={clsx(
                  'h-20 rounded-lg border p-2 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg',
                  bgColor
                )}
              >
                <div className={clsx(
                  'text-xs font-mono',
                  !inMonth ? 'text-space-600'
                    : intensity > 0.7 ? 'text-white font-bold'
                    : intensity > 0.4 ? 'text-gold-300' : 'text-slate-400'
                )}>
                  {inMonth ? day + 1 : ''}
                </div>
                {inMonth && films && (
                  <div className={clsx(
                    'text-[9px] leading-tight truncate',
                    intensity > 0.7 ? 'text-white/95' : 'text-slate-300'
                  )}>
                    <Film className="w-2.5 h-2.5 inline mr-0.5" strokeWidth={3} />
                    {films}
                  </div>
                )}
                {inMonth && intensity > 0.85 && (
                  <div className="flex items-center gap-0.5 text-[9px] text-cine-100">
                    <MessageCircle className="w-2.5 h-2.5" /> 火爆
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-5 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-space-700/40 border border-space-700" />空闲</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-chart-orange/25 border border-chart-orange/35" />一般</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold-500/30 border border-gold-500/40" />热门</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cine-500/40 border border-cine-500/50" />极热</span>
        </div>
      </div>
    </div>
  );
}
