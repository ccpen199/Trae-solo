import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle, TrendingUp, TrendingDown, Minus,
  Shield, Car, Package, Sparkles, ArrowRight,
} from 'lucide-react';
import { useDispatchStore } from '@/store/dispatchStore';
import type { RegionSaturation } from '@/types';

const CITY_CENTER: [number, number] = [31.2304, 121.4737];

function getSatColor(s: number) {
  if (s > 0.85) return { fill: '#EF4444', border: '#DC2626', label: 'text-signal-red', bg: 'bg-signal-red' };
  if (s > 0.7) return { fill: '#F97316', border: '#EA580C', label: 'text-orange-400', bg: 'bg-orange-500' };
  if (s > 0.5) return { fill: '#F59E0B', border: '#D97706', label: 'text-signal-yellow', bg: 'bg-signal-yellow' };
  return { fill: '#10B981', border: '#059669', label: 'text-signal-green', bg: 'bg-signal-green' };
}

function MapResizer({ regions }: { regions: RegionSaturation[] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map, regions.length]);
  return null;
}

export default function SaturationWarning() {
  const { init, saturationRegions } = useDispatchStore();
  const tickRef = useRef(0);
  const [, force] = useState(0);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    const id = setInterval(() => { tickRef.current++; force((n) => n + 1); }, 4000);
    return () => clearInterval(id);
  }, []);

  const regions = useMemo(() => {
    return saturationRegions.map((r) => {
      const drift = Math.sin(tickRef.current * 0.15 + r.lat) * 0.06;
      const s = Math.max(0.2, Math.min(0.99, r.saturation + drift));
      return { ...r, saturation: +s.toFixed(2), trend: Math.sin(tickRef.current * 0.1 + r.lng) > 0.15 ? 'up' : Math.sin(tickRef.current * 0.1 + r.lng) < -0.15 ? 'down' : 'flat' };
    }).sort((a, b) => b.saturation - a.saturation);
  }, [saturationRegions, tickRef.current]);

  const avgSat = useMemo(() => (regions.reduce((s, r) => s + r.saturation, 0) / Math.max(1, regions.length)).toFixed(2), [regions]);
  const warnCount = regions.filter((r) => r.saturation > 0.85).length;
  const healthyCount = regions.filter((r) => r.saturation <= 0.7).length;

  const trendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 32, right: 12, top: 12, bottom: 24 },
    tooltip: { trigger: 'axis', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 } },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 12 }, (_, i) => `${i}:00`),
      axisLine: { lineStyle: { color: '#243049' } },
      axisLabel: { color: '#64748B', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', min: 0.3, max: 1,
      axisLine: { show: false },
      axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
      splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
    },
    series: [{
      type: 'line', smooth: true, showSymbol: false,
      lineStyle: { color: '#F97316', width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(249,115,22,0.4)' }, { offset: 1, color: 'rgba(249,115,22,0)' }] },
      },
      markLine: { silent: true, symbol: 'none', lineStyle: { color: '#EF4444', type: 'dashed', width: 1 },
        data: [{ yAxis: 0.85, label: { formatter: '预警线 85%', color: '#EF4444', fontSize: 9, position: 'end' } }] },
      data: Array.from({ length: 12 }, (_, i) => +(0.55 + Math.abs(Math.sin(i * 0.6 + tickRef.current * 0.05)) * 0.35).toFixed(2)),
    }],
  }), [tickRef.current]);

  const aiSuggestions = useMemo(() => {
    const topWarn = regions.filter((r) => r.saturation > 0.85);
    return [
      {
        region: topWarn[0]?.name || '陆家嘴',
        type: '加派车辆',
        detail: '建议从相邻嘉定/宝山区域调度 8 辆空闲车辆支援，预计缓解率 62%',
        icon: Car,
        color: 'text-orange-400',
        border: 'border-orange-500/40',
        bg: 'bg-orange-500/5',
      },
      {
        region: topWarn[1]?.name || '张江',
        type: '加价激励',
        detail: '该区域订单加价 ¥15-30 激励司机前往，预计 12 分钟内吸收 18 单',
        icon: Sparkles,
        color: 'text-signal-yellow',
        border: 'border-signal-yellow/40',
        bg: 'bg-signal-yellow/5',
      },
      {
        region: topWarn[2]?.name || '漕河泾',
        type: '订单分流',
        detail: '建议将 23 单常温普货分流至虹桥/莘庄空闲司机池，ETA 影响 <8 分钟',
        icon: Package,
        color: 'text-signal-cyan',
        border: 'border-signal-cyan/40',
        bg: 'bg-signal-cyan/5',
      },
    ];
  }, [regions]);

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-ink-950 p-4 flex flex-col gap-4">
      <div className="absolute inset-0 data-grid opacity-40 pointer-events-none" />

      <header className="relative shrink-0">
        <div className="industrial-card corner-brackets px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-sm bg-gradient-to-br from-signal-red/30 to-orange-500/20 flex items-center justify-center border border-signal-red/30">
                <AlertTriangle className="w-6 h-6 text-signal-red" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl tracking-wider text-white">运力饱和度预警看板</h1>
                <div className="font-mono text-[10px] text-slate-500 tracking-[0.3em] mt-1">FLEET SATURATION WARNING DASHBOARD · REAL-TIME</div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4 px-4 py-2 rounded-sm bg-ink-800/60 border border-ink-600/60">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-signal-green" /><span className="text-[11px] text-slate-400">&lt;50%</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-signal-yellow" /><span className="text-[11px] text-slate-400">50-70%</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-orange-500" /><span className="text-[11px] text-slate-400">70-85%</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-signal-red animate-pulse" /><span className="text-[11px] text-slate-400">&gt;85%</span></div>
              </div>
              <div className="font-mono text-xs text-slate-500">刷新间隔 4s · Tick {tickRef.current}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4 shrink-0">
        {[
          { label: '全市平均饱和度', value: `${(+avgSat * 100).toFixed(1)}%`, change: 2.3, icon: Shield, color: +avgSat > 0.7 ? 'orange' : 'green', big: true },
          { label: '预警区域数', value: warnCount, change: 1, icon: AlertTriangle, color: 'red' },
          { label: '健康区域数', value: healthyCount, change: -2, icon: Shield, color: 'green' },
          { label: '监控节点', value: regions.length, change: 0, icon: Car, color: 'cyan' },
        ].map((k, i) => (
          <div key={i} className="stat-panel corner-brackets">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-xs text-slate-400 font-mono tracking-wider mb-1">{k.label}</div>
                <div className={`font-display font-extrabold ${k.big ? 'text-4xl' : 'text-3xl'} tracking-wide ${
                  k.color === 'orange' ? 'text-orange-400' : k.color === 'red' ? 'text-signal-red' : k.color === 'green' ? 'text-signal-green' : 'text-signal-cyan'
                }`}>{k.value}</div>
                {typeof k.change === 'number' && (
                  <div className={`mt-1.5 inline-flex items-center gap-1 text-xs ${k.change >= 0 ? 'text-signal-red' : 'text-signal-green'}`}>
                    {k.change > 0 ? <TrendingUp size={12} /> : k.change < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                    <span>{k.change >= 0 ? '+' : ''}{k.change}%</span>
                    <span className="text-slate-500 ml-1">较1h前</span>
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${
                k.color === 'orange' ? 'bg-orange-500/15' : k.color === 'red' ? 'bg-signal-red/15' : k.color === 'green' ? 'bg-signal-green/15' : 'bg-signal-cyan/15'
              }`}>
                <k.icon className={`w-6 h-6 ${
                  k.color === 'orange' ? 'text-orange-400' : k.color === 'red' ? 'text-signal-red' : k.color === 'green' ? 'text-signal-green' : 'text-signal-cyan'
                }`} />
              </div>
            </div>
          </div>
        ))}

        <div className="col-span-4 stat-panel corner-brackets pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-400 font-mono tracking-wider">饱和度每小时变化趋势（全市均值）</div>
            <div className="hex-tag text-[10px]">12H TREND</div>
          </div>
          <ReactECharts option={trendOption} style={{ height: 110 }} />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-100 gap-4 min-h-0">
        <div className="col-span-[62%] industrial-card corner-brackets relative overflow-hidden">
          <div className="absolute top-4 left-4 z-[1000] px-3 py-2 rounded-sm bg-ink-900/85 backdrop-blur-sm border border-ink-600/60 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-300 font-mono">区域热力饱和度 · CircleMarker大小 = 司机数</span>
          </div>
          <MapContainer center={CITY_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer attribution="&copy; OSM" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapResizer regions={regions} />
            {regions.map((r) => {
              const totalDrv = r.idleDrivers + r.inTransitDrivers;
              const c = getSatColor(r.saturation);
              const isWarn = r.saturation > 0.85;
              return (
                <CircleMarker
                  key={r.code}
                  center={[r.lat, r.lng]}
                  radius={8 + Math.min(28, totalDrv * 1.2)}
                  pathOptions={{
                    color: c.border,
                    weight: isWarn ? 3 : 2,
                    fillColor: c.fill,
                    fillOpacity: isWarn ? 0.55 : 0.35,
                    dashArray: isWarn ? '4 3' : undefined,
                  }}
                  className={isWarn ? 'animate-pulse-slow' : ''}
                >
                  <Popup>
                    <div className="font-display font-bold text-sm mb-1" style={{ color: c.fill }}>{r.name}</div>
                    <div className="text-xs space-y-0.5 text-slate-300">
                      <div>饱和度: <b style={{ color: c.fill }}>{(r.saturation * 100).toFixed(0)}%</b></div>
                      <div>空闲司机: {r.idleDrivers}</div>
                      <div>在途司机: {r.inTransitDrivers}</div>
                      <div>待派订单: {r.pendingOrders}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="col-span-[38%] flex flex-col gap-4 min-h-0">
          <div className="industrial-card corner-brackets p-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white tracking-wide">区域饱和度排行榜</h3>
              </div>
              <span className="hex-tag text-[10px]">TOP {regions.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {regions.map((r, idx) => {
                const c = getSatColor(r.saturation);
                const isWarn = r.saturation > 0.85;
                const TrendIcon = r.trend === 'up' ? TrendingUp : r.trend === 'down' ? TrendingDown : Minus;
                const trendColor = r.trend === 'up' ? 'text-signal-red' : r.trend === 'down' ? 'text-signal-green' : 'text-slate-500';
                return (
                  <div
                    key={r.code}
                    className={`relative p-3 rounded-sm border transition-all ${
                      isWarn
                        ? 'border-signal-red/60 bg-signal-red/5 animate-pulse-slow shadow-glow-red-sm'
                        : r.saturation > 0.7
                        ? 'border-orange-500/40 bg-orange-500/5'
                        : 'border-ink-600/60 bg-ink-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-sm font-display font-bold text-sm ${idx < 3 ? 'bg-orange-500 text-white' : 'bg-ink-700 text-slate-400'}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{r.name}</span>
                          <div className="flex items-center gap-2">
                            <TrendIcon size={13} className={trendColor} />
                            <span className={`font-display font-bold text-lg ${c.label}`}>{(r.saturation * 100).toFixed(0)}<span className="text-xs text-slate-500 ml-0.5">%</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-ink-700 overflow-hidden mb-2.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(r.saturation * 100).toFixed(0)}%`, background: `linear-gradient(90deg, ${c.border}, ${c.fill})` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.bg}`} />
                        <span>司机</span>
                        <span className="text-white ml-auto">{r.idleDrivers + r.inTransitDrivers}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Car size={11} className="text-signal-green" />
                        <span>空闲</span>
                        <span className="text-signal-green ml-auto">{r.idleDrivers}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Package size={11} className="text-orange-400" />
                        <span>待派</span>
                        <span className="text-orange-400 ml-auto">{r.pendingOrders}</span>
                      </div>
                    </div>
                    {isWarn && (
                      <div className="absolute top-1.5 right-1.5">
                        <span className="hex-tag text-[9px] !bg-signal-red/15 !text-signal-red">WARNING</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <div className="industrial-card corner-brackets p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-wide">AI 调度建议 · 针对高饱和区域</h3>
              <span className="font-mono text-[10px] text-slate-500 ml-2">AI-DISPATCH ADVISOR</span>
            </div>
            <span className="hex-tag text-[10px]">CONFIDENCE 92%</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {aiSuggestions.map((s, i) => (
              <div key={i} className={`relative p-4 rounded-sm border ${s.border} ${s.bg}`}>
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-sm bg-ink-900 border border-ink-600/60 text-[10px] font-mono text-slate-500">
                  SUGGESTION-0{i + 1}
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center shrink-0 bg-ink-900/60 border border-ink-600/60`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`font-display font-bold text-sm ${s.color}`}>{s.type}</span>
                      <span className="hex-tag text-[9px]">区域 · {s.region}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{s.detail}</p>
                    <button className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                      执行建议 <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
