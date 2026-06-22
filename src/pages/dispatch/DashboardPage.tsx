import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  AlertTriangle,
  Bike,
  Clock,
  FileText,
  Navigation,
  ShieldAlert,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { useDispatchStore } from '../../stores/dispatchStore';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { cn, formatDateTime, formatCurrency, getOrderStatusText, CITY_CENTER } from '../../utils';
import type { Order, RiderProfile } from '../../types';

const riderIcon = (status: string) =>
  L.divIcon({
    className: 'rider-marker',
    html: `<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${
      status === 'on_order'
        ? '#1E40FF'
        : status === 'idle'
        ? '#00C48C'
        : status === 'break'
        ? '#FF6B1A'
        : '#6B7280'
    };color:white;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:18px;">🛵</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const orderIcon = (status: string) =>
  L.divIcon({
    className: 'order-marker',
    html: `<div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${
      status === 'pending_accept' ? '#FF4757' : status === 'fused' ? '#FF6B1A' : '#1E40FF'
    };color:white;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:14px;">📦</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

type AlertLevel = 'critical' | 'warning' | 'info';

interface AlertItem {
  id: string;
  type: string;
  level: AlertLevel;
  message: string;
  time: Date;
  orderId?: string;
}

interface LogItem {
  id: string;
  action: 'push' | 'accept' | 'reject' | 'fuse';
  orderId: string;
  riderId?: string;
  time: Date;
  detail: string;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function DashboardPage() {
  const { mockRiders, mockOrders, assignOrderRider, showToast } = useAppStore();
  const selectOrder = useDispatchStore((s) => s.selectOrder);
  const selectRider = useDispatchStore((s) => s.selectRider);
  const selectedOrderId = useDispatchStore((s) => s.selectedOrderId);
  const selectedRiderId = useDispatchStore((s) => s.selectedRiderId);

  const [now, setNow] = useState(new Date());
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    order: Order;
    rider: RiderProfile;
  } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const onlineRiders = useMemo(
    () => mockRiders.filter((r) => r.status !== 'offline').length,
    [mockRiders]
  );

  const todayOrders = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return mockOrders.filter((o) => o.createdAt >= start).length;
  }, [mockOrders]);

  const riderDistOption = useMemo(() => {
    const dist: Record<string, number> = { idle: 0, on_order: 0, break: 0, offline: 0 };
    mockRiders.forEach((r) => (dist[r.status] = (dist[r.status] || 0) + 1));
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        textStyle: { color: '#9CA3AF' },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#0F1629', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          },
          data: [
            { value: dist.idle, name: '空闲', itemStyle: { color: '#00C48C' } },
            { value: dist.on_order, name: '配送中', itemStyle: { color: '#1E40FF' } },
            { value: dist.break, name: '休息', itemStyle: { color: '#FF6B1A' } },
            { value: dist.offline, name: '离线', itemStyle: { color: '#6B7280' } },
          ],
        },
      ],
    };
  }, [mockRiders]);

  const pendingOrders = useMemo(
    () =>
      mockOrders
        .filter((o) => o.status === 'pending_accept')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [mockOrders]
  );

  const alerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];
    const nowT = Date.now();
    mockOrders.forEach((o) => {
      if (o.status === 'pending_accept') {
        const mins = (nowT - o.createdAt.getTime()) / 60000;
        if (mins > 5) {
          list.push({
            id: `timeout_accept_${o.id}`,
            type: '超时未接单',
            level: 'critical',
            message: `订单 ${o.id.slice(-6)} 已等待 ${Math.floor(mins)} 分钟未接单`,
            time: o.createdAt,
            orderId: o.id,
          });
        } else if (mins > 2) {
          list.push({
            id: `warn_accept_${o.id}`,
            type: '超时未接单',
            level: 'warning',
            message: `订单 ${o.id.slice(-6)} 已等待 ${Math.floor(mins)} 分钟`,
            time: o.createdAt,
            orderId: o.id,
          });
        }
      }
      if (o.status === 'delivering' && o.expectedDeliverAt.getTime() < nowT) {
        list.push({
          id: `deliver_timeout_${o.id}`,
          type: '配送超时',
          level: 'critical',
          message: `订单 ${o.id.slice(-6)} 配送已超时`,
          time: o.expectedDeliverAt,
          orderId: o.id,
        });
      }
    });
    mockRiders.forEach((r) => {
      if (r.status !== 'offline') {
        const mins = (nowT - r.lastActiveAt.getTime()) / 60000;
        if (mins > 10) {
          list.push({
            id: `rider_lost_${r.userId}`,
            type: '骑手失联',
            level: 'warning',
            message: `骑手 ${r.userId.slice(-6)} 已 ${Math.floor(mins)} 分钟无上报`,
            time: r.lastActiveAt,
          });
        }
      }
    });
    const levelOrder: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
    return list.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
  }, [mockOrders, mockRiders]);

  const orderFlowOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const counts = hours.map(() => Math.floor(Math.random() * 30) + 5);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF', fontSize: 10, interval: 2 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1F2937' } },
        axisLabel: { color: '#9CA3AF', fontSize: 10 },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: counts,
          lineStyle: { color: '#1E40FF', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30,64,255,0.5)' },
                { offset: 1, color: 'rgba(30,64,255,0)' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  const logs = useMemo<LogItem[]>(() => {
    const actions: Array<LogItem['action']> = ['push', 'accept', 'reject', 'fuse'];
    const list: LogItem[] = [];
    for (let i = 0; i < 12; i++) {
      const action = actions[i % actions.length];
      const order = mockOrders[i % mockOrders.length];
      const rider = mockRiders[i % mockRiders.length];
      const details: Record<string, string> = {
        push: `推送订单给骑手 ${rider.userId.slice(-6)}`,
        accept: `骑手 ${rider.userId.slice(-6)} 接单`,
        reject: `骑手 ${rider.userId.slice(-6)} 拒单`,
        fuse: `订单熔断，已转派 ${order.fusionCount} 次`,
      };
      list.push({
        id: `log_${i}`,
        action,
        orderId: order.id,
        riderId: rider.userId,
        time: new Date(Date.now() - i * 180000),
        detail: details[action],
      });
    }
    return list;
  }, [mockOrders, mockRiders]);

  const actionColors: Record<string, string> = {
    push: 'text-primary bg-primary/15',
    accept: 'text-success bg-success/15',
    reject: 'text-danger bg-danger/15',
    fuse: 'text-accent bg-accent/15',
  };

  const actionText: Record<string, string> = {
    push: '推送',
    accept: '接单',
    reject: '拒单',
    fuse: '熔断',
  };

  const levelConfig: Record<AlertLevel, { bg: string; border: string; icon: typeof AlertTriangle }> = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse',
      icon: ShieldAlert,
    },
    warning: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/40',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/40',
      icon: Activity,
    },
  };

  const handleConfirmAssign = () => {
    if (!confirmModal) return;
    assignOrderRider(confirmModal.order.id, confirmModal.rider.userId);
    showToast(`订单已指派给骑手 ${confirmModal.rider.userId.slice(-6)}`, 'success');
    setConfirmModal(null);
    setDraggedOrder(null);
    selectOrder(null);
    selectRider(null);
  };

  const handleRiderDrop = (rider: RiderProfile) => {
    if (draggedOrder) {
      setConfirmModal({ order: draggedOrder, rider });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1629] text-gray-100 p-4">
      <header className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">闪跑侠 · 调度监控中心</h1>
            <p className="text-xs text-gray-400">Shanpao Dispatch Control</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-white">
              {now.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <div className="text-xs text-gray-400">
              {now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Card className="bg-white/5 border border-white/10 backdrop-blur rounded-xl">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">在线骑手</div>
                  <div className="text-lg font-bold text-success">
                    {onlineRiders}
                    <span className="text-xs text-gray-500 ml-1">/{mockRiders.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border border-white/10 backdrop-blur rounded-xl">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">今日订单</div>
                  <div className="text-lg font-bold text-primary">
                    {todayOrders}
                    <span className="text-xs text-success ml-1 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />12%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-20 gap-4 h-[calc(100vh-140px)]" style={{ gridTemplateColumns: '20% 55% 25%' }}>
        <div className="flex flex-col gap-4 overflow-hidden">
          <Card className="bg-white/5 border border-white/10 backdrop-blur flex-shrink-0">
            <CardHeader className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">骑手状态分布</h3>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <ReactECharts option={riderDistOption} style={{ height: 200 }} theme="dark" />
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur flex-1 flex flex-col overflow-hidden">
            <CardHeader className="px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-danger" />
                  <h3 className="text-sm font-semibold text-white">待接单列表</h3>
                </div>
                <Badge variant="danger">{pendingOrders.length}单</Badge>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {pendingOrders.map((order) => {
                const waitMins = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
                const isTimeout = waitMins > 2;
                const isSelected = selectedOrderId === order.id;
                return (
                  <motion.div
                    key={order.id}
                    layout
                    draggable
                    onDragStart={() => {
                      setDraggedOrder(order);
                      selectOrder(order.id);
                    }}
                    onDragEnd={() => !confirmModal && setDraggedOrder(null)}
                    onClick={() => selectOrder(isSelected ? null : order.id)}
                    className={cn(
                      'p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all',
                      isSelected
                        ? 'bg-primary/20 border-primary/60 shadow-lg shadow-primary/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-xs font-mono text-gray-300 truncate">{order.id.slice(-8)}</div>
                      {isTimeout && (
                        <Badge variant="danger" className="animate-pulse">
                          ⚠ {waitMins}min
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-white font-medium mb-1 truncate">{order.title}</div>
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {formatCurrency(order.totalAmount)} · {order.type === 'buy' ? '代买' : order.type === 'deliver' ? '代送' : '代办'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      📍 {order.pickup.address}
                    </div>
                  </motion.div>
                );
              })}
              {pendingOrders.length === 0 && (
                <div className="text-center text-gray-500 py-8 text-sm">暂无待接单</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="bg-white/5 border border-white/10 backdrop-blur overflow-hidden flex flex-col">
          <CardHeader className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">实时调度地图</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-success"></span>空闲</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary"></span>配送中</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-accent"></span>休息</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger"></span>待接</span>
            </div>
          </CardHeader>
          <div className="flex-1 relative">
            <MapContainer
              center={[CITY_CENTER.lat, CITY_CENTER.lng]}
              zoom={12}
              style={{ height: '100%', width: '100%', background: '#0B1220' }}
            >
              <MapController center={[CITY_CENTER.lat, CITY_CENTER.lng]} />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />
              {mockRiders.map((rider) => (
                <div
                  key={rider.userId}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleRiderDrop(rider)}
                >
                  <Marker
                    position={[rider.location.lat, rider.location.lng]}
                    icon={riderIcon(rider.status)}
                    eventHandlers={{
                      click: () => selectRider(selectedRiderId === rider.userId ? null : rider.userId),
                    }}
                  >
                    <Popup className="!bg-[#1F2937] !border-white/10 !text-white">
                      <div className="text-xs p-1 min-w-[160px]">
                        <div className="font-bold text-sm mb-1">骑手 {rider.userId.slice(-6)}</div>
                        <div className="text-gray-400 mb-1">
                          {rider.vehicleType} · 完成{rider.completedOrders}单
                        </div>
                        <div className="text-xs">
                          ⭐ {rider.avgRating} · 💯 {rider.creditScore}分
                        </div>
                        <Badge
                          variant={
                            rider.status === 'idle'
                              ? 'success'
                              : rider.status === 'on_order'
                              ? 'info'
                              : rider.status === 'break'
                              ? 'warning'
                              : 'default'
                          }
                          className="mt-2"
                        >
                          {rider.status === 'idle' ? '空闲可接单' : rider.status === 'on_order' ? '配送中' : rider.status === 'break' ? '休息中' : '离线'}
                        </Badge>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}
              {mockOrders
                .filter((o) => o.status === 'pending_accept' || o.status === 'picking' || o.status === 'delivering' || o.status === 'fused')
                .map((order) => (
                  <Marker
                    key={order.id}
                    position={[order.pickup.lat, order.pickup.lng]}
                    icon={orderIcon(order.status)}
                    eventHandlers={{
                      click: () => selectOrder(selectedOrderId === order.id ? null : order.id),
                    }}
                  >
                    <Popup className="!bg-[#1F2937] !border-white/10 !text-white">
                      <div className="text-xs p-1 min-w-[180px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">{order.id.slice(-6)}</span>
                          <Badge
                            variant={
                              order.status === 'fused'
                                ? 'warning'
                                : order.status === 'pending_accept'
                                ? 'danger'
                                : 'info'
                            }
                          >
                            {getOrderStatusText(order.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-white mb-1">{order.title}</div>
                        <div className="text-gray-400 mb-1 truncate">📍 {order.pickup.address}</div>
                        <div className="text-gray-400 truncate">🏠 {order.deliver.address}</div>
                        <div className="text-primary font-bold mt-1">{formatCurrency(order.totalAmount)}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
            {draggedOrder && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-white text-sm rounded-full shadow-lg z-[1000] pointer-events-none">
                拖拽订单到骑手位置以派单 · {draggedOrder.id.slice(-6)}
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4 overflow-hidden">
          <Card className={cn(
            'bg-white/5 border backdrop-blur flex-shrink-0',
            alerts.some((a) => a.level === 'critical')
              ? 'border-red-500/50 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
              : 'border-white/10'
          )}>
            <CardHeader className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={cn(
                    'w-4 h-4',
                    alerts.some((a) => a.level === 'critical') ? 'text-danger animate-pulse' : 'text-accent'
                  )} />
                  <h3 className="text-sm font-semibold text-white">实时预警</h3>
                </div>
                <Badge variant="danger">{alerts.length}</Badge>
              </div>
            </CardHeader>
            <div className="max-h-[220px] overflow-y-auto p-2 space-y-2">
              {alerts.slice(0, 6).map((alert) => {
                const cfg = levelConfig[alert.level];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'p-2.5 rounded-lg border text-xs',
                      cfg.bg, cfg.border
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        alert.level === 'critical' ? 'text-danger' : alert.level === 'warning' ? 'text-accent' : 'text-primary'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{alert.type}</span>
                          <span className="text-gray-500 text-[10px]">
                            {alert.time.toLocaleTimeString('zh-CN', { hour12: false })}
                          </span>
                        </div>
                        <div className="text-gray-300 leading-relaxed">{alert.message}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {alerts.length === 0 && (
                <div className="text-center text-gray-500 py-4 text-xs">运行正常，无预警</div>
              )}
            </div>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur flex-shrink-0">
            <CardHeader className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-white">订单流转 (单/小时)</h3>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <ReactECharts option={orderFlowOption} style={{ height: 160 }} theme="dark" />
            </CardContent>
          </Card>

          <Card className="bg-white/5 border border-white/10 backdrop-blur flex-1 flex flex-col overflow-hidden">
            <CardHeader className="px-4 py-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-white">调度日志</h3>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {logs.slice(0, 10).map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="rounded-lg p-2 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md font-medium',
                        actionColors[log.action]
                      )}>
                        {actionText[log.action]}
                      </span>
                      <span className="font-mono text-gray-300 truncate flex-1">{log.detail}</span>
                      <span className="text-gray-500 shrink-0">
                        {log.time.toLocaleTimeString('zh-CN', { hour12: false })}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 pt-2 border-t border-white/10 space-y-1 text-[11px] text-gray-400"
                        >
                          <div>订单号: <span className="text-gray-200 font-mono">{log.orderId}</span></div>
                          {log.riderId && <div>骑手ID: <span className="text-gray-200 font-mono">{log.riderId}</span></div>}
                          <div>时间: <span className="text-gray-200">{formatDateTime(log.time)}</span></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="确认人工派单"
        size="md"
      >
        {confirmModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">订单信息</div>
              <div className="font-semibold text-gray-900 mb-2">{confirmModal.order.title}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📍 取件: {confirmModal.order.pickup.address}</div>
                <div>🏠 送达: {confirmModal.order.deliver.address}</div>
                <div className="font-bold text-primary">{formatCurrency(confirmModal.order.totalAmount)}</div>
              </div>
            </div>
            <div className="flex items-center justify-center text-2xl text-gray-300">⬇ 指派给</div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-xs text-gray-500 mb-1">骑手信息</div>
              <div className="font-semibold text-gray-900 mb-2">骑手 {confirmModal.rider.userId.slice(-6)}</div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>🚗 {confirmModal.rider.vehicleType} · 完成{confirmModal.rider.completedOrders}单</div>
                <div>⭐ {confirmModal.rider.avgRating} · 💯 信用{confirmModal.rider.creditScore}分</div>
                <div>📞 状态: {confirmModal.rider.status === 'idle' ? '空闲中 ✓' : '配送中'}</div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="!text-gray-700 !border-gray-300 hover:!bg-gray-100" onClick={() => setConfirmModal(null)}>
                取消
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleConfirmAssign}>
                确认派单
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
