import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flame,
  Gauge,
  History,
  RefreshCw,
  Rocket,
  Search,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { cn, formatCurrency, formatDateTime } from '../../utils';
import type { Order, RiderProfile } from '../../types';

interface FusionLogEntry {
  time: Date;
  action: string;
  detail: string;
  operator?: string;
}

interface FusedOrderRow {
  order: Order;
  originalRider?: RiderProfile;
  reason: string;
  retryCount: number;
  status: 'pending_reassign' | 'reassigning' | 'assigned' | 'cancelled';
  logs: FusionLogEntry[];
  candidateRiders: RiderProfile[];
}

const statusText: Record<FusedOrderRow['status'], string> = {
  pending_reassign: '等待转派',
  reassigning: '转派中',
  assigned: '已转派',
  cancelled: '已取消',
};

const statusBadge: Record<FusedOrderRow['status'], 'danger' | 'warning' | 'success' | 'default'> = {
  pending_reassign: 'danger',
  reassigning: 'warning',
  assigned: 'success',
  cancelled: 'default',
};

export default function FusionPage() {
  const { mockOrders, mockRiders, showToast, assignOrderRider, updateOrderStatus } = useAppStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'urgent' | 'force' | 'cancel';
    row: FusedOrderRow;
    targetRider?: RiderProfile;
  } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FusedOrderRow['status']>('all');

  const fusedRows = useMemo<FusedOrderRow[]>(() => {
    const fusedOrders = mockOrders.filter((o) => o.status === 'fused' || o.fusionCount > 0);
    const otherOrders = mockOrders.filter((o) => o.status === 'pending_accept');
    const all = [...fusedOrders, ...otherOrders.slice(0, 3)];
    const reasonPool = [
      '骑手超时未接单，系统自动熔断',
      '骑手主动拒单，已达最大重试次数',
      '骑手失联，触发失联熔断机制',
      '配送地址变更，原骑手无法履约',
      '天气原因，原骑手申请转派',
    ];
    return all.map((order, idx) => {
      const originalRider = order.riderId
        ? mockRiders.find((r) => r.userId === order.riderId)
        : mockRiders[idx % mockRiders.length];
      const retryCount = order.fusionCount || Math.floor(Math.random() * 4) + 1;
      const status: FusedOrderRow['status'] =
        idx % 4 === 0 ? 'pending_reassign' : idx % 4 === 1 ? 'reassigning' : idx % 4 === 2 ? 'assigned' : 'cancelled';
      const logs: FusionLogEntry[] = [];
      const baseT = order.createdAt.getTime();
      logs.push({
        time: new Date(baseT),
        action: '订单创建',
        detail: `订单 ${order.id.slice(-8)} 生成，金额 ${formatCurrency(order.totalAmount)}`,
        operator: '系统',
      });
      if (originalRider) {
        logs.push({
          time: new Date(baseT + 60000),
          action: '指派骑手',
          detail: `推送给骑手 ${originalRider.userId.slice(-6)}`,
          operator: '调度系统',
        });
      }
      for (let i = 0; i < retryCount; i++) {
        const t = baseT + (i + 1) * 180000;
        const rr = mockRiders[(idx + i + 1) % mockRiders.length];
        logs.push({
          time: new Date(t),
          action: i === retryCount - 1 ? '触发熔断' : '转派失败',
          detail: i === retryCount - 1
            ? `已转派 ${retryCount} 次均失败，进入熔断队列`
            : `转派给骑手 ${rr.userId.slice(-6)} 失败`,
          operator: '调度引擎',
        });
      }
      if (status === 'assigned') {
        const asRider = mockRiders[(idx + 5) % mockRiders.length];
        logs.push({
          time: new Date(baseT + (retryCount + 1) * 180000),
          action: '转派成功',
          detail: `订单已指派给骑手 ${asRider.userId.slice(-6)}`,
          operator: '人工调度',
        });
      }
      return {
        order,
        originalRider,
        reason: reasonPool[idx % reasonPool.length],
        retryCount,
        status,
        logs,
        candidateRiders: mockRiders
          .filter((r) => r.status === 'idle')
          .slice(0, 3),
      };
    });
  }, [mockOrders, mockRiders]);

  const stats = useMemo(() => {
    const total = fusedRows.length;
    const avgRetry = total > 0
      ? (fusedRows.reduce((s, r) => s + r.retryCount, 0) / total).toFixed(1)
      : '0';
    const successCount = fusedRows.filter((r) => r.status === 'assigned').length;
    const rate = total > 0 ? ((successCount / total) * 100).toFixed(1) : '0';
    return { total, avgRetry, rate, successCount };
  }, [fusedRows]);

  const filteredRows = useMemo(() => {
    let list = fusedRows;
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.order.id.toLowerCase().includes(kw) ||
          (r.originalRider?.userId.toLowerCase().includes(kw) ?? false) ||
          r.order.title.toLowerCase().includes(kw)
      );
    }
    return list;
  }, [fusedRows, statusFilter, searchText]);

  const handleActionConfirm = () => {
    if (!actionModal) return;
    const { type, row, targetRider } = actionModal;
    if (type === 'urgent') {
      showToast('已标记加急，调度引擎将优先处理', 'success');
    } else if (type === 'force' && targetRider) {
      assignOrderRider(row.order.id, targetRider.userId);
      showToast(`已强制指派给骑手 ${targetRider.userId.slice(-6)}`, 'success');
    } else if (type === 'cancel') {
      updateOrderStatus(row.order.id, 'cancelled');
      showToast('订单已取消，将触发退款流程', 'info');
    }
    setActionModal(null);
  };

  return (
    <div className="min-h-screen bg-[#0F1629] text-gray-100 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Flame className="w-7 h-7 text-danger" />
              熔断队列管理
            </h1>
            <p className="text-sm text-gray-400 mt-1">跟踪熔断订单状态，确保每单最终完成履约</p>
          </div>
          <Button variant="accent" size="sm" onClick={() => showToast('正在重新扫描熔断订单', 'info')}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            刷新队列
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">今日熔断单数</div>
                  <div className="text-3xl font-bold text-red-400">{stats.total}</div>
                  <div className="text-xs text-gray-500 mt-1">较昨日 +12.5%</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertOctagon className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">平均转派次数</div>
                  <div className="text-3xl font-bold text-orange-400">{stats.avgRetry}</div>
                  <div className="text-xs text-gray-500 mt-1">阈值: 3次</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">转派成功率</div>
                  <div className="text-3xl font-bold text-green-400">{stats.rate}%</div>
                  <div className="text-xs text-green-400/70 mt-1">目标: ≥85%</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">已成功转派</div>
                  <div className="text-3xl font-bold text-blue-400">{stats.successCount}</div>
                  <div className="text-xs text-gray-500 mt-1">占比 {(stats.total > 0 ? (stats.successCount / stats.total * 100).toFixed(0) : 0)}%</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/5 border border-white/10 backdrop-blur mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索订单号/原骑手ID/订单标题"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary/50 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-1">
                {(['all', 'pending_reassign', 'reassigning', 'assigned', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium transition-all',
                      statusFilter === s
                        ? 'bg-accent text-white shadow-lg shadow-accent/30'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    )}
                  >
                    {s === 'all' ? '全部' : statusText[s]}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400 ml-auto">
                共 <span className="font-bold text-white">{filteredRows.length}</span> 条记录
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border border-white/10 backdrop-blur overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] border-b border-white/10">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3.5 w-10"></th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3.5">订单号</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3.5">原骑手</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3.5">熔断原因</th>
                  <th className="text-center text-xs font-medium text-gray-400 px-4 py-3.5">转派次数</th>
                  <th className="text-center text-xs font-medium text-gray-400 px-4 py-3.5">当前状态</th>
                  <th className="text-center text-xs font-medium text-gray-400 px-4 py-3.5">转派日志</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3.5">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isExpanded = expandedId === row.order.id;
                  return (
                    <>
                      <motion.tr
                        key={row.order.id}
                        className={cn(
                          'border-b border-white/5 hover:bg-white/[0.03] transition-colors',
                          row.status === 'pending_reassign' && 'bg-red-500/[0.02]'
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : row.order.id)}
                            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-gray-200 text-xs">{row.order.id.slice(-10)}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px] mt-0.5">{row.order.title}</div>
                          <div className="text-xs text-primary font-medium mt-0.5">{formatCurrency(row.order.totalAmount)}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {row.originalRider ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <img
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.originalRider.userId}`}
                                  alt=""
                                  className="w-7 h-7 rounded-full bg-white/5"
                                />
                                <div>
                                  <div className="text-xs font-medium text-gray-200">
                                    {row.originalRider.userId.slice(-6)}
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {row.originalRider.vehicleType} · ⭐{row.originalRider.avgRating}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">未指派</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 max-w-[240px]">
                          <div className="flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-300 leading-relaxed">{row.reason}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold',
                            row.retryCount >= 3 ? 'bg-red-500/15 text-red-400' :
                            row.retryCount >= 2 ? 'bg-orange-500/15 text-orange-400' :
                            'bg-yellow-500/15 text-yellow-400'
                          )}>
                            {row.retryCount} 次
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge variant={statusBadge[row.status]}>{statusText[row.status]}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <History className="w-3.5 h-3.5" />
                            {row.logs.length} 条
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setActionModal({ type: 'urgent', row })}
                              disabled={row.status === 'assigned' || row.status === 'cancelled'}
                            >
                              <Rocket className="w-3 h-3 mr-1" />
                              加急
                            </Button>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => setActionModal({ type: 'force', row, targetRider: row.candidateRiders[0] })}
                              disabled={row.status === 'assigned' || row.status === 'cancelled'}
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              强派
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setActionModal({ type: 'cancel', row })}
                              disabled={row.status === 'assigned' || row.status === 'cancelled'}
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              取消
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={`${row.order.id}_detail`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white/[0.02]"
                          >
                            <td colSpan={8} className="px-5 py-4">
                              <div className="flex gap-6">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <History className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-white">转派日志时间线</span>
                                  </div>
                                  <div className="relative pl-6 space-y-4">
                                    <div className="absolute left-2 top-1 bottom-1 w-px bg-white/10"></div>
                                    {row.logs.map((log, i) => (
                                      <div key={i} className="relative">
                                        <div className={cn(
                                          'absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2',
                                          i === row.logs.length - 1
                                            ? 'bg-primary border-primary/30 shadow-[0_0_8px_rgba(30,64,255,0.5)]'
                                            : 'bg-[#0F1629] border-white/20'
                                        )}></div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium text-white">{log.action}</span>
                                          {log.operator && (
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                                              {log.operator}
                                            </span>
                                          )}
                                          <span className="text-[10px] text-gray-500 ml-auto font-mono">
                                            {formatDateTime(log.time)}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-400">{log.detail}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="w-72 shrink-0 border-l border-white/10 pl-6">
                                  <div className="flex items-center gap-2 mb-3">
                                    <UserPlus className="w-4 h-4 text-accent" />
                                    <span className="text-sm font-semibold text-white">候选骑手</span>
                                  </div>
                                  <div className="space-y-2">
                                    {row.candidateRiders.map((rider) => (
                                      <div
                                        key={rider.userId}
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.userId}`}
                                            alt=""
                                            className="w-8 h-8 rounded-full bg-white/5"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-white">
                                              {rider.userId.slice(-6)}
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                              {rider.vehicleType}
                                            </div>
                                          </div>
                                          <Badge variant="success">空闲</Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                                          <span>⭐ {rider.avgRating} · 💯 {rider.creditScore}</span>
                                          <span>已完成 {rider.completedOrders} 单</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                      </div>
                      <div className="text-lg font-semibold text-white mb-1">无熔断订单</div>
                      <div className="text-sm text-gray-400">系统运行良好，未检测到熔断订单</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'urgent'
            ? '标记加急处理'
            : actionModal?.type === 'force'
            ? '人工强制指派'
            : '取消熔断订单'
        }
        size="md"
      >
        {actionModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">熔断订单</div>
              <div className="font-semibold text-gray-900 mb-2">{actionModal.row.order.title}</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>订单号: <span className="font-mono">{actionModal.row.order.id}</span></div>
                <div>金额: <span className="font-bold text-primary">{formatCurrency(actionModal.row.order.totalAmount)}</span></div>
                <div>熔断原因: <span className="text-gray-800">{actionModal.row.reason}</span></div>
                <div>已转派: <span className="font-bold text-orange-600">{actionModal.row.retryCount} 次</span></div>
              </div>
            </div>

            {actionModal.type === 'urgent' && (
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Rocket className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-accent mb-1">加急处理</div>
                    <div className="text-gray-600 text-xs">标记后调度引擎将优先为该订单匹配骑手，预计30秒内完成转派。</div>
                  </div>
                </div>
              </div>
            )}

            {actionModal.type === 'force' && actionModal.targetRider && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-xs text-gray-500 mb-2">指派给以下骑手</div>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${actionModal.targetRider.userId}`}
                    alt=""
                    className="w-12 h-12 rounded-xl bg-white"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      骑手 {actionModal.targetRider.userId.slice(-6)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {actionModal.targetRider.vehicleType} · ⭐{actionModal.targetRider.avgRating} · 完成{actionModal.targetRider.completedOrders}单
                    </div>
                    <Badge variant="success" className="mt-1">当前空闲</Badge>
                  </div>
                </div>
              </div>
            )}

            {actionModal.type === 'cancel' && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 space-y-2">
                <div className="flex items-start gap-2">
                  <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">取消订单注意事项</div>
                    <ul className="text-xs mt-1 space-y-1 text-red-600 list-disc list-inside">
                      <li>将自动触发全额退款流程（约 1-3 个工作日到账）</li>
                      <li>会影响平台履约率统计，请优先尝试转派</li>
                      <li>建议先联系用户沟通，减少客诉风险</li>
                    </ul>
                  </div>
                </div>
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
                variant={actionModal.type === 'cancel' ? 'danger' : actionModal.type === 'urgent' ? 'accent' : 'primary'}
                className="flex-1"
                onClick={handleActionConfirm}
              >
                {actionModal.type === 'urgent' ? '确认加急' : actionModal.type === 'force' ? '确认指派' : '确认取消订单'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
