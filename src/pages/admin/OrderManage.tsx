import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  Eye,
  AlertTriangle,
  Gavel,
  X,
  User,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Package,
} from 'lucide-react';
import { api } from '../../utils/api';
import { cn } from '../../lib/utils';
import type { ServiceOrder, PaginatedResponse } from '../../../shared/types';

const statusConfig: Record<string, { label: string; color: string }> = {
  published: { label: '已发布', color: 'bg-blue-500/20 text-blue-400' },
  matched: { label: '已匹配', color: 'bg-cyan-500/20 text-cyan-400' },
  confirmed: { label: '已确认', color: 'bg-teal-500/20 text-teal-400' },
  deposit_paid: { label: '已付定金', color: 'bg-lime-500/20 text-lime-400' },
  in_progress: { label: '进行中', color: 'bg-amber-500/20 text-amber-400' },
  completed: { label: '已完成', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: '已取消', color: 'bg-zinc-500/20 text-zinc-400' },
  disputed: { label: '有争议', color: 'bg-red-500/20 text-red-400' },
};

interface ArbitrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (decision: string, reason: string) => void;
  order: ServiceOrder | null;
}

function ArbitrateModal({ isOpen, onClose, onConfirm, order }: ArbitrateModalProps) {
  const [decision, setDecision] = useState<'refund' | 'complete'>('refund');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setErrors('请填写仲裁原因');
      return;
    }
    onConfirm(decision, reason);
    setReason('');
    setErrors(null);
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg animate-fade-in-up">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Gavel className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">订单仲裁</h3>
              <p className="text-sm text-zinc-500">订单号: {order.id.slice(0, 12)}...</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">订单标题</span>
              <span className="text-white font-medium">{order.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">订单金额</span>
              <span className="text-white font-medium">¥{order.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">发起方</span>
              <span className="text-white">{order.requester?.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm">承接方</span>
              <span className="text-white">{order.creator?.username || '未匹配'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              仲裁决定 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('refund')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                  decision === 'refund'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                )}
              >
                <XCircle className={cn('w-6 h-6 mb-2', decision === 'refund' ? 'text-red-400' : 'text-zinc-500')} />
                <div className={cn('font-medium', decision === 'refund' ? 'text-red-400' : 'text-zinc-400')}>
                  退款给用户
                </div>
                <div className="text-xs text-zinc-600 mt-1">取消订单，全额退款</div>
              </button>
              <button
                type="button"
                onClick={() => setDecision('complete')}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                  decision === 'complete'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                )}
              >
                <CheckCircle className={cn('w-6 h-6 mb-2', decision === 'complete' ? 'text-green-400' : 'text-zinc-500')} />
                <div className={cn('font-medium', decision === 'complete' ? 'text-green-400' : 'text-zinc-400')}>
                  完成订单
                </div>
                <div className="text-xs text-zinc-600 mt-1">结算给创作者</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              仲裁原因 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors) setErrors(null);
              }}
              placeholder="请详细说明仲裁的原因..."
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl bg-zinc-800 border text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all',
                errors ? 'border-red-500' : 'border-zinc-700'
              )}
            />
            {errors && <p className="mt-2 text-sm text-red-400">{errors}</p>}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            确认仲裁
          </button>
        </div>
      </div>
    </div>
  );
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onArbitrate: () => void;
}

function OrderDetailModal({ isOpen, onClose, order, onArbitrate }: OrderDetailModalProps) {
  const [traces, setTraces] = useState<any[]>([]);

  useEffect(() => {
    if (order?.id) {
      loadTraces();
    }
  }, [order?.id]);

  const loadTraces = async () => {
    if (!order?.id) return;
    try {
      const response: any = await api.orders.getTraces(order.id);
      setTraces(response.data);
    } catch (error) {
      console.error('Failed to load traces:', error);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">订单详情</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-zinc-800/50 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-xl font-semibold text-white">{order.title}</h4>
                <p className="text-zinc-500 text-sm mt-1">
                  订单号: <span className="font-mono">{order.id}</span>
                </p>
              </div>
              <span className={cn('badge', statusConfig[order.status]?.color)}>
                {statusConfig[order.status]?.label}
              </span>
            </div>
            {order.description && (
              <p className="text-zinc-400 text-sm">{order.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                <User className="w-4 h-4" />
                发起方
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {order.requester?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{order.requester?.username}</p>
                  <p className="text-zinc-500 text-xs">
                    创建于 {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                <User className="w-4 h-4" />
                承接方
              </div>
              {order.creator ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/30 flex items-center justify-center">
                    <span className="text-primary-400 font-medium">
                      {order.creator.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{order.creator.username}</p>
                    <p className="text-zinc-500 text-xs">
                      评分: {order.creator.rating} ⭐
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600">暂未匹配</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <DollarSign className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">¥{order.price}</p>
              <p className="text-zinc-500 text-xs">订单总额</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <Package className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">¥{order.deposit}</p>
              <p className="text-zinc-500 text-xs">定金</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{order.duration}h</p>
              <p className="text-zinc-500 text-xs">预计时长</p>
            </div>
          </div>

          {order.insurancePolicy && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h5 className="text-white font-medium mb-2">服务保障</h5>
              <p className="text-zinc-400 text-sm">{order.insurancePolicy}</p>
            </div>
          )}

          {order.requirements && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h5 className="text-white font-medium mb-2">服务要求</h5>
              <p className="text-zinc-400 text-sm">{order.requirements}</p>
            </div>
          )}

          {traces.length > 0 && (
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h5 className="text-white font-medium mb-4">订单追踪</h5>
              <div className="space-y-4">
                {traces.map((trace, index) => (
                  <div key={trace.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        index === 0 ? 'bg-primary-500' : 'bg-zinc-600'
                      )} />
                      {index < traces.length - 1 && (
                        <div className="w-0.5 h-full bg-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-white font-medium text-sm">{trace.type}</p>
                      {trace.content && (
                        <p className="text-zinc-500 text-xs mt-1">{trace.content}</p>
                      )}
                      <p className="text-zinc-600 text-xs mt-1">
                        {new Date(trace.createdAt).toLocaleString('zh-CN')}
                        {trace.operator && ` - ${trace.operator.username}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            关闭
          </button>
          {order.status === 'disputed' && (
            <button
              onClick={onArbitrate}
              className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <Gavel className="w-4 h-4" />
              进行仲裁
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderManage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showArbitrate, setShowArbitrate] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 20 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response: any = await api.admin.getOrders(params);
      const data = response.data as PaginatedResponse<ServiceOrder>;
      setOrders(data.items);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleArbitrateClick = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setShowArbitrate(true);
    setShowDetail(false);
  };

  const handleArbitrateConfirm = async (decision: string, reason: string) => {
    if (!selectedOrder) return;
    try {
      await api.admin.arbitrate(selectedOrder.id, decision, reason);
      setShowArbitrate(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      console.error('Failed to arbitrate:', error);
    }
  };

  const disputedCount = orders.filter((o) => o.status === 'disputed').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">订单管理</h1>
          <p className="text-zinc-500 mt-1">查看和管理平台所有订单</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索订单号..."
              className="pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
              <p className="text-sm text-zinc-500">总订单</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {orders.filter((o) => o.status === 'completed').length}
              </p>
              <p className="text-sm text-zinc-500">已完成</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {orders.filter((o) => ['published', 'matched', 'confirmed', 'deposit_paid', 'in_progress'].includes(o.status)).length}
              </p>
              <p className="text-sm text-zinc-500">进行中</p>
            </div>
          </div>
        </div>
        <div className={cn(
          'bg-zinc-900 border rounded-2xl p-4',
          disputedCount > 0 ? 'border-red-500/50' : 'border-zinc-800'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              disputedCount > 0 ? 'bg-red-500/20 animate-pulse' : 'bg-zinc-800'
            )}>
              <AlertTriangle className={cn('w-5 h-5', disputedCount > 0 ? 'text-red-400' : 'text-zinc-500')} />
            </div>
            <div>
              <p className={cn('text-2xl font-bold', disputedCount > 0 ? 'text-red-400' : 'text-white')}>
                {disputedCount}
              </p>
              <p className="text-sm text-zinc-500">争议订单</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setShowStatusFilter(!showStatusFilter)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'all' ? '全部状态' : statusConfig[statusFilter]?.label}
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                showStatusFilter && 'rotate-180'
              )}
            />
          </button>

          {showStatusFilter && (
            <div className="absolute left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-10">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setShowStatusFilter(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors',
                  statusFilter === 'all' ? 'text-primary-400' : 'text-zinc-400'
                )}
              >
                全部状态
              </button>
              {Object.keys(statusConfig).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowStatusFilter(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between',
                    statusFilter === status ? 'text-primary-400' : 'text-zinc-400'
                  )}
                >
                  {statusConfig[status].label}
                  {status === 'disputed' && disputedCount > 0 && (
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  订单信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  发起方
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  承接方
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    暂无订单数据
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={cn(
                      'hover:bg-zinc-800/30 transition-colors',
                      order.status === 'disputed' && 'bg-red-500/5'
                    )}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{order.title}</p>
                        <p className="text-zinc-600 text-xs font-mono mt-1">
                          {order.id.slice(0, 16)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {order.requester?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white">{order.requester?.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.creator ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center">
                            <span className="text-primary-400 text-sm font-medium">
                              {order.creator.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white">{order.creator.username}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600">未匹配</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">{formatCurrency(order.price)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {order.status === 'disputed' && (
                          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                        )}
                        <span className={cn('badge', statusConfig[order.status]?.color)}>
                          {statusConfig[order.status]?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'disputed' && (
                          <button
                            onClick={() => handleArbitrateClick(order)}
                            className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"
                            title="仲裁"
                          >
                            <Gavel className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderDetailModal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onArbitrate={() => {
          if (selectedOrder) {
            setShowArbitrate(true);
            setShowDetail(false);
          }
        }}
      />

      <ArbitrateModal
        isOpen={showArbitrate}
        onClose={() => {
          setShowArbitrate(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleArbitrateConfirm}
        order={selectedOrder}
      />
    </div>
  );
}
