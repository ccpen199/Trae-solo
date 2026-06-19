import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  Clock,
  Shirt,
  BookOpen,
  Smartphone,
  Package,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ListChecks,
  UserCheck,
  DollarSign,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { QualityOrder, QualityOrderStatus, Category } from '../../../shared/types';

const statusOptions: { value: QualityOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'ai-screening', label: 'AI初筛中' },
  { value: 'manual-inspection', label: '人工质检中' },
  { value: 'completed', label: '已完成' },
];

const categoryOptions: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: '全部品类' },
  { value: 'clothing', label: '衣服' },
  { value: 'books', label: '图书' },
  { value: 'phones', label: '手机' },
];

const statusBadgeClass: Record<QualityOrderStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600',
  'ai-screening': 'bg-blue-100 text-blue-700',
  'manual-inspection': 'bg-amber-100 text-amber-700',
  completed: 'bg-eco-100 text-eco-700',
};

const statusLabelMap: Record<QualityOrderStatus, string> = {
  pending: '待处理',
  'ai-screening': 'AI初筛中',
  'manual-inspection': '人工质检中',
  completed: '已完成',
};

const categoryIconMap: Record<string, typeof Package> = {
  clothing: Shirt,
  books: BookOpen,
  phones: Smartphone,
};

const categoryLabelMap: Record<string, string> = {
  clothing: '衣服',
  books: '图书',
  phones: '手机',
};

type DropdownKey = 'status' | 'category' | null;

export default function QualityList() {
  const navigate = useNavigate();
  const { qualityOrders, orders } = useStore();
  const [statusFilter, setStatusFilter] = useState<QualityOrderStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const getOrderInfo = (qo: QualityOrder) => {
    return orders.find((o) => o.id === qo.orderId);
  };

  const stats = useMemo(() => {
    return {
      pending: qualityOrders.filter((q) => q.status === 'pending').length,
      aiScreening: qualityOrders.filter((q) => q.status === 'ai-screening').length,
      manualInspection: qualityOrders.filter((q) => q.status === 'manual-inspection').length,
      completed: qualityOrders.filter((q) => q.status === 'completed').length,
    };
  }, [qualityOrders]);

  const filteredOrders = useMemo(() => {
    return qualityOrders.filter((qo) => {
      if (statusFilter !== 'all' && qo.status !== statusFilter) return false;
      const order = getOrderInfo(qo);
      if (categoryFilter !== 'all' && order?.category !== categoryFilter) return false;
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchOrderNo = order?.orderNo.toLowerCase().includes(searchLower);
        const matchAssignee = qo.assignee?.toLowerCase().includes(searchLower);
        if (!matchOrderNo && !matchAssignee) return false;
      }
      if (dateFrom && qo.createdAt < dateFrom) return false;
      if (dateTo && qo.createdAt > dateTo + ' 23:59:59') return false;
      return true;
    });
  }, [qualityOrders, statusFilter, categoryFilter, searchText, dateFrom, dateTo, orders]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const newSelected = new Set(selectedIds);
      paginatedOrders.forEach((o) => newSelected.delete(o.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedOrders.forEach((o) => newSelected.add(o.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleQuickFilter = (status: QualityOrderStatus | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const getSopProgress = (qo: QualityOrder) => {
    const completed = qo.sopSteps.filter((s) => s.completed).length;
    const total = qo.sopSteps.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getFinalPrice = (qo: QualityOrder) => {
    const order = getOrderInfo(qo);
    return order?.finalPrice ?? order?.estimatedPrice;
  };

  const renderDropdown = (
    key: DropdownKey,
    value: string,
    options: { value: string; label: string }[],
    onChange: (v: string) => void
  ) => (
    <div className="relative">
      <button
        onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
        className="btn-secondary !py-2.5 !px-4 gap-2 text-sm flex items-center"
      >
        <Filter className="w-4 h-4" />
        <span>{options.find((o) => o.value === value)?.label}</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', openDropdown === key && 'rotate-180')} />
      </button>
      {openDropdown === key && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-neutral-100 z-50 overflow-hidden animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpenDropdown(null);
              }}
              className={cn(
                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                value === opt.value ? 'bg-eco-50 text-eco-700 font-medium' : 'text-neutral-700 hover:bg-neutral-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const statBadgeConfig: Record<QualityOrderStatus, { dot: string; text: string; activeBg: string; activeRing: string }> = {
    pending: {
      dot: 'bg-neutral-400',
      text: 'text-neutral-600',
      activeBg: 'bg-neutral-50',
      activeRing: 'ring-neutral-400',
    },
    'ai-screening': {
      dot: 'bg-blue-500',
      text: 'text-blue-600',
      activeBg: 'bg-blue-50',
      activeRing: 'ring-blue-500',
    },
    'manual-inspection': {
      dot: 'bg-amber-500',
      text: 'text-amber-600',
      activeBg: 'bg-amber-50',
      activeRing: 'ring-amber-500',
    },
    completed: {
      dot: 'bg-eco-500',
      text: 'text-eco-600',
      activeBg: 'bg-eco-50',
      activeRing: 'ring-eco-500',
    },
  };

  const StatBadge = ({
    label,
    count,
    status,
    isActive,
    onClick,
  }: {
    label: string;
    count: number;
    status: QualityOrderStatus;
    isActive: boolean;
    onClick: () => void;
  }) => {
    const config = statBadgeConfig[status];
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all border',
          isActive
            ? `${config.activeBg} border-transparent ring-2 ring-offset-1 ${config.activeRing}`
            : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
        )}
      >
        <span className={cn('w-2 h-2 rounded-full', config.dot)}></span>
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className={cn('text-sm font-bold', config.text)}>{count}</span>
      </button>
    );
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">质检工单管理</h1>
        <p className="text-sm text-neutral-500 mt-1">管理回收物品的质检流程和工单分配</p>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-neutral-100">
          <StatBadge
            label="待处理"
            count={stats.pending}
            status="pending"
            isActive={statusFilter === 'pending'}
            onClick={() => handleQuickFilter('pending')}
          />
          <StatBadge
            label="AI质检中"
            count={stats.aiScreening}
            status="ai-screening"
            isActive={statusFilter === 'ai-screening'}
            onClick={() => handleQuickFilter('ai-screening')}
          />
          <StatBadge
            label="人工质检中"
            count={stats.manualInspection}
            status="manual-inspection"
            isActive={statusFilter === 'manual-inspection'}
            onClick={() => handleQuickFilter('manual-inspection')}
          />
          <StatBadge
            label="已完成"
            count={stats.completed}
            status="completed"
            isActive={statusFilter === 'completed'}
            onClick={() => handleQuickFilter('completed')}
          />
          {statusFilter !== 'all' && (
            <button
              onClick={() => handleQuickFilter('all')}
              className="text-sm text-neutral-500 hover:text-neutral-700 underline ml-2"
            >
              清除筛选
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索订单号、质检师..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-base !pl-10 !py-2.5"
            />
          </div>

          {renderDropdown(
            'status',
            statusFilter,
            statusOptions as unknown as { value: string; label: string }[],
            (v) => setStatusFilter(v as QualityOrderStatus | 'all')
          )}
          {renderDropdown(
            'category',
            categoryFilter,
            categoryOptions as unknown as { value: string; label: string }[],
            (v) => setCategoryFilter(v as Category | 'all')
          )}

          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-base !pl-9 !py-2.5 !pr-3 text-sm w-40"
              />
            </div>
            <span className="text-neutral-400">至</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-base !pl-9 !py-2.5 !pr-3 text-sm w-40"
              />
            </div>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-3">
            <span className="text-sm text-neutral-600">
              已选择 <span className="font-semibold text-eco-600">{selectedIds.size}</span> 项
            </span>
            <button className="btn-secondary !py-2 !px-4 text-sm gap-1.5">
              <UserPlus className="w-4 h-4" />
              批量分配
            </button>
            <button className="btn-secondary !py-2 !px-4 text-sm gap-1.5 text-blue-600 hover:!text-blue-600 hover:!border-blue-300 hover:!bg-blue-50">
              <PlayCircle className="w-4 h-4" />
              批量开始质检
            </button>
            <button className="btn-secondary !py-2 !px-4 text-sm gap-1.5 text-amber-600 hover:!text-amber-600 hover:!border-amber-300 hover:!bg-amber-50">
              <Tag className="w-4 h-4" />
              批量标记
            </button>
            <button className="btn-secondary !py-2 !px-4 text-sm gap-1.5 text-red-500 hover:!text-red-500 hover:!border-red-300 hover:!bg-red-50">
              <Trash2 className="w-4 h-4" />
              批量删除
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr>
                <th className="table-th w-12">
                  <button onClick={toggleSelectAll} className="p-1">
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-eco-600" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="table-th w-12">
                  <span className="text-xs text-neutral-400">图片</span>
                </th>
                <th className="table-th">订单号</th>
                <th className="table-th">品类</th>
                <th className="table-th">状态</th>
                <th className="table-th">AI初筛</th>
                <th className="table-th">SOP进度</th>
                <th className="table-th">人工结论</th>
                <th className="table-th">最终估价</th>
                <th className="table-th">创建时间</th>
                <th className="table-th">分配给</th>
                <th className="table-th text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-neutral-400">
                    暂无质检工单
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((qo, idx) => {
                  const order = getOrderInfo(qo);
                  const CatIcon = categoryIconMap[order?.category || ''] || Package;
                  const isSelected = selectedIds.has(qo.id);
                  const sopProgress = getSopProgress(qo);
                  const finalPrice = getFinalPrice(qo);
                  return (
                    <tr
                      key={qo.id}
                      className={cn(
                        'cursor-pointer hover:bg-neutral-50 transition-colors animate-slide-up',
                        isSelected && 'bg-eco-50/60'
                      )}
                      onClick={() => navigate(`/admin/quality/${qo.id}`)}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="table-td">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(qo.id);
                          }}
                          className="p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-eco-600" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400 hover:text-neutral-600" />
                          )}
                        </button>
                      </td>
                      <td className="table-td">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          {qo.images && qo.images.length > 0 ? (
                            <img
                              src={qo.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-neutral-300" />
                          )}
                        </div>
                      </td>
                      <td className="table-td font-medium text-neutral-800">{order?.orderNo || '-'}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-eco-50 flex items-center justify-center">
                            <CatIcon className="w-4 h-4 text-eco-600" />
                          </div>
                          <span className="text-neutral-700">
                            {categoryLabelMap[order?.category || ''] || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className={cn('badge', statusBadgeClass[qo.status])}>
                          {statusLabelMap[qo.status]}
                        </span>
                      </td>
                      <td className="table-td">
                        {qo.aiResult ? (
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600">
                              {qo.aiResult.detectedCondition}分
                            </span>
                            <span className="text-xs text-neutral-400">/</span>
                            <span className="text-xs text-neutral-500">
                              {Math.round(qo.aiResult.confidence * 100)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-sm">-</span>
                        )}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <ListChecks className="w-3.5 h-3.5 text-amber-500" />
                          <div className="flex-1 min-w-[60px]">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-neutral-700">
                                {sopProgress.completed}/{sopProgress.total}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                                style={{ width: `${sopProgress.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        {qo.manualResult ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-eco-500" />
                            <span className="text-sm font-medium text-eco-600">
                              {qo.manualResult.condition}分
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-sm">-</span>
                        )}
                      </td>
                      <td className="table-td">
                        {finalPrice ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-eco-500" />
                            <span className="text-sm font-bold text-eco-600">
                              ¥{finalPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-sm">-</span>
                        )}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-xs">{qo.createdAt}</span>
                        </div>
                      </td>
                      <td className="table-td">
                        {qo.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center text-white text-xs font-medium">
                              {qo.assignee.slice(-2)}
                            </div>
                            <span className="text-neutral-700 text-sm">{qo.assignee}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-sm">未分配</span>
                        )}
                      </td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/quality/${qo.id}`);
                            }}
                            className="p-2 rounded-lg text-eco-600 hover:bg-eco-50 transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
                            title="分配"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            共 <span className="font-semibold text-neutral-700">{filteredOrders.length}</span> 条记录，
            第 <span className="font-semibold text-neutral-700">{currentPage}</span> /{' '}
            <span className="font-semibold text-neutral-700">{totalPages || 1}</span> 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                currentPage === 1
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={cn(
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                  currentPage === p
                    ? 'bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-card'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                currentPage === totalPages || totalPages === 0
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
