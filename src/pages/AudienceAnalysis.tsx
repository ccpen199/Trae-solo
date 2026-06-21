import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Users, UserCheck, BarChart3, GitMerge, RotateCcw, Search,
  Eye, PieChart as PieChartIcon, ArrowRight, Sparkles,
} from 'lucide-react';
import type { AudienceFilterReq, AudienceProfile, AudienceMigration } from 'shared/types';
import { formatNumber, formatPercent } from '@/utils/format';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { clsx } from 'clsx';

const genders = [{ k: 'male', l: '男性', c: 'text-chart-blue' }, { k: 'female', l: '女性', c: 'text-chart-pink' }];
const ages = [
  { k: 'under18', l: '18岁以下' }, { k: '18-24', l: '18-24岁' },
  { k: '25-34', l: '25-34岁' }, { k: '35-44', l: '35-44岁' },
  { k: '45-54', l: '45-54岁' }, { k: '55+', l: '55岁以上' },
];
const regions = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '重庆', '南京', '西安', '天津', '长沙', '青岛', '沈阳', '郑州'];
const freqs = [
  { k: 'low', l: '低频 ≤3次/年' }, { k: 'medium', l: '中频 4-12次/年' },
  { k: 'high', l: '高频 13-30次/年' }, { k: 'extreme', l: '极高频 >30次/年' },
];
const types = ['科幻', '悬疑犯罪', '动作冒险', '爱情', '喜剧', '动画', '剧情', '历史传记', '恐怖惊悚', '纪录片'];

export default function AudienceAnalysis() {
  const [profile, setProfile] = useState<AudienceProfile | null>(null);
  const [migration, setMigration] = useState<AudienceMigration | null>(null);
  const [filters, setFilters] = useState<AudienceFilterReq>({});
  const [filtersOpen, setFiltersOpen] = useState<Record<string, boolean>>({ gender: true, age: true, region: false, freq: true, type: false });

  const loadProfile = (f: AudienceFilterReq) => {
    fetch('/api/audience/filter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      .then(r => r.json()).then(j => setProfile(j.data));
  };

  useEffect(() => {
    loadProfile(filters);
    fetch('/api/audience/migration').then(r => r.json()).then(j => setMigration(j.data));
  }, []);

  const toggleFilter = (cat: string, key: string, multi = true) => {
    setFilters(prev => {
      const next = { ...prev };
      if (cat === 'gender') {
        const arr = (next.gender || []) as string[];
        next.gender = (multi ? (arr.includes(key as never) ? arr.filter(x => x !== key) : [...arr, key]) : [key]) as AudienceFilterReq['gender'];
      } else if (cat === 'freq') {
        const arr = (next.frequency || []) as string[];
        next.frequency = (multi ? (arr.includes(key as never) ? arr.filter(x => x !== key) : [...arr, key]) : [key]) as AudienceFilterReq['frequency'];
      } else if (cat === 'region') {
        const arr = next.regions || [];
        next.regions = arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key];
      } else if (cat === 'type') {
        const arr = next.preferredTypes || [];
        next.preferredTypes = arr.includes(key) ? arr.filter(x => x !== key) : [...arr, key];
      } else if (cat === 'age') {
        next.ageRange = key === 'all' ? undefined : ([
          Number(key.split('-')[0]?.replace('under', '0') || 0),
          Number(key.split('-')[1]?.replace('+', '') || 100) || 100,
        ] as [number, number]);
      }
      setTimeout(() => loadProfile(next), 50);
      return next;
    });
  };

  const isFilterActive = (cat: string, key: string) => {
    if (cat === 'gender') return (filters.gender || []).includes(key as never);
    if (cat === 'freq') return (filters.frequency || []).includes(key as never);
    if (cat === 'region') return (filters.regions || []).includes(key);
    if (cat === 'type') return (filters.preferredTypes || []).includes(key);
    if (cat === 'age') {
      if (key === 'all') return !filters.ageRange;
      const [lo, hi] = filters.ageRange || [];
      const klo = Number(key.split('-')[0]?.replace('under', '0') || 0);
      const khi = Number(key.split('-')[1]?.replace('+', '') || 100) || 100;
      return lo === klo && hi === khi;
    }
    return false;
  };

  const activeFilterCount =
    (filters.gender?.length || 0) +
    (filters.frequency?.length || 0) +
    (filters.regions?.length || 0) +
    (filters.preferredTypes?.length || 0) +
    (filters.ageRange ? 1 : 0);

  const radarOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1' } },
    radar: {
      indicator: [
        { name: '消费力', max: 100 }, { name: '观影频次', max: 100 }, { name: '偏好广度', max: 100 },
        { name: '社交属性', max: 100 }, { name: '品牌忠诚', max: 100 }, { name: '决策周期', max: 100 },
      ],
      center: ['50%', '52%'], radius: '66%',
      axisName: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.6)' } },
      splitArea: { areaStyle: { color: ['rgba(17, 29, 53, 0.2)', 'rgba(17, 29, 53, 0.4)'] } },
      axisLine: { lineStyle: { color: '#243B5E' } },
    },
    series: [{
      type: 'radar', symbol: 'circle', symbolSize: 7,
      data: [{
        name: '当前人群画像',
        value: profile ? [profile.radarProfile.consumption, profile.radarProfile.frequency, profile.radarProfile.diversity, profile.radarProfile.social, profile.radarProfile.loyalty, profile.radarProfile.decisionCycle] : [60, 60, 60, 60, 60, 60],
        lineStyle: { color: '#D4AF37', width: 2.5, shadowColor: 'rgba(212,175,55,0.4)', shadowBlur: 10 },
        areaStyle: { color: { type: 'radial', x: 0.5, y: 0.5, r: 0.5, colorStops: [{ offset: 0, color: 'rgba(212,175,55,0.35)' }, { offset: 1, color: 'rgba(212,175,55,0.02)' }] } },
        itemStyle: { color: '#D4AF37', borderWidth: 2, borderColor: '#0A1628' },
      }],
    }],
  };

  const pieOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1' }, formatter: '{b}: {c}%' },
    series: [{
      type: 'pie', radius: ['50%', '78%'], center: ['50%', '50%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: '#0A1628', borderWidth: 3, borderRadius: 3 },
      label: { color: '#94a3b8', fontSize: 11, formatter: '{b}\n{d}%' },
      labelLine: { lineStyle: { color: '#243B5E' } },
      data: [
        { value: profile?.genderRatio.male || 48, name: '男性', itemStyle: { color: '#3B82F6' } },
        { value: 100 - (profile?.genderRatio.male || 48), name: '女性', itemStyle: { color: '#EC4899' } },
      ],
    }],
  };

  const ageBarOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1' }, axisPointer: { type: 'shadow' }, formatter: (p: unknown) => { const a = p as Array<{ axisValue: string; value: number }>; return `${a[0]?.axisValue}<br/><b style="color:#D4AF37;font-family:JetBrains Mono">${a[0]?.value}%</b>`; } },
    grid: { left: 4, right: 12, top: 8, bottom: 4, containLabel: true },
    xAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.5)', type: 'dashed' } } },
    yAxis: { type: 'category', data: profile?.ageDistribution.map(a => a.range).reverse() || [], axisLine: { lineStyle: { color: '#1A2A47' } }, axisLabel: { color: '#94a3b8', fontSize: 10 }, axisTick: { show: false } },
    series: [{
      type: 'bar', data: profile?.ageDistribution.map(a => a.ratio).reverse() || [], barWidth: 14,
      itemStyle: { borderRadius: [0, 4, 4, 0], color: (p: unknown) => { const v = (p as { value: number }).value; return v > 25 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#95751B' }, { offset: 1, color: '#E2BC30' }]) : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#1D4ED8' }, { offset: 1, color: '#06B6D4' }]); } },
      label: { show: true, position: 'right', color: '#e2bc30', fontSize: 10, fontFamily: 'JetBrains Mono', formatter: '{c}%' },
    } as never],
  };

  const freqBarOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1' } },
    grid: { left: 8, right: 16, top: 10, bottom: 32, containLabel: true },
    xAxis: { type: 'category', data: profile?.frequencyDistribution.map(f => f.level.split(' ')[0]) || [], axisLine: { lineStyle: { color: '#1A2A47' } }, axisLabel: { color: '#64748b', fontSize: 10, rotate: 12 } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.5)', type: 'dashed' } } },
    series: [{
      type: 'bar', barWidth: 22,
      data: profile?.frequencyDistribution.map((f, i) => ({ value: f.ratio, itemStyle: { color: ['#3B82F6', '#10B981', '#F59E0B', '#C0392B'][i], borderRadius: [6, 6, 0, 0] } })) || [],
      label: { show: true, position: 'top', color: '#D4AF37', fontSize: 11, fontFamily: 'JetBrains Mono', formatter: '{c}%' },
    } as never],
  };

  const typeHorizontalOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1' } },
    grid: { left: 4, right: 28, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLine: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: profile?.preferredTypes.map(p => p.type).reverse() || [], axisLine: { show: false }, axisLabel: { color: '#94a3b8', fontSize: 11 }, axisTick: { show: false } },
    series: [{
      type: 'bar', data: profile?.preferredTypes.map(p => p.score).reverse() || [], barWidth: 14,
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: (p: unknown) => {
          const v = (p as { value: number }).value;
          return v > 75 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#95751B' }, { offset: 1, color: '#EBCB50' }])
            : v > 60 ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#1D4ED8' }, { offset: 1, color: '#06B6D4' }])
            : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#334155' }, { offset: 1, color: '#64748b' }]);
        },
      },
      label: { show: true, position: 'right', color: '#cbd5e1', fontSize: 10, fontFamily: 'JetBrains Mono' },
    } as never],
  };

  const sankeyOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1', fontSize: 12 }, trigger: 'item', triggerOn: 'mousemove' },
    series: [{
      type: 'sankey', emphasis: { focus: 'adjacency' }, nodeAlign: 'left', nodeWidth: 18, nodeGap: 14,
      data: migration?.nodes.map((n, i) => ({
        name: n.name,
        itemStyle: { color: n.category === 'source' ? ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 4] : ['#D4AF37', '#C0392B', '#06B6D4'][i % 3] },
      })) || [],
      links: migration?.links.map(l => ({
        source: migration.nodes.find(n => n.id === l.source)?.name || '',
        target: migration.nodes.find(n => n.id === l.target)?.name || '',
        value: l.value,
        lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.55 },
      })) || [],
      label: { color: '#cbd5e1', fontSize: 11 },
      lineStyle: { color: 'gradient', curveness: 0.5 },
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-gold-500 font-medium tracking-widest uppercase mb-1.5">Audience Intelligence Center</div>
          <h1 className="font-serif text-3xl font-bold text-slate-100">
            <span className="text-gradient-gold">受众分析</span> · 多维画像中心
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">交叉筛选 · 六维画像 · 偏好洞察 · 相似影片人群迁移分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 px-4 rounded-xl bg-gradient-to-r from-gold-500/15 to-transparent border border-gold-500/30 flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-400" strokeWidth={1.8} />
            <span className="text-sm text-slate-300">人群规模</span>
            <span className="font-mono font-bold text-gold-400">{formatNumber(profile?.totalUsers || 0)}</span>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => { setFilters({}); setTimeout(() => loadProfile({}), 50); }} className="btn-secondary h-10 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />重置筛选 ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-1 space-y-3">
          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 flex items-center justify-center">
                  <Search className="w-4.5 h-4.5 text-gold-400" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-slate-100">多维交叉筛选</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">实时联动 · 即时计算</p>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <span className="badge bg-gold-500/15 text-gold-400 border border-gold-500/30">
                  {activeFilterCount} 个条件
                </span>
              )}
            </div>
            <div className="space-y-4 max-h-[620px] overflow-y-auto scrollbar-thin pr-1">
              {[
                { key: 'gender', title: '性别', icon: Users, items: genders.map(g => ({ k: g.k, l: g.l, sub: undefined })) },
                { key: 'age', title: '年龄段', icon: UserCheck, items: [{ k: 'all', l: '全部' }, ...ages].map(a => ({ k: a.k, l: a.l, sub: undefined })), single: true },
                { key: 'freq', title: '观影频次', icon: BarChart3, items: freqs.map(f => ({ k: f.k, l: f.l, sub: undefined })) },
                { key: 'type', title: '偏好类型', icon: Eye, items: types.map(t => ({ k: t, l: t, sub: undefined })) },
                { key: 'region', title: '城市区域', icon: PieChartIcon, items: regions.map(r => ({ k: r, l: r, sub: undefined })) },
              ].map(sec => (
                <div key={sec.key}>
                  <button onClick={() => setFiltersOpen(f => ({ ...f, [sec.key]: !f[sec.key as keyof typeof f] }))} className="w-full flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                      <sec.icon className="w-3.5 h-3.5 text-gold-400" strokeWidth={1.8} />
                      {sec.title}
                    </div>
                    <ArrowRight className={clsx('w-3.5 h-3.5 text-slate-500 transition-transform', filtersOpen[sec.key as keyof typeof filtersOpen] && 'rotate-90 text-gold-400')} strokeWidth={2} />
                  </button>
                  {filtersOpen[sec.key as keyof typeof filtersOpen] && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sec.items.map(it => (
                        <button
                          key={it.k}
                          onClick={() => toggleFilter(sec.key, it.k, !sec.single)}
                          className={clsx(
                            'px-2.5 py-1 rounded-md text-xs transition-all border',
                            isFilterActive(sec.key, it.k)
                              ? 'bg-gold-500/20 text-gold-400 border-gold-500/40'
                              : 'bg-space-700/40 text-slate-400 border-space-600/40 hover:border-gold-500/30 hover:text-slate-200'
                          )}
                        >
                          {it.l}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="cip-divider mt-4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: '人群规模', v: formatNumber(profile?.totalUsers || 0), sub: '样本覆盖数', icon: Users, c: 'text-gold-400' },
              { l: '男性占比', v: formatPercent(profile?.genderRatio.male || 0), sub: '女性占优' in (profile?.genderRatio || {}) ? '' : (profile && profile.genderRatio.male < 50 ? '女性占优' : '男性占优'), icon: UserCheck, c: 'text-chart-blue' },
              { l: '核心年龄段', v: '25-34岁', sub: formatPercent(profile?.ageDistribution.find(a => a.range === '25-34岁')?.ratio || 0) + ' 最高占比', icon: Sparkles, c: 'text-chart-green' },
              { l: '最强偏好', v: profile?.preferredTypes[0]?.type || '-', sub: `偏好指数 ${profile?.preferredTypes[0]?.score || 0}`, icon: Eye, c: 'text-chart-purple' },
            ].map((m, i) => (
              <div key={i} className="cip-card-hover p-4.5">
                <div className="flex items-start justify-between mb-3">
                  <div className={clsx('w-9 h-9 rounded-lg bg-space-700/50 flex items-center justify-center', m.c)}>
                    <m.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="kpi-label mb-1">{m.l}</div>
                <div className={clsx('font-mono font-bold text-xl tracking-tight', m.c)}>{m.v}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="cip-card p-5 border-gradient-gold">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  六维人群画像雷达
                </h3>
              </div>
              <ReactECharts option={radarOption} style={{ height: 280 }} />
            </div>

            <div className="cip-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-semibold text-slate-100">性别分布</h3>
              </div>
              <ReactECharts option={pieOption} style={{ height: 220 }} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-center p-2 rounded-lg bg-space-700/40">
                  <div className="text-xs text-slate-500 mb-0.5">男性</div>
                  <div className="font-mono text-chart-blue font-bold">{formatPercent(profile?.genderRatio.male || 0)}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-space-700/40">
                  <div className="text-xs text-slate-500 mb-0.5">女性</div>
                  <div className="font-mono text-chart-pink font-bold">{formatPercent(100 - (profile?.genderRatio.male || 0))}</div>
                </div>
              </div>
            </div>

            <div className="cip-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-semibold text-slate-100">年龄分布结构</h3>
              </div>
              <ReactECharts option={ageBarOption} style={{ height: 280 }} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2 cip-card p-5">
              <h3 className="font-serif font-semibold text-slate-100 mb-3">观影频次分层</h3>
              <ReactECharts option={freqBarOption} style={{ height: 240 }} />
            </div>
            <div className="lg:col-span-3 cip-card p-5">
              <h3 className="font-serif font-semibold text-slate-100 mb-3">类型偏好指数 TOP</h3>
              <ReactECharts option={typeHorizontalOption} style={{ height: 260 }} />
            </div>
          </div>

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100 flex items-center gap-2.5">
                  <GitMerge className="w-5 h-5 text-chart-purple" strokeWidth={1.8} />
                  相似影片人群迁移分析 · 桑基图
                </h3>
                <p className="text-xs text-slate-500 mt-1 ml-7.5 pl-0.5">
                  左侧：参考影片受众 &nbsp;|&nbsp; 右侧：目标/竞品影片 &nbsp;|&nbsp; 连线粗细代表迁移规模
                </p>
              </div>
              <span className="badge bg-chart-purple/15 text-chart-purple border border-chart-purple/30">
                重叠度分析
              </span>
            </div>
            <div className="h-[380px] -mx-2">
              {migration && <ReactECharts option={sankeyOption} style={{ height: '100%', width: '100%' }} />}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-space-700/40">
              {migration?.links.filter(l => l.target.endsWith('(目标)') || l.target.includes('目标')).slice(0, 4).map((l, i) => {
                const src = migration.nodes.find(n => n.id === l.source);
                const tgt = migration.nodes.find(n => n.id === l.target);
                return (
                  <div key={i} className="p-3 rounded-xl bg-space-800/40 border border-space-700/40">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="truncate">{src?.name}</span>
                      <ArrowRight className="w-3 h-3 text-chart-purple shrink-0" />
                      <span className="truncate text-gold-400 font-medium">{tgt?.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className="font-mono font-bold text-gold-400 text-lg">{formatNumber(l.value)}</span>
                      <span className="text-[10px] text-slate-500">人</span>
                    </div>
                    <div className="text-[11px] text-chart-green">重叠度 {l.overlapRatio}%</div>
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
