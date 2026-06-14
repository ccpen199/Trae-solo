import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import ReactECharts from 'echarts-for-react';
import {
  Truck, Package, Thermometer, Radio, Activity, AlertTriangle,
  Gauge, Target, Users, Timer, Zap, MapPin, Navigation,
} from 'lucide-react';
import { useDispatchStore } from '@/store/dispatchStore';
import { useOrderStore } from '@/store/orderStore';
import { tempControlMap, formatMoney, formatVolume, formatWeight, haversine } from '@/utils/format';
import type { CargoOrder, Driver, TempControl } from '@/types';
import { AREA_ADDRESSES_EXPORT } from '@/utils/mockData';

const CITY_CENTER: [number, number] = [31.2304, 121.4737];

function makeIcon(status: Driver['currentStatus']) {
  const color = status === 'IDLE' ? '#10B981' : status === 'IN_TRANSIT' ? '#F97316' : '#3B82F6';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative;width:28px;height:28px;">
        <div style="position:absolute;inset:0;background:${color};border-radius:50%;box-shadow:0 0 12px ${color}aa,0 0 0 3px rgba(15,23,42,0.9);"></div>
        <div style="position:absolute;inset:3px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#0B1220" stroke="#0B1220" stroke-width="2.5"><path d="M10 17h4V5H10zm-6 0h4v-7H4zm12 0h4v-4l-3-5h-1z"/></svg>
        </div>
        <div style="position:absolute;inset:-4px;border:2px solid ${color};border-radius:50%;opacity:0.5;animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function MapController({ orders, drivers }: { orders: CargoOrder[]; drivers: Driver[] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map, orders.length, drivers.length]);
  return null;
}

export default function DispatchCenter() {
  const { init: initDispatch, gmv, todayOrders, fulfillmentRate, pendingMatching, matchSuccessRate, matchAvgMs, heatmapData } = useDispatchStore();
  const { orders, drivers, init: initOrders, loading } = useOrderStore();
  const [clock, setClock] = useState(new Date());
  const tickRef = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => { initDispatch(); initOrders(); }, [initDispatch, initOrders]);
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => { tickRef.current++; forceUpdate((n) => n + 1); }, 3000);
    return () => clearInterval(id);
  }, []);

  const pendingOrders = useMemo(
    () => orders.filter((o) => ['PUBLISHED', 'MATCHING'].includes(o.status)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );
  const inTransitOrders = useMemo(() => orders.filter((o) => ['IN_TRANSIT', 'PICKING_UP', 'ACCEPTED'].includes(o.status)), [orders]);
  const idleDrivers = useMemo(() => drivers.filter((d) => d.currentStatus === 'IDLE'), [drivers]);
  const onDutyDrivers = useMemo(() => drivers.filter((d) => d.currentStatus === 'ON_DUTY'), [drivers]);
  const busyDrivers = useMemo(() => drivers.filter((d) => d.currentStatus === 'IN_TRANSIT'), [drivers]);

  const activeMatching = useMemo(() => pendingOrders.find((o) => o.status === 'MATCHING') || pendingOrders[0], [pendingOrders]);

  const matchLog = useMemo(() => {
    const matched = orders.filter((o) => o.matchedAt && o.matchCandidates && o.matchCandidates.length > 0);
    return [...matched].sort((a, b) => new Date(b.matchedAt!).getTime() - new Date(a.matchedAt!).getTime()).slice(0, 10);
  }, [orders]);

  const matchTrendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: 28, right: 8, top: 12, bottom: 20 },
    tooltip: { trigger: 'axis', backgroundColor: '#0B1220', borderColor: '#243049', borderWidth: 1, textStyle: { color: '#E2E8F0', fontSize: 11 } },
    xAxis: { type: 'category', data: ['0m', '5m', '10m', '15m', '20m', '25m', '30m'], axisLine: { lineStyle: { color: '#243049' } }, axisLabel: { color: '#64748B', fontSize: 9 }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLine: { show: false }, axisLabel: { color: '#64748B', fontSize: 9 }, splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } } },
    series: [{
      type: 'line', smooth: true, showSymbol: false,
      lineStyle: { color: '#F97316', width: 1.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(249,115,22,0.35)' }, { offset: 1, color: 'rgba(249,115,22,0)' }] } },
      data: Array.from({ length: 7 }, () => 80 + Math.floor(Math.random() * 60)),
    }],
  }), [tickRef.current]);

  const tempPieOption = useMemo(() => {
    const counts: Record<TempControl, number> = { NORMAL: 0, FRESH: 0, REFRIGERATED: 0, DEEP_FREEZE: 0 };
    orders.forEach((o) => { counts[o.tempControl]++; });
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', backgroundColor: '#0B1220', borderColor: '#243049', textStyle: { color: '#E2E8F0', fontSize: 11 }, formatter: '{b}<br/>{c}单 ({d}%)' },
      legend: { orient: 'vertical', left: 6, top: 'center', textStyle: { color: '#94A3B8', fontSize: 10 }, itemWidth: 8, itemHeight: 8, itemGap: 10,
        formatter: (name: string) => `${tempControlMap[name as TempControl].icon} ${tempControlMap[name as TempControl].label.slice(0, 5)}` },
      series: [{
        type: 'pie', radius: ['40%', '68%'], center: ['68%', '50%'],
        itemStyle: { borderRadius: 2, borderColor: '#0B1220', borderWidth: 2 },
        label: { show: false }, labelLine: { show: false },
        data: [
          { value: counts.NORMAL, name: 'NORMAL', itemStyle: { color: '#64748B' } },
          { value: counts.FRESH, name: 'FRESH', itemStyle: { color: '#10B981' } },
          { value: counts.REFRIGERATED, name: 'REFRIGERATED', itemStyle: { color: '#3B82F6' } },
          { value: counts.DEEP_FREEZE, name: 'DEEP_FREEZE', itemStyle: { color: '#06B6D4' } },
        ],
      }],
    };
  }, [orders]);

  const saturationBars = useMemo(() => AREA_ADDRESSES_EXPORT.map((a) => {
    const baseSat = 0.4 + Math.abs(Math.sin(tickRef.current * 0.1 + a.lat)) * 0.58;
    return { name: a.name, saturation: +baseSat.toFixed(2), lat: a.lat, lng: a.lng };
  }).sort((a, b) => b.saturation - a.saturation), [tickRef.current]);

  const timeStr = clock.toLocaleTimeString('zh-CN', { hour12: false });
  const dateStr = clock.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });

  if (loading) {
    return <div className="h-full flex items-center justify-center text-slate-400"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-3" />装载调度数据...</div>;
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative bg-ink-950">
      <div className="absolute inset-0 data-grid opacity-60" />
      <div className="absolute inset-0 bg-noise-overlay pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none" />

      <div className="relative h-full flex flex-col p-4 gap-4">
        <header className="relative shrink-0">
          <div className="industrial-card corner-brackets px-6 py-3">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5 shrink-0">
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-orange-500 to-orange-550 flex items-center justify-center shadow-glow-orange-sm">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display font-extrabold text-2xl tracking-wider bg-gradient-to-r from-orange-400 via-white to-orange-300 bg-clip-text text-transparent leading-tight">
                      同城货运智能调度中心
                    </h1>
                    <div className="font-mono text-[10px] text-slate-500 tracking-[0.3em] mt-0.5">URBAN FREIGHT INTELLIGENT DISPATCH CENTER</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <div className="flex whitespace-nowrap animate-marquee gap-10 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs">GMV</span>
                    <span className="font-display font-bold text-orange-400 text-lg">¥{(gmv / 10000).toFixed(2)}万</span>
                    <span className="text-signal-green text-xs flex items-center gap-0.5">↑3.2%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs">今日订单</span>
                    <span className="font-display font-bold text-signal-cyan text-lg">{todayOrders}</span>
                    <span className="text-signal-green text-xs flex items-center gap-0.5">↑12</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs">履约率</span>
                    <span className="font-display font-bold text-signal-green text-lg">{(fulfillmentRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs">待派单</span>
                    <span className="font-display font-bold text-signal-yellow text-lg">{pendingMatching}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs">匹配成功率</span>
                    <span className="font-display font-bold text-signal-green text-lg">{(matchSuccessRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs">平均耗时</span>
                    <span className="font-display font-bold text-orange-400 text-lg">{matchAvgMs.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-signal-green/10 border border-signal-green/30">
                  <Radio className="w-4 h-4 text-signal-green animate-pulse" />
                  <span className="font-display font-bold text-signal-green text-sm">12/12 在线</span>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-xl text-white tracking-wider tabular-nums">{timeStr}</div>
                  <div className="font-mono text-[10px] text-slate-500 tracking-wider">{dateStr}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-100 gap-4 min-h-0">
          <aside className="col-span-[20%] flex flex-col gap-4 min-h-0">
            <div className="industrial-card corner-brackets p-4 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">待派订单池</h3>
                </div>
                <span className="hex-tag text-[10px]">{pendingOrders.length} 单</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {pendingOrders.slice(0, 8).map((o) => {
                  const pickup = o.stops.find((s) => s.type === 'PICKUP');
                  const delivery = o.stops.find((s) => s.type === 'DELIVERY');
                  const dist = pickup && delivery ? haversine(pickup.lat, pickup.lng, delivery.lat, delivery.lng) : 0;
                  return (
                    <div key={o.id} className={`relative p-3 rounded-sm border ${o.status === 'MATCHING' ? 'border-orange-500/60 bg-orange-500/5 animate-pulse-slow' : 'border-ink-600/70 bg-ink-900/60'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display text-xs text-orange-400 font-bold">{o.orderNo.slice(-8)}</span>
                        <span className="hex-tag text-[9px]">{tempControlMap[o.tempControl].icon} {tempControlMap[o.tempControl].label.slice(0, 2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono">
                        <div className="text-slate-400">货值 <span className="text-orange-300">¥{(o.cargoValue / 1000).toFixed(1)}k</span></div>
                        <div className="text-slate-400">距离 <span className="text-signal-cyan">{dist.toFixed(1)}km</span></div>
                        <div className="text-slate-400">体积 <span className="text-white">{formatVolume(o.volume)}</span></div>
                        <div className="text-slate-400">重量 <span className="text-white">{formatWeight(o.weight)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="industrial-card corner-brackets p-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-signal-cyan" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">运力在线状态</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2.5 rounded-sm bg-signal-green/10 border border-signal-green/20 text-center">
                  <div className="font-display font-bold text-2xl text-signal-green tabular-nums">{idleDrivers.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">在线待命</div>
                </div>
                <div className="p-2.5 rounded-sm bg-signal-blue/10 border border-signal-blue/20 text-center">
                  <div className="font-display font-bold text-2xl text-signal-blue tabular-nums">{onDutyDrivers.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">在岗</div>
                </div>
                <div className="p-2.5 rounded-sm bg-orange-500/10 border border-orange-500/20 text-center">
                  <div className="font-display font-bold text-2xl text-orange-400 tabular-nums">{busyDrivers.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">配送中</div>
                </div>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {drivers.slice(0, 6).map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1 px-2 rounded-sm bg-ink-900/40">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${d.currentStatus === 'IDLE' ? 'bg-signal-green' : d.currentStatus === 'IN_TRANSIT' ? 'bg-orange-500 animate-pulse' : 'bg-signal-blue'}`} />
                      <span className="text-xs text-slate-300">{d.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{d.licensePlate.slice(-6)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="industrial-card corner-brackets p-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">算法运行状态</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="text-[10px] text-slate-500 font-mono mb-0.5">匹配平均耗时</div>
                  <div className="font-display font-bold text-lg text-orange-400 tabular-nums">{(1200 + (tickRef.current * 37) % 400).toFixed(0)}<span className="text-xs text-slate-500 ml-1">ms</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono mb-0.5">成功率</div>
                  <div className="font-display font-bold text-lg text-signal-green tabular-nums">{(matchSuccessRate * 100).toFixed(1)}<span className="text-xs text-slate-500 ml-1">%</span></div>
                </div>
              </div>
              <ReactECharts option={matchTrendOption} style={{ height: 80 }} />
            </div>
          </aside>

          <main className="col-span-[55%] flex flex-col gap-4 min-h-0">
            <div className="industrial-card corner-brackets flex-1 relative overflow-hidden min-h-0">
              <div className="absolute top-3 left-4 z-[1000] flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-ink-900/85 backdrop-blur-sm border border-ink-600/60 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-slate-300 font-mono">上海主城区</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-sm bg-ink-900/85 backdrop-blur-sm border border-ink-600/60 text-[11px]">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-signal-green" /><span className="text-slate-400">IDLE</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-signal-blue" /><span className="text-slate-400">ON_DUTY</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" /><span className="text-slate-400">IN_TRANSIT</span></div>
                </div>
              </div>
              <div className="absolute top-3 right-4 z-[1000]">
                <div className="px-3 py-1.5 rounded-sm bg-ink-900/85 backdrop-blur-sm border border-ink-600/60 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-signal-yellow animate-pulse" />
                  <span className="font-mono text-[11px] text-slate-300">{tickRef.current * 3}s · 实时刷新</span>
                </div>
              </div>

              <MapContainer center={CITY_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController orders={orders} drivers={drivers} />

                {heatmapData.map((p, idx) => (
                  <CircleMarker
                    key={`hm-${idx}`}
                    center={[p.lat, p.lng]}
                    radius={6 + p.count / 10}
                    pathOptions={{ color: '#F97316', fillColor: '#F97316', fillOpacity: Math.min(0.35, 0.08 + p.value / 100), weight: 0 }}
                  />
                ))}

                {pendingOrders.slice(0, 6).map((o) => {
                  const pk = o.stops.find((s) => s.type === 'PICKUP');
                  if (!pk) return null;
                  return (
                    <CircleMarker
                      key={`pending-${o.id}`}
                      center={[pk.lat, pk.lng]}
                      radius={9}
                      pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.55, weight: 2, dashArray: '3 3' }}
                    >
                      <Popup>{o.orderNo}<br/>{tempControlMap[o.tempControl].label}</Popup>
                    </CircleMarker>
                  );
                })}

                {drivers.map((d) => (
                  <Marker key={d.id} position={[d.currentLat, d.currentLng]} icon={makeIcon(d.currentStatus)}>
                    <Popup>{d.name} · {d.licensePlate}<br/>{d.vehicleTypeName}</Popup>
                  </Marker>
                ))}

                {inTransitOrders.slice(0, 8).map((o) => {
                  const pk = o.stops.find((s) => s.type === 'PICKUP');
                  const dl = o.stops.find((s) => s.type === 'DELIVERY');
                  if (!pk || !dl) return null;
                  return (
                    <Polyline
                      key={`route-${o.id}`}
                      positions={[[pk.lat, pk.lng], [dl.lat, dl.lng]]}
                      pathOptions={{ color: '#F97316', weight: 2, opacity: 0.55, dashArray: '6 8' }}
                    />
                  );
                })}
              </MapContainer>
            </div>

            <div className="industrial-card corner-brackets p-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">匹配算法实时榜单</h3>
                  <span className="font-mono text-[10px] text-slate-500 ml-2">TOP 10 MATCHES</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="text-left py-1.5 px-3 font-normal">#</th>
                      <th className="text-left py-1.5 px-3 font-normal">订单</th>
                      <th className="text-left py-1.5 px-3 font-normal">匹配司机</th>
                      <th className="text-left py-1.5 px-3 font-normal">车牌</th>
                      <th className="text-right py-1.5 px-3 font-normal">匹配分</th>
                      <th className="text-right py-1.5 px-3 font-normal">耗时</th>
                      <th className="text-left py-1.5 px-3 font-normal">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchLog.map((o, idx) => {
                      const driver = drivers.find((d) => d.id === o.driverId);
                      const top = o.matchCandidates?.[0];
                      return (
                        <tr key={o.id} className="border-t border-ink-600/40 hover:bg-orange-500/5">
                          <td className="py-2 px-3 font-mono text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="py-2 px-3 font-display text-orange-400 font-semibold">{o.orderNo.slice(-8)}</td>
                          <td className="py-2 px-3 text-slate-200">{driver?.name || '--'}</td>
                          <td className="py-2 px-3 font-mono text-slate-400">{driver?.licensePlate.slice(-6) || '--'}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="font-display font-bold text-signal-green">{top ? (top.overallScore * 100).toFixed(0) : '--'}</span>
                            <span className="text-slate-500 ml-0.5">分</span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-signal-cyan">{(800 + idx * 67) % 1800}ms</td>
                          <td className="py-2 px-3">
                            <span className="hex-tag text-[9px]">{o.status === 'MATCHED' ? '匹配完成' : o.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          <aside className="col-span-[25%] flex flex-col gap-4 min-h-0">
            <div className="industrial-card corner-brackets p-4 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 rounded-full" style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, rgba(249,115,22,0.6) 25%, transparent 50%)',
                  animation: 'spin 2s linear infinite',
                }} />
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-orange-400 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white tracking-wide">匹配进行中</h3>
                  </div>
                  <span className="hex-tag text-[10px] animate-pulse">SCANNING</span>
                </div>

                {activeMatching ? (
                  <div>
                    <div className="p-3 rounded-sm border border-orange-500/40 bg-orange-500/5 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-[10px] text-slate-500 mb-0.5">目标订单</div>
                          <div className="font-display font-bold text-orange-400 text-lg">{activeMatching.orderNo}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[10px] text-slate-500 mb-0.5">温控</div>
                          <div className="text-sm">{tempControlMap[activeMatching.tempControl].icon} {tempControlMap[activeMatching.tempControl].label}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(activeMatching.matchCandidates || []).slice(0, 3).map((c, i) => (
                        <div key={c.driverId} className="p-2.5 rounded-sm border border-ink-600/70 bg-ink-900/60">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-orange-500 text-white' : i === 1 ? 'bg-signal-yellow/20 text-signal-yellow' : 'bg-slate-500/20 text-slate-400'}`}>
                                {i + 1}
                              </div>
                              <span className="text-xs text-white font-medium">{c.driver.name}</span>
                            </div>
                            <div className="font-display font-bold text-orange-400">{(c.overallScore * 100).toFixed(0)}<span className="text-xs text-slate-500 ml-0.5">分</span></div>
                          </div>
                          <div className="space-y-1">
                            {[
                              { label: '路线', v: c.routeScore, c: '#06B6D4' },
                              { label: '履约', v: c.historyScore, c: '#10B981' },
                              { label: '车型', v: c.vehicleScore, c: '#3B82F6' },
                              { label: '空返', v: c.returnEmptyScore, c: '#F97316' },
                            ].map((m) => (
                              <div key={m.label} className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 w-8">{m.label}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(m.v * 100).toFixed(0)}%`, backgroundColor: m.c }} />
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{(m.v * 100).toFixed(0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">暂无匹配任务</div>
                )}
              </div>
            </div>

            <div className="industrial-card corner-brackets p-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-signal-red" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">饱和度预警</h3>
                </div>
                <span className="font-mono text-[10px] text-slate-500">SATURATION</span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {saturationBars.map((r) => {
                  const isWarn = r.saturation > 0.85;
                  return (
                    <div key={r.name} className={`p-2 rounded-sm border ${isWarn ? 'border-signal-red/50 bg-signal-red/5 animate-pulse-slow' : 'border-ink-600/60 bg-ink-900/40'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-200">{r.name}</span>
                        <span className={`font-display font-bold text-xs ${isWarn ? 'text-signal-red' : r.saturation > 0.7 ? 'text-orange-400' : r.saturation > 0.5 ? 'text-signal-yellow' : 'text-signal-green'}`}>
                          {(r.saturation * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(r.saturation * 100).toFixed(0)}%`,
                            background: isWarn ? 'linear-gradient(90deg,#EF4444,#DC2626)' : r.saturation > 0.7 ? 'linear-gradient(90deg,#F97316,#EA580C)' : r.saturation > 0.5 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="industrial-card corner-brackets p-4 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-signal-cyan" />
                  <h3 className="text-sm font-semibold text-white tracking-wide">温控分布</h3>
                </div>
                <Users className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="flex-1 min-h-0">
                <ReactECharts option={tempPieOption} style={{ height: '100%', minHeight: 160 }} />
              </div>
            </div>
          </aside>
        </div>

        <div className="shrink-0 flex items-center justify-between px-2">
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-signal-green rounded-full animate-pulse" />SYSTEM ONLINE</span>
            <span>NODE: DISPATCH-SH-01</span>
            <span>VERSION: v2.8.1</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
            <span>LATENCY: {(18 + tickRef.current % 7)}ms</span>
            <span>MATCH Q: {pendingOrders.length}</span>
            <span className="text-orange-500/80">运联智能调度平台 © 2026</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
