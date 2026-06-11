import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Navigation,
  User,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useNewOrders, useOrderAlerts } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import type { Order, OrderAlert as OrderAlertType } from '@/types';

const mockRecentOrders: Order[] = [
  {
    id: '1',
    order_no: 'DD202406110001',
    customerName: '张先生',
    riderName: '李骑手',
    pickup_address: '朝阳区建国路88号SOHO现代城',
    delivery_address: '海淀区中关村大街1号',
    goods_type: '餐饮',
    goods_weight: 2.5,
    distance_km: 8.5,
    estimated_price: 28,
    status: 'delivering',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    pickup_lat: 39.9042,
    pickup_lng: 116.4074,
    delivery_lat: 39.9842,
    delivery_lng: 116.3074,
  },
  {
    id: '2',
    order_no: 'DD202406110002',
    customerName: '王女士',
    riderName: '赵骑手',
    pickup_address: '东城区王府井大街138号',
    delivery_address: '西城区金融街7号',
    goods_type: '文件',
    goods_weight: 0.5,
    distance_km: 5.2,
    estimated_price: 18,
    status: 'picked_up',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    pickup_lat: 39.9142,
    pickup_lng: 116.4174,
    delivery_lat: 39.9242,
    delivery_lng: 116.3574,
  },
  {
    id: '3',
    order_no: 'DD202406110003',
    customerName: '刘先生',
    pickup_address: '丰台区方庄路2号',
    delivery_address: '朝阳区三里屯路19号',
    goods_type: '生鲜',
    goods_weight: 5.0,
    distance_km: 12.3,
    estimated_price: 42,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    pickup_lat: 39.8642,
    pickup_lng: 116.4374,
    delivery_lat: 39.9342,
    delivery_lng: 116.4574,
  },
  {
    id: '4',
    order_no: 'DD202406110004',
    customerName: '陈女士',
    riderName: '孙骑手',
    pickup_address: '海淀区学院路15号',
    delivery_address: '朝阳区望京SOHO',
    goods_type: '数码',
    goods_weight: 1.2,
    distance_km: 15.8,
    estimated_price: 52,
    status: 'in_transit',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    pickup_lat: 39.9942,
    pickup_lng: 116.3474,
    delivery_lat: 39.9992,
    delivery_lng: 116.4774,
  },
  {
    id: '5',
    order_no: 'DD202406110005',
    customerName: '周先生',
    pickup_address: '西直门北大街甲43号',
    delivery_address: '东直门南大街1号',
    goods_type: '医药',
    goods_weight: 0.3,
    distance_km: 6.5,
    estimated_price: 22,
    status: 'exception',
    exception_type: 'address_unclear',
    exception_reason: '收货地址门牌号模糊',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    pickup_lat: 39.9442,
    pickup_lng: 116.3574,
    delivery_lat: 39.9442,
    delivery_lng: 116.4274,
  },
];

const mockRiderPositions = [
  { id: 'r1', name: '李骑手', lat: 39.9342, lng: 116.3674, status: 'delivering', eta: 8 },
  { id: 'r2', name: '赵骑手', lat: 39.9192, lng: 116.3874, status: 'picked_up', eta: 15 },
  { id: 'r3', name: '孙骑手', lat: 39.9892, lng: 116.4174, status: 'in_transit', eta: 22 },
  { id: 'r4', name: '周骑手', lat: 39.8842, lng: 116.4274, status: 'online', eta: 0 },
  { id: 'r5', name: '吴骑手', lat: 39.9542, lng: 116.4474, status: 'busy', eta: 12 },
];

const trend7Days = [
  { day: '周一', orders: 156, revenue: 4280 },
  { day: '周二', orders: 189, revenue: 5120 },
  { day: '周三', orders: 172, revenue: 4890 },
  { day: '周四', orders: 201, revenue: 5680 },
  { day: '周五', orders: 245, revenue: 6920 },
  { day: '周六', orders: 312, revenue: 8750 },
  { day: '周日', orders: 278, revenue: 7890 },
];

export default function Dashboard() {
  const { metrics, alerts, status, fetchMetrics, subscribeRealTime, markAlertRead } = useDashboardStore();
  const [recentOrders, setRecentOrders] = useState<Order[]>(mockRecentOrders);
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(null);
  const [localAlerts, setLocalAlerts] = useState<OrderAlertType[]>([
    {
      id: 'a1',
      orderId: '5',
      type: 'exception',
      level: 'high',
      message: '订单 DD202406110005 地址模糊，需人工处理',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'a2',
      orderId: '1',
      type: 'delay',
      level: 'medium',
      message: '订单 DD202406110001 预计超时3分钟',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 'a3',
      orderId: '3',
      type: 'urgent',
      level: 'critical',
      message: '生鲜订单 DD202406110003 待派单超过5分钟',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ]);

  useEffect(() => {
    fetchMetrics();
    const unsubscribe = subscribeRealTime();
    return unsubscribe;
  }, [fetchMetrics, subscribeRealTime]);

  useNewOrders((order) => {
    setRecentOrders((prev) => [order, ...prev].slice(0, 10));
    setHighlightedOrder(order.id);
    setTimeout(() => setHighlightedOrder(null), 3000);
  }, []);

  useOrderAlerts((alert) => {
    setLocalAlerts((prev) => [alert, ...prev].slice(0, 20));
  }, []);

  const completionRate = useMemo(() => {
    const total = metrics?.total_orders ?? 86;
    const completed = metrics?.completed_orders ?? 72;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [metrics]);

  const orderDistribution = useMemo(() => {
    return [
      { label: '待处理', value: metrics?.pending_orders ?? 8, color: '#F59E0B' },
      { label: '配送中', value: metrics?.in_progress_orders ?? 5, color: '#3B82F6' },
      { label: '已完成', value: metrics?.completed_orders ?? 72, color: '#10B981' },
      { label: '异常', value: metrics?.exception_orders ?? 1, color: '#EF4444' },
    ];
  }, [metrics]);

  const distributionTotal = orderDistribution.reduce((sum, item) => sum + item.value, 0);

  const handleAlertClick = (alert: OrderAlertType) => {
    markAlertRead(alert.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">商家仪表盘</h1>
          <p className="text-sm text-gray-400 mt-1">实时监控订单、骑手和运营数据</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-500/15 border border-success-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-status-pulse" />
            <span className="text-sm text-success-400">实时连接</span>
          </div>
          <button
            onClick={fetchMetrics}
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 hover:text-gray-100 transition-colors',
              status.loading && 'opacity-60 cursor-not-allowed'
            )}
            disabled={status.loading}
          >
            <RefreshCw className={cn('w-4 h-4', status.loading && 'animate-spin')} />
            刷新数据
          </button>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日订单数"
          value={metrics?.total_orders ?? 86}
          icon={<Package className="w-5 h-5" />}
          trend={{ direction: 'up', percentage: 12, label: '较昨日' }}
          status="info"
          statusLabel="实时"
          loading={status.loading}
        />
        <StatCard
          title="完成率"
          value={completionRate}
          format="percent"
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ direction: 'up', percentage: 3.2, label: '较昨日' }}
          status="success"
          statusLabel="健康"
          loading={status.loading}
        />
        <StatCard
          title="平均配送时长"
          value={metrics?.avg_delivery_time ?? 32}
          format="time"
          icon={<Clock className="w-5 h-5" />}
          trend={{ direction: 'down', percentage: 2, label: '较昨日' }}
          loading={status.loading}
        />
        <StatCard
          title="今日营收"
          value={metrics?.total_revenue ?? 2856}
          format="currency"
          icon={<CircleDollarSign className="w-5 h-5" />}
          trend={{ direction: 'up', percentage: 8.5, label: '较昨日' }}
          status="warning"
          statusLabel="增长中"
          loading={status.loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">实时订单流</h2>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-accent-400" />
              <span className="text-xs text-amber-accent-400">WebSocket</span>
            </div>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-500',
                  highlightedOrder === order.id
                    ? 'bg-amber-accent-500/20 border-amber-accent-500/50 shadow-glow-amber animate-pulse'
                    : 'bg-space-blue-700/50 border-space-blue-600 hover:bg-space-blue-700'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono-code text-gray-400">{order.order_no}</span>
                  <StatusBadge status={order.status} size="sm" pulse={order.status === 'pending'} />
                </div>
                <div className="text-sm text-gray-200 mb-1.5 truncate">
                  {order.customerName} · {order.goods_type}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{order.delivery_address}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    {order.riderName ? (
                      <>
                        <User className="w-3 h-3" />
                        <span>{order.riderName}</span>
                      </>
                    ) : (
                      <span className="text-warning-400">待派单</span>
                    )}
                  </div>
                  <span className="text-amber-accent-400 font-mono-code">
                    ¥{order.estimated_price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">配送地图</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-status-pulse" />
                在线 {mockRiderPositions.filter(r => r.status !== 'offline').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-info-500" />
                配送中 {mockRiderPositions.filter(r => ['delivering', 'in_transit', 'picked_up'].includes(r.status)).length}
              </span>
            </div>
          </div>
          <div className="relative h-[480px] bg-space-blue-900/50 rounded-lg overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {recentOrders.slice(0, 3).map((order, idx) => (
              <svg key={`route-${order.id}`} className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id={`routeGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${80 + idx * 60} ${100 + idx * 80} Q ${250 + idx * 30} ${180 + idx * 40} ${380 - idx * 40} ${320 + idx * 30}`}
                  fill="none"
                  stroke={`url(#routeGrad-${idx})`}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              </svg>
            ))}

            {mockRiderPositions.map((rider, idx) => {
              const positions = [
                { left: '25%', top: '35%' },
                { left: '40%', top: '45%' },
                { left: '65%', top: '28%' },
                { left: '15%', top: '65%' },
                { left: '75%', top: '55%' },
              ];
              const pos = positions[idx % positions.length];
              return (
                <div
                  key={rider.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div className="relative">
                    {rider.eta > 0 && (
                      <div className="absolute -inset-4 rounded-full border-2 border-info-500/30 animate-ping" />
                    )}
                    <div className={cn(
                      'relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2',
                      rider.status === 'delivering' || rider.status === 'in_transit'
                        ? 'bg-info-500 border-info-300'
                        : rider.status === 'picked_up'
                        ? 'bg-warning-500 border-warning-300'
                        : 'bg-success-500 border-success-300'
                    )}>
                      <Navigation className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-space-blue-700 border border-space-blue-500 rounded-lg px-3 py-2 text-xs shadow-xl">
                      <div className="text-gray-100 font-medium">{rider.name}</div>
                      <div className="text-gray-400">
                        {rider.eta > 0 ? `ETA: ${rider.eta}分钟` : '空闲'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {recentOrders.slice(0, 4).map((order, idx) => {
              const positions = [
                { left: '12%', top: '20%' },
                { left: '85%', top: '75%' },
                { left: '48%', top: '15%' },
                { left: '30%', top: '80%' },
              ];
              const pos = positions[idx % positions.length];
              return (
                <div
                  key={`pickup-${order.id}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center border-2',
                    order.status === 'exception'
                      ? 'bg-danger-500 border-danger-300'
                      : order.status === 'pending'
                      ? 'bg-warning-500 border-warning-300 animate-bounce-light'
                      : 'bg-success-500 border-success-300'
                  )}>
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-3 left-3 bg-space-blue-800/90 border border-space-blue-600 rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center gap-3 text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-info-500" />
                  骑手位置
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-success-500" />
                  配送点
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-info-500/50" />
                  配送路线
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">订单状态分布</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-36 h-36 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    let cumulativePercent = 0;
                    return orderDistribution.map((item, idx) => {
                      const percent = distributionTotal > 0 ? (item.value / distributionTotal) * 100 : 0;
                      const startAngle = (cumulativePercent / 100) * 2 * Math.PI;
                      cumulativePercent += percent;
                      const endAngle = (cumulativePercent / 100) * 2 * Math.PI;
                      const x1 = 50 + 40 * Math.cos(startAngle);
                      const y1 = 50 + 40 * Math.sin(startAngle);
                      const x2 = 50 + 40 * Math.cos(endAngle);
                      const y2 = 50 + 40 * Math.sin(endAngle);
                      const largeArc = percent > 50 ? 1 : 0;
                      const pathData = percent >= 100
                        ? `M 50 10 A 40 40 0 1 1 49.99 10`
                        : `M ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2}`;
                      return (
                        <path
                          key={idx}
                          d={pathData}
                          fill="none"
                          stroke={item.color}
                          strokeWidth="12"
                          className="transition-all duration-500"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-100 font-mono-code">{distributionTotal}</span>
                  <span className="text-xs text-gray-400">总订单</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {orderDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-100 font-mono-code">{item.value}</span>
                      <span className="text-xs text-gray-500">
                        {distributionTotal > 0 ? Math.round((item.value / distributionTotal) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">近7日趋势</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-amber-accent-400">
                  <Activity className="w-3 h-3" />
                  订单量
                </span>
                <span className="flex items-center gap-1 text-success-400">
                  <TrendingUp className="w-3 h-3" />
                  营收
                </span>
              </div>
            </div>
            <div className="h-40">
              <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="orderArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="revenueArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[20, 50, 80, 110].map((y) => (
                  <line
                    key={y}
                    x1="30"
                    y1={y}
                    x2="390"
                    y2={y}
                    stroke="#1E293B"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                ))}
                {(() => {
                  const maxOrders = Math.max(...trend7Days.map((d) => d.orders));
                  const maxRevenue = Math.max(...trend7Days.map((d) => d.revenue));
                  const stepX = 360 / (trend7Days.length - 1);
                  const orderPoints = trend7Days.map(
                    (d, i) => `${30 + i * stepX},${120 - (d.orders / maxOrders) * 90}`
                  );
                  const revenuePoints = trend7Days.map(
                    (d, i) => `${30 + i * stepX},${120 - (d.revenue / maxRevenue) * 90}`
                  );
                  return (
                    <>
                      <path
                        d={`M 30 120 L ${orderPoints.join(' L ')} L ${30 + (trend7Days.length - 1) * stepX} 120 Z`}
                        fill="url(#orderArea)"
                      />
                      <path
                        d={`M 30 120 L ${revenuePoints.join(' L ')} L ${30 + (trend7Days.length - 1) * stepX} 120 Z`}
                        fill="url(#revenueArea)"
                      />
                      <polyline
                        points={orderPoints.join(' ')}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={revenuePoints.join(' ')}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {trend7Days.map((d, i) => (
                        <g key={i}>
                          <circle
                            cx={30 + i * stepX}
                            cy={120 - (d.orders / maxOrders) * 90}
                            r="3.5"
                            fill="#F59E0B"
                            className="hover:r-5 transition-all"
                          />
                          <text
                            x={30 + i * stepX}
                            y="135"
                            fill="#64748B"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {d.day}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-danger-400" />
            <h2 className="text-lg font-semibold text-gray-100">异常订单告警</h2>
            {localAlerts.filter((a) => !a.read).length > 0 && (
              <span className="px-2 py-0.5 bg-danger-500/20 text-danger-400 text-xs rounded-full">
                {localAlerts.filter((a) => !a.read).length} 条未读
              </span>
            )}
          </div>
          <button
            onClick={() => alerts.forEach((a) => markAlertRead(a.id))}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            全部已读
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {localAlerts.slice(0, 6).map((alert) => (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              className={cn(
                'p-4 rounded-lg border cursor-pointer transition-all hover:bg-space-blue-700',
                alert.level === 'critical'
                  ? 'bg-danger-500/10 border-danger-500/40'
                  : alert.level === 'high'
                  ? 'bg-danger-500/5 border-danger-500/20'
                  : alert.level === 'medium'
                  ? 'bg-warning-500/5 border-warning-500/20'
                  : 'bg-info-500/5 border-info-500/20'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {alert.level === 'critical' || alert.level === 'high' ? (
                    <AlertTriangle className={cn(
                      'w-4 h-4',
                      alert.level === 'critical' ? 'text-danger-400' : 'text-danger-400'
                    )} />
                  ) : (
                    <Clock className="w-4 h-4 text-warning-400" />
                  )}
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    alert.level === 'critical'
                      ? 'bg-danger-500/20 text-danger-400'
                      : alert.level === 'high'
                      ? 'bg-danger-500/15 text-danger-400'
                      : alert.level === 'medium'
                      ? 'bg-warning-500/15 text-warning-400'
                      : 'bg-info-500/15 text-info-400'
                  )}>
                    {alert.level === 'critical' ? '紧急' : alert.level === 'high' ? '高危' : alert.level === 'medium' ? '中危' : '提示'}
                  </span>
                </div>
                {!alert.read && (
                  <span className="w-2 h-2 rounded-full bg-danger-500 animate-status-pulse" />
                )}
              </div>
              <p className="text-sm text-gray-200 mb-2">{alert.message}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-mono-code">{alert.orderId}</span>
                <span>
                  {new Date(alert.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
