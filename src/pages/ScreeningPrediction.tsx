import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Calendar, CalendarCheck, TrendingUp, Target, Sparkles, ArrowRight,
  Film, Users, Megaphone, Calendar as CalendarIcon, MessageCircle,
  Lightbulb, ChevronRight, Flame, Shield, Building2, Gauge,
  Eye, CheckCircle2,
} from 'lucide-react';
import type { CompetitorInfo, SchedulePredictionRes } from 'shared/types';
import { formatNumber, formatCurrency } from '@/utils/format';
import type { EChartsOption } from 'echarts';
import { clsx } from 'clsx';

const castLevelColor: Record<string, string> = { S: 'text-gold-400', A: 'text-chart-purple', B: 'text-chart-blue', C: 'text-slate-400' };
const castLevelBg: Record<string, string> = { S: 'bg-gold-500/15 border-gold-500/30', A: 'bg-chart-purple/15 border-chart-purple/30', B: 'bg-chart-blue/15 border-chart-blue/30', C: 'bg-space-700 border-space-600' };

const scheduleHeatData = {
  name: '2026暑期档',
  score: 78,
  trend: 'up' as const,
  details: [
    { label: '影片供给量', value: 72 },
    { label: '观众期待度', value: 85 },
    { label: '社交媒体声量', value: 81 },
    { label: '预售转化率', value: 64 },
  ],
};

const competitorFactorData = {
  score: 68,
  top3: [
    { name: '星河长明', type: '科幻/冒险', opening: 18600, cast: 'S' as const },
    { name: '山海谣', type: '奇幻/爱情', opening: 12400, cast: 'A' as const },
    { name: '长安诡事录', type: '悬疑/古装', opening: 9800, cast: 'A' as const },
  ],
  pressureIndex: 72,
};

const theaterHistoryData = {
  avgOccupancy: 42.6,
  avgRevenue: 3280,
  efficiencyScore: 76,
  theaters: [
    { name: '万达IMAX旗舰店', occupancy: 58.2, dailyShows: 12 },
    { name: '中影杜比影城', occupancy: 51.7, dailyShows: 10 },
    { name: '金逸CGV中心店', occupancy: 39.4, dailyShows: 8 },
  ],
};

const schedulingPlan = [
  { id: 1, name: '万达IMAX旗舰店', shows: 12, goldenPct: 58, hall: 'IMAX', confidence: 92, advice: '增加1场黄金场', hallType: 'IMAX' as const },
  { id: 2, name: '中影杜比影城', shows: 10, goldenPct: 55, hall: '杜比', confidence: 88, advice: '建议替换为杜比厅', hallType: 'dolby' as const },
  { id: 3, name: '金逸CGV中心店', shows: 8, goldenPct: 50, hall: '普通', confidence: 83, advice: '维持当前排片', hallType: 'normal' as const },
  { id: 4, name: '百老汇万象城店', shows: 9, goldenPct: 52, hall: 'IMAX', confidence: 79, advice: '建议增加IMAX场次', hallType: 'IMAX' as const },
  { id: 5, name: '大地影院银泰店', shows: 7, goldenPct: 48, hall: '普通', confidence: 74, advice: '午后场可减少1场', hallType: 'normal' as const },
  { id: 6, name: '横店影视城旗舰店', shows: 11, goldenPct: 54, hall: '杜比', confidence: 86, advice: '黄金场加密至6场', hallType: 'dolby' as const },
  { id: 7, name: '博纳国际影城', shows: 8, goldenPct: 46, hall: '普通', confidence: 68, advice: '建议升级IMAX厅', hallType: 'normal' as const },
  { id: 8, name: '星美国际影城', shows: 6, goldenPct: 42, hall: '普通', confidence: 71, advice: '场次偏少，建议+2场', hallType: 'normal' as const },
  { id: 9, name: 'UME国际影城双井店', shows: 10, goldenPct: 56, hall: 'IMAX', confidence: 90, advice: '周末增加早场', hallType: 'IMAX' as const },
  { id: 10, name: '耀莱成龙影城', shows: 7, goldenPct: 44, hall: '杜比', confidence: 65, advice: '建议替换杜比厅排片', hallType: 'dolby' as const },
];

function confidenceColor(v: number) {
  if (v > 85) return 'text-chart-green';
  if (v >= 70) return 'text-chart-orange';
  return 'text-cine-400';
}

function confidenceBg(v: number) {
  if (v > 85) return 'bg-chart-green/15';
  if (v >= 70) return 'bg-chart-orange/15';
  return 'bg-cine-400/15';
}

function hallBadge(type: 'IMAX' | 'dolby' | 'normal') {
  if (type === 'IMAX') return 'bg-chart-blue/15 text-chart-blue border-chart-blue/30';
  if (type === 'dolby') return 'bg-chart-purple/15 text-chart-purple border-chart-purple/30';
  return 'bg-space-700 text-slate-400 border-space-600';
}

function ProgressBar({ value, color = 'bg-gold-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-space-700/60 rounded-full overflow-hidden">
      <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ScreeningPrediction() {
  const [competitors, setCompetitors] = useState<CompetitorInfo[]>([]);
  const [prediction, setPrediction] = useState<SchedulePredictionRes | null>(null);
  const [selectedFilm, setSelectedFilm] = useState(0);
  const [simulateValues, setSimulateValues] = useState({ screenPct: 18, priceAdj: 0, primeTimeBoost: 65 });
  const [adoptedRows, setAdoptedRows] = useState<Set<number>>(new Set());

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

  const combinedScore =
    scheduleHeatData.score * 0.35 +
    competitorFactorData.score * 0.35 +
    theaterHistoryData.efficiencyScore * 0.30;

  const strategy = combinedScore >= 80 ? '激进' : combinedScore >= 60 ? '稳健' : '保守';
  const strategyColor = combinedScore >= 80 ? 'text-chart-green' : combinedScore >= 60 ? 'text-gold-400' : 'text-cine-400';
  const strategyBg = combinedScore >= 80 ? 'bg-chart-green/15 border-chart-green/30' : combinedScore >= 60 ? 'bg-gold-500/15 border-gold-500/30' : 'bg-cine-400/15 border-cine-400/30';

  const totalShows = schedulingPlan.reduce((s, r) => s + r.shows, 0);
  const avgGolden = schedulingPlan.reduce((s, r) => s + r.goldenPct, 0) / schedulingPlan.length;
  const weightedConf = schedulingPlan.reduce((s, r) => s + r.confidence * r.shows, 0) / totalShows;

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

      <div className="cip-card p-5">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 flex items-center justify-center">
            <Gauge className="w-4.5 h-4.5 text-gold-400" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-slate-100">三因子联动分析</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">档期热度 × 竞品表现 × 影院历史表现 综合评估</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-space-700/50 bg-space-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-chart-orange/15 flex items-center justify-center">
                <Flame className="w-4 h-4 text-chart-orange" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">档期热度因子</div>
                <div className="text-[10px] text-slate-500">{scheduleHeatData.name}</div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-3xl font-bold text-gold-400">{scheduleHeatData.score}</span>
              <span className="text-xs text-slate-500">/100</span>
              {scheduleHeatData.trend === 'up' && <TrendingUp className="w-4 h-4 text-chart-green" strokeWidth={1.8} />}
            </div>
            <div className="space-y-3">
              {scheduleHeatData.details.map(d => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">{d.label}</span>
                    <span className="font-mono text-slate-300">{d.value}</span>
                  </div>
                  <ProgressBar value={d.value} color={d.value >= 80 ? 'bg-chart-green' : d.value >= 60 ? 'bg-gold-500' : 'bg-chart-orange'} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-space-700/50 bg-space-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-chart-red/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-chart-red" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">竞品表现因子</div>
                <div className="text-[10px] text-slate-500">综合评分</div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-3xl font-bold text-gold-400">{competitorFactorData.score}</span>
              <span className="text-xs text-slate-500">/100</span>
            </div>
            <div className="space-y-2.5 mb-4">
              {competitorFactorData.top3.map((t, i) => (
                <div key={t.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-space-700 text-slate-400 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-slate-200 font-medium">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t.type}</span>
                    <span className="font-mono text-gold-400">{formatNumber(t.opening)}万</span>
                    <span className={clsx('badge text-[9px] py-0 px-1.5', castLevelBg[t.cast], castLevelColor[t.cast])}>{t.cast}级</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">竞品压力指数</span>
                <span className="font-mono text-chart-orange">{competitorFactorData.pressureIndex}</span>
              </div>
              <ProgressBar value={competitorFactorData.pressureIndex} color="bg-chart-red" />
            </div>
          </div>

          <div className="rounded-xl border border-space-700/50 bg-space-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-chart-blue/15 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-chart-blue" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">影院历史表现因子</div>
                <div className="text-[10px] text-slate-500">近30天数据</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-gold-400">{theaterHistoryData.avgOccupancy}%</div>
                <div className="text-[10px] text-slate-500">平均上座率</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-gold-400">{formatNumber(theaterHistoryData.avgRevenue)}</div>
                <div className="text-[10px] text-slate-500">场均收入</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-lg font-bold text-gold-400">{theaterHistoryData.efficiencyScore}</div>
                <div className="text-[10px] text-slate-500">排片效率</div>
              </div>
            </div>
            <div className="space-y-2">
              {theaterHistoryData.theaters.map(t => (
                <div key={t.name} className="flex items-center justify-between text-xs bg-space-700/30 rounded-lg px-3 py-2">
                  <span className="text-slate-300 font-medium">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">上座 <span className="font-mono text-chart-green">{t.occupancy}%</span></span>
                    <span className="text-slate-400">日均 <span className="font-mono text-chart-blue">{t.dailyShows}场</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gold-500/20 bg-gradient-to-r from-gold-500/5 to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-slate-500 mb-1">三因子加权总分</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-gold-400">{combinedScore.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">/100</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  档期×0.35 + 竞品×0.35 + 历史×0.30
                </div>
              </div>
              <div className="h-10 w-px bg-space-700" />
              <div>
                <div className="text-xs text-slate-500 mb-1">推荐排片策略</div>
                <span className={clsx('badge border text-sm font-semibold px-3 py-1', strategyBg, strategyColor)}>
                  {strategy}
                </span>
              </div>
              <div className="h-10 w-px bg-space-700" />
              <div>
                <div className="text-xs text-slate-500 mb-1">置信区间</div>
                <span className="font-mono text-sm text-chart-blue">
                  {formatNumber(Math.round(combinedScore * 180 - 800))}万 ~ {formatNumber(Math.round(combinedScore * 180 + 600))}万
                </span>
              </div>
            </div>
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

      <div className="cip-card p-5">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-green/20 to-emerald-500/10 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-chart-green" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-slate-100">可复核院线排片方案</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">逐影院排片详情 · 一键采纳 · 灵活调整</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-space-700/60">
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-2 w-10">序号</th>
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-3">影院名称</th>
                <th className="text-center text-xs text-slate-500 font-medium py-3 px-3">推荐排片场次</th>
                <th className="text-center text-xs text-slate-500 font-medium py-3 px-3">黄金场占比</th>
                <th className="text-center text-xs text-slate-500 font-medium py-3 px-3">推荐影厅</th>
                <th className="text-center text-xs text-slate-500 font-medium py-3 px-3">置信度</th>
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-3">调整建议</th>
                <th className="text-center text-xs text-slate-500 font-medium py-3 px-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {schedulingPlan.map(row => {
                const adopted = adoptedRows.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={clsx(
                      'border-b border-space-700/30 transition-colors',
                      adopted ? 'bg-chart-green/5' : 'hover:bg-space-800/40'
                    )}
                  >
                    <td className="py-3 px-2">
                      <span className="w-6 h-6 rounded-md bg-space-700 text-slate-400 text-xs font-bold flex items-center justify-center">
                        {row.id}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-medium">{row.name}</td>
                    <td className="py-3 px-3 text-center font-mono text-gold-400">{row.shows}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-slate-200">{row.goldenPct}%</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={clsx('badge text-[10px] border', hallBadge(row.hallType))}>
                        {row.hall}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={clsx('font-mono font-semibold px-2 py-0.5 rounded-md', confidenceColor(row.confidence), confidenceBg(row.confidence))}>
                        {row.confidence}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Lightbulb className="w-3 h-3 text-chart-orange shrink-0" strokeWidth={1.8} />
                        <span>{row.advice}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="text-xs text-slate-400 hover:text-chart-blue transition-colors flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
                          详情
                        </button>
                        <button
                          onClick={() => {
                            setAdoptedRows(prev => {
                              const next = new Set(prev);
                              if (next.has(row.id)) next.delete(row.id);
                              else next.add(row.id);
                              return next;
                            });
                          }}
                          className={clsx(
                            'text-xs transition-colors flex items-center gap-1',
                            adopted
                              ? 'text-chart-green'
                              : 'text-slate-400 hover:text-chart-green'
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {adopted ? '已采纳' : '采纳'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gold-500/20">
                <td colSpan={2} className="py-3 px-2 text-xs text-slate-500 font-medium">汇总</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-gold-400">{totalShows}</td>
                <td className="py-3 px-3 text-center font-mono text-gold-400">{avgGolden.toFixed(1)}%</td>
                <td />
                <td className="py-3 px-3 text-center">
                  <span className={clsx('font-mono font-semibold px-2 py-0.5 rounded-md', confidenceColor(weightedConf), confidenceBg(weightedConf))}>
                    {weightedConf.toFixed(1)}%
                  </span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
