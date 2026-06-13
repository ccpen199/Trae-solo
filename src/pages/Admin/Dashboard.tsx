import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  Download,
  FolderKanban,
  Play,
  Clock,
  Star,
  Target,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Trophy,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  FileBarChart,
  Award,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockProviders, mockNpsRecords } from '@/mock';

const TIME_RANGES = ['近7天', '近30天', '本季度', '本年度'] as const;

const KPI_DATA = [
  { icon: FolderKanban, label: '总项目数', value: 156, trend: 12.5, unit: '' },
  { icon: Play, label: '在执行项目', value: 47, trend: 8.3, unit: '' },
  { icon: Clock, label: '平均周期', value: 68, trend: -5.2, unit: '天' },
  { icon: Star, label: '平均NPS', value: 8.6, trend: 3.1, unit: '' },
  { icon: Target, label: '匹配成功率', value: 87.5, trend: 2.8, unit: '%' },
  { icon: CheckCircle2, label: '准时交付率', value: 96.3, trend: 1.5, unit: '%' },
];

const STAGES = ['需求诊断', '方案报价', '施工排期', '材料进场', '施工执行', '竣工验收', '质保跟踪'];
const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

const HEATMAP_DATA: number[][] = [
  [4, 10, 7, 15, 22, 3, 2],
  [5, 11, 8, 16, 24, 2, 1],
  [6, 13, 9, 18, 26, 3, 2],
  [3, 9, 6, 14, 20, 2, 1],
  [5, 12, 8, 17, 25, 3, 2],
  [4, 11, 7, 19, 28, 4, 3],
];

const BOTTLENECK_DATA = [
  { name: '施工执行', days: 25 },
  { name: '材料进场', days: 18 },
  { name: '方案报价', days: 12 },
  { name: '施工排期', days: 8 },
  { name: '需求诊断', days: 5 },
  { name: '竣工验收', days: 3 },
  { name: '质保跟踪', days: 2 },
];

const NPS_CATEGORIES = [
  { name: '整体体验', score: 8.6 },
  { name: '设计质量', score: 8.8 },
  { name: '施工质量', score: 8.4 },
  { name: '响应速度', score: 8.7 },
  { name: '性价比', score: 8.2 },
  { name: '售后服务', score: 8.5 },
];

const BAD_WORDS = [
  { text: '工期延误', size: 'text-lg', color: 'text-red-400' },
  { text: '材料色差', size: 'text-base', color: 'text-orange-400' },
  { text: '沟通不畅', size: 'text-base', color: 'text-yellow-400' },
  { text: '细节不精', size: 'text-sm', color: 'text-amber-300' },
  { text: '响应延迟', size: 'text-sm', color: 'text-neutral-400' },
  { text: '增项过多', size: 'text-base', color: 'text-orange-300' },
  { text: '设计偏差', size: 'text-sm', color: 'text-yellow-300' },
  { text: '噪音扰民', size: 'text-xs', color: 'text-neutral-500' },
  { text: '返工率高', size: 'text-sm', color: 'text-red-300' },
  { text: '验收标准模糊', size: 'text-xs', color: 'text-neutral-500' },
];

const CHART_TEXT = { color: '#94A3B8' };
const SPLIT_LINE = { lineStyle: { color: 'rgba(100,116,139,0.2)' } };
const AXIS_LINE = { lineStyle: { color: 'rgba(100,116,139,0.3)' } };
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,30,49,0.9)',
  borderColor: 'rgba(212,168,83,0.3)',
  textStyle: { color: '#E2E8F0' },
};

const stagger = (_i: number) => ({ opacity: 0, y: 20 });
const staggerAnimate = (i: number) => ({
  opacity: 1,
  y: 0,
  transition: { duration: 0.5, delay: i * 0.08 },
});

function KPICard({ icon: Icon, label, value, trend, unit, index }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; trend: number; unit: string; index: number;
}) {
  const isUp = trend >= 0;
  return (
    <motion.div
      initial={stagger(index)}
      animate={staggerAnimate(index)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-base p-5"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-gradient">
            <Icon className="h-5 w-5 text-primary-900" />
          </div>
          <span className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400',
          )}>
            <TrendingUp className={cn('h-3 w-3', !isUp && 'rotate-180')} />
            {isUp ? '+' : ''}{trend}%
          </span>
        </div>
        <p className="mt-3 text-xs text-neutral-400">{label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono glow-text-gold">
            {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}
          </span>
          {unit && <span className="text-sm text-gold-400/80">{unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function HeatmapChart() {
  const option = useMemo(() => ({
    tooltip: { ...TOOLTIP_STYLE, formatter: (p: { data: number[] }) => `${WEEKS[p.data[0]]} ${STAGES[p.data[1]]}: ${p.data[2]}天` },
    grid: { left: '12%', right: '12%', bottom: '15%', top: '5%' },
    xAxis: { type: 'category', data: STAGES, axisLabel: { ...CHART_TEXT, fontSize: 11, interval: 0, rotate: 15 }, axisLine: AXIS_LINE, axisTick: { show: false } },
    yAxis: { type: 'category', data: WEEKS, axisLabel: CHART_TEXT, axisLine: AXIS_LINE, axisTick: { show: false } },
    visualMap: { min: 0, max: 30, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, textStyle: CHART_TEXT, inRange: { color: ['#FBF6EC', '#F4E7C9', '#ECD6A3', '#D4A853'] }, itemWidth: 14, itemHeight: 120 },
    series: [{
      type: 'heatmap', data: HEATMAP_DATA.flatMap((row, wi) => row.map((v, si) => [si, wi, v])),
      label: { show: true, color: '#1E3A5F', fontSize: 11, fontWeight: 600 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(212,168,83,0.5)' } },
    }],
    backgroundColor: 'transparent',
  }), []);

  return <ReactECharts option={option} style={{ height: 320 }} />;
}

function BottleneckPanel() {
  const maxDays = Math.max(...BOTTLENECK_DATA.map(d => d.days));
  return (
    <div className="space-y-3">
      {BOTTLENECK_DATA.map((item) => {
        const isBottleneck = item.days > 15;
        return (
          <div key={item.name} className="flex items-center gap-3">
            <span className={cn('w-20 shrink-0 text-xs text-right', isBottleneck ? 'text-red-400 font-medium' : 'text-neutral-400')}>
              {item.name}
            </span>
            <div className="flex-1 h-5 rounded-full bg-primary-900/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.days / maxDays) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={cn('h-full rounded-full', isBottleneck ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-gold-700 to-gold-400')}
              />
            </div>
            <span className={cn('w-12 text-xs font-mono shrink-0', isBottleneck ? 'text-red-400' : 'text-gold-300')}>
              {item.days}天
            </span>
            {isBottleneck && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
          </div>
        );
      })}
      <div className="divider-gold my-4" />
      <div className="space-y-2 text-xs text-neutral-400">
        <p>💡 <span className="text-gold-300">建议：</span>施工执行环节引入BIM预演，预计缩短工期20%</p>
        <p>💡 <span className="text-gold-300">建议：</span>材料进场采用集采+前置备货模式，减少等待时间</p>
      </div>
    </div>
  );
}

function NpsGauge() {
  const score = 8.6;
  const pct = score / 10;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference * (1 - pct * 0.75);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 180" className="w-44 h-44">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9A7431" />
            <stop offset="50%" stopColor="#D4A853" />
            <stop offset="100%" stopColor="#E4C57D" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          transform="rotate(135 90 90)" strokeLinecap="round" />
        <motion.circle cx="90" cy="90" r="70" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform="rotate(135 90 90)" strokeLinecap="round" />
        <text x="90" y="82" textAnchor="middle" className="glow-text-gold" fill="#E4C57D" fontSize="36" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{score}</text>
        <text x="90" y="105" textAnchor="middle" fill="#94A3B8" fontSize="12">NPS分数</text>
      </svg>
      <div className="flex w-full gap-1 mt-2 rounded-lg overflow-hidden h-2.5">
        <div className="bg-emerald-500" style={{ width: '68%' }} />
        <div className="bg-yellow-500" style={{ width: '24%' }} />
        <div className="bg-red-500" style={{ width: '8%' }} />
      </div>
      <div className="flex w-full justify-between mt-1 text-xs text-neutral-400">
        <span className="text-emerald-400">推荐者 68%</span>
        <span className="text-yellow-400">中立者 24%</span>
        <span className="text-red-400">贬损者 8%</span>
      </div>
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        {NPS_CATEGORIES.map(c => (
          <div key={c.name} className="card-base p-2 text-center">
            <p className="text-xs text-neutral-400">{c.name}</p>
            <p className="text-sm font-bold font-mono glow-text-gold">{c.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NpsTrendChart() {
  const option = useMemo(() => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const scores = [8.2, 8.3, 8.1, 8.4, 8.5, 8.3, 8.6, 8.4, 8.7, 8.5, 8.6, 8.8, 8.5, 8.7, 8.6, 8.9, 8.7, 8.6, 8.8, 8.5, 8.7, 8.9, 8.6, 8.8, 8.7, 8.9, 8.8, 8.7, 8.6, 8.6];
    return {
      tooltip: { ...TOOLTIP_STYLE, trigger: 'axis' as const },
      grid: { left: '8%', right: '4%', bottom: '10%', top: '10%' },
      xAxis: { type: 'category' as const, data: dates, axisLabel: { ...CHART_TEXT, fontSize: 10, interval: 4 }, axisLine: AXIS_LINE, axisTick: { show: false } },
      yAxis: { type: 'value' as const, min: 7.5, max: 10, splitLine: SPLIT_LINE, axisLabel: { ...CHART_TEXT, fontSize: 10 }, axisLine: { show: false } },
      series: [{
        type: 'line', data: scores, smooth: true, symbol: 'circle', symbolSize: 4,
        lineStyle: { color: '#D4A853', width: 2 },
        itemStyle: { color: '#D4A853' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(212,168,83,0.35)' }, { offset: 1, color: 'rgba(212,168,83,0.02)' }],
          },
        },
      }],
      backgroundColor: 'transparent',
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ReactECharts option={option} style={{ height: '100%', minHeight: 200 }} />
      </div>
      <div className="mt-3">
        <p className="text-xs text-neutral-400 mb-2">差评关键词云</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {BAD_WORDS.map(w => (
            <span key={w.text} className={cn('font-medium cursor-default transition-colors hover:text-gold-300', w.size, w.color)}>{w.text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderRankTable() {
  const sorted = [...mockProviders].sort((a, b) => b.rating.overall - a.rating.overall);
  const top3 = sorted.slice(0, 3);
  const levelColor: Record<string, string> = { 'S级': 'bg-gold-500/20 text-gold-300 border-gold-500/40', 'A级': 'bg-info-500/20 text-info-500 border-info-500/40', 'B级': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40' };
  const trophyColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-neutral-400 border-b border-white/5">
            <th className="py-2 text-left w-10">排名</th>
            <th className="py-2 text-left">公司</th>
            <th className="py-2 text-center w-14">等级</th>
            <th className="py-2 text-center w-16">评分</th>
            <th className="py-2 text-center w-20">准时率</th>
            <th className="py-2 text-center w-14">项目</th>
          </tr>
        </thead>
        <tbody>
          {top3.map((p, i) => (
            <tr key={p.id} className="border-b border-white/5 hover:bg-primary-800/30 transition-colors">
              <td className="py-3"><Trophy className={cn('h-5 w-5', trophyColors[i])} /></td>
              <td className="py-3 text-neutral-200 text-xs">{p.shortName}</td>
              <td className="py-3 text-center"><span className={cn('inline-block rounded px-1.5 py-0.5 text-xs border', levelColor[p.level] || levelColor['B级'])}>{p.level}</span></td>
              <td className="py-3 text-center font-mono text-gold-300">{p.rating.overall}</td>
              <td className="py-3 text-center font-mono text-emerald-400">{p.rating.onTimeRate}%</td>
              <td className="py-3 text-center font-mono text-neutral-300">{p.rating.totalOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderRadarChart() {
  const sorted = [...mockProviders].sort((a, b) => b.rating.overall - a.rating.overall);
  const [visible, setVisible] = useState([true, true, true]);
  const top3 = sorted.slice(0, 3);
  const colors = ['#D4A853', '#3D5D97', '#0EA5E9'];

  const areaColors = ['rgba(212,168,83,0.1)', 'rgba(61,93,151,0.1)', 'rgba(14,165,233,0.1)'];

  const option = useMemo(() => ({
    tooltip: TOOLTIP_STYLE,
    legend: { show: false },
    radar: {
      indicator: [
        { name: '交付质量', max: 5 }, { name: '响应速度', max: 5 },
        { name: '性价比', max: 5 }, { name: '设计水平', max: 5 }, { name: '售后服务', max: 5 },
      ],
      axisName: { ...CHART_TEXT, fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(100,116,139,0.15)' } },
      splitArea: { areaStyle: { color: ['rgba(30,58,95,0.1)', 'rgba(30,58,95,0.2)'] } },
      axisLine: { lineStyle: { color: 'rgba(100,116,139,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: top3.map((p, i) => visible[i] ? {
        value: [p.rating.deliveryQuality, p.rating.responseSpeed, p.rating.costPerformance, p.rating.designLevel, p.rating.afterSales],
        name: p.shortName,
        lineStyle: { color: colors[i], width: 2 },
        itemStyle: { color: colors[i] },
        areaStyle: { color: areaColors[i] },
      } : null).filter(Boolean),
    }],
    backgroundColor: 'transparent',
  }), [visible, top3]);

  return (
    <div>
      <div className="flex gap-3 mb-3">
        {top3.map((p, i) => (
          <label key={p.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input type="checkbox" checked={visible[i]} onChange={() => setVisible(v => v.map((x, j) => j === i ? !x : x))}
              className="accent-gold-500 rounded" />
            <span style={{ color: colors[i] }}>{p.shortName}</span>
          </label>
        ))}
      </div>
      <ReactECharts option={option} style={{ height: 260 }} />
    </div>
  );
}

function ProviderDetail() {
  const provider = [...mockProviders].sort((a, b) => b.rating.overall - a.rating.overall)[0];
  const dims = [
    { label: '交付质量', value: provider.rating.deliveryQuality },
    { label: '响应速度', value: provider.rating.responseSpeed },
    { label: '性价比', value: provider.rating.costPerformance },
    { label: '设计水平', value: provider.rating.designLevel },
    { label: '售后服务', value: provider.rating.afterSales },
  ];
  const levelColor: Record<string, string> = { 'S级': 'bg-gold-500/20 text-gold-300 border border-gold-500/40', 'A级': 'bg-info-500/20 text-info-500 border border-info-500/40', 'B级': 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/40' };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-neutral-200">{provider.shortName}</h4>
        <span className={cn('rounded px-2 py-0.5 text-xs font-medium', levelColor[provider.level])}>{provider.level}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {provider.qualifications.slice(0, 3).map(q => (
          <span key={q.id} className="chip">{q.name.slice(0, 8)}</span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="card-base p-2 text-center"><p className="text-neutral-400">总人数</p><p className="font-mono text-gold-300 font-bold">{provider.teamSize}</p></div>
        <div className="card-base p-2 text-center"><p className="text-neutral-400">设计师</p><p className="font-mono text-gold-300 font-bold">{provider.designers}</p></div>
        <div className="card-base p-2 text-center"><p className="text-neutral-400">项目经理</p><p className="font-mono text-gold-300 font-bold">{provider.projectManagers}</p></div>
        <div className="card-base p-2 text-center"><p className="text-neutral-400">工人</p><p className="font-mono text-gold-300 font-bold">{provider.workers}</p></div>
      </div>
      <div className="space-y-2">
        {dims.map(d => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-16 text-xs text-neutral-400 shrink-0">{d.label}</span>
            <div className="flex-1 h-2 rounded-full bg-primary-900/50 overflow-hidden">
              <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${(d.value / 5) * 100}%` }} />
            </div>
            <span className="w-10 text-xs font-mono text-gold-300 shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="divider-gold" />
      <div>
        <p className="text-xs text-neutral-400 mb-2">最近项目</p>
        {provider.cases.slice(0, 2).map(c => (
          <div key={c.id} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-neutral-200 truncate max-w-[70%]">{c.name}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', c.npsScore >= 9 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-300')}>
              NPS {c.npsScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageDurationDetail() {
  const rows = [
    { stage: '需求诊断', avg: 5.2, min: 2, max: 12, std: 2.1, projects: 128, bottleneck: false },
    { stage: '方案报价', avg: 11.8, min: 5, max: 25, std: 4.3, projects: 115, bottleneck: true },
    { stage: '施工排期', avg: 7.5, min: 3, max: 15, std: 2.8, projects: 102, bottleneck: false },
    { stage: '材料进场', avg: 17.6, min: 8, max: 35, std: 6.5, projects: 96, bottleneck: true },
    { stage: '施工执行', avg: 25.3, min: 12, max: 48, std: 9.1, projects: 88, bottleneck: true },
    { stage: '竣工验收', avg: 3.1, min: 1, max: 8, std: 1.4, projects: 75, bottleneck: false },
    { stage: '质保跟踪', avg: 2.4, min: 1, max: 6, std: 1.1, projects: 68, bottleneck: false },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-neutral-400 border-b border-white/5">
            <th className="py-2 text-left font-medium">环节</th>
            <th className="py-2 text-right font-medium">平均耗时</th>
            <th className="py-2 text-right font-medium">最短</th>
            <th className="py-2 text-right font-medium">最长</th>
            <th className="py-2 text-right font-medium">标准差</th>
            <th className="py-2 text-right font-medium">项目数</th>
            <th className="py-2 text-center font-medium">状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.stage} className="border-b border-white/5 hover:bg-primary-800/30 transition-colors">
              <td className="py-2.5 text-neutral-200">{r.stage}</td>
              <td className="py-2.5 text-right font-mono text-gold-300 font-bold">{r.avg}天</td>
              <td className="py-2.5 text-right font-mono text-emerald-400">{r.min}天</td>
              <td className="py-2.5 text-right font-mono text-rose-400">{r.max}天</td>
              <td className="py-2.5 text-right font-mono text-neutral-400">±{r.std}</td>
              <td className="py-2.5 text-right font-mono text-neutral-300">{r.projects}</td>
              <td className="py-2.5 text-center">
                {r.bottleneck ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px]">
                    <AlertTriangle className="w-3 h-3" />瓶颈
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />正常
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NpsCollectionTable() {
  return (
    <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-primary-800/90 backdrop-blur-sm z-10">
          <tr className="text-neutral-400 border-b border-white/5">
            <th className="py-2 text-left font-medium">项目</th>
            <th className="py-2 text-left font-medium">客户</th>
            <th className="py-2 text-center font-medium">角色</th>
            <th className="py-2 text-center font-medium">评分</th>
            <th className="py-2 text-center font-medium">类型</th>
            <th className="py-2 text-left font-medium">反馈摘要</th>
            <th className="py-2 text-center font-medium">处理状态</th>
            <th className="py-2 text-right font-medium">采集时间</th>
          </tr>
        </thead>
        <tbody>
          {mockNpsRecords.map(r => (
            <tr key={r.id} className="border-b border-white/5 hover:bg-primary-800/30 transition-colors">
              <td className="py-2.5 text-neutral-200 truncate max-w-[140px]">{r.workOrderTitle}</td>
              <td className="py-2.5 text-neutral-300">{r.reviewerName}</td>
              <td className="py-2.5 text-center">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary-700/50 text-neutral-300 border border-white/5">
                  {r.reviewerRole}
                </span>
              </td>
              <td className="py-2.5 text-center">
                <span className={cn(
                  'font-mono font-bold text-sm',
                  r.score >= 9 ? 'text-emerald-400' :
                  r.score >= 7 ? 'text-gold-300' : 'text-rose-400'
                )}>{r.score}</span>
              </td>
              <td className="py-2.5 text-center">
                {r.score >= 9 ? <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 inline" /> :
                 r.score >= 7 ? <Star className="w-3.5 h-3.5 text-gold-300 inline" /> :
                 <ThumbsDown className="w-3.5 h-3.5 text-rose-400 inline" />}
              </td>
              <td className="py-2.5 text-neutral-400 truncate max-w-[200px]">{r.comment}</td>
              <td className="py-2.5 text-center">
                <span className={cn(
                  'inline-block px-2 py-0.5 rounded-full text-[10px]',
                  r.responseStatus === '已回复' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                  r.responseStatus === '已处理' ? 'bg-info-500/15 text-info-400 border border-info-500/30' :
                  'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                )}>{r.responseStatus}</span>
              </td>
              <td className="py-2.5 text-right text-neutral-500 whitespace-nowrap">{r.reviewDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderFullRankTable() {
  const sorted = [...mockProviders].sort((a, b) => b.rating.overall - a.rating.overall);
  const levelColor: Record<string, string> = { 'S级': 'bg-gold-500/20 text-gold-300 border-gold-500/40', 'A级': 'bg-info-500/20 text-info-500 border-info-500/40', 'B级': 'bg-neutral-500/20 text-neutral-400 border-neutral-500/40' };
  return (
    <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-primary-800/90 backdrop-blur-sm z-10">
          <tr className="text-neutral-400 border-b border-white/5">
            <th className="py-2 text-left w-10">排名</th>
            <th className="py-2 text-left">供应商</th>
            <th className="py-2 text-center w-14">等级</th>
            <th className="py-2 text-center">综合分</th>
            <th className="py-2 text-center">交付</th>
            <th className="py-2 text-center">响应</th>
            <th className="py-2 text-center">性价比</th>
            <th className="py-2 text-center">设计</th>
            <th className="py-2 text-center">售后</th>
            <th className="py-2 text-center">准时率</th>
            <th className="py-2 text-center">项目数</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.id} className="border-b border-white/5 hover:bg-primary-800/30 transition-colors">
              <td className="py-2.5 font-mono text-neutral-400">#{i + 1}</td>
              <td className="py-2.5 text-neutral-200">{p.shortName}</td>
              <td className="py-2.5 text-center"><span className={cn('inline-block rounded px-1.5 py-0.5 border text-[10px]', levelColor[p.level] || levelColor['B级'])}>{p.level}</span></td>
              <td className="py-2.5 text-center font-mono font-bold text-gold-300">{p.rating.overall}</td>
              <td className="py-2.5 text-center font-mono text-neutral-300">{p.rating.deliveryQuality}</td>
              <td className="py-2.5 text-center font-mono text-neutral-300">{p.rating.responseSpeed}</td>
              <td className="py-2.5 text-center font-mono text-neutral-300">{p.rating.costPerformance}</td>
              <td className="py-2.5 text-center font-mono text-neutral-300">{p.rating.designLevel}</td>
              <td className="py-2.5 text-center font-mono text-neutral-300">{p.rating.afterSales}</td>
              <td className="py-2.5 text-center font-mono text-emerald-400">{p.rating.onTimeRate}%</td>
              <td className="py-2.5 text-center font-mono text-neutral-400">{p.rating.totalOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<number>(1);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold glow-text-gold">运营服务看板</h1>
            <p className="mt-1 text-sm text-neutral-400">实时监控平台运营与服务质量</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-primary-900/60 border border-white/5 p-0.5">
              {TIME_RANGES.map((r, i) => (
                <button key={r} onClick={() => setTimeRange(i)}
                  className={cn('px-3.5 py-1.5 rounded-md text-xs font-medium transition-all', timeRange === i ? 'bg-gold-gradient text-primary-900 shadow-gold-glow' : 'text-neutral-400 hover:text-neutral-200')}>
                  {r}
                </button>
              ))}
            </div>
            <button className="btn-primary"><Download className="h-4 w-4" />导出数据</button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {KPI_DATA.map((kpi, i) => <KPICard key={kpi.label} {...kpi} index={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={stagger(0)} animate={staggerAnimate(0)} className="card-base p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-200 mb-3">各环节平均耗时热力图</h3>
            <HeatmapChart />
          </motion.div>
          <motion.div initial={stagger(1)} animate={staggerAnimate(1)} className="card-base p-5">
            <h3 className="text-sm font-semibold text-neutral-200 mb-3">环节耗时排名 & 瓶颈分析</h3>
            <BottleneckPanel />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={stagger(2)} animate={staggerAnimate(2)} className="card-base p-5">
            <h3 className="text-sm font-semibold text-neutral-200 mb-3">NPS总览仪表盘</h3>
            <NpsGauge />
          </motion.div>
          <motion.div initial={stagger(3)} animate={staggerAnimate(3)} className="card-base p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-neutral-200 mb-3">NPS趋势 & 差评分析</h3>
            <NpsTrendChart />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <motion.div initial={stagger(6)} animate={staggerAnimate(6)} className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-gold-400" />
                NPS采集记录明细
              </h3>
              <span className="text-xs text-neutral-500">共 {mockNpsRecords.length} 条记录</span>
            </div>
            <NpsCollectionTable />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <motion.div initial={stagger(7)} animate={staggerAnimate(7)} className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold-400" />
                各环节耗时明细报表
              </h3>
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span>瓶颈环节</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>正常环节</span>
              </div>
            </div>
            <StageDurationDetail />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <motion.div initial={stagger(8)} animate={staggerAnimate(8)} className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-400" />
                供应商交付质量完整评分表
              </h3>
              <span className="text-xs text-neutral-500">共 {mockProviders.length} 家供应商</span>
            </div>
            <ProviderFullRankTable />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
