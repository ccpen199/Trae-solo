import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  MapPin, Building, Armchair, ChevronRight, Search, Flame, Filter,
  ArrowUpDown, TrendingUp, Star, Clock,
} from 'lucide-react';
import type { CityHeatmapItem, TheaterHeatmapItem, ScreenHeatmap } from 'shared/types';
import { formatNumber, formatPercent } from '@/utils/format';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { clsx } from 'clsx';

export default function OccupancyHeatmap() {
  const [drillLevel, setDrillLevel] = useState<0 | 1 | 2>(0);
  const [selectedCity, setSelectedCity] = useState<CityHeatmapItem | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<TheaterHeatmapItem | null>(null);
  const [cities, setCities] = useState<CityHeatmapItem[]>([]);
  const [theaters, setTheaters] = useState<TheaterHeatmapItem[]>([]);
  const [screens, setScreens] = useState<ScreenHeatmap[]>([]);
  const [viewMode, setViewMode] = useState<'weekday' | 'weekend'>('weekend');

  useEffect(() => {
    fetch('/api/heatmap/cities').then(r => r.json()).then(j => setCities(j.data));
  }, []);

  const loadTheaters = (cityCode: string) => {
    fetch(`/api/heatmap/theaters?cityCode=${cityCode}`).then(r => r.json()).then(j => setTheaters(j.data));
  };
  const loadScreens = () => {
    fetch('/api/heatmap/screen').then(r => r.json()).then(j => setScreens(j.data));
  };

  const handleCityClick = (city: CityHeatmapItem) => {
    setSelectedCity(city);
    loadTheaters(city.cityCode);
    setDrillLevel(1);
  };
  const handleTheaterClick = (t: TheaterHeatmapItem) => {
    setSelectedTheater(t);
    loadScreens();
    setDrillLevel(2);
  };

  const scatterData: [number, number, number, string][] = cities.map(c => [c.lng, c.lat, c.occupancy, c.cityName]);
  const maxOcc = Math.max(...cities.map(c => c.occupancy), 1);

  const mapOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1', fontSize: 12 },
      formatter: (p: unknown) => {
        const d = p as { data: [number, number, number, string] };
        if (!d?.data) return '';
        const [, , occ, name] = d.data;
        const city = cities.find(c => c.cityName === name);
        return `<div style="font-weight:600;color:#e2bc30;margin-bottom:6px">${name}</div>
          <div>平均上座率：<b style="color:#10B981">${occ?.toFixed(1)}%</b></div>
          <div>当日票房贡献：<b style="font-family:JetBrains Mono">${formatNumber(city?.boxOffice || 0)}万</b></div>
          <div style="color:#64748b;font-size:10px;margin-top:4px">点击进入影院维度</div>`;
      },
    },
    geo: {
      map: 'china', roam: true, zoom: 1.2, center: [104.5, 36],
      itemStyle: { areaColor: '#0F1B30', borderColor: '#1E3A5F', borderWidth: 0.8 },
      emphasis: { itemStyle: { areaColor: '#1A2F55', borderColor: '#D4AF37' }, label: { show: false } },
    },
    visualMap: {
      min: 20, max: 70, left: 12, bottom: 12, calculable: true, itemWidth: 10, itemHeight: 110,
      text: ['高', '低'], textStyle: { color: '#94a3b8', fontSize: 10 },
      inRange: { color: ['#1E3A5F', '#3B82F6', '#10B981', '#F59E0B', '#C0392B', '#D4AF37'] },
    },
    series: [{
      type: 'effectScatter', coordinateSystem: 'geo', rippleEffect: { period: 3.5, scale: 3.8, brushType: 'stroke' },
      symbolSize: (val: [number, number, number]) => 6 + (val[2] / maxOcc) * 22,
      itemStyle: {
        color: (p: unknown) => {
          const d = p as { value: [number, number, number] };
          const v = d.value[2];
          return v > 60 ? '#C0392B' : v > 50 ? '#F59E0B' : v > 40 ? '#10B981' : '#3B82F6';
        },
        shadowBlur: 14, shadowColor: 'rgba(212,175,55,0.5)',
      },
      label: { show: true, position: 'right', formatter: (p: unknown) => (p as { data: [number, number, number, string] }).data[3], color: '#cbd5e1', fontSize: 10 },
      data: scatterData,
      onClick: (params: unknown) => {
        const d = params as { data: [number, number, number, string] };
        const city = cities.find(c => c.cityName === d?.data?.[3]);
        if (city) handleCityClick(city);
      },
    } as never],
  };

  const timeSlots = ['09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];
  const heatmapData: [number, number, number][] = [];
  screens.forEach((s, si) => {
    s.timeMatrix.forEach((t, ti) => {
      const v = viewMode === 'weekday' ? t.weekdayOccupancy : t.weekendOccupancy;
      heatmapData.push([ti, si, +v.toFixed(1)]);
    });
  });

  const screenHeatmapOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top', backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1', fontSize: 12 },
      formatter: (p: unknown) => {
        const d = p as { data: [number, number, number], name: string };
        const sIdx = d.data[1];
        const tIdx = d.data[0];
        const screen = screens[sIdx];
        const slot = screen?.timeMatrix[tIdx];
        return `<div style="font-weight:600;color:#e2bc30">${screen?.screenName}</div>
          <div>时段：${slot?.timeSlot}</div>
          <div>工作日：<b style="color:#3B82F6">${slot?.weekdayOccupancy}%</b></div>
          <div>周末：<b style="color:#10B981">${slot?.weekendOccupancy}%</b></div>
          ${slot && (viewMode === 'weekday' ? slot.weekdayOccupancy : slot.weekendOccupancy) >= 60 ? '<div style="color:#F59E0B;margin-top:4px;font-size:11px">🌟 黄金场次</div>' : ''}`;
      },
    },
    grid: { left: 90, right: 24, top: 10, bottom: 40 },
    xAxis: {
      type: 'category', data: timeSlots, splitArea: { show: true },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1A2A47' } }, axisTick: { show: false },
    },
    yAxis: {
      type: 'category', data: screens.map(s => s.screenName), splitArea: { show: true },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1A2A47' } }, axisTick: { show: false },
    },
    visualMap: {
      min: 10, max: 95, show: true, orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: '#94a3b8', fontSize: 10 }, itemWidth: 10, itemHeight: 120,
      inRange: { color: ['#0F1B30', '#1E3A5F', '#3B82F6', '#10B981', '#F59E0B', '#C0392B', '#D4AF37'] },
      calculable: true,
    },
    series: [{
      name: '上座率', type: 'heatmap', data: heatmapData,
      label: { show: true, color: '#fff', fontSize: 10, formatter: (p: unknown) => `${(p as { data: [number, number, number] }).data[2]}%` },
      emphasis: { itemStyle: { borderColor: '#D4AF37', borderWidth: 2, shadowBlur: 12, shadowColor: 'rgba(212,175,55,0.5)' } },
    }],
  };

  const hourlyData: number[] = selectedTheater
    ? (Object.entries(selectedTheater.hourlyOccupancy) as [string, number][]).map(([, v]) => v)
    : [];
  const hours = selectedTheater ? Object.keys(selectedTheater.hourlyOccupancy) : [];
  const hourlyOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(10,22,40,0.95)', borderColor: 'rgba(212,175,55,0.3)', textStyle: { color: '#cbd5e1' } },
    grid: { left: 4, right: 12, top: 12, bottom: 20, containLabel: true },
    xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1A2A47' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
    yAxis: { type: 'value', max: 100, axisLine: { show: false }, axisLabel: { color: '#64748b', fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: 'rgba(26, 42, 71, 0.5)', type: 'dashed' } } },
    series: [{
      type: 'bar', data: hourlyData, barWidth: '55%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (p: unknown) => {
          const v = (p as { value: number }).value;
          return v > 60 ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#E2BC30' }, { offset: 1, color: '#95751B' }])
            : v > 40 ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#10B981' }, { offset: 1, color: '#059669' }])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#3B82F6' }, { offset: 1, color: '#1D4ED8' }]);
        },
      },
    } as never],
  };

  const citiesSortDesc = [...cities].sort((a, b) => b.occupancy - a.occupancy);
  const goldenCount = screens.reduce((acc, s) => acc + s.goldenShows.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-gold-500 font-medium tracking-widest uppercase mb-1.5">Occupancy Heatmap Analytics</div>
          <h1 className="font-serif text-3xl font-bold text-slate-100">
            <span className="text-gradient-gold">上座率热力图</span> · 多维下钻
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">全国城市 → 影院 → 影厅/时段三级下钻分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 rounded-xl bg-space-800/50 border border-space-700/50 p-1">
            {[
              { k: 'weekday', l: '工作日' },
              { k: 'weekend', l: '周末' },
            ].map(o => (
              <button
                key={o.k}
                onClick={() => setViewMode(o.k as 'weekday' | 'weekend')}
                className={clsx(
                  'px-4 rounded-lg text-sm font-medium transition-all',
                  viewMode === o.k ? 'bg-gold-500/20 text-gold-400 shadow-inner' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
            <input placeholder="搜索城市/影院..." className="w-56 h-10 pl-10 pr-4 rounded-xl bg-space-800/50 border border-space-700/50 text-sm placeholder:text-slate-500 focus:outline-none focus:border-gold-500/40 transition-all" />
          </div>
          <button className="btn-secondary flex items-center gap-1.5 h-10">
            <Filter className="w-4 h-4" />筛选
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-500">当前路径：</span>
        <button
          onClick={() => setDrillLevel(0)}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors', drillLevel === 0 ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:text-slate-200 hover:bg-space-700/40')}
        >
          <MapPin className="w-3.5 h-3.5" />全国城市视图
        </button>
        {drillLevel >= 1 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-space-600" />
            <button
              onClick={() => setDrillLevel(1)}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors', drillLevel === 1 ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:text-slate-200 hover:bg-space-700/40')}
            >
              <Building className="w-3.5 h-3.5" />{selectedCity?.cityName || '-'} · 影院列表
            </button>
          </>
        )}
        {drillLevel >= 2 && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-space-600" />
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-400">
              <Armchair className="w-3.5 h-3.5" />{selectedTheater?.theaterName || '-'} · 影厅时段
            </span>
          </>
        )}
      </div>

      {drillLevel === 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-3 cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100">全国城市上座率热力图</h3>
                <p className="text-xs text-slate-500 mt-0.5">点击任意城市气泡进入影院维度下钻</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-chart-green">
                <MapPin className="w-3.5 h-3.5" />已覆盖 {cities.length} 个城市
              </span>
            </div>
            <div className="h-[520px] -mx-2">
              <ChinaMapInitializer />
              <ReactECharts option={mapOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </div>
          <div className="cip-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-semibold text-slate-100 flex items-center gap-2">
                <Flame className="w-4 h-4 text-cine-400" />上座率TOP城市
              </h3>
              <button className="text-xs text-slate-500 flex items-center gap-1 hover:text-gold-400">
                <ArrowUpDown className="w-3 h-3" />排序
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
              {citiesSortDesc.slice(0, 20).map((c, i) => (
                <button
                  key={c.cityCode}
                  onClick={() => handleCityClick(c)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-space-800/30 hover:bg-gold-500/10 border border-transparent hover:border-gold-500/30 transition-all group text-left"
                >
                  <span className={clsx(
                    'w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold',
                    i === 0 ? 'bg-cine-500 text-white' : i < 3 ? 'bg-gold-500/30 text-gold-400' : 'bg-space-700 text-slate-400'
                  )}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-gold-400 transition-colors">
                      {c.cityName}
                      <span className="ml-1.5 text-[10px] text-slate-500">{c.province}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">票房贡献 {formatNumber(c.boxOffice)}万</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={clsx(
                      'font-mono font-bold text-sm',
                      c.occupancy > 55 ? 'text-cine-400' : c.occupancy > 45 ? 'text-chart-orange' : c.occupancy > 35 ? 'text-chart-green' : 'text-slate-400'
                    )}>{formatPercent(c.occupancy)}</div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-gold-400 ml-auto mt-0.5" strokeWidth={2} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {drillLevel === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-1 space-y-4">
            <div className="cip-card p-5 border-gradient-gold">
              <div className="kpi-label mb-2">{selectedCity?.cityName} · 核心指标</div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">平均上座率</span>
                    <span className="font-mono text-chart-green">{selectedCity?.occupancy.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-space-700 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-chart-green to-emerald-400" style={{ width: `${selectedCity?.occupancy}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="kpi-label mb-1">票房贡献</div>
                    <div className="kpi-value text-lg">{formatNumber(selectedCity?.boxOffice || 0)}<span className="text-xs text-gold-500/70">万</span></div>
                  </div>
                  <div>
                    <div className="kpi-label mb-1">影院数量</div>
                    <div className="kpi-value text-lg">{theaters.length}<span className="text-xs text-gold-500/70 ml-1">家</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="cip-card p-5">
              <h3 className="font-serif text-base font-semibold text-slate-100 mb-4">影院分时上座率</h3>
              <ReactECharts option={hourlyOption} style={{ height: 180 }} />
            </div>
          </div>

          <div className="xl:col-span-3 cip-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100">
                  {selectedCity?.cityName} · 影院经营表现排行
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">点击任意影院进入影厅时段热力分析</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-chart-green">
                <Building className="w-3.5 h-3.5" />共 {theaters.length} 家影院
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
              {theaters.map(t => (
                <button
                  key={t.theaterId}
                  onClick={() => handleTheaterClick(t)}
                  className="text-left p-4 rounded-xl bg-space-800/40 border border-space-700/40 hover:border-gold-500/40 hover:shadow-glow-gold transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-blue/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                        <Building className="w-4.5 h-4.5 text-chart-blue" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-200 group-hover:text-gold-400 truncate">{t.theaterName}</span>
                          <span className="badge badge-online shrink-0">No.{t.rankInCity}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{t.address}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-gold-400 shrink-0" strokeWidth={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div className="p-2 rounded-lg bg-space-700/40">
                      <div className="text-slate-500 mb-0.5">影厅数</div>
                      <div className="font-mono text-slate-200 font-bold">{t.totalScreens}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-space-700/40">
                      <div className="text-slate-500 mb-0.5">当日票房</div>
                      <div className="font-mono text-gold-400 font-bold">{formatNumber(t.totalBoxOffice)}万</div>
                    </div>
                    <div className="p-2 rounded-lg bg-space-700/40">
                      <div className="text-slate-500 mb-0.5">平均上座率</div>
                      <div className={clsx('font-mono font-bold',
                        t.avgOccupancy > 55 ? 'text-cine-400' : t.avgOccupancy > 40 ? 'text-chart-orange' : 'text-chart-green')}>
                        {formatPercent(t.avgOccupancy)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(Object.entries(t.hourlyOccupancy) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, v]) => (
                      <span key={h} className={clsx(
                        'inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md',
                        v >= 55 ? 'bg-cine-500/15 text-cine-400 border border-cine-500/30' :
                        v >= 40 ? 'bg-chart-orange/15 text-chart-orange border border-chart-orange/30' :
                        'bg-space-700 text-slate-400'
                      )}>
                        <Clock className="w-2.5 h-2.5" />{h} {v.toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {drillLevel === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="cip-card-hover p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4.5 h-4.5 text-chart-blue" />
                <span className="kpi-label">影院</span>
              </div>
              <div className="text-base font-semibold text-slate-200 truncate">{selectedTheater?.theaterName}</div>
              <div className="text-xs text-slate-500 mt-1 truncate">{selectedTheater?.address}</div>
            </div>
            <div className="cip-card-hover p-5">
              <div className="flex items-center gap-2 mb-3">
                <Armchair className="w-4.5 h-4.5 text-gold-400" />
                <span className="kpi-label">影厅数量</span>
              </div>
              <div className="kpi-value text-2xl">{screens.length}</div>
              <div className="text-xs text-slate-500 mt-1">总座位数 {screens.reduce((a, s) => a + s.seatCount, 0)} 个</div>
            </div>
            <div className="cip-card-hover p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4.5 h-4.5 text-chart-green" />
                <span className="kpi-label">平均上座率</span>
              </div>
              <div className="kpi-value text-2xl">{formatPercent(selectedTheater?.avgOccupancy || 0)}</div>
              <div className="text-xs text-chart-green mt-1">全市排名 No.{selectedTheater?.rankInCity}</div>
            </div>
            <div className="cip-card-hover p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4.5 h-4.5 text-cine-400" />
                <span className="kpi-label">黄金场次</span>
              </div>
              <div className="kpi-value text-2xl">{goldenCount}<span className="text-sm ml-1">场</span></div>
              <div className="text-xs text-slate-500 mt-1">上座率 ≥ 60%</div>
            </div>
          </div>

          <div className="cip-card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-100">
                  影厅 × 时段 上座率热力矩阵
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  行：影厅 &nbsp;|&nbsp; 列：时段 &nbsp;|&nbsp; 当前视图：
                  <span className="text-gold-400 font-medium">{viewMode === 'weekday' ? '工作日' : '周末'}</span>
                  &nbsp;|&nbsp; 悬停查看详情
                </p>
              </div>
              <span className="badge badge-online">黄金场 {goldenCount} 个</span>
            </div>
            <ReactECharts option={screenHeatmapOption} style={{ height: 380 }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="cip-card p-5">
              <h3 className="font-serif text-base font-semibold text-slate-100 mb-4">影厅详细配置</h3>
              <div className="space-y-2.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                {screens.map(s => (
                  <div key={s.screenId} className="flex items-center gap-3 p-3.5 rounded-xl bg-space-800/40 border border-space-700/30 hover:border-space-600/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-chart-purple/20 to-violet-500/10 flex items-center justify-center shrink-0">
                      <Armchair className="w-5 h-5 text-chart-purple" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200">{s.screenName}</span>
                        <span className="text-[11px] text-slate-500">{s.seatCount}座</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.goldenShows.length > 0 ? s.goldenShows.slice(0, 3).map(g => (
                          <span key={g} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-cine-500/15 text-cine-400 border border-cine-500/30">
                            <Star className="w-2.5 h-2.5" />{g}
                          </span>
                        )) : <span className="text-[10px] text-slate-500">暂无黄金场</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-gold-400">
                        {viewMode === 'weekday'
                          ? `${(s.timeMatrix.reduce((a, t) => a + t.weekdayOccupancy, 0) / s.timeMatrix.length).toFixed(1)}%`
                          : `${(s.timeMatrix.reduce((a, t) => a + t.weekendOccupancy, 0) / s.timeMatrix.length).toFixed(1)}%`
                        }
                      </div>
                      <div className="text-[10px] text-slate-500">平均{viewMode === 'weekday' ? '工作日' : '周末'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cip-card p-5">
              <h3 className="font-serif text-base font-semibold text-slate-100 mb-4">排片优化建议</h3>
              <div className="space-y-3.5">
                {[
                  { lvl: '高', color: 'text-cine-400 bg-cine-500/10 border-cine-500/30', title: '增设巨幕厅黄金场次', desc: '周末19-21点IMAX厅平均上座率达78.5%，建议追加场次1-2场/天，预计增收22%' },
                  { lvl: '高', color: 'text-chart-orange bg-chart-orange/10 border-chart-orange/30', title: '调整午间场票价策略', desc: '11-15点时段平均上座率仅32%，建议推出工作日午间特惠套餐35元/位，提升人次35%+' },
                  { lvl: '中', color: 'text-chart-blue bg-chart-blue/10 border-chart-blue/30', title: '优化情侣座分布配置', desc: '3号/5号厅周末19-21点情侣座售罄率达92%，建议增加可拆情侣座占比至30%' },
                  { lvl: '中', color: 'text-chart-green bg-chart-green/10 border-chart-green/30', title: '提升家庭座场次供给', desc: '15-17点家庭观影占比较高，建议增加动画片排片占比并配套家庭套票方案' },
                  { lvl: '低', color: 'text-chart-purple bg-chart-purple/10 border-chart-purple/30', title: '深夜场差异化运营', desc: '21-23点上座率48%，可考虑引入影迷专场/艺术片/老片重映等差异化内容' },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-space-800/40 border border-space-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={clsx('badge text-[10px] border', s.color)}>优先级 {s.lvl}</span>
                      <h4 className="text-sm font-semibold text-slate-200 flex-1">{s.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChinaMapInitializer() {
  useEffect(() => {
    const init = async () => {
      try {
        const echarts = await import('echarts');
        const res = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
        if (res.ok) {
          const geo = await res.json();
          echarts.registerMap('china', geo);
        }
      } catch (e) {
        console.warn('Map load failed, using fallback');
      }
    };
    init();
  }, []);
  return null;
}
