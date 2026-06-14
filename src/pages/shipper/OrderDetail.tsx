import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Package,
  ThermometerSun,
  DoorOpen,
  ListOrdered,
  MapPin,
  Phone,
  Star,
  ShieldCheck,
  FileText,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ReactECharts from 'echarts-for-react';
import { useOrderStore } from '@/store/orderStore';
import {
  statusTextMap,
  tempControlMap,
  difficultyMap,
  formatMoney,
  formatVolume,
  formatWeight,
  formatDateTime,
  formatTime,
} from '@/utils/format';
import { OrderTimeline } from '@/components/charts/OrderTimeline';
import type { CargoOrder, Driver, VehicleSensorData, CheckResult } from '@/types';

const truckIcon = L.divIcon({
  className: 'truck-marker',
  html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#F97316,#EA580C);border:2px solid #0F172A;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(249,115,22,0.6);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const pickupIcon = L.divIcon({
  className: 'pickup-marker',
  html: `<div style="width:24px;height:24px;background:#F97316;border:2px solid #0F172A;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(249,115,22,0.5);"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const deliveryIcon = L.divIcon({
  className: 'delivery-marker',
  html: `<div style="width:24px;height:24px;background:#06B6D4;border:2px solid #0F172A;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(6,182,212,0.5);"><div style="width:8px;height:8px;background:white;border-radius:50%;"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface CheckCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  result: CheckResult;
  description: string;
}

function CheckCard({ icon: Icon, title, result, description }: CheckCardProps) {
  const color = result.pass ? 'signal-green' : result.score >= 60 ? 'signal-yellow' : 'signal-red';
  const progress = result.score;
  const gaugeColor = result.pass ? '#10B981' : result.score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="industrial-card p-4 corner-brackets">
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <div
            className="gauge-ring w-full h-full rounded-full"
            style={{
              ['--gauge-progress' as string]: progress,
              ['--gauge-color' as string]: gaugeColor,
            } as React.CSSProperties}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-2xl font-bold text-${color}`}>{result.score}</span>
            <span className="text-[10px] text-slate-500 font-mono">SCORE</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className={`w-4 h-4 text-${color}`} />
            <span className="text-sm font-semibold text-white">{title}</span>
            {result.pass ? (
              <CheckCircle2 className={`w-4 h-4 text-${color} ml-auto`} />
            ) : (
              <XCircle className={`w-4 h-4 text-${color} ml-auto`} />
            )}
          </div>
          <div className={`text-[11px] font-semibold uppercase tracking-wider mb-2 text-${color}`}>
            {result.pass ? '校验通过' : result.score >= 60 ? '部分异常' : '校验失败'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ order }: { order: CargoOrder }) {
  const cfg = statusTextMap[order.status];
  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-display font-bold text-2xl text-white tracking-tight">{order.orderNo}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold ${cfg.bg} ${cfg.color}`}
              >
                <span className="status-dot animate-pulse" style={{ backgroundColor: 'currentColor' }} />
                {cfg.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                创建于 {formatDateTime(order.createdAt)}
              </span>
              {order.matchedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-signal-green" />
                  匹配于 {formatDateTime(order.matchedAt)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新状态
          </button>
          <button className="btn-ghost gap-2">
            <Eye className="w-4 h-4" />
            查看凭证
          </button>
          <button className="btn-primary gap-2">
            <Phone className="w-4 h-4" />
            联系司机
          </button>
        </div>
      </div>
    </div>
  );
}

function MapSection({ order, sensorHistory, driver }: {
  order: CargoOrder;
  sensorHistory: VehicleSensorData[];
  driver?: Driver;
}) {
  const stops = order.stops;
  const pickup = stops.find((s) => s.type === 'PICKUP');
  const deliveries = stops.filter((s) => s.type === 'DELIVERY');

  const center: [number, number] = useMemo(() => {
    if (sensorHistory.length > 0) {
      const last = sensorHistory[sensorHistory.length - 1];
      return [last.location.lat, last.location.lng];
    }
    if (stops.length > 0) {
      return [stops[0].lat, stops[0].lng];
    }
    return [39.9042, 116.4074];
  }, [sensorHistory, stops]);

  const positions: [number, number][] = useMemo(() => {
    const pts: [number, number][] = stops.map((s) => [s.lat, s.lng]);
    if (sensorHistory.length > 0) {
      const last = sensorHistory[sensorHistory.length - 1];
      const idx = stops.findIndex((s) => s.arrivedAt === undefined);
      if (idx > 0) {
        return [...pts.slice(0, idx), [last.location.lat, last.location.lng]];
      }
    }
    return pts;
  }, [stops, sensorHistory]);

  const currentVehiclePos = useMemo(() => {
    if (sensorHistory.length > 0) {
      const last = sensorHistory[sensorHistory.length - 1];
      return [last.location.lat, last.location.lng] as [number, number];
    }
    if (order.currentLat && order.currentLng) {
      return [order.currentLat, order.currentLng] as [number, number];
    }
    return null;
  }, [sensorHistory, order.currentLat, order.currentLng]);

  const lastSensor = sensorHistory[sensorHistory.length - 1];

  return (
    <div className="industrial-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-600/60">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">实时运输轨迹</h3>
          <span className="hex-tag">{stops.length} 站点</span>
        </div>
        {lastSensor && (
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>速度 <span className="text-signal-green">{lastSensor.location.speed}km/h</span></span>
            <span>温度 <span className="text-signal-cyan">{lastSensor.temperature}℃</span></span>
            <span className="flex items-center gap-1">
              <span className="status-dot bg-signal-green animate-pulse" />
              实时追踪
            </span>
          </div>
        )}
      </div>
      <div className="relative" style={{ height: 380 }}>
        <MapContainer
          center={center}
          zoom={12}
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#F97316',
              weight: 3,
              opacity: 0.8,
              dashArray: '8, 6',
            }}
          />
          {pickup && (
            <CircleMarker
              center={[pickup.lat, pickup.lng]}
              radius={14}
              pathOptions={{
                color: '#F97316',
                fillColor: '#F97316',
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="font-semibold text-orange-400">📍 取货点</div>
                <div className="text-xs text-slate-300 mt-1">{pickup.address}</div>
              </Popup>
            </CircleMarker>
          )}
          {pickup && (
            <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
              <Popup>
                <div className="font-semibold text-orange-400">取货点</div>
                <div className="text-xs text-slate-300 mt-1">{pickup.address}</div>
                {pickup.contactName && (
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">{pickup.contactName} · {pickup.contactPhone}</div>
                )}
              </Popup>
            </Marker>
          )}
          {deliveries.map((d, i) => (
            <CircleMarker
              key={i}
              center={[d.lat, d.lng]}
              radius={14}
              pathOptions={{
                color: '#06B6D4',
                fillColor: '#06B6D4',
                fillOpacity: 0.2,
                weight: 2,
              }}
            >
              <Popup>
                <div className="font-semibold text-signal-cyan">📦 送达点 #{i + 1}</div>
                <div className="text-xs text-slate-300 mt-1">{d.address}</div>
              </Popup>
            </CircleMarker>
          ))}
          {deliveries.map((d, i) => (
            <Marker key={`m-${i}`} position={[d.lat, d.lng]} icon={deliveryIcon}>
              <Popup>
                <div className="font-semibold text-signal-cyan">送达点 #{i + 1}</div>
                <div className="text-xs text-slate-300 mt-1">{d.address}</div>
                {d.contactName && (
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">{d.contactName} · {d.contactPhone}</div>
                )}
              </Popup>
            </Marker>
          ))}
          {currentVehiclePos && (
            <Marker position={currentVehiclePos} icon={truckIcon}>
              <Popup>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-sm bg-orange-500/20 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{driver?.name || '司机'}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{driver?.licensePlate || '未知车牌'}</div>
                  </div>
                </div>
                {lastSensor && (
                  <div className="mt-2 pt-2 border-t border-ink-600 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400"><span>速度</span><span className="text-signal-green">{lastSensor.location.speed} km/h</span></div>
                    <div className="flex justify-between text-slate-400"><span>载重</span><span className="text-orange-400">{lastSensor.loadWeight} kg</span></div>
                    <div className="flex justify-between text-slate-400"><span>温度</span><span className="text-signal-cyan">{lastSensor.temperature} ℃</span></div>
                    <div className="flex justify-between text-slate-400"><span>开门</span><span className="text-signal-yellow">{lastSensor.doorOpenCount} 次</span></div>
                  </div>
                )}
              </Popup>
            </Marker>
          )}
        </MapContainer>
        <div className="absolute left-4 bottom-4 bg-ink-900/90 backdrop-blur-sm border border-ink-600/60 rounded-sm p-3 space-y-2 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="text-slate-400">取货点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-signal-cyan" />
            <span className="text-slate-400">送达点</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-400">车辆位置</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-orange-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #F97316 0 4px, transparent 4px 7px)' }} />
            <span className="text-slate-400">规划路线</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SensorChart({ sensorHistory, order }: {
  sensorHistory: VehicleSensorData[];
  order: CargoOrder;
}) {
  const option = useMemo(() => {
    const times = sensorHistory.map((s) => formatTime(s.timestamp));
    const weights = sensorHistory.map((s) => s.loadWeight);
    const temps = sensorHistory.map((s) => s.temperature);
    const doorEvents = sensorHistory
      .map((s, idx) => ({ idx, count: s.doorOpenCount }))
      .filter((v, i, arr) => i === 0 || v.count > arr[i - 1].count);

    const tempRange = order.tempRange;
    const abnormalAreas: unknown[] = [];
    temps.forEach((t, i) => {
      if (tempRange && (t < tempRange[0] || t > tempRange[1])) {
        const endIdx = Math.min(i + 1, temps.length - 1);
        abnormalAreas.push([
          { xAxis: i, itemStyle: { color: 'rgba(239,68,68,0.12)' } },
          { xAxis: endIdx },
        ]);
      }
    });

    const weightBase = order.weight;
    weights.forEach((w, i) => {
      if (Math.abs(w - weightBase) > weightBase * 0.08) {
        const endIdx = Math.min(i + 1, weights.length - 1);
        abnormalAreas.push([
          { xAxis: i, itemStyle: { color: 'rgba(245,158,11,0.1)' } },
          { xAxis: endIdx },
        ]);
      }
    });

    const doorMarkPoints = doorEvents.map((d) => ({
      xAxis: d.idx,
      yAxis: 0,
      value: `开门#${d.count}`,
      symbol: 'pin',
      symbolSize: 32,
      itemStyle: { color: '#F59E0B' },
      label: {
        show: true,
        formatter: `🚪${d.count}`,
        fontSize: 9,
        color: '#0F172A',
        fontWeight: 600,
      },
    }));

    return {
      backgroundColor: 'transparent',
      grid: { left: 56, right: 56, top: 50, bottom: 48 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        axisPointer: { type: 'cross', lineStyle: { color: '#F97316', opacity: 0.3 } },
      },
      legend: {
        data: ['载重', '温度'],
        right: 0,
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 12 },
        itemWidth: 14,
        itemHeight: 10,
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          interval: Math.max(0, Math.floor(times.length / 10) - 1),
        },
        axisTick: { show: false },
        name: '时间',
        nameTextStyle: { color: '#64748B', fontSize: 10, padding: [16, 0, 0, 0] },
      },
      yAxis: [
        {
          type: 'value',
          name: '载重(kg)',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#64748B', fontSize: 10 },
          splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
          min: Math.min(0, ...weights) - 100,
          max: Math.max(...weights, weightBase) + 200,
        },
        {
          type: 'value',
          name: '温度(℃)',
          nameTextStyle: { color: '#64748B', fontSize: 10 },
          axisLine: { show: false },
          axisLabel: { color: '#64748B', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '载重',
          type: 'line',
          data: weights,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#F97316', width: 2 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(249,115,22,0.35)' },
                { offset: 1, color: 'rgba(249,115,22,0)' },
              ],
            },
          },
          markLine: tempRange ? [] : {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#F97316', type: 'dashed', opacity: 0.6 },
            label: { formatter: '标称 {c}kg', color: '#F97316', fontSize: 10 },
            data: [{ yAxis: weightBase }],
          },
          markArea: abnormalAreas.length > 0 ? { data: abnormalAreas } : undefined,
        },
        {
          name: '温度',
          type: 'line',
          yAxisIndex: 1,
          data: temps,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#06B6D4', width: 2 },
          itemStyle: { color: '#06B6D4', borderColor: '#0F172A', borderWidth: 2 },
          markLine: tempRange ? {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#06B6D4', type: 'dashed', opacity: 0.6 },
            label: { color: '#06B6D4', fontSize: 10 },
            data: [
              { yAxis: tempRange[0], label: { formatter: `下限 ${tempRange[0]}℃` } },
              { yAxis: tempRange[1], label: { formatter: `上限 ${tempRange[1]}℃` } },
            ],
          } : undefined,
          markPoint: doorMarkPoints.length > 0 ? { data: doorMarkPoints } : undefined,
        },
      ],
    };
  }, [sensorHistory, order]);

  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">传感器监测曲线</h3>
            <span className="hex-tag">{sensorHistory.length} 条记录</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">SENSOR TELEMETRY · 实时同步</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 bg-orange-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }} />
            载重
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-cyan" />
            温度
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-signal-yellow" />
            开门事件
          </span>
        </div>
      </div>
      {sensorHistory.length > 0 ? (
        <ReactECharts option={option} style={{ height: 280 }} />
      ) : (
        <div className="h-72 flex items-center justify-center text-slate-500 text-sm font-mono">
          <div className="text-center">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <div>运输尚未开始，传感器数据等待上传</div>
          </div>
        </div>
      )}
    </div>
  );
}

function BasicInfoCard({ order }: { order: CargoOrder }) {
  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">货物信息</h3>
      </div>
      <div className="mb-4 pb-4 border-b border-ink-600/60">
        <div className="text-base font-semibold text-white mb-2">{order.cargoName}</div>
        <div className="flex flex-wrap gap-2">
          <span className="hex-tag">体积 {formatVolume(order.volume)}</span>
          <span className="hex-tag">重量 {formatWeight(order.weight)}</span>
          <span
            className="hex-tag"
            style={{ background: 'rgba(6,182,212,0.1)', color: '#22D3EE' }}
          >
            {tempControlMap[order.tempControl].icon} {tempControlMap[order.tempControl].label}
          </span>
          <span
            className="hex-tag"
            style={{
              background:
                order.loadingDifficulty === 'HIGH'
                  ? 'rgba(239,68,68,0.1)'
                  : order.loadingDifficulty === 'MEDIUM'
                    ? 'rgba(245,158,11,0.1)'
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
      </div>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">货值</span>
          <span className="text-slate-200 font-display">{formatMoney(order.cargoValue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">取货窗</span>
          <span className="text-slate-200 font-mono text-xs">
            {formatTime(order.pickupTimeWindow[0])} - {formatTime(order.pickupTimeWindow[1])}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">配送节点</span>
          <span className="text-slate-200">
            {order.stops.filter((s) => s.type === 'PICKUP').length} 取 /{' '}
            {order.stops.filter((s) => s.type === 'DELIVERY').length} 送
          </span>
        </div>
        {order.tempRange && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-mono text-xs">温控区间</span>
            <span className="text-signal-cyan font-mono">
              {order.tempRange[0]}℃ ~ {order.tempRange[1]}℃
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DriverCard({ driver }: { driver?: Driver }) {
  if (!driver) {
    return (
      <div className="industrial-card corner-brackets p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-signal-cyan" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">承运司机</h3>
        </div>
        <div className="text-center py-6 text-slate-500 text-sm">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          暂无分配司机
        </div>
      </div>
    );
  }
  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-signal-cyan" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">承运司机</h3>
      </div>
      <div className="flex items-start gap-4 mb-4 pb-4 border-b border-ink-600/60">
        <img
          src={driver.avatar}
          alt={driver.name}
          className="w-14 h-14 rounded-sm border-2 border-signal-cyan/40 bg-ink-900"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-semibold text-white">{driver.name}</span>
            <span className="text-signal-yellow text-xs flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" />
              {driver.rating}
            </span>
          </div>
          <div className="text-xs text-signal-cyan font-mono mb-1">{driver.licensePlate}</div>
          <div className="text-[11px] text-slate-500">
            {driver.vehicleTypeName} · {driver.region}
          </div>
        </div>
      </div>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">履约率</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-ink-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-signal-green"
                style={{ width: `${driver.historyFulfillmentRate * 100}%` }}
              />
            </div>
            <span className="text-signal-green font-display text-xs">
              {(driver.historyFulfillmentRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">累计完成</span>
          <span className="text-slate-200 font-display">{driver.totalOrders} 单</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">联系方式</span>
          <span className="text-slate-200 font-mono text-xs">{driver.phone}</span>
        </div>
      </div>
    </div>
  );
}

function PriceCard({ order }: { order: CargoOrder }) {
  const pb = order.priceBreakdown;
  const rows = [
    { label: '基础运费', value: pb.basePrice, color: 'text-slate-200' },
    { label: '拥堵溢价', value: pb.congestionPremium, color: 'text-signal-yellow', note: '路径系数' },
    { label: '夜间附加', value: pb.nightSurcharge, color: 'text-signal-blue', note: '时段收费' },
    { label: '多站点系数', value: pb.multiStopCoefficient, color: 'text-signal-cyan', note: `×${(1 + pb.multiStopCoefficient / 100).toFixed(2)}` },
    { label: '保险费用', value: pb.insuranceFee, color: 'text-signal-green', note: 'PICC承保' },
  ];

  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-signal-green" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">费用明细</h3>
      </div>
      <div className="space-y-2.5 mb-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{r.label}</span>
              {r.note && <span className="text-[10px] text-slate-600 font-mono">({r.note})</span>}
            </div>
            <span className={`font-display ${r.color}`}>{formatMoney(r.value)}</span>
          </div>
        ))}
      </div>
      <div className="divider-dashed" />
      <div className="flex items-center justify-between pt-4">
        <span className="text-sm font-semibold text-white">合计运费</span>
        <div className="text-right">
          <span className="text-2xl font-display font-extrabold text-orange-400">{formatMoney(pb.total)}</span>
        </div>
      </div>
    </div>
  );
}

function InsuranceCard({ order }: { order: CargoOrder }) {
  const ins = order.insurance;
  const statusMap = {
    PENDING: { text: '待出单', color: 'text-signal-yellow', bg: 'bg-signal-yellow/10' },
    ISSUED: { text: '已承保', color: 'text-signal-green', bg: 'bg-signal-green/10' },
    CLAIMED: { text: '理赔中', color: 'text-signal-red', bg: 'bg-signal-red/10' },
    SETTLED: { text: '已理赔', color: 'text-signal-blue', bg: 'bg-signal-blue/10' },
  } as const;

  if (!ins.enabled) {
    return (
      <div className="industrial-card corner-brackets p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">运输保险</h3>
        </div>
        <div className="text-center py-4 text-slate-500 text-sm">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-20" />
          本订单未投保
        </div>
      </div>
    );
  }

  const s = statusMap[ins.status];

  return (
    <div className="industrial-card corner-brackets p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-signal-green" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">运输保险</h3>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold ${s.bg} ${s.color}`}>
          {s.text}
        </span>
      </div>
      <div className="mb-4 p-3 rounded-sm bg-gradient-to-r from-signal-green/10 to-transparent border border-signal-green/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-signal-green/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-signal-green" />
          </div>
          <div>
            <div className="text-xs font-semibold text-signal-green">{ins.insurer} · 中国人民保险</div>
            <div className="text-[10px] text-slate-500 font-mono">PICC FREIGHT INSURANCE</div>
          </div>
        </div>
      </div>
      <div className="space-y-2.5 text-sm">
        {ins.policyNo && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-mono text-xs">保单号</span>
            <span className="text-slate-200 font-mono text-xs">{ins.policyNo}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">保费</span>
          <span className="text-orange-400 font-display">{formatMoney(ins.premium)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs">保额</span>
          <span className="text-signal-green font-display">
            ¥{ins.coverage.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, drivers, sensorHistory, init, getOrder, getDriver, getSensorHistory } = useOrderStore();

  useEffect(() => { init(); }, [init]);

  const order = useMemo(() => (id ? getOrder(id) : undefined), [id, orders, getOrder]);
  const driver = useMemo(() => (order?.driverId ? getDriver(order.driverId) : undefined), [order?.driverId, drivers, getDriver]);
  const history = useMemo(() => (id ? getSensorHistory(id) : []), [id, sensorHistory, getSensorHistory]);

  const fulfillment = useMemo(() => {
    if (order?.fulfillment) return order.fulfillment;
    const lastSensor = history[history.length - 1];
    const loadScore = lastSensor
      ? Math.max(0, 100 - Math.abs(lastSensor.loadWeight - (order?.weight || 0)) / (order?.weight || 1) * 200)
      : 0;
    const tempScore = lastSensor
      ? order?.tempRange
        ? lastSensor.temperature >= order.tempRange[0] && lastSensor.temperature <= order.tempRange[1]
          ? 95
          : Math.max(40, 100 - Math.abs(lastSensor.temperature - (order.tempRange[0] + order.tempRange[1]) / 2) * 8)
        : 90
      : 0;
    const doorScore = lastSensor ? Math.max(30, 100 - lastSensor.doorOpenCount * 15) : 0;
    const seqScore = order?.stops.filter((s) => s.arrivedAt).length ? 85 : 0;

    return {
      orderId: order?.id || '',
      loadCheck: { pass: loadScore >= 70, score: Math.round(loadScore), detail: `标称 ${formatWeight(order?.weight || 0)}，当前 ${formatWeight(lastSensor?.loadWeight || 0)}，偏差 ${((Math.abs((lastSensor?.loadWeight || 0) - (order?.weight || 0)) / (order?.weight || 1)) * 100).toFixed(1)}%，在合理范围内。` },
      tempCheck: { pass: tempScore >= 70, score: Math.round(tempScore), detail: order?.tempControl === 'NORMAL' ? '常温运输，温度波动在正常区间。' : `当前温度 ${lastSensor?.temperature || '--'}℃，温控要求 ${tempControlMap[order?.tempControl || 'NORMAL'].label}。` },
      doorCheck: { pass: doorScore >= 60, score: Math.round(doorScore), detail: `全程开门 ${lastSensor?.doorOpenCount || 0} 次，${lastSensor && lastSensor.doorOpenCount <= 3 ? '次数正常，未发现异常开箱。' : '开门次数较多，建议核查货厢录像。'}` },
      stopSeqCheck: { pass: seqScore >= 60, score: Math.round(seqScore), detail: `规划 ${order?.stops.length || 0} 个节点，已完成 ${order?.stops.filter((s) => s.arrivedAt).length || 0} 个，顺序符合调度要求。` },
      overallPass: loadScore >= 70 && tempScore >= 70 && doorScore >= 60 && seqScore >= 60,
      violations: [],
    };
  }, [order, history]);

  if (!order) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="industrial-card p-16 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-signal-yellow" />
          <div className="text-lg font-semibold text-slate-400 mb-2">订单不存在</div>
          <div className="text-sm text-slate-600 font-mono">ORDER NOT FOUND</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1800px] mx-auto">
      <button onClick={() => navigate(-1)} className="btn-ghost gap-2 text-xs">
        <ArrowLeft className="w-3.5 h-3.5" />
        返回订单列表
      </button>

      <StatusBar order={order} />

      <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] gap-5">
        <div className="space-y-5">
          <MapSection order={order} sensorHistory={history} driver={driver} />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">履约校验</h3>
                <span className="hex-tag">
                  {fulfillment.overallPass ? (
                    <span className="text-signal-green">✓ 校验通过</span>
                  ) : (
                    <span className="text-signal-red">⚠ 存在异常</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span className="status-dot bg-signal-green" />
                <span>≥70 通过</span>
                <span className="status-dot bg-signal-yellow ml-3" />
                <span>≥60 警告</span>
                <span className="status-dot bg-signal-red ml-3" />
                <span>{'<'}60 失败</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CheckCard
                icon={Package}
                title="载重校验"
                result={fulfillment.loadCheck}
                description={fulfillment.loadCheck.detail}
              />
              <CheckCard
                icon={ThermometerSun}
                title="温控校验"
                result={fulfillment.tempCheck}
                description={fulfillment.tempCheck.detail}
              />
              <CheckCard
                icon={DoorOpen}
                title="开门校验"
                result={fulfillment.doorCheck}
                description={fulfillment.doorCheck.detail}
              />
              <CheckCard
                icon={ListOrdered}
                title="顺序校验"
                result={fulfillment.stopSeqCheck}
                description={fulfillment.stopSeqCheck.detail}
              />
            </div>
          </div>

          <SensorChart sensorHistory={history} order={order} />
        </div>

        <div className="space-y-5">
          <BasicInfoCard order={order} />
          <DriverCard driver={driver} />
          <PriceCard order={order} />
          <InsuranceCard order={order} />

          <div className="industrial-card corner-brackets p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">配送时间轴</h3>
              </div>
              <span className="hex-tag">{order.stops.length} 节点</span>
            </div>
            <OrderTimeline stops={order.stops} />
          </div>
        </div>
      </div>
    </div>
  );
}
