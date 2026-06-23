import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  MapPin,
  User,
  Clock,
  Wrench,
  ChevronDown,
  AlertTriangle,
  Star,
} from 'lucide-react';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import WorkOrderDetail from './WorkOrderDetail';
import { cn } from '@/lib/utils';

interface WorkOrder {
  id: string;
  user_id: string;
  user_name: string;
  account_no: string;
  address: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'dispatched' | 'in_progress' | 'completed' | 'closed';
  assignee: string | null;
  grid_area: string;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
  images: string[];
  evaluation: {
    rating: number;
    comment: string;
    evaluatedAt: string;
  } | null;
  warning_id: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface ListResponse {
  list: WorkOrder[];
  total: number;
  page: number;
  pageSize: number;
}

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待派单' },
  { key: 'dispatched', label: '已派单' },
  { key: 'in_progress', label: '处理中' },
  { key: 'completed', label: '已完成' },
];

const typeOptions = [
  { key: 'repair', label: '维修' },
  { key: 'install', label: '安装' },
  { key: 'inspection', label: '安检' },
  { key: 'leak', label: '泄漏' },
  { key: 'meter', label: '表具' },
  { key: 'other', label: '其他' },
];

const priorityConfig: Record<string, { color: string; label: string; bg: string; text: string }> = {
  low: { color: 'bg-green-500', label: '低', bg: 'bg-green-50', text: 'text-green-700' },
  medium: { color: 'bg-blue-500', label: '中', bg: 'bg-blue-50', text: 'text-blue-700' },
  high: { color: 'bg-amber-500', label: '高', bg: 'bg-amber-50', text: 'text-amber-700' },
  urgent: { color: 'bg-red-500', label: '紧急', bg: 'bg-red-50', text: 'text-red-700' },
};

const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: '待派单' },
  dispatched: { variant: 'info', label: '已派单' },
  in_progress: { variant: 'info', label: '处理中' },
  completed: { variant: 'success', label: '已完成' },
  closed: { variant: 'default', label: '已关闭' },
};

const typeLabels: Record<string, string> = {
  repair: '维修',
  install: '安装',
  inspection: '安检',
  leak: '泄漏',
  meter: '表具',
  other: '其他',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function WorkOrders() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [createForm, setCreateForm] = useState({
    user_id: '',
    type: 'repair',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [creating, setCreating] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (searchText) params.append('search', searchText);

      const res = await fetch(`/api/work-orders?${params}`);
      const data: ApiResponse<ListResponse> = await res.json();

      if (data.success) {
        setOrders(data.data.list);
        setTotal(data.data.total);
      }
    } catch (err) {
      console.error('获取工单列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchText, page, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = (order: WorkOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCreateOrder = async () => {
    if (!createForm.user_id || !createForm.title || !createForm.description) {
      alert('请填写完整信息');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          user_id: '',
          type: 'repair',
          title: '',
          description: '',
          priority: 'medium',
        });
        fetchOrders();
      } else {
        alert(data.error || '创建失败');
      }
    } catch (err) {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/work-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.data);
        }
      }
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const handleEvaluate = async (orderId: string, rating: number, comment: string) => {
    try {
      const res = await fetch(`/api/work-orders/${orderId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();

      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('提交评价失败:', err);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">报修工单</h1>
          <p className="text-sm text-gray-500 mt-1">管理和处理用户报修工单</p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
          新建工单
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setStatusFilter(filter.key);
                  setPage(1);
                }}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  statusFilter === filter.key
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center gap-3 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索工单编号、标题或用户..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Button
                variant="secondary"
                icon={Filter}
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="min-w-[100px]"
              >
                <span className="flex items-center gap-1">
                  {typeFilter ? typeLabels[typeFilter] : '类型'}
                  <ChevronDown className="w-4 h-4" />
                </span>
              </Button>
              {showTypeDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      setTypeFilter('');
                      setShowTypeDropdown(false);
                      setPage(1);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                      !typeFilter && 'text-primary-600 font-medium'
                    )}
                  >
                    全部类型
                  </button>
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setTypeFilter(opt.key);
                        setShowTypeDropdown(false);
                        setPage(1);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                        typeFilter === opt.key && 'text-primary-600 font-medium'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-1 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无工单数据</p>
          </div>
        ) : (
          orders.map((order) => {
            const priority = priorityConfig[order.priority];
            const status = statusConfig[order.status];

            return (
              <div
                key={order.id}
                onClick={() => handleViewDetail(order)}
                className="bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex">
                  <div className={cn('w-1 rounded-l-xl flex-shrink-0', priority.color)} />
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-mono text-gray-400">{order.id}</span>
                        <h3 className="text-base font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                          {order.title}
                        </h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priority.bg, priority.text)}>
                          {priority.label}优先级
                        </span>
                      </div>
                      <StatusBadge variant={status.variant} icon>
                        {status.label}
                      </StatusBadge>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700">
                        {typeLabels[order.type] || order.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{order.user_name}</span>
                        <span className="text-gray-400 text-xs">({order.account_no})</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDateTime(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Wrench className="w-4 h-4 text-gray-400" />
                        <span>派单人员：</span>
                        <span className="font-medium text-gray-700">
                          {order.assignee || '待分配'}
                        </span>
                      </div>

                      {order.evaluation && (
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-4 h-4',
                                  i < order.evaluation!.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400 ml-1">已评价</span>
                        </div>
                      )}

                      <span className="text-sm text-primary-600 font-medium group-hover:translate-x-1 transition-transform">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      <WorkOrderDetail
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
        onEvaluate={handleEvaluate}
      />

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建工单"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button onClick={handleCreateOrder} loading={creating}>
              创建工单
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                用户ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createForm.user_id}
                onChange={(e) => setCreateForm((f) => ({ ...f, user_id: e.target.value }))}
                placeholder="请输入用户ID"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                工单类型
              </label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              工单标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="请输入工单标题"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              问题描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="请详细描述问题..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              优先级
            </label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                const config = priorityConfig[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCreateForm((f) => ({ ...f, priority: p }))}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg border transition-all',
                      createForm.priority === p
                        ? `${config.bg} ${config.text} border-transparent ring-2 ring-offset-1 ring-${config.color.replace('bg-', '')}`
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
