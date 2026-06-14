import { useEffect, useMemo, useState } from 'react';
import type { CargoOrder } from '@/types';
import {
  User,
  Battery,
  MapPin,
  DollarSign,
  Calendar,
  Truck,
  Package,
  Thermometer,
  Gauge,
  DoorOpen,
  Clock,
  Radio,
  Wifi,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { SensorGauge } from '@/components/charts/SensorGauge';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import {
  formatMoney,
  formatWeight,
  formatTime,
  minutesAgo,
  statusTextMap,
  tempControlMap,
} from '@/utils/format';
import type { DriverStatus, TempControl, VehicleSensorData } from '@/types';

type WorkStatus = 'IDLE' | 'ON_DUTY' | 'IN_TRANSIT';

const workStatusConfig: Record<WorkStatus, { label: string; color: string; dot: string }> = {
  IDLE: { label: '离线', color: 'text-slate-400', dot: 'bg-slate-500' },
  ON_DUTY: { label: '在线', color: 'text-signal-green', dot: 'bg-signal-green' },
  IN_TRANSIT: { label: '配送中', color: 'text-orange-400', dot: 'bg-orange-500' },
};

function StatusToggle({
  status,
  onChange,
}: {
  status: WorkStatus;
  onChange: (s: WorkStatus) => void;
}) {
  const options: WorkStatus[] = ['IDLE', 'ON_DUTY', 'IN_TRANSIT'];
  return (
    <div className="flex items-center gap-1 bg-ink-950/80 border border-ink-600/60 rounded-sm p-1">
      {options.map((opt) => {
        const active = status === opt;
        const cfg = workStatusConfig[opt];
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`relative px-4 py-1.5 text-xs font-semibold transition-all duration-200 rounded-sm ${
              active ? 'bg-ink-800 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot} ${active ? 'animate-pulse' : ''}`} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

function DoorEventItem({
  time,
  duration,
  stopName,
}: {
  time: string;
  duration: number;
  stopName: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-ink-600/30 last:border-0">
      <div className="w-8 h-8 flex items-center justify-center bg-orange-500/10 rounded-sm shrink-0">
        <DoorOpen className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="font-mono">{time}</span>
          <span className="text-slate-600">|</span>
          <span className="text-orange-400 font-mono">{duration}s</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{stopName}</div>
      </div>
    </div>
  );
}

function TaskCard({
  order,
  onClick,
  highlight,
}: {
  order: CargoOrder;
  onClick: () => void;
  highlight?: boolean;
}) {
  const pickup = order.stops.find((s) => s.type === 'PICKUP');
  const deliveries = order.stops.filter((s) => s.type === 'DELIVERY');
  const cfg = statusTextMap[order.status];

  return (
    <div
      onClick={onClick}
      className={`industrial-card p-4 cursor-pointer transition-all duration-200 hover:border-orange-500/40 hover:shadow-glow-orange-sm ${
        highlight ? 'corner-brackets border-orange-500/40' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-orange-400">{order.orderNo}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
            <span className="status-dot animate-pulse" style={{ backgroundColor: 'currentColor' }} />
            {cfg.label}
          </span>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-bold text-orange-400">{formatMoney(order.totalPrice)}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm text-white font-medium mb-1">{order.cargoName}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hex-tag">{order.volume}m³</span>
          <span className="hex-tag">{formatWeight(order.weight)}</span>
          <span className="text-xs text-slate-500">
            {tempControlMap[order.tempControl].icon} {tempControlMap[order.tempControl].label}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <div className="text-slate-300 truncate">{pickup?.address.slice(0, 28)}...</div>
        </div>
        {deliveries.slice(0, 2).map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-sm bg-signal-green" />
            </div>
            <div className="text-slate-400 truncate">{d.address.slice(0, 28)}...</div>
          </div>
        ))}
        {deliveries.length > 2 && (
          <div className="pl-6 text-[11px] text-orange-400 font-mono">+{deliveries.length - 2} 个配送点</div>
        )}
      </div>

      <div className="divider-dashed my-3" />
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {minutesAgo(order.createdAt)}
        </span>
        <span className="flex items-center gap-1 text-orange-400 group-hover:text-orange-300">
          查看详情 <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const { orders, drivers, init, loading, getSensorHistory } = useOrderStore();
  const [workStatus, setWorkStatus] = useState<WorkStatus>('ON_DUTY');
  const [, forceTick] = useState(0);

  useEffect(() => {
    init();
    const t = setInterval(() => forceTick((x) => x + 1), 2500);
    return () => clearInterval(t);
  }, [init]);

  const driverId = user?.id ?? 'drv_demo';

  const currentDriver = useMemo(() => {
    const found = drivers.find((d) => d.id === driverId);
    if (found) return found;
    if (drivers.length > 0) return drivers[0];
    return null;
  }, [drivers, driverId]);

  const myOrders = useMemo(() => orders.filter((o) => o.driverId === (currentDriver?.id ?? driverId)), [orders, currentDriver, driverId]);

  const activeOrder = useMemo(
    () =>
      myOrders.find(
        (o) =>
          o.status === 'IN_TRANSIT' ||
          o.status === 'PICKING_UP' ||
          o.status === 'PARTIAL_DELIVERED' ||
          o.status === 'ACCEPTED',
      ) ?? myOrders[0],
    [myOrders],
  );

  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return myOrders.filter(
      (o) =>
        (o.status === 'COMPLETED' || o.status === 'DELIVERED' || o.status === 'FULFILLMENT_CHECKING') &&
        new Date(o.createdAt).toDateString() === today,
    );
  }, [myOrders]);

  const sensorData = useMemo<VehicleSensorData[]>(() => {
    if (activeOrder) return getSensorHistory(activeOrder.id);
    const otherActive = orders.find((o) => o.status === 'IN_TRANSIT' || o.status === 'PICKING_UP');
    return otherActive ? getSensorHistory(otherActive.id) : [];
  }, [activeOrder, orders, getSensorHistory]);

  const latestSensor = sensorData[sensorData.length - 1];
  const recentSensor = sensorData.slice(-72);

  const batteryLevel = useMemo(() => {
    if (!currentDriver) return 78;
    const base = currentDriver.currentStatus === 'IN_TRANSIT' ? 65 : 85;
    return Math.max(15, Math.min(100, base - Math.floor(Math.random() * 8)));
  }, [currentDriver, latestSensor?.timestamp]);

  const maxWeight = currentDriver?.maxWeight ?? 8000;
  const tempCapability: TempControl[] = currentDriver?.tempCapability ?? ['NORMAL'];

  const tempZones = useMemo(() => {
    if (tempCapability.includes('DEEP_FREEZE')) {
      return [
        { from: -40, to: -25, color: '#06B6D4' },
        { from: -25, to: -10, color: '#3B82F6' },
        { from: -10, to: 10, color: '#10B981' },
        { from: 10, to: 40, color: '#EF4444' },
      ];
    }
    if (tempCapability.includes('REFRIGERATED')) {
      return [
        { from: -40, to: -20, color: '#06B6D4' },
        { from: -20, to: 0, color: '#3B82F6' },
        { from: 0, to: 15, color: '#10B981' },
        { from: 15, to: 40, color: '#EF4444' },
      ];
    }
    if (tempCapability.includes('FRESH')) {
      return [
        { from: -40, to: 0, color: '#06B6D4' },
        { from: 0, to: 10, color: '#10B981' },
        { from: 10, to: 25, color: '#F59E0B' },
        { from: 25, to: 40, color: '#EF4444' },
      ];
    }
    return [
      { from: -40, to: 5, color: '#3B82F6' },
      { from: 5, to: 28, color: '#10B981' },
      { from: 28, to: 40, color: '#EF4444' },
    ];
  }, [tempCapability]);

  const loadZones = [
    { from: 0, to: maxWeight * 0.8, color: '#10B981' },
    { from: maxWeight * 0.8, to: maxWeight * 0.95, color: '#F59E0B' },
    { from: maxWeight * 0.95, to: maxWeight, color: '#EF4444' },
  ];

  const speedZones = [
    { from: 0, to: 60, color: '#10B981' },
    { from: 60, to: 90, color: '#F59E0B' },
    { from: 90, to: 120, color: '#EF4444' },
  ];

  const batteryZones = [
    { from: 0, to: 20, color: '#EF4444' },
    { from: 20, to: 50, color: '#F59E0B' },
    { from: 50, to: 100, color: '#10B981' },
  ];

  const loadCurveOption = useMemo(() => {
    const times = recentSensor.map((s) => formatTime(s.timestamp));
    const weights = recentSensor.map((s) => +s.loadWeight.toFixed(1));
    return {
      backgroundColor: 'transparent',
      grid: { left: 52, right: 20, top: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>载重: <span style="color:#F97316;font-weight:600">${p.value}kg</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: { color: '#64748B', fontSize: 10, interval: Math.floor(times.length / 6) },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'kg',
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: weights,
          smooth: true,
          showSymbol: false,
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
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#EF4444', type: 'dashed', width: 1 },
            data: [{ yAxis: maxWeight * 0.95, label: { formatter: '警戒', color: '#EF4444', fontSize: 10, position: 'insideEndTop' } }],
          },
        },
      ],
    };
  }, [recentSensor, maxWeight]);

  const tempCurveOption = useMemo(() => {
    const times = recentSensor.map((s) => formatTime(s.timestamp));
    const temps = recentSensor.map((s) => +s.temperature.toFixed(1));
    const tempMode = tempCapability.includes('DEEP_FREEZE')
      ? { normal: [-35, -25], label: '深冷区', color: '#06B6D4' }
      : tempCapability.includes('REFRIGERATED')
        ? { normal: [-22, -14], label: '冷藏区', color: '#3B82F6' }
        : tempCapability.includes('FRESH')
          ? { normal: [2, 8], label: '保鲜区', color: '#10B981' }
          : { normal: [10, 28], label: '常温区', color: '#64748B' };
    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 20, top: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>温度: <span style="color:${tempMode.color};font-weight:600">${p.value}℃</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: { color: '#64748B', fontSize: 10, interval: Math.floor(times.length / 6) },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '℃',
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        min: -40,
        max: 40,
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
      },
      visualMap: {
        show: false,
        pieces: [
          { lte: tempMode.normal[0] - 10, color: '#06B6D4' },
          { gt: tempMode.normal[0] - 10, lte: tempMode.normal[0], color: '#3B82F6' },
          { gt: tempMode.normal[0], lte: tempMode.normal[1], color: tempMode.color },
          { gt: tempMode.normal[1], lte: tempMode.normal[1] + 10, color: '#F59E0B' },
          { gt: tempMode.normal[1] + 10, color: '#EF4444' },
        ],
        outOfRange: { color: '#64748B' },
      },
      series: [
        {
          type: 'line',
          data: temps,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${tempMode.color}55` },
                { offset: 1, color: `${tempMode.color}00` },
              ],
            },
          },
          markArea: {
            silent: true,
            itemStyle: { color: `${tempMode.color}15` },
            data: [[{ yAxis: tempMode.normal[0] }, { yAxis: tempMode.normal[1] }]],
          },
        },
      ],
    };
  }, [recentSensor, tempCapability]);

  const earningsOption = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '今天'];
    const earnings = [380, 520, 450, 680, 590, 720, (completedToday.length * 280) + (currentDriver?.todayEarnings ?? 0)];
    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 16, top: 24, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B1220',
        borderColor: '#243049',
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>收入: <span style="color:#F97316;font-weight:600">¥${p.value}</span>`;
        },
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: { lineStyle: { color: '#243049' } },
        axisLabel: { color: '#64748B', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '¥',
        nameTextStyle: { color: '#64748B', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => v >= 1000 ? `${v / 1000}k` : v },
        splitLine: { lineStyle: { color: '#1A2238', type: 'dashed' } },
      },
      series: [
        {
          type: 'bar',
          data: earnings,
          barWidth: 22,
          itemStyle: {
            borderRadius: [2, 2, 0, 0],
            color: (params: any) => {
              if (params.dataIndex === earnings.length - 1) {
                return {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: '#FB923C' },
                    { offset: 1, color: '#F97316' },
                  ],
                };
              }
              return {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(249,115,22,0.55)' },
                  { offset: 1, color: 'rgba(249,115,22,0.1)' },
                ],
              };
            },
          },
          label: {
            show: true,
            position: 'top',
            color: '#F97316',
            fontSize: 10,
            fontFamily: 'Orbitron',
            fontWeight: 600,
            formatter: (p: any) => p.dataIndex === earnings.length - 1 ? `¥${p.value}` : '',
          },
        },
      ],
    };
  }, [completedToday.length, currentDriver?.todayEarnings]);

  const totalDoorOpens = latestSensor?.doorOpenCount ?? 0;
  const todayDoorOpens = Math.max(0, totalDoorOpens - Math.floor(Math.random() * 8));
  const lastDoorEvents = [
    { time: '14:32:18', duration: 145, stopName: '漕河泾开发区仓库 B区3号门' },
    { time: '12:15:42', duration: 92, stopName: '陆家嘴环路卸货点' },
    { time: '10:08:30', duration: 210, stopName: '莘庄工业区装货区' },
  ];

  const todayEarningsTotal = useMemo(() => {
    const base = completedToday.reduce((s, o) => s + o.totalPrice, 0);
    return base + (currentDriver?.todayEarnings ?? 0);
  }, [completedToday, currentDriver?.todayEarnings]);

  const todayExpected = todayEarningsTotal + (activeOrder && !['COMPLETED', 'DELIVERED'].includes(activeOrder.status) ? activeOrder.totalPrice : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm">装载传感器数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5 max-w-[1920px] mx-auto">
      <div className="industrial-card p-4 corner-brackets">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentDriver?.avatar ?? user?.avatar ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver'}
                alt="avatar"
                className="w-14 h-14 rounded-sm border-2 border-orange-500/50 bg-ink-900"
              />
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-ink-900 ${workStatusConfig[workStatus].dot} animate-pulse`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{currentDriver?.name ?? user?.name ?? '李师傅'}</h2>
                <span className="hex-tag">{currentDriver?.vehicleTypeName ?? '4.2米厢货'}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-orange-400" />
                  {currentDriver?.licensePlate ?? user?.company ?? '沪A·D8823F'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {currentDriver?.region ?? '上海·浦东'}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400" />
                  {currentDriver?.rating ?? 4.8}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">今日收入</div>
              <div className="flex items-baseline gap-1">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <span className="font-display text-xl font-bold text-orange-400">{formatMoney(todayEarningsTotal)}</span>
              </div>
              <div className="text-[10px] text-signal-green font-mono flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" />
                预计 {formatMoney(todayExpected)}
              </div>
            </div>

            <StatusToggle status={workStatus} onChange={setWorkStatus} />
          </div>
        </div>
      </div>

      <div className="industrial-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-400 animate-pulse" />
              传感器监控中心
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              SENSOR CONTROL UNIT · 每2.5s采样 · 已同步 {recentSensor.length} 帧
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Wifi className="w-3.5 h-3.5 text-signal-green animate-pulse" />
            <span className="text-signal-green">LINK OK</span>
            <span className="text-slate-700">|</span>
            <span>{latestSensor ? formatTime(latestSensor.timestamp) : '--:--'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col items-center p-3 bg-ink-950/40 rounded-sm border border-ink-600/30">
            <SensorGauge
              value={latestSensor?.loadWeight ?? 0}
              max={maxWeight}
              label="载重 LOAD"
              unit="kg"
              zones={loadZones}
            />
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              限重 {formatWeight(maxWeight)}
            </div>
          </div>
          <div className="flex flex-col items-center p-3 bg-ink-950/40 rounded-sm border border-ink-600/30">
            <SensorGauge
              value={latestSensor?.temperature ?? 22}
              max={40}
              label="温度 TEMP"
              unit="℃"
              zones={tempZones}
            />
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              {tempCapability.includes('DEEP_FREEZE') ? '深冷模式' : tempCapability.includes('REFRIGERATED') ? '冷藏模式' : tempCapability.includes('FRESH') ? '保鲜模式' : '常温模式'}
            </div>
          </div>
          <div className="flex flex-col items-center p-3 bg-ink-950/40 rounded-sm border border-ink-600/30">
            <SensorGauge
              value={latestSensor?.location.speed ?? 0}
              max={120}
              label="车速 SPEED"
              unit="km/h"
              zones={speedZones}
            />
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              <Gauge className="w-3 h-3 inline mr-1" />
              限速 90km/h
            </div>
          </div>
          <div className="flex flex-col items-center p-3 bg-ink-950/40 rounded-sm border border-ink-600/30">
            <SensorGauge
              value={batteryLevel}
              max={100}
              label="电量 BATTERY"
              unit="%"
              zones={batteryZones}
            />
            <div className="mt-2 text-[10px] font-mono text-slate-500">
              <Battery className="w-3 h-3 inline mr-1" />
              续航约 {Math.floor(batteryLevel * 1.8)}km
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1">
            <div className="industrial-card p-4 h-full corner-brackets">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-orange-400" />
                  开门次数统计
                </h4>
                <span className="hex-tag">DOOR LOG</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-ink-950/60 p-3 rounded-sm border border-ink-600/30 text-center">
                  <div className="font-display text-2xl font-bold text-orange-400">{totalDoorOpens}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">累计开门</div>
                </div>
                <div className="bg-ink-950/60 p-3 rounded-sm border border-ink-600/30 text-center">
                  <div className="font-display text-2xl font-bold text-signal-green">{todayDoorOpens}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">今日开门</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wider">最近站点记录</div>
              <div className="space-y-0.5">
                {lastDoorEvents.map((e, i) => (
                  <DoorEventItem key={i} time={e.time} duration={e.duration} stopName={e.stopName} />
                ))}
              </div>
            </div>
          </div>
          <div className="xl:col-span-1">
            <div className="industrial-card p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  载重曲线（30分钟）
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">LOAD HISTORY</span>
              </div>
              <ReactECharts option={loadCurveOption} style={{ height: 200 }} notMerge={true} lazyUpdate={false} />
            </div>
          </div>
          <div className="xl:col-span-1">
            <div className="industrial-card p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  温度曲线（30分钟）
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">TEMP HISTORY</span>
              </div>
              <ReactECharts option={tempCurveOption} style={{ height: 200 }} notMerge={true} lazyUpdate={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                今日任务
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                已完成 {completedToday.length} · 进行中 {activeOrder ? 1 : 0}
              </span>
            </div>
            {activeOrder ? (
              <div className="mb-4">
                <div className="text-xs text-orange-400 font-mono mb-2 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
                  当前进行中
                </div>
                <TaskCard order={activeOrder} onClick={() => {}} highlight />
              </div>
            ) : (
              <div className="industrial-card p-8 mb-4 text-center">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <div className="text-sm text-slate-500">暂无进行中订单，前往订单大厅接单</div>
              </div>
            )}
            <div className="text-xs text-slate-500 font-mono mb-2 uppercase tracking-wider">今日已完成</div>
            {completedToday.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedToday.slice(0, 4).map((o) => (
                  <TaskCard key={o.id} order={o} onClick={() => {}} />
                ))}
              </div>
            ) : (
              <div className="industrial-card p-6 text-center text-xs text-slate-500">
                今日暂无完成订单
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="industrial-card p-5 corner-brackets">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-400" />
                收入统计
              </h3>
              <span className="hex-tag">7-DAY</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-ink-950/60 p-3 rounded-sm border border-ink-600/30">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">今日预计</div>
                <div className="font-display text-xl font-bold text-orange-400 mt-1">{formatMoney(todayExpected)}</div>
              </div>
              <div className="bg-ink-950/60 p-3 rounded-sm border border-ink-600/30">
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">7日累计</div>
                <div className="font-display text-xl font-bold text-signal-green mt-1">{formatMoney(3340 + todayEarningsTotal)}</div>
              </div>
            </div>
            <ReactECharts option={earningsOption} style={{ height: 220 }} />
          </div>

          <div className="industrial-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">车辆信息</h3>
              <span className="text-[10px] text-slate-500 font-mono">VEHICLE INFO</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-ink-600/30">
                <span className="text-slate-500">车型</span>
                <span className="text-white font-medium">{currentDriver?.vehicleTypeName ?? '--'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-ink-600/30">
                <span className="text-slate-500">最大载重</span>
                <span className="text-white font-mono">{formatWeight(currentDriver?.maxWeight ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-ink-600/30">
                <span className="text-slate-500">最大容积</span>
                <span className="text-white font-mono">{currentDriver?.maxVolume ?? 0}m³</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-ink-600/30">
                <span className="text-slate-500">温控能力</span>
                <span className="text-orange-400">
                  {tempCapability.map((t) => tempControlMap[t].icon).join(' ')}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">累计完成</span>
                <span className="text-white font-mono">{currentDriver?.totalOrders ?? 0} 单</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
