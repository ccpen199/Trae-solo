import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Bell,
  ArrowUpCircle,
  UserCog,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  User,
  Download,
  Send,
  TrendingUp,
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockSupervisionOrders } from '@/mock/data';
import {
  formatDate,
  getStatusText,
  getStatusColor,
} from '@/utils/format';
import type { SupervisionOrder, SupervisionStatus } from '@/types';
import { cn } from '@/lib/utils';

type BusinessTypeFilter = 'all' | string;
type StatusFilter = 'all' | SupervisionStatus;
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

const businessTypes = [
  { value: 'all', label: '全部业务' },
  { value: '社保转移', label: '社保转移' },
  { value: '医保报销', label: '医保报销' },
  { value: '失业金申领', label: '失业金申领' },
  { value: '工伤认定', label: '工伤认定' },
  { value: '生育津贴', label: '生育津贴' },
  { value: '社保卡办理', label: '社保卡办理' },
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'warning', label: '预警中' },
  { value: 'overdue', label: '已超时' },
  { value: 'completed', label: '已完成' },
];

const priorityOptions = [
  { value: 'all', label: '全部优先级' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const getPriorityText = (priority: string): string => {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return map[priority] || priority;
};

const getPriorityColor = (priority: string): string => {
  const map: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'default',
  };
  return map[priority] || 'default';
};

const Supervision: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<BusinessTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<SupervisionOrder | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const filteredOrders = useMemo(() => {
    return mockSupervisionOrders.filter((order) => {
      const matchSearch =
        searchText === '' ||
        order.businessNo.includes(searchText) ||
        order.applicantName.includes(searchText);
      const matchBusinessType =
        businessTypeFilter === 'all' || order.businessType === businessTypeFilter;
      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || order.priority === priorityFilter;
      const matchStartDate =
        !startDate || new Date(order.receiveDate) >= new Date(startDate);
      const matchEndDate =
        !endDate || new Date(order.receiveDate) <= new Date(endDate);
      return (
        matchSearch &&
        matchBusinessType &&
        matchStatus &&
        matchPriority &&
        matchStartDate &&
        matchEndDate
      );
    });
  }, [searchText, businessTypeFilter, statusFilter, priorityFilter, startDate, endDate]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedOrders.map((o) => o.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleViewDetail = (order: SupervisionOrder) => {
    setSelectedOrder(order);
    setShowDetailPanel(true);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
    setTimeout(() => setSelectedOrder(null), 300);
  };

  const handleBatchSupervise = () => {
    alert(`批量督办 ${selectedIds.length} 条工单`);
  };

  const handleBatchTransfer = () => {
    alert(`批量转办 ${selectedIds.length} 条工单`);
  };

  const handleExport = () => {
    alert('导出数据');
  };

  const handleSupervise = (order: SupervisionOrder) => {
    alert(`督办工单：${order.businessNo}`);
  };

  const handleTransfer = (order: SupervisionOrder) => {
    alert(`转办工单：${order.businessNo}`);
  };

  const handleSendReminder = () => {
    alert('发送催办通知');
  };

  const handleEscalate = () => {
    alert('升级督办');
  };

  const handleManualIntervention = () => {
    alert('人工干预');
  };

  const progressSteps = [
    { title: '申请提交', status: 'completed', time: '2025-06-10 09:30' },
    { title: '材料审核', status: 'completed', time: '2025-06-10 14:20' },
    { title: '业务办理', status: 'current', time: '进行中' },
    { title: '领导审批', status: 'pending', time: '待办理' },
    { title: '结果反馈', status: 'pending', time: '待办理' },
  ];

  const supervisionHistory = [
    {
      id: 1,
      time: '2025-06-12 10:00',
      type: '催办通知',
      operator: '系统自动',
      content: '业务即将到期，已发送催办通知至经办人',
    },
    {
      id: 2,
      time: '2025-06-11 16:30',
      type: '督办提醒',
      operator: '张科长',
      content: '请尽快处理该业务，确保按时办结',
    },
    {
      id: 3,
      time: '2025-06-10 09:30',
      type: '工单创建',
      operator: '系统',
      content: '督办工单创建，进入办理流程',
    },
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'current':
        return <Clock className="w-5 h-5 text-primary-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-neutral-200" />;
    }
  };

  const getRemainingDaysColor = (days: number, status: string) => {
    if (status === 'completed') return 'text-success-500';
    if (status === 'overdue') return 'text-danger-500';
    if (days <= 3) return 'text-danger-500';
    if (days <= 7) return 'text-warning-500';
    return 'text-neutral-600';
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-600 mb-2">业务督办</h1>
          <p className="text-sm text-neutral-400">
            监督管理各类业务办理进度，确保按时办结
          </p>
        </div>

        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              <input
                type="text"
                placeholder="搜索业务编号/申请人"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowBusinessTypeDropdown(!showBusinessTypeDropdown);
                  setShowStatusDropdown(false);
                  setShowPriorityDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
              >
                <Filter className="w-4 h-4 text-neutral-400" />
                {businessTypes.find((o) => o.value === businessTypeFilter)?.label}
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
              {showBusinessTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
                  {businessTypes.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setBusinessTypeFilter(option.value as BusinessTypeFilter);
                        setShowBusinessTypeDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors',
                        businessTypeFilter === option.value
                          ? 'text-primary-500 bg-primary-50'
                          : 'text-neutral-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowBusinessTypeDropdown(false);
                  setShowPriorityDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-neutral-400" />
                {statusOptions.find((o) => o.value === statusFilter)?.label}
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value as StatusFilter);
                        setShowStatusDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors',
                        statusFilter === option.value
                          ? 'text-primary-500 bg-primary-50'
                          : 'text-neutral-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowBusinessTypeDropdown(false);
                  setShowStatusDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-neutral-400" />
                {priorityOptions.find((o) => o.value === priorityFilter)?.label}优先级
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPriorityFilter(option.value as PriorityFilter);
                        setShowPriorityDropdown(false);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors',
                        priorityFilter === option.value
                          ? 'text-primary-500 bg-primary-50'
                          : 'text-neutral-600'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
              <span className="text-neutral-300">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>

            <span className="text-sm text-neutral-400 ml-auto">
              共 {filteredOrders.length} 条记录
            </span>
          </div>
        </Card>

        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-neutral-600">督办工单列表</span>
              {selectedIds.length > 0 && (
                <span className="text-xs text-primary-500">
                  已选 {selectedIds.length} 项
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                icon={<Bell className="w-4 h-4" />}
                onClick={handleBatchSupervise}
                disabled={selectedIds.length === 0}
              >
                批量督办
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<UserCog className="w-4 h-4" />}
                onClick={handleBatchTransfer}
                disabled={selectedIds.length === 0}
              >
                批量转办
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Download className="w-4 h-4" />}
                onClick={handleExport}
              >
                导出
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        paginatedOrders.length > 0 &&
                        selectedIds.length === paginatedOrders.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    业务类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    业务编号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    申请人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    受理日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    截止日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    剩余天数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    当前节点
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    经办人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => handleSelectOne(order.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600 font-medium">
                        {order.businessType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500 font-mono">
                        {order.businessNo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.applicantType === 'enterprise' ? (
                          <Building2 className="w-4 h-4 text-primary-400" />
                        ) : (
                          <User className="w-4 h-4 text-neutral-300" />
                        )}
                        <span className="text-sm text-neutral-600">
                          {order.applicantName}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            order.applicantType === 'enterprise'
                              ? 'bg-primary-50 text-primary-500'
                              : 'bg-neutral-100 text-neutral-400'
                          )}
                        >
                          {order.applicantType === 'enterprise' ? '企业' : '个人'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">
                        {formatDate(order.receiveDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">
                        {formatDate(order.deadlineDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          getRemainingDaysColor(order.remainingDays, order.status)
                        )}
                      >
                        {order.status === 'completed'
                          ? '已完成'
                          : order.status === 'overdue'
                          ? `超期 ${Math.abs(order.remainingDays)} 天`
                          : `${order.remainingDays} 天`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge badge-${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500">{order.currentNode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                          <span className="text-xs text-white font-medium">
                            {order.handler.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-600">{order.handler}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge badge-${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Bell className="w-4 h-4" />}
                          onClick={() => handleSupervise(order)}
                        >
                          督办
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => handleViewDetail(order)}
                        >
                          详情
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<UserCog className="w-4 h-4" />}
                          onClick={() => handleTransfer(order)}
                        >
                          转办
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginatedOrders.length === 0 && (
            <div className="py-16 text-center">
              <XCircle className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-400 text-sm">暂无符合条件的督办工单</p>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100">
            <div className="text-sm text-neutral-400">
              第 {currentPage} / {totalPages || 1} 页，共 {filteredOrders.length} 条
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-primary-300 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-primary-500 text-white'
                        : 'text-neutral-500 hover:bg-neutral-100'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:border-primary-300 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showDetailPanel && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={handleCloseDetail}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-modal z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-600">督办详情</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      业务编号：{selectedOrder.businessNo}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseDetail}
                    className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-primary-500" />
                    工单基本信息
                  </h4>
                  <Card padding="sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">业务类型</span>
                        <span className="text-sm text-neutral-600 font-medium">
                          {selectedOrder.businessType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">业务编号</span>
                        <span className="text-sm text-neutral-500 font-mono">
                          {selectedOrder.businessNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">申请人</span>
                        <div className="flex items-center gap-2">
                          {selectedOrder.applicantType === 'enterprise' ? (
                            <Building2 className="w-4 h-4 text-primary-400" />
                          ) : (
                            <User className="w-4 h-4 text-neutral-300" />
                          )}
                          <span className="text-sm text-neutral-600">
                            {selectedOrder.applicantName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">受理日期</span>
                        <span className="text-sm text-neutral-600">
                          {formatDate(selectedOrder.receiveDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">截止日期</span>
                        <span className="text-sm text-neutral-600">
                          {formatDate(selectedOrder.deadlineDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">剩余天数</span>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            getRemainingDaysColor(
                              selectedOrder.remainingDays,
                              selectedOrder.status
                            )
                          )}
                        >
                          {selectedOrder.status === 'completed'
                            ? '已完成'
                            : selectedOrder.status === 'overdue'
                            ? `超期 ${Math.abs(selectedOrder.remainingDays)} 天`
                            : `${selectedOrder.remainingDays} 天`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">当前状态</span>
                        <span
                          className={`badge badge-${getStatusColor(selectedOrder.status)}`}
                        >
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">优先级</span>
                        <span
                          className={`badge badge-${getPriorityColor(
                            selectedOrder.priority
                          )}`}
                        >
                          {getPriorityText(selectedOrder.priority)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">当前节点</span>
                        <span className="text-sm text-neutral-600">
                          {selectedOrder.currentNode}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">经办人</span>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {selectedOrder.handler.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-neutral-600">
                            {selectedOrder.handler}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ({selectedOrder.handlerDept})
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    办理进度
                  </h4>
                  <Card padding="sm">
                    <div className="relative">
                      {progressSteps.map((step, index) => (
                        <div key={index} className="flex gap-3 pb-5 last:pb-0">
                          <div className="relative flex flex-col items-center">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center z-10',
                                step.status === 'completed' && 'bg-success-50',
                                step.status === 'current' && 'bg-primary-50'
                              )}
                            >
                              {getStepIcon(step.status)}
                            </div>
                            {index < progressSteps.length - 1 && (
                              <div
                                className={cn(
                                  'absolute top-8 w-0.5 h-[calc(100%-2rem)]',
                                  step.status === 'completed'
                                    ? 'bg-success-300'
                                    : 'bg-neutral-200'
                                )}
                              />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                step.status === 'completed' && 'text-success-600',
                                step.status === 'current' && 'text-primary-600',
                                step.status === 'pending' && 'text-neutral-400'
                              )}
                            >
                              {step.title}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">{step.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-500" />
                    督办历史
                  </h4>
                  <Card padding="none">
                    <div className="divide-y divide-neutral-100">
                      {supervisionHistory.map((record) => (
                        <div key={record.id} className="p-4 hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-neutral-600">
                              {record.type}
                            </span>
                            <span className="text-xs text-neutral-400">{record.time}</span>
                          </div>
                          <p className="text-sm text-neutral-500 mb-1">{record.content}</p>
                          <p className="text-xs text-neutral-400">操作人：{record.operator}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-600 mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary-500" />
                    督办操作
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      icon={<Bell className="w-4 h-4" />}
                      onClick={handleSendReminder}
                      className="flex-col py-3 h-auto"
                    >
                      <span className="text-xs mt-1">发送催办</span>
                    </Button>
                    <Button
                      variant="outline"
                      icon={<ArrowUpCircle className="w-4 h-4" />}
                      onClick={handleEscalate}
                      className="flex-col py-3 h-auto"
                    >
                      <span className="text-xs mt-1">升级督办</span>
                    </Button>
                    <Button
                      variant="outline"
                      icon={<UserCog className="w-4 h-4" />}
                      onClick={handleManualIntervention}
                      className="flex-col py-3 h-auto"
                    >
                      <span className="text-xs mt-1">人工干预</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Supervision;
