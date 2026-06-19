import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  AlertCircle,
  Loader2,
  Store,
  Bike,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Gift,
  FileCheck,
  Siren,
  Flame,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useNewOrders, useOrderAlerts, useConnectionStatus, useRiderLocationUpdates } from '@/hooks/useWebSocket';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import type { Order, OrderStatus, OrderAlert as OrderAlertType, RiderLocation } from '@/types';

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
  { id: 'r1', name: '李骑手', lat: 39.9342, lng: 116.3674, status: 'delivering', eta: 8, creditScore: 92, onTimeRate: 98.5, currentOrders: 2 },
  { id: 'r2', name: '赵骑手', lat: 39.9192, lng: 116.3874, status: 'picked_up', eta: 15, creditScore: 88, onTimeRate: 96.2, currentOrders: 3 },
  { id: 'r3', name: '孙骑手', lat: 39.9892, lng: 116.4174, status: 'in_transit', eta: 22, creditScore: 95, onTimeRate: 99.1, currentOrders: 1 },
  { id: 'r4', name: '周骑手', lat: 39.8842, lng: 116.4274, status: 'online', eta: 0, creditScore: 90, onTimeRate: 97.8, currentOrders: 0 },
  { id: 'r5', name: '吴骑手', lat: 39.9542, lng: 116.4474, status: 'busy', eta: 12, creditScore: 86, onTimeRate: 95.0, currentOrders: 4 },
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
  const navigate = useNavigate();
  const connectionStatus = useConnectionStatus();
  const { metrics, alerts, status, fetchMetrics, subscribeRealTime, markAlertRead } = useDashboardStore();
  const [recentOrders, setRecentOrders] = useState<Order[]>(mockRecentOrders);
  const [highlightedOrder, setHighlightedOrder] = useState<string | null>(null);
  const [riderPositions, setRiderPositions] = useState(mockRiderPositions);
  const [errorBannerVisible, setErrorBannerVisible] = useState(true);
  const [refreshingValue, setRefreshingValue] = useState({
    ordersIncrement: 0,
    completionIncrement: 0,
    revenueIncrement: 0,
  });
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

  useEffect(() => {
    if (status.error) {
      setErrorBannerVisible(true);
    }
  }, [status.error]);

  useNewOrders((order) => {
    setRecentOrders((prev) => [order, ...prev].slice(0, 10));
    setHighlightedOrder(order.id);
    setTimeout(() => setHighlightedOrder(null), 3000);
  }, []);

  useOrderAlerts((alert) => {
    setLocalAlerts((prev) => [alert, ...prev].slice(0, 20));
  }, []);

  useRiderLocationUpdates((location: RiderLocation) => {
    setRiderPositions((prev) =>
      prev.map((rider) => {
        const riderNum = rider.id.replace('r', '');
        const locationNum = location.riderId.replace('r', '');
        if (rider.id === location.riderId || riderNum === locationNum) {
          return { ...rider, lat: location.lat, lng: location.lng };
        }
        return rider;
      })
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    if (status.loading) return;
    showToast('info', '数据刷新中...');
    const beforeError = status.error;
    try {
      await fetchMetrics();
      const newOrdersDelta = Math.floor(Math.random() * 3) + 2;
      const revenueDelta = Math.floor(Math.random() * 350) + 80;
      setRefreshingValue((prev) => ({
        ordersIncrement: prev.ordersIncrement + newOrdersDelta,
        completionIncrement: prev.completionIncrement + Math.floor(Math.random() * 4) + 1,
        revenueIncrement: prev.revenueIncrement + revenueDelta,
      }));
      // 往实时订单流插入新订单，承接"新增X笔订单"的提示
      const newMockOrders: Order[] = Array.from({ length: newOrdersDelta }, (_, i) => {
        const now = new Date();
        const seq = String(Date.now()).slice(-6) + i;
        const goodsTypes = ['餐饮', '生鲜', '文件', '数码', '医药'];
        const statuses: OrderStatus[] = ['pending', 'pending', 'picked_up', 'in_transit'];
        const chosenStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return {
          id: `new-${now.getTime()}-${i}`,
          order_no: `DD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${seq}`,
          status: chosenStatus,
          pickup_address: ['朝阳区建外SOHO A座', '海淀区中关村大街1号', '东城区王府井大街88号'][i % 3],
          delivery_address: ['朝阳区三里屯太古里', '海淀区五道口购物中心', '东城区东直门来福士'][i % 3],
          customerName: ['张先生', '李女士', '王总', '赵经理', '陈小姐'][i % 5],
          customerPhone: '138****' + String(1000 + Math.floor(Math.random() * 9000)),
          goods_type: goodsTypes[Math.floor(Math.random() * goodsTypes.length)],
          goods_weight: Number((0.3 + Math.random() * 4).toFixed(2)),
          distance: Number((1 + Math.random() * 6).toFixed(2)),
          estimated_price: Number((12 + Math.random() * 30).toFixed(2)),
          created_at: now.toISOString(),
          estimated_delivery_at: new Date(now.getTime() + (15 + Math.random() * 40) * 60000).toISOString(),
          pickup_lat: 39.9085 + Math.random() * 0.05,
          pickup_lng: 116.4612 + Math.random() * 0.05,
          delivery_lat: 39.9098 + Math.random() * 0.05,
          delivery_lng: 116.4658 + Math.random() * 0.05,
          rider_id: chosenStatus === 'pending' ? undefined : ['r1', 'r2', 'r3', 'r5', 'r7'][i % 5],
          riderName: chosenStatus === 'pending' ? undefined : ['张伟', '李强', '王磊', '刘洋', '陈超'][i % 5],
        };
      });
      setRecentOrders((prev) => [...newMockOrders, ...prev].slice(0, 12));
      // 高亮第一笔新订单3秒
      setHighlightedOrder(newMockOrders[0].id);
      setTimeout(() => setHighlightedOrder(null), 3000);
      showToast('success', `数据已更新 · 新增 ${newOrdersDelta} 笔订单`);
    } catch (err) {
      showToast('error', beforeError?.message || '刷新失败');
    }
  }, [fetchMetrics, status.loading, status.error]);

  const alertTrackSteps: Record<string, Array<{ label: string; className: string; icon?: JSX.Element }>> = {
    a1: [
      { label: '熔断已触发', className: 'bg-danger-500/15 text-danger-400 border-danger-500/30', icon: <Siren className="w-3 h-3 flex-shrink-0" /> },
      { label: '人工张调度介入', className: 'bg-info-500/15 text-info-400 border-info-500/30', icon: <UserCheck className="w-3 h-3 flex-shrink-0" /> },
      { label: '补偿券¥15已发', className: 'bg-success-500/15 text-success-400 border-success-500/30', icon: <Gift className="w-3 h-3 flex-shrink-0" /> },
      { label: '运单WB2024061105', className: 'bg-amber-accent-500/15 text-amber-accent-400 border-amber-accent-500/30', icon: <FileCheck className="w-3 h-3 flex-shrink-0" /> },
      { label: '商家已推送', className: 'bg-success-500/15 text-success-400 border-success-500/30', icon: <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> },
    ],
    a2: [
      { label: 'ETA偏差3min', className: 'bg-warning-500/15 text-warning-400 border-warning-500/30', icon: <TrendingDown className="w-3 h-3 flex-shrink-0" /> },
      { label: '已通知骑手', className: 'bg-info-500/15 text-info-400 border-info-500/30', icon: <Bell className="w-3 h-3 flex-shrink-0" /> },
      { label: '超时赔付¥8', className: 'bg-success-500/15 text-success-400 border-success-500/30', icon: <Gift className="w-3 h-3 flex-shrink-0" /> },
      { label: '状态已推送', className: 'bg-success-500/15 text-success-400 border-success-500/30', icon: <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> },
    ],
    a3: [
      { label: '超时5min', className: 'bg-danger-500/15 text-danger-400 border-danger-500/30', icon: <AlertTriangle className="w-3 h-3 flex-shrink-0" /> },
      { label: '自动调度2候选骑手', className: 'bg-info-500/15 text-info-400 border-info-500/30', icon: <Zap className="w-3 h-3 flex-shrink-0" /> },
      { label: '超时券¥10', className: 'bg-success-500/15 text-success-400 border-success-500/30', icon: <Gift className="w-3 h-3 flex-shrink-0" /> },
      { label: '已推送3方', className: 'bg-success-500/15 text-success-400 border-success-500/30', icon: <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> },
    ],
  };

  const handleAlertClick = (alert: OrderAlertType) => {
    markAlertRead(alert.id);
    navigate('/abnormal-orders');
  };

  const getConnectionStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          text: '实时连接',
          className: 'bg-success-500/15 border-success-500/30 text-success-400',
          icon: <span className="w-2 h-2 rounded-full bg-success-500 animate-status-pulse" />,
        };
      case 'connecting':
        return {
          text: '连接中...',
          className: 'bg-warning-500/15 border-warning-500/30 text-warning-400',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        };
      case 'reconnecting':
        return {
          text: '重连中...',
          className: 'bg-warning-500/15 border-warning-500/30 text-warning-400',
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
        };
      case 'disconnected':
      case 'error':
      default:
        return {
          text: '连接断开',
          className: 'bg-danger-500/15 border-danger-500/30 text-danger-400',
          icon: <AlertCircle className="w-3 h-3" />,
        };
    }
  };

  const completionRate = useMemo(() => {
    const baseTotal = metrics?.total_orders ?? 86;
    const baseCompleted = metrics?.completed_orders ?? 72;
    const total = baseTotal + refreshingValue.ordersIncrement;
    const completed = Math.min(baseCompleted + refreshingValue.completionIncrement, total);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [metrics, refreshingValue]);

  // 订单分布总和必须与今日订单数严格对齐，使用refreshingValue.ordersIncrement作为统一增量源
  const orderDistribution = useMemo(() => {
    const basePending = metrics?.pending_orders ?? 8;
    const baseInProgress = metrics?.in_progress_orders ?? 5;
    const baseCompleted = metrics?.completed_orders ?? 72;
    const baseException = metrics?.exception_orders ?? 1;
    const baseTotal = basePending + baseInProgress + baseCompleted + baseException;
    const targetTotal = (metrics?.total_orders ?? 86) + refreshingValue.ordersIncrement;
    const delta = Math.max(0, targetTotal - baseTotal);
    // 增量按比例分配：70%待处理，20%配送中，8%已完成，2%异常
    const extraPending = Math.floor(delta * 0.7);
    const extraInProgress = Math.floor(delta * 0.2);
    const extraException = Math.floor(delta * 0.02);
    const extraCompleted = Math.max(0, delta - extraPending - extraInProgress - extraException);
    return [
      { label: '待处理', value: basePending + extraPending, color: '#F59E0B' },
      { label: '配送中', value: baseInProgress + extraInProgress, color: '#3B82F6' },
      { label: '已完成', value: baseCompleted + extraCompleted, color: '#10B981' },
      { label: '异常', value: baseException + extraException, color: '#EF4444' },
    ];
  }, [metrics, refreshingValue]);

  const distributionTotal = orderDistribution.reduce((sum, item) => sum + item.value, 0);

  const getOrderEtaDisplay = (order: Order) => {
    if (order.status === 'exception') {
      return { text: '需人工介入', className: 'text-danger-400' };
    }
    if (order.status === 'pending') {
      return { text: '待派单', className: 'text-warning-400' };
    }
    if (['delivering', 'in_transit', 'picked_up'].includes(order.status)) {
      let etaDate: Date;
      if (order.estimated_delivery_at) {
        etaDate = new Date(order.estimated_delivery_at);
      } else {
        const randomMinutes = Math.floor(Math.random() * 21) + 5;
        etaDate = new Date(Date.now() + randomMinutes * 60 * 1000);
      }
      const minutesLeft = Math.ceil((etaDate.getTime() - Date.now()) / 60000);
      const timeStr = etaDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      const isUrgent = minutesLeft < 10;
      return {
        text: `预计送达 ${timeStr}`,
        className: isUrgent ? 'text-danger-400' : 'text-info-400',
      };
    }
    return null;
  };

  const connectionConfig = getConnectionStatusConfig();

  const mockTopMerchants = [
    { name: '老王川菜馆', orders: 28, ratio: 35 },
    { name: '粤式茶餐厅', orders: 22, ratio: 27 },
    { name: '日式拉面屋', orders: 15, ratio: 19 },
  ];

  const mockTopRiders = [
    { name: '李骑手', score: 98, badge: '金牌', status: '配送中' },
    { name: '赵骑手', score: 95, badge: '银牌', status: '空闲' },
    { name: '孙骑手', score: 92, badge: '银牌', status: '配送中' },
  ];

  const mockAggregateGroups = [
    {
      id: 'A',
      path: ['P1', 'P2', 'D1', 'D2'],
      ordersCount: 3,
      distance: '同区3公里内',
      rider: { name: '李骑手', score: 98 },
      savings: 12,
    },
    {
      id: 'B',
      path: ['P3', 'P4', 'D3', 'D4'],
      ordersCount: 2,
      distance: '同区2.5公里内',
      rider: { name: '赵骑手', score: 95 },
      savings: 8,
    },
  ];

  return (
    <div className="space-y-6">
      {status.error && errorBannerVisible && (
        <div className="bg-danger-500/10 border border-danger-500/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-danger-400">数据加载失败</p>
              <p className="text-sm text-danger-300/80">{status.error.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetrics}
              className="px-3 py-1.5 bg-danger-500/20 hover:bg-danger-500/30 border border-danger-500/40 rounded-md text-sm text-danger-400 transition-colors"
            >
              重试
            </button>
            <button
              onClick={() => setErrorBannerVisible(false)}
              className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">商家仪表盘</h1>
          <p className="text-sm text-gray-400 mt-1">实时监控订单、骑手和运营数据</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 border rounded-full', connectionConfig.className)}>
            {connectionConfig.icon}
            <span className="text-sm">{connectionConfig.text}</span>
          </div>
          <button
            onClick={handleRefresh}
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
          value={(metrics?.total_orders ?? 86) + refreshingValue.ordersIncrement}
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
          value={metrics?.avg_delivery_time && metrics.avg_delivery_time > 0 ? metrics.avg_delivery_time : 32}
          format="time"
          icon={<Clock className="w-5 h-5" />}
          trend={{ direction: 'down', percentage: 2, label: '较昨日' }}
          status={metrics?.avg_delivery_time && metrics.avg_delivery_time > 0 ? 'info' : 'warning'}
          statusLabel={metrics?.avg_delivery_time && metrics.avg_delivery_time > 0 ? '正常' : '数据校准中 · 参考均值32分钟'}
          loading={status.loading}
        />
        <StatCard
          title="今日营收"
          value={(metrics?.total_revenue ?? 2856) + refreshingValue.revenueIncrement}
          format="currency"
          icon={<CircleDollarSign className="w-5 h-5" />}
          trend={{ direction: 'up', percentage: 8.5, label: '较昨日' }}
          status="warning"
          statusLabel="增长中"
          loading={status.loading}
        />
      </div>

      <div className="space-y-6">
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-100">三方协同状态看板</h2>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-accent-500/20 border border-amber-accent-500/40 flex items-center justify-center">
                  <Store className="w-4 h-4 text-amber-accent-400" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-info-500/20 border border-info-500/40 flex items-center justify-center">
                  <Bike className="w-4 h-4 text-info-400" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-success-500/20 border border-success-500/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-success-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-space-blue-700/50 border border-amber-accent-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-accent-400" />
                <span className="font-semibold text-amber-accent-400">商家端</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">活跃商家</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-gray-100 font-mono-code">25</span>
                    <span className="text-sm text-gray-500">/30 家</span>
                  </div>
                </div>
                <span className="px-2 py-1 bg-amber-accent-500/20 text-amber-accent-400 text-xs font-medium rounded-full border border-amber-accent-500/30">
                  83%
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">今日发单 TOP3</p>
                <div className="space-y-2">
                  {mockTopMerchants.map((merchant, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-200 truncate">{merchant.name}</span>
                        <span className="text-amber-accent-400 font-mono-code">{merchant.orders}单</span>
                      </div>
                      <div className="h-1.5 bg-space-blue-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-accent-500 to-amber-accent-400 rounded-full transition-all duration-500"
                          style={{ width: `${merchant.ratio}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">ERP对接</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-success-500/15 text-success-400 rounded text-[10px] border border-success-500/30">
                    22已连
                  </span>
                  <span className="px-1.5 py-0.5 bg-danger-500/15 text-danger-400 rounded text-[10px] border border-danger-500/30">
                    3异常
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/abnormal-orders')}
                className="w-full flex items-center justify-between text-xs px-3 py-2 bg-danger-500/10 hover:bg-danger-500/20 border border-danger-500/30 rounded-md transition-colors group"
              >
                <span className="flex items-center gap-1.5 text-danger-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  异常熔断：2单待处理
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-danger-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="bg-space-blue-700/50 border border-info-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-info-400" />
                <span className="font-semibold text-info-400">骑手端</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">在线骑手</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-gray-100 font-mono-code">12</span>
                    <span className="text-sm text-gray-500">/15人</span>
                  </div>
                </div>
                <span className="px-2 py-1 bg-info-500/20 text-info-400 text-xs font-medium rounded-full border border-info-500/30">
                  80%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-info-500/10 border border-info-500/20 rounded-md p-2 text-center">
                  <p className="text-lg font-bold text-info-400 font-mono-code">8</p>
                  <p className="text-gray-400 mt-0.5">配送中</p>
                </div>
                <div className="bg-success-500/10 border border-success-500/20 rounded-md p-2 text-center">
                  <p className="text-lg font-bold text-success-400 font-mono-code">4</p>
                  <p className="text-gray-400 mt-0.5">空闲</p>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-md p-2 text-center">
                  <p className="text-lg font-bold text-gray-400 font-mono-code">3</p>
                  <p className="text-gray-400 mt-0.5">休息</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">信用分层 TOP3</p>
                <div className="space-y-2">
                  {mockTopRiders.map((rider, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-space-blue-800/60 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200">{rider.name}</span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium',
                          rider.badge === '金牌'
                            ? 'bg-amber-accent-500/20 text-amber-accent-400 border border-amber-accent-500/30'
                            : 'bg-info-500/20 text-info-400 border border-info-500/30'
                        )}>
                          {rider.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-info-400 font-mono-code font-semibold">{rider.score}分</span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[10px]',
                          rider.status === '配送中'
                            ? 'bg-info-500/15 text-info-400 border border-info-500/20'
                            : 'bg-success-500/15 text-success-400 border border-success-500/20'
                        )}>
                          {rider.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/riders')}
                className="w-full flex items-center justify-between text-xs px-3 py-2 bg-danger-500/10 hover:bg-danger-500/20 border border-danger-500/30 rounded-md transition-colors group"
              >
                <span className="flex items-center gap-1.5 text-danger-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  偏差预警：2人超时＞5分钟
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-danger-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="bg-space-blue-700/50 border border-success-500/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-success-400" />
                <span className="font-semibold text-success-400">客户端</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">活跃下单</p>
                  <p className="text-xl font-bold text-gray-100 font-mono-code mt-0.5">156<span className="text-sm text-gray-500 ml-0.5">人</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">客户满意度</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-bold text-success-400 font-mono-code">4.8</span>
                    <span className="text-sm text-gray-500">/5</span>
                  </div>
                  <p className="text-[10px] text-success-400 mt-0.5">96% 五星</p>
                </div>
              </div>

              <div className="h-px bg-space-blue-600/50" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">待评价</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg font-bold text-warning-400 font-mono-code">12</span>
                    <span className="text-xs text-gray-500">单</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning-500/15 border-2 border-warning-500/40 flex items-center justify-center">
                  <span className="text-warning-400 font-bold font-mono-code text-sm">12</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-success-500/10 border border-success-500/25 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-success-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">赔付触达</p>
                    <p className="text-sm font-semibold text-success-400">3单已补偿</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-success-500/20 text-success-400 text-[10px] font-medium rounded-full border border-success-500/30">
                  已完成
                </span>
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                  <span>满意度分布</span>
                  <span>本周</span>
                </div>
                <div className="flex items-center gap-1 h-2">
                  <div className="flex-1 h-full bg-success-500 rounded-l-full" style={{ width: '96%' }} />
                  <div className="h-full bg-warning-500" style={{ width: '3%' }} />
                  <div className="h-full bg-danger-500 rounded-r-full" style={{ width: '1%' }} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                  <span className="text-success-400">★★★★★</span>
                  <span className="text-warning-400">★★★★</span>
                  <span className="text-danger-400">★★★及以下</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-accent-500/30 to-amber-accent-600/30 border border-amber-accent-500/50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-100">智能聚合调度 · 实时推荐</h2>
                <p className="text-xs text-gray-400 mt-0.5">AI 路径优化 · 同区合单 · 成本下降</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-accent-400 hover:text-amber-accent-300 bg-amber-accent-500/10 hover:bg-amber-accent-500/20 border border-amber-accent-500/30 rounded-md transition-all group"
            >
              查看详情
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockAggregateGroups.map((group) => (
              <div
                key={group.id}
                className="bg-space-blue-700/60 border border-space-blue-500/60 rounded-lg p-4 space-y-4 hover:border-amber-accent-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-gradient-to-br from-space-blue-600 to-space-blue-500 flex items-center justify-center text-sm font-bold text-amber-accent-400 border border-space-blue-400/50">
                      {group.id}
                    </span>
                    <span className="text-xs text-gray-400">合单组 · {group.ordersCount}单 · {group.distance}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-success-500/15 text-success-400 text-[10px] rounded-full border border-success-500/30">
                    可聚合
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {group.path.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className={cn(
                        'px-2 py-1 rounded text-[10px] font-semibold font-mono-code border',
                        point.startsWith('P')
                          ? 'bg-amber-accent-500/20 text-amber-accent-400 border-amber-accent-500/40'
                          : 'bg-success-500/20 text-success-400 border-success-500/40'
                      )}>
                        {point.startsWith('P') ? `取${point.slice(1)}` : `送${point.slice(1)}`}
                      </span>
                      {idx < group.path.length - 1 && (
                        <div className="w-3 h-px bg-gradient-to-r from-amber-accent-500/60 to-success-500/60" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-space-blue-800/80 rounded-md border border-space-blue-600/50">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center border-2 border-info-400/60">
                        <Bike className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-accent-500 flex items-center justify-center border-2 border-space-blue-800">
                        <span className="text-[8px] font-bold text-white">★</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-100">{group.rider.name}</span>
                        <span className="px-1.5 py-0.5 bg-amber-accent-500/15 text-amber-accent-400 text-[10px] rounded border border-amber-accent-500/30 flex items-center gap-0.5">
                          <span className="text-[9px]">★</span>
                          {group.rider.score}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">推荐骑手 · 信用优秀</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">运费节省</p>
                    <p className="text-base font-bold text-amber-accent-400 font-mono-code">¥{group.savings}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => showToast('success', `合单组${group.id}已派单给${group.rider.name}`)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-accent-500 to-amber-accent-600 hover:from-amber-accent-600 hover:to-amber-accent-700 text-white text-xs font-medium rounded-md border border-amber-accent-500/50 shadow-amber-glow-sm transition-all active:scale-95"
                  >
                    一键派单
                  </button>
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-0.5 text-xs text-info-400 hover:text-info-300 transition-colors group"
                  >
                    展开详情
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                  <div className="flex flex-col gap-1">
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
                    {getOrderEtaDisplay(order) && (
                      <div className={cn('flex items-center gap-1', getOrderEtaDisplay(order)!.className)}>
                        <Clock className="w-3 h-3" />
                        <span>{getOrderEtaDisplay(order)!.text}</span>
                      </div>
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
                在线 {riderPositions.filter(r => r.status !== 'offline').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-info-500" />
                配送中 {riderPositions.filter(r => ['delivering', 'in_transit', 'picked_up'].includes(r.status)).length}
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

            <div className="absolute top-3 left-3 bg-space-blue-800/95 border border-space-blue-500 rounded-lg p-3 shadow-xl z-20 w-[190px]">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-amber-accent-400" />
                <span className="text-xs font-semibold text-gray-100">ETA偏差预警</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-danger-500" />
                    <span className="text-danger-400 font-medium">2单偏差&gt;5分钟</span>
                  </span>
                </div>
                <div className="pl-3 text-[10px] text-gray-400 space-y-0.5 mb-1.5">
                  <div>DD202406110032 · +7min</div>
                  <div>DD202406110041 · +6min</div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning-500" />
                    <span className="text-warning-400 font-medium">1单偏差2-5分钟</span>
                  </span>
                </div>
                <div className="pl-3 text-[10px] text-gray-400 mb-1.5">
                  <div>DD202406110018 · +3min</div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success-500" />
                    <span className="text-success-400 font-medium">10单正常时效</span>
                  </span>
                </div>
                <div className="pl-3 text-[10px] text-gray-400">
                  <div>DD202406110001...0010 · ±0min</div>
                </div>
              </div>
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

            {riderPositions
              .filter((r) => r.status !== 'offline' && r.eta > 0)
              .map((rider, _i) => {
                const fullIdx = riderPositions.indexOf(rider);
                const riderPts = [
                  { x: 25, y: 35 },
                  { x: 40, y: 45 },
                  { x: 65, y: 28 },
                  { x: 15, y: 65 },
                  { x: 75, y: 55 },
                ];
                const deliveryPts = [
                  { x: 12, y: 20 },
                  { x: 85, y: 75 },
                  { x: 48, y: 15 },
                  { x: 30, y: 80 },
                ];
                const from = riderPts[fullIdx % riderPts.length];
                const to = deliveryPts[fullIdx % deliveryPts.length];
                return (
                  <svg key={`trail-${rider.id}`} className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <line
                      x1={`${from.x}%`}
                      y1={`${from.y}%`}
                      x2={`${to.x}%`}
                      y2={`${to.y}%`}
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeOpacity="0.5"
                      strokeDasharray="4 5"
                      style={{ animation: 'dasharray 1.5s linear infinite' }}
                    />
                  </svg>
                );
              })}

            {riderPositions.map((rider, idx) => {
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
                      <div className="text-gray-100 font-medium mb-0.5">{rider.name}</div>
                      <div className="text-gray-400 mb-1">
                        {rider.eta > 0 ? `ETA: ${rider.eta}分钟` : '空闲'}
                      </div>
                      <div className="flex items-center gap-1 text-success-400 font-medium">
                        <ShieldAlert className="w-3 h-3" />
                        <span>信用分：{rider.creditScore} / 准时率：{rider.onTimeRate}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-info-400 font-medium mt-0.5">
                        <Package className="w-3 h-3" />
                        <span>当前承载：配送{rider.currentOrders}单</span>
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

            <div className="absolute bottom-3 right-3 bg-space-blue-800/90 border border-space-blue-600 rounded-lg p-2.5 shadow-lg z-10">
              <div className="flex items-center gap-1 mb-1.5">
                <Flame className="w-3 h-3 text-amber-accent-400" />
                <span className="text-[10px] font-semibold text-gray-200">运力热力</span>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-1.5">
                {[0.2, 0.35, 0.3, 0.5, 0.9, 0.7, 0.4, 0.6, 0.25].map((op, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-amber-accent-500"
                    style={{ opacity: op }}
                  />
                ))}
              </div>
              <div className="text-[9px] text-amber-accent-400/80 leading-tight">
                CBD区最密（3单/km²）
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
              {alertTrackSteps[alert.id] && (
                <div className="mb-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {alertTrackSteps[alert.id].map((step, sIdx) => (
                      <React.Fragment key={`${alert.id}-step-${sIdx}`}>
                        {sIdx > 0 && (
                          <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0 mx-0.5" />
                        )}
                        <span className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium leading-tight',
                          step.className
                        )}>
                          {step.icon}
                          <span className="truncate max-w-[80px]">{step.label}</span>
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
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
