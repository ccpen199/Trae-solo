import { useEffect, useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp, Users, Ticket, Percent, Banknote, UserCheck,
  ArrowUpRight, ArrowDownRight, Minus, Activity, Zap, Clock,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { formatNumber, formatPercent, formatCurrency } from '@/utils/format';
import type { EChartsOption } from 'echarts';
import { clsx } from 'clsx';

type TimePeriod = 'today' | 'week' | 'month' | 'season';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  change?: number;
  unit?: string;
  highlight?: boolean;
  anomaly?: 'warn' | 'error' | null;
}

function KpiCard({ label, value, icon: Icon, change, unit, highlight, anomaly }: KpiCardProps) {
  const changeColor = change === undefined ? 'text-slate-500'
    : change > 0 ? 'text-chart-green'
    : change < 0 ? 'text-cine-400' : 'text-slate-400';
  const ChangeIcon = change === undefined ? null
    : change > 0 ? ArrowUpRight
    : change < 0 ? ArrowDownRight : Minus;

  return (
    <div className={clsx(
      'cip-card-hover p-5 relative overflow-hidden group',
      highlight && 'border-gradient-gold'
    )}>
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center',
            highlight
              ? 'bg-gradient-to-br from-gold-400/20 to-gold-600/10 text-gold-400 shadow-glow-gold'
              : 'bg-space-700/60 text-slate-400 group-hover:text-gold-400 group-hover:bg-gold-500/10 transition-colors'
          )}>
            <Icon className="w-5.5 h-5.5" strokeWidth={1.8} />
          </div>
          <div className="flex items-center gap-1.5">
            {anomaly && (
              <span className={clsx(
                'badge text-[10px]',
                anomaly === 'error' ? 'badge-warn' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
              )}>
                {anomaly === 'error' ? '🚨异常波动' : '⚠️数据波动'}
              </span>
            )}
            {change !== undefined && ChangeIcon && (
              <div className={clsx('flex items-center gap-0.5 text-xs font-medium', changeColor)}>
                <ChangeIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="kpi-label mb-1.5">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className={clsx(highlight ? 'kpi-value text-3xl' : 'kpi-value text-2xl')}>
            {value}
          </span>
          {unit && <span className="text-xs text-slate-500">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

const PERIOD_CONFIG: Record<TimePeriod, {
  kpiLabels: [string, string, string];
  chartTitle: string;
  chartSubtitle: string;
  xLabels: string[];
  multiplier: number;
  seriesNames: [string, string, string];
  rankingTitle: string;
  rankingSubtitle: string;
  rowBoxOfficeLabel: string;
  rowTotalPrefix: string;
  pieTitle: string;
  pieSubtitle: string;
  miniBoxOfficeLabel: string;
  changeMaxPp: number;
}> = {
  today: {
    kpiLabels: ['当日实时票房', '当日观影人次', '当日总场次'],
    chartTitle: '24小时票房分时走势',
    chartSubtitle: '今日票房 vs 上月同期 vs 影史同期参考',
    xLabels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    multiplier: 1,
    seriesNames: ['今日票房', '上月同期', '影史同期'],
    rankingTitle: '实时票房排行 TOP10',
    rankingSubtitle: '档期热度榜 · 秒级刷新 · 涨跌指示',
    rowBoxOfficeLabel: '当日票房',
    rowTotalPrefix: '累计',
    pieTitle: '当日票房分布',
    pieSubtitle: 'TOP6影片当日票房占比',
    miniBoxOfficeLabel: '当日',
    changeMaxPp: 5,
  },
  week: {
    kpiLabels: ['本周累计票房', '本周观影人次', '本周总场次'],
    chartTitle: '本周每日票房走势',
    chartSubtitle: '本周每日 vs 上周同期 vs 影史同期参考',
    xLabels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    multiplier: 12,
    seriesNames: ['本周票房', '上周同期', '影史同期'],
    rankingTitle: '本周影片票房排行 TOP10',
    rankingSubtitle: '本周累计排行 · 含昨日预估',
    rowBoxOfficeLabel: '本周票房',
    rowTotalPrefix: '本周累计',
    pieTitle: '本周票房分布',
    pieSubtitle: 'TOP6影片本周票房占比',
    miniBoxOfficeLabel: '本周',
    changeMaxPp: 3,
  },
  month: {
    kpiLabels: ['本月累计票房', '本月观影人次', '本月总场次'],
    chartTitle: '本月每日票房走势',
    chartSubtitle: '本月每日 vs 去年同期 vs 影史同期参考',
    xLabels: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
    multiplier: 50,
    seriesNames: ['本月票房', '去年同期', '影史同期'],
    rankingTitle: '本月影片票房排行 TOP10',
    rankingSubtitle: '本月累计排行 · 可追溯历史数据',
    rowBoxOfficeLabel: '本月票房',
    rowTotalPrefix: '本月累计',
    pieTitle: '本月票房分布',
    pieSubtitle: 'TOP6影片本月票房占比',
    miniBoxOfficeLabel: '本月',
    changeMaxPp: 2,
  },
  season: {
    kpiLabels: ['档期累计票房', '档期观影人次', '档期总场次'],
    chartTitle: '2026暑期档每日票房走势',
    chartSubtitle: '2026暑期档 vs 2025暑期档 vs 历史同期参考',
    xLabels: (() => {
      const labels: string[] = [];
      for (let m = 6; m <= 8; m++) {
        const days = m === 8 ? 31 : 30;
        for (let d = 1; d <= days; d++) {
          labels.push(`${m}.${d}`);
        }
      }
      return labels;
    })(),
    multiplier: 500,
    seriesNames: ['2026暑期档', '2025暑期档', '历史同期'],
    rankingTitle: '暑期档影片票房排行 TOP10',
    rankingSubtitle: '档期累计排行 · 实时更新',
    rowBoxOfficeLabel: '档期票房',
    rowTotalPrefix: '档期累计',
    pieTitle: '档期票房分布',
    pieSubtitle: 'TOP6影片档期票房占比',
    miniBoxOfficeLabel: '档期',
    changeMaxPp: 1.5,
  },
};

function generateTrendForPeriod(period: TimePeriod) {
  const config = PERIOD_CONFIG[period];
  const { xLabels, multiplier } = config;

  const genSeries = (baseFactor: number) => xLabels.map((_, i) => {
    let hourFactor = 1;
    if (period === 'today') {
      const h = i;
      hourFactor = Math.max(0, Math.sin((h - 8) * Math.PI / 14)) * 0.9 + 0.1;
    } else if (period === 'week') {
      hourFactor = i >= 5 ? 1.6 : 1;
    } else if (period === 'month') {
      const weekday = i % 7;
      hourFactor = weekday >= 5 ? 1.4 : 1;
    } else {
      hourFactor = i > 20 ? 1.3 : 0.85 + Math.random() * 0.3;
    }
    return Math.round((800 + Math.random() * 2700) * hourFactor * multiplier * baseFactor);
  });

  return {
    xLabels,
    series: [
      genSeries(1),
      genSeries(0.9 + Math.random() * 0.15),
      genSeries(0.8 + Math.random() * 0.2),
    ],
  };
}

function stabilize(current: number, prev: number | null): number {
  if (prev === null) return current;
  const ratio = (current - prev) / Math.max(Math.abs(prev), 1);
  const clamped = Math.max(-0.08, Math.min(0.08, ratio));
  const adjusted = prev * (1 + clamped);
  return Math.round(prev + (adjusted - prev) * 0.3);
}

function stabilizeChange(prev: number | null, raw: number, maxPp: number): number {
  if (prev === null) return raw;
  const diff = raw - prev;
  const clampedDiff = Math.max(-maxPp, Math.min(maxPp, diff));
  const target = prev + clampedDiff;
  return +(prev + (target - prev) * 0.4).toFixed(1);
}

function detectAnomaly(current: number, prev: number | null): 'warn' | 'error' | null {
  if (prev === null || prev === 0) return null;
  const ratio = Math.abs((current - prev) / prev);
  if (ratio > 0.10) return 'error';
  if (ratio > 0.05) return 'warn';
  return null;
}

export default function Dashboard() {
  const { boxOffice, ranking, pipelines, refreshAll } = useAppStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');

  const prevKpiRef = useRef<{
    totalBoxOffice: number | null;
    totalAudience: number | null;
    totalShowCount: number | null;
  }>({ totalBoxOffice: null, totalAudience: null, totalShowCount: null });

  const prevTrendRef = useRef<number[] | null>(null);

  const prevChangeRef = useRef<{
    boxOfficeChange: number | null;
    audienceChange: number | null;
    showCountChange: number | null;
    occupancyChange: number | null;
    perShowChange: number | null;
    ticketPriceChange: number | null;
  }>({
    boxOfficeChange: null,
    audienceChange: null,
    showCountChange: null,
    occupancyChange: null,
    perShowChange: null,
    ticketPriceChange: null,
  });

  const config = PERIOD_CONFIG[timePeriod];
  const multiplier = config.multiplier;
  const changeMaxPp = config.changeMaxPp;

  const stabilizedKpi = useMemo(() => {
    const raw = {
      totalBoxOffice: (boxOffice?.totalBoxOffice || 38000) * multiplier,
      totalAudience: (boxOffice?.totalAudience || 3500000) * multiplier * 0.8,
      totalShowCount: (boxOffice?.totalShowCount || 450000) * multiplier * 0.6,
    };

    const result = {
      totalBoxOffice: stabilize(raw.totalBoxOffice, prevKpiRef.current.totalBoxOffice),
      totalAudience: stabilize(raw.totalAudience, prevKpiRef.current.totalAudience),
      totalShowCount: stabilize(raw.totalShowCount, prevKpiRef.current.totalShowCount),
    };

    prevKpiRef.current = {
      totalBoxOffice: result.totalBoxOffice,
      totalAudience: result.totalAudience,
      totalShowCount: result.totalShowCount,
    };

    return result;
  }, [boxOffice, multiplier]);

  const stabilizedChanges = useMemo(() => {
    const rawBoxOfficeChange = boxOffice?.boxOfficeChange ?? -2.5;
    const rawAudienceChange = 3.2;
    const rawShowCountChange = 1.8;
    const rawOccupancyChange = -0.5;
    const rawPerShowChange = 2.1;
    const rawTicketPriceChange = 0.9;

    const pc = prevChangeRef.current;
    const result = {
      boxOfficeChange: stabilizeChange(pc.boxOfficeChange, rawBoxOfficeChange, changeMaxPp),
      audienceChange: stabilizeChange(pc.audienceChange, rawAudienceChange, changeMaxPp),
      showCountChange: stabilizeChange(pc.showCountChange, rawShowCountChange, changeMaxPp),
      occupancyChange: stabilizeChange(pc.occupancyChange, rawOccupancyChange, changeMaxPp),
      perShowChange: stabilizeChange(pc.perShowChange, rawPerShowChange, changeMaxPp),
      ticketPriceChange: stabilizeChange(pc.ticketPriceChange, rawTicketPriceChange, changeMaxPp),
    };

    prevChangeRef.current = { ...result };

    return result;
  }, [boxOffice, changeMaxPp]);

  const anomalies = useMemo(() => ({
    totalBoxOffice: detectAnomaly(stabilizedKpi.totalBoxOffice, prevKpiRef.current.totalBoxOffice),
    totalAudience: detectAnomaly(stabilizedKpi.totalAudience, prevKpiRef.current.totalAudience),
    totalShowCount: detectAnomaly(stabilizedKpi.totalShowCount, prevKpiRef.current.totalShowCount),
  }), [stabilizedKpi]);

  const trendData = useMemo(() => generateTrendForPeriod(timePeriod), [timePeriod]);

  const trendSeries = useMemo(() => {
    const current = trendData.series[0];
    if (!prevTrendRef.current || prevTrendRef.current.length !== current.length) {
      prevTrendRef.current = [...current];
      return trendData.series;
    }
    const stabilized = current.map((v, i) => stabilize(v, prevTrendRef.current![i]));
    prevTrendRef.current = [...stabilized];
    return [stabilized, trendData.series[1], trendData.series[2]];
  }, [trendData]);

  useEffect(() => {
    refreshAll();
    const t = setInterval(refreshAll, 15000);
    return () => clearInterval(t);
  }, [refreshAll]);

  useEffect(() => {
    prevKpiRef.current = { totalBoxOffice: null, totalAudience: null, totalShowCount: null };
    prevTrendRef.current = null;
    prevChangeRef.current = {
      boxOfficeChange: null,
      audienceChange: null,
      showCountChange: null,
      occupancyChange: null,
      perShowChange: null,
      ticketPriceChange: null,
    };
  }, [timePeriod]);

  const trendOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      borderWidth: 1,
      textStyle: { color: '#cbd5e1', fontSize: 12 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; seriesName: string; value: number }>;
        let s = `<div style="font-weight:600;margin-bottom:6px;color:#e2bc30">${arr[0]?.axisValue}</div>`;
        arr.forEach(p => {
          const dot = p.seriesName === config.seriesNames[0] ? '#D4AF37'
            : p.seriesName === config.seriesNames[2] ? '#64748b' : '#3B82F6';
          s += `<div style="display:flex;justify-content:space-between;gap:32px;margin:3px 0">
            <span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dot};margin-right:6px"></span>${p.seriesName}</span>
            <span style="font-family:JetBrains Mono;font-weight:600">${formatCurrency(p.value)}</span>
          </div>`;
        });
        return s;
      },
    },
    legend: {
      data: config.seriesNames,
      right: 0,
      top: 0,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      icon: 'roundRect',
      itemWidth: 12, itemHeight: 4,
    },
    grid: { left: 8, right: 8, top: 40, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.xLabels,
      axisLine: { lineStyle: { color: '#1A2A47' } },
      axisLabel: {
        color: '#64748b',
        fontSize: 10,
        interval: timePeriod === 'season' ? 15 : timePeriod === 'month' ? 4 : timePeriod === 'week' ? 0 : 1,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, formatter: (v: number) => formatNumber(v) },
      splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.5)', type: 'dashed' } },
    },
    series: [
      {
        name: config.seriesNames[0], type: 'line', smooth: true, symbol: 'none',
        lineStyle: { color: '#D4AF37', width: 3, shadowColor: 'rgba(212,175,55,0.4)', shadowBlur: 12 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212, 175, 55, 0.35)' },
              { offset: 1, color: 'rgba(212, 175, 55, 0.005)' },
            ],
          },
        },
        data: trendSeries[0],
      },
      {
        name: config.seriesNames[1], type: 'line', smooth: true, symbol: 'none',
        lineStyle: { color: '#3B82F6', width: 1.5, type: 'dashed', opacity: 0.7 },
        data: trendSeries[1],
      },
      {
        name: config.seriesNames[2], type: 'line', smooth: true, symbol: 'none',
        lineStyle: { color: '#475569', width: 1.2, type: 'dotted', opacity: 0.8 },
        data: trendSeries[2],
      },
    ],
  };

  const rankPieOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#cbd5e1', fontSize: 12 },
      formatter: '{b}: {d}%',
    },
    series: [{
      type: 'pie', radius: ['58%', '80%'], center: ['50%', '50%'],
      avoidLabelOverlap: true, itemStyle: { borderColor: '#0A1628', borderWidth: 2 },
      label: { show: false },
      data: ranking.slice(0, 6).map((r, i) => ({
        name: r.filmName,
        value: r.boxOffice,
        itemStyle: {
          color: ['#D4AF37', '#C0392B', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][i],
        },
      })),
    }],
  };

  const periodButtons: { key: TimePeriod; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'season', label: '档期' },
  ];

  const getPipelineImpact = (errorCount24h: number) => {
    if (errorCount24h > 5) {
      return {
        text: `影响：可能存在约 ±${(errorCount24h * 0.5).toFixed(1)}% 数据偏差`,
        className: 'text-cine-400',
      };
    }
    if (errorCount24h > 0) {
      return {
        text: `影响：约 ±${(errorCount24h * 0.3).toFixed(1)}% 轻微偏差`,
        className: 'text-yellow-400',
      };
    }
    return {
      text: '数据完整度 100%',
      className: 'text-chart-green',
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-gold-500 font-medium tracking-widest uppercase mb-1.5">Cinema Intelligence Dashboard</div>
          <h1 className="font-serif text-3xl font-bold text-white">
            <span className="text-gradient-gold">中国电影市场</span> · 实时数据大屏
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">秒级票房采集管道 · 多维度数据交叉分析 · 智能决策支持引擎</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-space-800/50 border border-space-700/50">
            <div className="w-2 h-2 rounded-full bg-chart-green animate-pulse" />
            <span className="text-xs text-chart-green font-medium">3 路管道正常运行</span>
          </div>
          <div className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-space-800/50 border border-space-700/50">
            <Zap className="w-3.5 h-3.5 text-gold-400" strokeWidth={2} />
            <span className="text-xs text-slate-300 font-mono">延迟 247ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label={config.kpiLabels[0]}
          value={formatNumber(stabilizedKpi.totalBoxOffice, 1)}
          icon={Banknote}
          change={stabilizedChanges.boxOfficeChange}
          unit="万元"
          highlight
          anomaly={anomalies.totalBoxOffice}
        />
        <KpiCard
          label={config.kpiLabels[1]}
          value={formatNumber(stabilizedKpi.totalAudience)}
          icon={Users}
          change={stabilizedChanges.audienceChange}
          unit="人"
          anomaly={anomalies.totalAudience}
        />
        <KpiCard
          label={config.kpiLabels[2]}
          value={formatNumber(stabilizedKpi.totalShowCount)}
          icon={Ticket}
          change={stabilizedChanges.showCountChange}
          unit="场"
          anomaly={anomalies.totalShowCount}
        />
        <KpiCard label="平均上座率" value={formatPercent(boxOffice?.avgOccupancy || 0)} icon={Percent} change={stabilizedChanges.occupancyChange} />
        <KpiCard label="场均人次" value={String(boxOffice?.perShowAudience || 0)} icon={UserCheck} change={stabilizedChanges.perShowChange} unit="人/场" />
        <KpiCard label="平均票价" value={`¥${boxOffice?.avgTicketPrice?.toFixed(1) || '0'}`} icon={TrendingUp} unit="元" change={stabilizedChanges.ticketPriceChange} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 cip-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-100">{config.chartTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{config.chartSubtitle}</p>
            </div>
            <div className="flex gap-2">
              {periodButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setTimePeriod(btn.key)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    timePeriod === btn.key
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
          <ReactECharts option={trendOption} style={{ height: 340 }} />
        </div>

        <div className="cip-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-100">{config.pieTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{config.pieSubtitle}</p>
            </div>
          </div>
          <div className="flex-1">
            <ReactECharts option={rankPieOption} style={{ height: 200 }} />
          </div>
          <div className="space-y-2 mt-2">
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.filmId} className="flex items-center gap-3 text-sm">
                <span className={clsx(
                  'w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold',
                  i === 0 ? 'bg-gold-500 text-space-950'
                    : i === 1 ? 'bg-slate-400 text-space-950'
                    : i === 2 ? 'bg-amber-700 text-white'
                    : 'bg-space-700 text-slate-400'
                )}>{r.rank}</span>
                <span className="flex-1 text-slate-300 truncate">{r.filmName}</span>
                <span className="font-mono text-gold-400 text-xs font-medium">{formatNumber(r.boxOffice)}万</span>
                <span className="text-[10px] text-slate-500 w-8 text-right">{config.miniBoxOfficeLabel}</span>
                <span className="w-16 text-right">
                  <div className="h-1.5 rounded-full bg-space-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400"
                      style={{ width: `${r.boxOfficeRatio * 3.5}%` }}
                    />
                  </div>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 cip-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-lg font-semibold text-slate-100">{config.rankingTitle}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{config.rankingSubtitle}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>票房占比</span>
              <span>排片占比</span>
              <span>上座率</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {ranking.slice(0, 10).map((r, i) => (
              <div key={r.filmId} className="group flex items-center gap-4 p-3 rounded-xl bg-space-800/30 hover:bg-space-700/30 border border-transparent hover:border-space-600/40 transition-all">
                <div className="flex items-center gap-3 w-52 shrink-0">
                  <span className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm',
                    i === 0 ? 'bg-gradient-to-br from-gold-300 to-gold-600 text-space-950 shadow-glow-gold'
                      : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-space-950'
                      : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                      : 'bg-space-700 text-slate-400'
                  )}>
                    {r.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-200 truncate group-hover:text-gold-400 transition-colors">{r.filmName}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      {r.changeIndicator === 'up' && <span className="text-chart-green flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" strokeWidth={3} />+{r.changeValue}</span>}
                      {r.changeIndicator === 'down' && <span className="text-cine-400 flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" strokeWidth={3} />-{r.changeValue}</span>}
                      {r.changeIndicator === 'flat' && <span className="text-slate-500 flex items-center gap-0.5"><Minus className="w-3 h-3" strokeWidth={3} />持平</span>}
                      <span>{config.rowTotalPrefix} {formatNumber(r.totalBoxOffice)}万</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-6 items-center">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">{r.boxOfficeRatio.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-space-700 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400" style={{ width: `${r.boxOfficeRatio * 4}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">{r.showCountRatio.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-space-700 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-chart-blue to-chart-cyan" style={{ width: `${r.showCountRatio * 4.5}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={r.occupancy > 50 ? 'text-chart-green' : r.occupancy > 35 ? 'text-chart-orange' : 'text-slate-400'}>
                        {r.occupancy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-space-700 overflow-hidden">
                      <div className={clsx(
                        'h-full rounded-full',
                        r.occupancy > 50 ? 'bg-gradient-to-r from-chart-green to-emerald-400'
                          : r.occupancy > 35 ? 'bg-gradient-to-r from-chart-orange to-amber-400'
                          : 'bg-gradient-to-r from-slate-500 to-slate-400'
                      )} style={{ width: `${r.occupancy}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 w-28">
                  <div className="font-mono font-bold text-gold-400">{formatNumber(r.boxOffice)}<span className="text-xs text-gold-500/70 ml-0.5">万</span></div>
                  <div className="text-[11px] text-slate-500">{config.rowBoxOfficeLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-green/20 to-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5 text-chart-green" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-100">数据采集管道</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">猫眼票务 Webhook · 实时监控</p>
                </div>
              </div>
              <span className="badge badge-online">3路在线</span>
            </div>
            <div className="space-y-3">
              {pipelines.map(p => {
                const impact = getPipelineImpact(p.errorCount24h);
                return (
                  <div key={p.webhookName} className="p-3.5 rounded-xl bg-space-800/40 border border-space-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'w-2 h-2 rounded-full',
                          p.status === 'online' ? 'bg-chart-green animate-pulse' : 'bg-chart-orange'
                        )} />
                        <span className="text-sm font-medium text-slate-200">{p.webhookName}</span>
                      </div>
                      <span className={clsx('badge text-[10px]', p.status === 'online' ? 'badge-online' : 'badge-warn')}>
                        {p.status === 'online' ? '正常' : '降级'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={1.8} />延迟</div>
                        <div className="font-mono text-slate-300 mt-0.5">{p.latencyMs} ms</div>
                      </div>
                      <div>
                        <div className="text-slate-500 flex items-center gap-1"><Zap className="w-3 h-3" strokeWidth={1.8} />吞吐</div>
                        <div className="font-mono text-slate-300 mt-0.5">{p.eventsPerSecond}/s</div>
                      </div>
                      <div>
                        <div className="text-slate-500">24h异常</div>
                        <div className={clsx('font-mono mt-0.5', p.errorCount24h > 5 ? 'text-cine-400' : 'text-chart-green')}>{p.errorCount24h} 次</div>
                      </div>
                    </div>
                    <div className={clsx('text-[11px] mt-2', impact.className)}>
                      {impact.text}
                    </div>
                  </div>
                );
              })}
              {pipelines.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">加载中...</div>
              )}
            </div>
          </div>

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chart-purple/20 to-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5 text-chart-purple" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-100">档期热度指数</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">2026暑期档 · 实时供需热度</p>
                </div>
              </div>
            </div>
            <div className="space-y-3.5">
              {[
                { name: '暑期档总票房预测', value: 92, bar: 158, unit: '亿元', trend: '+12.5%' },
                { name: 'TOP3影片集中度', value: 68, bar: 68, unit: '%', trend: '+2.1pp' },
                { name: '平均宣发投入指数', value: 78, bar: 78, unit: '', trend: '中高' },
                { name: '用户观影意愿热度', value: 86, bar: 86, unit: '', trend: '+5.3%' },
                { name: '院线排片信心指数', value: 81, bar: 81, unit: '', trend: '+3.8%' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-200">{item.bar}{item.unit}</span>
                      <span className="text-chart-green flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" strokeWidth={3} />{item.trend}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-space-700 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.value}%`,
                        background: `linear-gradient(90deg, #8B5CF6, #D4AF37 ${item.value}%)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
