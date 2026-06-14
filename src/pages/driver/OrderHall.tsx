import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Clock,
  Package,
  Thermometer,
  Truck,
  Target,
  Filter,
  SlidersHorizontal,
  Navigation,
  DollarSign,
  User,
  Star,
  ChevronRight,
  Check,
  RefreshCw,
  Sparkles,
  List,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import {
  formatMoney,
  formatWeight,
  formatTime,
  statusTextMap,
  tempControlMap,
  difficultyMap,
  vehicleTypeMap,
  haversine,
} from '@/utils/format';
import { calculateMatchScore } from '@/utils/matching';
import type { CargoOrder, MatchCandidate, TempControl, VehicleType } from '@/types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MatchMode = 'SMART' | 'ALL';

const VEHICLE_FILTERS: { value: VehicleType | 'ALL'; label: string; icon: string }[] = [
  { value: 'ALL', label: '全部车型', icon: '🚛' },
  { value: 'VAN', label: '面包车', icon: '🚐' },
  { value: 'TRUCK_4M', label: '4.2米', icon: '🚚' },
  { value: 'TRUCK_6M', label: '6.8米', icon: '🚛' },
  { value: 'TRUCK_9M', label: '9.6米', icon: '🚚' },
  { value: 'REEFER', label: '冷藏车', icon: '❄️' },
];

const TEMP_FILTERS: { value: TempControl | 'ALL'; label: string; icon: string }[] = [
  { value: 'ALL', label: '不限温度', icon: '🌡️' },
  { value: 'NORMAL', label: '常温', icon: '🌡️' },
  { value: 'FRESH', label: '保鲜', icon: '🥬' },
  { value: 'REFRIGERATED', label: '冷藏', icon: '❄️' },
  { value: 'DEEP_FREEZE', label: '深冷', icon: '🧊' },
];

function MatchScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const progress = Math.min(100, Math.max(0, score));
  const dash = 2 * Math.PI * ((size / 2) * 0.72);
  const offset = dash - (progress / 100) * dash;
  const color = score >= 85 ? '#F97316' : score >= 70 ? '#FB923C' : '#FDBA74';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <filter id={`glow-${score}-${size}`}>
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) * 0.72}
          stroke="#1A2238"
          strokeWidth={size * 0.06}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) * 0.72}
          stroke={color}
          strokeWidth={size * 0.06}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={dash}
          strokeDashoffset={offset}
          filter={`url(#glow-${score}-${size})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none"
          style={{ color, fontSize: size * 0.28 }}
        >
          {score.toFixed(0)}
        </span>
        <span className="text-[9px] text-slate-500 font-mono mt-0.5">匹配度</span>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  weight,
  color,
}: {
  label: string;
  value: number;
  weight: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 shrink-0 text-[10px] text-slate-500 font-mono">
        {label}
        <span className="text-slate-700 ml-0.5">{weight}%</span>
      </div>
      <div className="flex-1 h-2 bg-ink-800 rounded-sm overflow-hidden relative">
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
      <div className="w-9 text-right text-[10px] font-mono font-semibold" style={{ color }}>
        {value.toFixed(0)}
      </div>
    </div>
  );
}

function DriverCompareCard({
  candidate,
  isMe,
}: {
  candidate: MatchCandidate;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex-1 p-2.5 rounded-sm border transition-all duration-200 ${
        isMe
          ? 'bg-orange-500/10 border-orange-500/50 shadow-glow-orange-sm relative'
          : 'bg-ink-950/50 border-ink-600/40'
      }`}
    >
      {isMe && (
        <div className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
          我
        </div>
      )}
      <div className="flex items-center gap-2 mb-1.5">
        <img
          src={candidate.driver.avatar}
          alt="driver"
          className={`w-7 h-7 rounded-sm border ${isMe ? 'border-orange-500/60' : 'border-ink-600/50'}`}
        />
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-semibold truncate ${isMe ? 'text-orange-400' : 'text-white'}`}>
            {candidate.driver.name}
          </div>
          <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-yellow-500" />
            {candidate.driver.rating}
          </div>
        </div>
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-slate-500">距离</span>
          <span className="text-slate-300 font-mono">{candidate.distanceKm}km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">ETA</span>
          <span className="text-slate-300 font-mono">{candidate.etaMinutes}分</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">评分</span>
          <span className={isMe ? 'text-orange-400 font-display font-bold' : 'text-signal-green font-mono'}>
            {candidate.overallScore}
          </span>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  myCandidate,
  onAccept,
  onLater,
}: {
  order: CargoOrder;
  myCandidate: MatchCandidate | null;
  onAccept: () => void;
  onLater: () => void;
}) {
  const pickup = order.stops.find((s) => s.type === 'PICKUP');
  const deliveries = order.stops.filter((s) => s.type === 'DELIVERY');
  const candidates = order.matchCandidates ?? [];
  const score = myCandidate?.overallScore ?? 0;
  const distance = myCandidate?.distanceKm ?? 0;
  const eta = myCandidate?.etaMinutes ?? 0;

  const allStops = order.stops;
  const routeSegments: { from: string; to: string; dist: number }[] = [];
  for (let i = 0; i < allStops.length - 1; i++) {
    const dist = haversine(allStops[i].lat, allStops[i].lng, allStops[i + 1].lat, allStops[i + 1].lng);
    routeSegments.push({
      from: allStops[i].address.split('区').pop()?.slice(0, 10) || allStops[i].address.slice(0, 10),
      to: allStops[i + 1].address.split('区').pop()?.slice(0, 10) || allStops[i + 1].address.slice(0, 10),
      dist: +dist.toFixed(1),
    });
  }

  return (
    <div className="industrial-card p-5 transition-all duration-300 group hover:border-orange-500/60 hover:scale-[1.008] hover:shadow-[0_0_0_1px_rgba(249,115,22,0.4),0_12px_40px_-12px_rgba(249,115,22,0.35)]">
      <div className="flex gap-4 mb-4">
        <div className="shrink-0">
          <MatchScoreRing score={score} size={78} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-display text-sm font-bold text-orange-400 shrink-0">
                {order.orderNo}
              </span>
              <span className="hex-tag">{order.shipperName.slice(0, 8)}</span>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-0.5">
                <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-display text-2xl font-extrabold text-orange-400 tracking-tight">
                  {order.totalPrice.toFixed(0)}
                </span>
                <span className="text-xs text-orange-400/70">元</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-white font-semibold mb-2 truncate">{order.cargoName}</div>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              {distance.toFixed(1)}km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-400" />
              {eta}分钟可达
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-signal-green" />
              {deliveries.length + 1}站点
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="hex-tag">{order.volume}m³</span>
        <span className="hex-tag">{formatWeight(order.weight)}</span>
        <span
          className="hex-tag"
          style={{
            background:
              order.tempControl === 'DEEP_FREEZE'
                ? 'rgba(6,182,212,0.12)'
                : order.tempControl === 'REFRIGERATED'
                  ? 'rgba(59,130,246,0.12)'
                  : order.tempControl === 'FRESH'
                    ? 'rgba(16,185,129,0.12)'
                    : undefined,
            color:
              order.tempControl === 'DEEP_FREEZE'
                ? '#22D3EE'
                : order.tempControl === 'REFRIGERATED'
                  ? '#60A5FA'
                  : order.tempControl === 'FRESH'
                    ? '#34D399'
                    : undefined,
          }}
        >
          {tempControlMap[order.tempControl].icon} {tempControlMap[order.tempControl].label}
        </span>
        <span
          className="hex-tag"
          style={{
            background:
              order.loadingDifficulty === 'HIGH'
                ? 'rgba(239,68,68,0.12)'
                : order.loadingDifficulty === 'MEDIUM'
                  ? 'rgba(245,158,11,0.12)'
                  : 'rgba(16,185,129,0.1)',
            color:
              order.loadingDifficulty === 'HIGH'
                ? '#F87171'
                : order.loadingDifficulty === 'MEDIUM'
                  ? '#FBBF24'
                  : '#34D399',
          }}
        >
          装卸难度 {difficultyMap[order.loadingDifficulty].label}
        </span>
      </div>

      <div className="bg-ink-950/50 rounded-sm p-3 mb-4 border border-ink-600/30">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
          配送路线 ROUTE
        </div>
        <div className="space-y-2">
          {routeSegments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    i === 0 ? 'bg-orange-500 border-orange-400' : 'bg-ink-800 border-signal-green'
                  }`}
                />
                {i < routeSegments.length - 1 && (
                  <div className="w-px h-4 bg-ink-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`${i === 0 ? 'text-orange-300' : 'text-slate-300'} truncate`}>
                    {i === 0 ? '取货：' : ''}{seg.from}
                  </span>
                  <span className="text-slate-600 font-mono text-[10px] shrink-0 ml-2">
                    {seg.dist}km
                  </span>
                </div>
                <div className="text-slate-400 truncate mt-0.5">
                  → 送达：{seg.to}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="divider-dashed my-2" />
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>取货时间窗：{formatTime(order.pickupTimeWindow[0])} - {formatTime(order.pickupTimeWindow[1])}</span>
          <span className="text-orange-400">
            总里程 ≈ {routeSegments.reduce((s, r) => s + r.dist, 0).toFixed(1)}km
          </span>
        </div>
      </div>

      <div className="space-y-1.5 mb-4 bg-ink-950/30 p-3 rounded-sm border border-ink-600/20">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2 flex items-center gap-1">
          <Target className="w-3 h-3 text-orange-400" />
          匹配度分解
        </div>
        <ScoreBar label="路线分" value={myCandidate?.routeScore ?? 0} weight={30} color="#F97316" />
        <ScoreBar label="历史分" value={myCandidate?.historyScore ?? 0} weight={25} color="#06B6D4" />
        <ScoreBar label="车型分" value={myCandidate?.vehicleScore ?? 0} weight={25} color="#10B981" />
        <ScoreBar label="返程分" value={myCandidate?.returnEmptyScore ?? 0} weight={20} color="#8B5CF6" />
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
          Top 3 候选司机对比
        </div>
        <div className="flex gap-2">
          {candidates.length > 0 ? (
            candidates.slice(0, 3).map((c) => (
              <DriverCompareCard key={c.driverId} candidate={c} isMe={myCandidate?.driverId === c.driverId} />
            ))
          ) : (
            <div className="flex-1 py-4 text-center text-xs text-slate-500 bg-ink-950/40 rounded-sm border border-ink-600/30">
              暂无匹配数据
            </div>
          )}
        </div>
      </div>

      <div className="divider-dashed mb-4" />
      <div className="flex items-center gap-3">
        <button onClick={onAccept} className="btn-primary flex-1">
          <Check className="w-4 h-4 mr-1.5" />
          立即接单
        </button>
        <button
          onClick={onLater}
          className="btn-ghost flex-1"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          稍后考虑
        </button>
      </div>
    </div>
  );
}

export default function OrderHall() {
  const { user } = useAuthStore();
  const { orders, drivers, init, loading, assignDriver } = useOrderStore();

  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | 'ALL'>('ALL');
  const [tempFilter, setTempFilter] = useState<TempControl | 'ALL'>('ALL');
  const [distanceRange, setDistanceRange] = useState(30);
  const [matchMode, setMatchMode] = useState<MatchMode>('SMART');
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [laterIds, setLaterIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    init();
  }, [init]);

  const driverId = user?.id ?? 'drv_demo';

  const currentDriver = useMemo(() => {
    const found = drivers.find((d) => d.id === driverId);
    if (found) return found;
    if (drivers.length > 0) return drivers[0];
    return null;
  }, [drivers, driverId]);

  const publishedOrders = useMemo(
    () => orders.filter((o) => o.status === 'PUBLISHED' || o.status === 'MATCHING'),
    [orders],
  );

  const ordersWithMyMatch = useMemo(() => {
    if (!currentDriver) return [];
    return publishedOrders
      .map((order) => {
        let myMatch = order.matchCandidates?.find((c) => c.driverId === currentDriver.id);
        if (!myMatch) {
          myMatch = calculateMatchScore(order, currentDriver);
        }
        return { order, myMatch };
      })
      .filter(({ myMatch }) => myMatch.distanceKm <= distanceRange)
      .filter(({ order }) => {
        if (vehicleFilter === 'ALL') return true;
        const conditions: Record<VehicleType, boolean> = {
          VAN: order.volume <= 5 && order.weight <= 1000,
          TRUCK_4M: order.volume <= 14 && order.weight <= 3000,
          TRUCK_6M: order.volume <= 35 && order.weight <= 8000,
          TRUCK_9M: order.volume <= 60 && order.weight <= 18000,
          REEFER: ['FRESH', 'REFRIGERATED', 'DEEP_FREEZE', 'NORMAL'].includes(order.tempControl),
        };
        return conditions[vehicleFilter];
      })
      .filter(({ order }) => tempFilter === 'ALL' || order.tempControl === tempFilter)
      .filter(({ order }) => !acceptedIds.has(order.id) && !laterIds.has(order.id))
      .sort((a, b) => {
        if (matchMode === 'SMART') return b.myMatch.overallScore - a.myMatch.overallScore;
        return a.myMatch.distanceKm - b.myMatch.distanceKm;
      });
  }, [publishedOrders, currentDriver, distanceRange, vehicleFilter, tempFilter, matchMode, acceptedIds, laterIds]);

  const myAcceptedToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (o) =>
        o.driverId === (currentDriver?.id ?? driverId) &&
        new Date(o.matchedAt ?? o.createdAt).toDateString() === today,
    );
  }, [orders, currentDriver, driverId]);

  const mapCenter: [number, number] = currentDriver
    ? [currentDriver.currentLat, currentDriver.currentLng]
    : [31.2304, 121.4737];

  const handleAccept = (orderId: string) => {
    if (currentDriver) {
      assignDriver(orderId, currentDriver.id);
    }
    setAcceptedIds((prev) => new Set(prev).add(orderId));
  };

  const handleLater = (orderId: string) => {
    setLaterIds((prev) => new Set(prev).add(orderId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">加载订单大厅中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-[1920px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              订单大厅
            </h1>
            <span className="hex-tag">{matchMode === 'SMART' ? '智能推荐模式' : '全部列表模式'}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 font-mono">
            共 {ordersWithMyMatch.length} 个可接订单 · 已为您按匹配度排序
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <div className="industrial-card px-3 py-2 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-orange-400" />
            <span>今日已接</span>
            <span className="font-display text-orange-400 font-bold text-sm">
              {myAcceptedToday.length + acceptedIds.size}
            </span>
            <span>单</span>
          </div>
          <div className="industrial-card px-3 py-2 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-signal-green" />
            <span>今日收入</span>
            <span className="font-display text-signal-green font-bold text-sm">
              {formatMoney(
                myAcceptedToday.reduce((s, o) => s + o.totalPrice, 0) +
                  Array.from(acceptedIds).reduce((s, id) => {
                    const o = orders.find((x) => x.id === id);
                    return s + (o?.totalPrice ?? 0);
                  }, 0),
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5 min-w-0">
          <div className="industrial-card p-4 corner-brackets">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">筛选</span>
              </div>

              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {VEHICLE_FILTERS.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => setVehicleFilter(v.value)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-sm border ${
                        vehicleFilter === v.value
                          ? 'bg-orange-500/15 border-orange-500/60 text-orange-400 shadow-glow-orange-sm'
                          : 'bg-ink-950/50 border-ink-600/50 text-slate-400 hover:text-white hover:border-ink-500'
                      }`}
                    >
                      <span className="mr-1">{v.icon}</span>
                      {v.label}
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-ink-600 mx-1 hidden md:block" />

                <div className="flex flex-wrap gap-1">
                  {TEMP_FILTERS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTempFilter(t.value)}
                      className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-sm border ${
                        tempFilter === t.value
                          ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-400'
                          : 'bg-ink-950/50 border-ink-600/50 text-slate-400 hover:text-white hover:border-ink-500'
                      }`}
                    >
                      <span className="mr-1">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 flex-1 md:flex-none md:w-48">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 shrink-0">距离</span>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    value={distanceRange}
                    onChange={(e) => setDistanceRange(+e.target.value)}
                    className="flex-1 accent-orange-500 h-1"
                  />
                  <span className="text-xs font-mono text-orange-400 font-bold w-10 text-right shrink-0">
                    {distanceRange}km
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-ink-950/80 border border-ink-600/60 rounded-sm p-1 shrink-0">
                  <button
                    onClick={() => setMatchMode('SMART')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-all rounded-sm flex items-center gap-1.5 ${
                      matchMode === 'SMART'
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    智能推荐
                  </button>
                  <button
                    onClick={() => setMatchMode('ALL')}
                    className={`px-3 py-1.5 text-xs font-semibold transition-all rounded-sm flex items-center gap-1.5 ${
                      matchMode === 'ALL'
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    全部列表
                  </button>
                </div>
              </div>
            </div>
          </div>

          {ordersWithMyMatch.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ordersWithMyMatch.map(({ order, myMatch }) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  myCandidate={myMatch}
                  onAccept={() => handleAccept(order.id)}
                  onLater={() => handleLater(order.id)}
                />
              ))}
            </div>
          ) : (
            <div className="industrial-card p-12 text-center">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <div className="text-sm text-slate-500 mb-2">当前筛选条件下没有可接订单</div>
              <div className="text-xs text-slate-600 font-mono">
                请尝试调整车型、温度或距离筛选条件
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="sticky top-5 space-y-5">
            <div className="industrial-card overflow-hidden corner-brackets">
              <div className="px-4 py-3 border-b border-ink-600/60 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  当前位置
                </h3>
                <span className="text-[10px] text-signal-green font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
                  GPS LOCK
                </span>
              </div>
              <div className="h-[300px]">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  {currentDriver && (
                    <>
                      <Circle
                        center={[currentDriver.currentLat, currentDriver.currentLng]}
                        radius={distanceRange * 1000}
                        pathOptions={{
                          color: '#F97316',
                          fillColor: '#F97316',
                          fillOpacity: 0.06,
                          weight: 1,
                          opacity: 0.4,
                          dashArray: '4,4',
                        }}
                      />
                      <Marker position={[currentDriver.currentLat, currentDriver.currentLng]}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-bold text-orange-400 mb-1">{currentDriver.name}</div>
                            <div className="text-xs text-slate-400">{currentDriver.licensePlate}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {currentDriver.vehicleTypeName}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                      {ordersWithMyMatch.slice(0, 8).map(({ order, myMatch }) => {
                        const pickup = order.stops[0];
                        return (
                          <Marker
                            key={order.id}
                            position={[pickup.lat, pickup.lng]}
                          >
                            <Popup>
                              <div className="text-xs">
                                <div className="font-bold text-orange-400 mb-1">
                                  {order.cargoName.slice(0, 10)}
                                </div>
                                <div className="text-slate-400">匹配度 {myMatch.overallScore}</div>
                                <div className="text-slate-400">{myMatch.distanceKm}km</div>
                                <div className="text-signal-green font-display font-bold mt-1">
                                  {formatMoney(order.totalPrice)}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </>
                  )}
                </MapContainer>
              </div>
              <div className="px-4 py-3 bg-ink-950/50 border-t border-ink-600/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">您的位置</span>
                  <span className="text-white font-mono">
                    {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-slate-500">搜索半径</span>
                  <span className="text-orange-400 font-mono">{distanceRange}km</span>
                </div>
              </div>
            </div>

            <div className="industrial-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">今日战绩</h3>
                <span className="hex-tag">TODAY</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-ink-950/60 p-3 rounded-sm border border-ink-600/30 text-center">
                  <div className="flex items-center justify-center gap-1 text-signal-green mb-1">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="font-display text-2xl font-bold text-white">
                    {myAcceptedToday.length + acceptedIds.size}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">已接单数</div>
                </div>
                <div className="bg-ink-950/60 p-3 rounded-sm border border-ink-600/30 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="font-display text-2xl font-bold text-orange-400">
                    {(
                      myAcceptedToday.reduce((s, o) => s + o.totalPrice, 0) +
                      Array.from(acceptedIds).reduce((s, id) => {
                        const o = orders.find((x) => x.id === id);
                        return s + (o?.totalPrice ?? 0);
                      }, 0)
                    ).toFixed(0)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">总收入 元</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-ink-600/30">
                  <span className="text-slate-500">等待接单</span>
                  <span className="text-white font-mono">{ordersWithMyMatch.length} 单</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-ink-600/30">
                  <span className="text-slate-500">平均匹配度</span>
                  <span className="text-orange-400 font-display font-bold">
                    {ordersWithMyMatch.length > 0
                      ? (ordersWithMyMatch.reduce((s, r) => s + r.myMatch.overallScore, 0) / ordersWithMyMatch.length).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">最近单均价</span>
                  <span className="text-signal-green font-mono">
                    {myAcceptedToday.length > 0
                      ? formatMoney(myAcceptedToday.reduce((s, o) => s + o.totalPrice, 0) / myAcceptedToday.length)
                      : '--'}
                  </span>
                </div>
              </div>
            </div>

            <div className="industrial-card p-4">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-3">
                快速筛选
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setVehicleFilter('ALL');
                    setTempFilter('ALL');
                    setDistanceRange(30);
                    setMatchMode('SMART');
                  }}
                  className="w-full py-2 text-xs text-slate-300 bg-ink-950/50 border border-ink-600/40 rounded-sm hover:border-orange-500/40 hover:text-orange-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重置全部筛选
                </button>
                <button
                  onClick={() => {
                    setDistanceRange(10);
                    setMatchMode('SMART');
                  }}
                  className="w-full py-2 text-xs text-slate-300 bg-ink-950/50 border border-ink-600/40 rounded-sm hover:border-cyan-500/40 hover:text-cyan-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  只看10km内高匹配
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
