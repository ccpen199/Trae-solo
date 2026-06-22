import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Filter,
  GitMerge,
  HandCoins,
  MapPin,
  RefreshCw,
  Search,
  SplitSquareVertical,
  UserX,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { cn, formatCurrency, formatDateTime } from '../../utils';
import type { Order, RiderProfile } from '../../types';

type ConflictType = 'time_overlap' | 'rider_overload' | 'area_imbalance';

interface ConflictGroup {
  id: string;
  type: ConflictType;
  orders: Order[];
  riders: RiderProfile[];
  suggestedSolution: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: Date;
}

const conflictTypeText: Record<ConflictType, string> = {
  time_overlap: '时间重叠',
  rider_overload: '骑手超载',
  area_imbalance: '区域失衡',
};

const conflictTypeBadge: Record<ConflictType, 'danger' | 'warning' | 'info'> = {
  time_overlap: 'danger',
  rider_overload: 'warning',
  area_imbalance: 'info',
};

const severityConfig: Record<string, { color: string; label: string }> = {
  high: { color: 'bg-red-500', label: '高' },
  medium: { color: 'bg-orange-500', label: '中' },
  low: { color: 'bg-yellow-500', label: '低' },
};

export default function ConflictsPage() {
  const { mockOrders, mockRiders, showToast, assignOrderRider, updateOrderStatus } = useAppStore();

  const [filterType, setFilterType] = useState<ConflictType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 86400000).toISOString().slice(0, 16),
    end: new Date().toISOString().slice(0, 16),
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'assign' | 'split' | 'cancel';
    conflict: ConflictGroup;
    order?: Order;
  } | null>(null);

  const conflicts = useMemo<ConflictGroup[]>(() => {
    const list: ConflictGroup[] = [];
    const activeOrders = mockOrders.filter(
      (o) => o.status === 'pending_accept' || o.status === 'picking' || o.status === 'delivering'
    );

    for (let i = 0; i < activeOrders.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 4, activeOrders.length); j++) {
        const a = activeOrders[i];
        const b = activeOrders[j];
        const aStart = a.expectedPickupAt.getTime();
        const aEnd = a.expectedDeliverAt.getTime();
        const bStart = b.expectedPickupAt.getTime();
        const bEnd = b.expectedDeliverAt.getTime();

        if (aStart < bEnd && bStart < aEnd && a.riderId && a.riderId === b.riderId) {
          const rider = mockRiders.find((r) => r.userId === a.riderId);
          list.push({
            id: `conflict_to_${i}_${j}`,
            type: 'time_overlap',
            orders: [a, b],
            riders: rider ? [rider] : [],
            suggestedSolution: '建议将后产生的订单转派给最近的空闲骑手',
            severity: 'high',
            createdAt: new Date(Math.min(a.createdAt.getTime(), b.createdAt.getTime())),
          });
        }
      }
    }

    mockRiders.forEach((rider, idx) => {
      const riderOrders = activeOrders.filter((o) => o.riderId === rider.userId);
      if (riderOrders.length >= 3) {
        list.push({
          id: `conflict_ol_${idx}`,
          type: 'rider_overload',
          orders: riderOrders.slice(0, 3),
          riders: [rider],
          suggestedSolution: `该骑手承载${riderOrders.length}单，建议拆分1-2单给区域内其他骑手`,
          severity: riderOrders.length >= 4 ? 'high' : 'medium',
          createdAt: new Date(),
        });
      }
    });

    if (mockRiders.length > 0) {
      const areaCount: Record<string, { orders: number; riders: number }> = {};
      activeOrders.forEach((o) => {
        const key = Math.round(o.pickup.lat * 100) + '_' + Math.round(o.pickup.lng * 100);
        if (!areaCount[key]) areaCount[key] = { orders: 0, riders: 0 };
        areaCount[key].orders++;
      });
      mockRiders.forEach((r) => {
        if (r.status === 'idle' || r.status === 'on_order') {
          const key = Math.round(r.location.lat * 100) + '_' + Math.round(r.location.lng * 100);
          if (!areaCount[key]) areaCount[key] = { orders: 0, riders: 0 };
          areaCount[key].riders++;
        }
      });
      Object.entries(areaCount).forEach(([key, val], idx) => {
        if (val.orders >= val.riders * 2 && val.orders >= 3) {
          const relOrders = activeOrders.filter(
            (o) => Math.round(o.pickup.lat * 100) + '_' + Math.round(o.pickup.lng * 100) === key
          );
          list.push({
            id: `conflict_area_${idx}`,
            type: 'area_imbalance',
            orders: relOrders.slice(0, 3),
            riders: mockRiders.filter((r) => r.status === 'idle').slice(0, 2),
            suggestedSolution: '该区域订单密度过高，建议从邻近区域调度空闲骑手支援',
            severity: val.orders >= 5 ? 'high' : 'low',
            createdAt: new Date(),
          });
        }
      });
    }

    return list;
  }, [mockOrders, mockRiders]);

  const filteredConflicts = useMemo(() => {
    let list = conflicts;
    if (filterType !== 'all') {
      list = list.filter((c) => c.type === filterType);
    }
    const startT = new Date(dateRange.start).getTime();
    const endT = new Date(dateRange.end).getTime();
    list = list.filter((c) => c.createdAt.getTime() >= startT && c.createdAt.getTime() <= endT);
    return list;
  }, [conflicts, filterType, dateRange]);

  const heatmapOption = useMemo(() => {
    const timeSlots = Array.from({ length: 12 }, (_, i) => `${(i * 2).toString().padStart(2, '0')}:00-${(i * 2 + 2).toString().padStart(2, '0')}:00`);
    const data = {
      time_overlap: timeSlots.map(() => Math.floor(Math.random() * 8) + 1),
      rider_overload: timeSlots.map(() => Math.floor(Math.random() * 6) + 1),
      area_imbalance: timeSlots.map(() => Math.floor(Math.random() * 5) + 1),
    };
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        data: ['时间重叠', '骑手超载', '区域失衡'],
        textStyle: { color: '#9CA3AF' },
        top: 0,
      },
      grid: { left: 40, right: 20, top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: timeSlots,
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { color: '#9CA3AF', fontSize: 10, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        name: '冲突数',
        nameTextStyle: { color: '#9CA3AF' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1F2937' } },
        axisLabel: { color: '#9CA3AF', fontSize: 10 },
      },
      series: [
        {
          name: '时间重叠',
          type: 'bar',
          stack: 'total',
          data: data.time_overlap,
          itemStyle: { color: '#FF4757', borderRadius: [0, 0, 0, 0] },
        },
        {
          name: '骑手超载',
          type: 'bar',
          stack: 'total',
          data: data.rider_overload,
          itemStyle: { color: '#FF6B1A' },
        },
        {
          name: '区域失衡',
          type: 'bar',
          stack: 'total',
          data: data.area_imbalance,
          itemStyle: { color: '#1E40FF', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, []);

  const handleActionConfirm = () => {
    if (!actionModal) return;
    const { type, conflict, order } = actionModal;
    if (type === 'assign' && order && conflict.riders.length > 0) {
      assignOrderRider(order.id, conflict.riders[0].userId);
      showToast(`订单已指派给骑手 ${conflict.riders[0].userId.slice(-6)}`, 'success');
    } else if (type === 'split') {
      showToast('已拆分订单，正在重新调度', 'success');
    } else if (type === 'cancel' && order) {
      updateOrderStatus(order.id, 'cancelled');
      showToast('订单已取消', 'info');
    }
    setActionModal(null);
  };

  const stats = useMemo(() => ({
    total: conflicts.length,
    time_overlap: conflicts.filter((c) => c.type === 'time_overlap').length,
    rider_overload: conflicts.filter((c) => c.type === 'rider_overload').length,
    area_imbalance: conflicts.filter((c) => c.type === 'area_imbalance').length,
    high: conflicts.filter((c) => c.severity === 'high').length,
  }), [conflicts]);

  return (
    <div className="min-h-screen bg-[#0F1629] text-gray-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-accent" />
              订单冲突管理
            </h1>
            <p className="text-sm text-gray-400 mt-1">检测并处理调度冲突，确保订单履约率</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                高危 <span className="font-bold text-red-400">{stats.high}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                超载 <span className="font-bold text-orange-400">{stats.rider_overload}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                失衡 <span className="font-bold text-blue-400">{stats.area_imbalance}</span>
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={() => showToast('已重新扫描冲突', 'info')}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              重新扫描
            </Button>
          </div>
        </div>

        <Card className="bg-white/5 border border-white/10 backdrop-blur mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">冲突类型:</span>
                <div className="flex gap-1">
                  {(['all', 'time_overlap', 'rider_overload', 'area_imbalance'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        filterType === t
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {t === 'all' ? '全部' : conflictTypeText[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">时间范围:</span>
                <input
                  type="datetime-local"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-primary/50"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="datetime-local"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  placeholder="搜索订单号/骑手ID"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 w-48 focus:outline-none focus:border-primary/50 placeholder-gray-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {filteredConflicts.length === 0 ? (
              <Card className="bg-white/5 border border-white/10 backdrop-blur">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Search className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">暂无冲突</div>
                  <div className="text-sm text-gray-400">当前筛选条件下未检测到调度冲突</div>
                </CardContent>
              </Card>
            ) : (
              filteredConflicts.map((conflict) => {
                const isExpanded = expandedId === conflict.id;
                const sev = severityConfig[conflict.severity];
                return (
                  <motion.div
                    key={conflict.id}
                    layout
                    className={cn(
                      'rounded-2xl border overflow-hidden transition-all',
                      conflict.severity === 'high'
                        ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                        : conflict.severity === 'medium'
                        ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40'
                        : 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                    )}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : conflict.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={conflictTypeBadge[conflict.type]}>
                              {conflictTypeText[conflict.type]}
                            </Badge>
                            <span className={cn('w-2 h-2 rounded-full', sev.color)} />
                            <span className="text-xs text-gray-400">严重度: {sev.label}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDateTime(conflict.createdAt)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {conflict.orders.map((order) => (
                              <div
                                key={order.id}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs"
                              >
                                <div className="font-mono text-gray-300">{order.id.slice(-8)}</div>
                                <div className="text-gray-500 mt-0.5 truncate max-w-[200px]">{order.title}</div>
                              </div>
                            ))}
                          </div>
                          {conflict.riders.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                              <UserX className="w-3.5 h-3.5" />
                              涉及骑手:
                              {conflict.riders.map((r) => (
                                <span key={r.userId} className="font-mono text-gray-300">
                                  {r.userId.slice(-6)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <GitMerge className={cn('w-5 h-5 text-gray-500 transition-transform', isExpanded && 'rotate-180')} />
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-4 bg-white/[0.02]">
                            <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                              <div className="flex items-start gap-2">
                                <HandCoins className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-semibold text-primary mb-1">AI 建议解决方案</div>
                                  <div className="text-sm text-gray-300">{conflict.suggestedSolution}</div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {conflict.orders.map((order) => (
                                <div key={order.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-gray-400">{order.id.slice(-8)}</span>
                                      <Badge variant="info">{order.type === 'buy' ? '代买' : order.type === 'deliver' ? '代送' : '代办'}</Badge>
                                    </div>
                                    <span className="text-sm font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
                                  </div>
                                  <div className="text-sm text-white font-medium mb-2 truncate">{order.title}</div>
                                  <div className="text-xs text-gray-400 space-y-1">
                                    <div className="flex items-start gap-1">
                                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-danger" />
                                      <span className="truncate">取: {order.pickup.address}</span>
                                    </div>
                                    <div className="flex items-start gap-1">
                                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                                      <span className="truncate">送: {order.deliver.address}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-gray-500" />
                                      <span>
                                        {order.expectedPickupAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                        {' → '}
                                        {order.expectedDeliverAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionModal({ type: 'assign', conflict, order });
                                      }}
                                    >
                                      <GitMerge className="w-3.5 h-3.5 mr-1" />
                                      人工派单
                                    </Button>
                                    <Button
                                      variant="accent"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionModal({ type: 'split', conflict, order });
                                      }}
                                    >
                                      <SplitSquareVertical className="w-3.5 h-3.5 mr-1" />
                                      拆分
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionModal({ type: 'cancel', conflict, order });
                                      }}
                                    >
                                      <XCircle className="w-3.5 h-3.5 mr-1" />
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border border-white/10 backdrop-blur">
              <CardHeader className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-white">冲突热力图 (按时间段)</h3>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <ReactECharts option={heatmapOption} style={{ height: 320 }} theme="dark" />
              </CardContent>
            </Card>

            <Card className="bg-white/5 border border-white/10 backdrop-blur">
              <CardHeader className="px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">冲突统计</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20">
                  <div>
                    <div className="text-xs text-gray-400">时间重叠</div>
                    <div className="text-xl font-bold text-red-400">{stats.time_overlap}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20">
                  <div>
                    <div className="text-xs text-gray-400">骑手超载</div>
                    <div className="text-xl font-bold text-orange-400">{stats.rider_overload}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <UserX className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                  <div>
                    <div className="text-xs text-gray-400">区域失衡</div>
                    <div className="text-xl font-bold text-blue-400">{stats.area_imbalance}</div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'assign'
            ? '人工派单确认'
            : actionModal?.type === 'split'
            ? '拆分订单确认'
            : '取消订单确认'
        }
        size="md"
      >
        {actionModal && actionModal.order && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">目标订单</div>
              <div className="font-semibold text-gray-900 mb-2">{actionModal.order.title}</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>订单号: <span className="font-mono">{actionModal.order.id}</span></div>
                <div>金额: <span className="font-bold text-primary">{formatCurrency(actionModal.order.totalAmount)}</span></div>
              </div>
            </div>

            {actionModal.type === 'assign' && actionModal.conflict.riders.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-xs text-gray-500 mb-1">建议骑手</div>
                <div className="font-semibold text-gray-900">
                  骑手 {actionModal.conflict.riders[0].userId.slice(-6)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {actionModal.conflict.riders[0].vehicleType} · ⭐{actionModal.conflict.riders[0].avgRating}
                </div>
              </div>
            )}

            {actionModal.type === 'cancel' && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                ⚠️ 取消订单将触发退款流程，且会影响用户体验，请谨慎操作。
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="!text-gray-700 !border-gray-300 hover:!bg-gray-100 flex-1"
                onClick={() => setActionModal(null)}
              >
                取消
              </Button>
              <Button
                variant={actionModal.type === 'cancel' ? 'danger' : 'primary'}
                className="flex-1"
                onClick={handleActionConfirm}
              >
                确认{actionModal.type === 'assign' ? '派单' : actionModal.type === 'split' ? '拆分' : '取消'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
