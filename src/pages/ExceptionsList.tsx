import { useState, useEffect } from 'react';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  UserPlus,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Car,
  ClipboardCheck,
  Calendar,
  Wallet,
  FileSignature,
  ArrowLeftRight,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getExceptions, assignException, addHandlingRecord, resolveException, closeException } from '@/api/modules/exceptions';
import type { Exception, ExceptionType, ExceptionStatus, User as UserType, UserRole } from '@/types';
import { formatDate, getRoleLabel } from '@/utils';
import { STATUS_LABELS } from '@/utils/constants';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import ConfirmModal from '@/components/ConfirmModal';

const exceptionTypeLabels: Record<ExceptionType, string> = {
  fake_car: '虚假车源',
  accident_concealed: '隐瞒事故',
  deposit_refund: '订金纠纷',
  transfer_failed: '过户失败',
  mileage_dispute: '里程争议',
  duplicate_sale: '一车多卖',
};

const exceptionTypeColors: Record<ExceptionType, string> = {
  fake_car: 'bg-danger-100 text-danger-700 border-danger-200',
  accident_concealed: 'bg-orange-100 text-orange-700 border-orange-200',
  deposit_refund: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  transfer_failed: 'bg-purple-100 text-purple-700 border-purple-200',
  mileage_dispute: 'bg-blue-100 text-blue-700 border-blue-200',
  duplicate_sale: 'bg-gray-100 text-gray-700 border-gray-200',
};

const exceptionTypes: Array<{ value: ExceptionType | ''; label: string }> = [
  { value: '', label: '全部类型' },
  { value: 'fake_car', label: '虚假车源' },
  { value: 'accident_concealed', label: '隐瞒事故' },
  { value: 'deposit_refund', label: '订金纠纷' },
  { value: 'transfer_failed', label: '过户失败' },
  { value: 'mileage_dispute', label: '里程争议' },
  { value: 'duplicate_sale', label: '一车多卖' },
];

const statusOptions: ExceptionStatus[] = ['open', 'investigating', 'resolved', 'closed'];

const mockUsers: UserType[] = [
  { id: 1, username: 'admin', name: '系统管理员', role: 'admin', phone: '13800138000', email: 'admin@example.com', status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 6, username: 'cs1', name: '赵客服', role: 'customer_service', phone: '13800138006', email: 'cs1@example.com', status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 5, username: 'sales1', name: '王销售', role: 'sales', phone: '13800138005', email: 'sales1@example.com', status: 'active', createdAt: '2024-01-01T00:00:00Z' },
];

const mockReporters: UserType[] = [
  { id: 3, username: 'buyer1', name: '张先生', role: 'buyer', phone: '13800138003', email: 'buyer1@example.com', status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, username: 'dealer1', name: '诚信二手车行', role: 'dealer', phone: '13800138002', email: 'dealer1@example.com', status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 4, username: 'inspector1', name: '李检测师', role: 'inspector', phone: '13800138004', email: 'inspector1@example.com', status: 'active', createdAt: '2024-01-01T00:00:00Z' },
];

const relatedTypeIcons: Record<string, React.ElementType> = {
  car: Car,
  inspection: ClipboardCheck,
  appointment: Calendar,
  deposit: Wallet,
  contract: FileSignature,
  transfer: ArrowLeftRight,
};

const relatedTypeLabels: Record<string, string> = {
  car: '车辆',
  inspection: '检测报告',
  appointment: '预约',
  deposit: '订金',
  contract: '合同',
  transfer: '过户',
};

const generateMockExceptions = (): Exception[] => {
  const types: ExceptionType[] = ['fake_car', 'accident_concealed', 'deposit_refund', 'transfer_failed', 'mileage_dispute', 'duplicate_sale'];
  const relatedTypes: Array<'car' | 'inspection' | 'appointment' | 'deposit' | 'contract' | 'transfer'> = ['car', 'inspection', 'appointment', 'deposit', 'contract', 'transfer'];
  const statuses: ExceptionStatus[] = ['open', 'investigating', 'resolved', 'closed'];
  const titles: Record<ExceptionType, string[]> = {
    fake_car: ['疑似虚假车源信息', '车辆信息与实际不符', 'VIN码验证不通过'],
    accident_concealed: ['卖家隐瞒重大事故', '检测发现未披露事故', '历史维修记录异常'],
    deposit_refund: ['订金退还申请', '订金扣除争议', '违约方认定纠纷'],
    transfer_failed: ['过户材料不全', '车辆存在抵押', '车管所审核不通过'],
    mileage_dispute: ['表显里程与实际不符', '调表车嫌疑', '保养记录里程矛盾'],
    duplicate_sale: ['同一车辆多次售卖', '合同冲突', '订金重复收取'],
  };

  const exceptions: Exception[] = [];
  for (let i = 1; i <= 35; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const relatedType = relatedTypes[Math.floor(Math.random() * relatedTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const reporter = mockReporters[Math.floor(Math.random() * mockReporters.length)];
    const assignee = Math.random() > 0.3 ? mockUsers[Math.floor(Math.random() * mockUsers.length)] : undefined;
    const titleOptions = titles[type];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    exceptions.push({
      id: i,
      type,
      relatedType,
      relatedId: Math.floor(Math.random() * 1000),
      reporterId: reporter.id,
      reporter,
      assigneeId: assignee?.id,
      assignee,
      title: titleOptions[Math.floor(Math.random() * titleOptions.length)],
      description: `详细描述异常情况，包括事件经过、涉及人员、相关证据等信息。工单编号：EXC${String(i).padStart(6, '0')}`,
      evidence: [],
      status,
      handlingRecords: [
        {
          id: 1,
          operatorId: 6,
          operator: mockUsers[1],
          action: '创建工单',
          comment: '已收到异常报告，开始处理',
          createdAt: date.toISOString(),
        },
      ],
      resolution: status === 'resolved' || status === 'closed' ? '已与双方沟通，达成和解协议，问题已解决。' : undefined,
      closedAt: status === 'closed' ? new Date(date.getTime() + 86400000 * 3).toISOString() : undefined,
      createdAt: date.toISOString(),
    });
  }
  return exceptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const mockExceptions = generateMockExceptions();

export default function ExceptionsList() {
  const { user, checkRole } = useAuthStore();
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    assigneeId: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'close' | null; exceptionId: number | null }>({ open: false, type: null, exceptionId: null });
  const [assignTo, setAssignTo] = useState('');
  const [recordAction, setRecordAction] = useState('');
  const [recordComment, setRecordComment] = useState('');
  const [resolutionText, setResolutionText] = useState('');

  useEffect(() => {
    loadExceptions();
  }, [filters]);

  const loadExceptions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.assigneeId) params.assigneeId = Number(filters.assigneeId);

      try {
        const data = await getExceptions(params);
        setExceptions(data);
      } catch {
        setExceptions(mockExceptions);
      }
    } catch (error) {
      console.error('加载异常工单失败:', error);
      setExceptions(mockExceptions);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      assigneeId: '',
    });
    setCurrentPage(1);
  };

  const filteredExceptions = exceptions.filter(exc => {
    if (filters.type && exc.type !== filters.type) return false;
    if (filters.status && exc.status !== filters.status) return false;
    if (filters.assigneeId && exc.assigneeId !== Number(filters.assigneeId)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredExceptions.length / pageSize);
  const paginatedExceptions = filteredExceptions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const canAssign = () => checkRole(['admin', 'customer_service']);
  const canHandle = (exc: Exception) => checkRole(['admin', 'customer_service']) || (user?.id === exc.assigneeId);
  const canResolve = (exc: Exception) => exc.status === 'investigating' && canHandle(exc);
  const canClose = (exc: Exception) => exc.status === 'resolved' && checkRole(['admin']);

  const handleAssign = async () => {
    if (!selectedException || !assignTo) return;
    try {
      await assignException(selectedException.id, Number(assignTo));
      loadExceptions();
      setShowAssignModal(false);
      setAssignTo('');
      setSelectedException(null);
    } catch (error) {
      console.error('分配处理人失败:', error);
      loadExceptions();
      setShowAssignModal(false);
      setAssignTo('');
      setSelectedException(null);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedException || !recordAction || !recordComment) return;
    try {
      await addHandlingRecord(selectedException.id, recordAction, recordComment);
      loadExceptions();
      setShowRecordModal(false);
      setRecordAction('');
      setRecordComment('');
      setSelectedException(null);
    } catch (error) {
      console.error('添加处理记录失败:', error);
      loadExceptions();
      setShowRecordModal(false);
      setRecordAction('');
      setRecordComment('');
      setSelectedException(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedException || !resolutionText) return;
    try {
      await resolveException(selectedException.id, resolutionText);
      loadExceptions();
      setShowResolveModal(false);
      setResolutionText('');
      setSelectedException(null);
    } catch (error) {
      console.error('标记解决失败:', error);
      loadExceptions();
      setShowResolveModal(false);
      setResolutionText('');
      setSelectedException(null);
    }
  };

  const handleClose = async (id: number) => {
    try {
      await closeException(id);
      loadExceptions();
      setConfirmModal({ open: false, type: null, exceptionId: null });
    } catch (error) {
      console.error('关闭工单失败:', error);
      loadExceptions();
      setConfirmModal({ open: false, type: null, exceptionId: null });
    }
  };

  const openDetailModal = (exc: Exception) => {
    setSelectedException(exc);
    setShowDetailModal(true);
  };

  const openAssignModal = (exc: Exception) => {
    setSelectedException(exc);
    setAssignTo(exc.assigneeId?.toString() || '');
    setShowAssignModal(true);
  };

  const openRecordModal = (exc: Exception) => {
    setSelectedException(exc);
    setShowRecordModal(true);
  };

  const openResolveModal = (exc: Exception) => {
    setSelectedException(exc);
    setResolutionText(exc.resolution || '');
    setShowResolveModal(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              异常工单
            </h1>
            <p className="text-sm text-neutral-500">管理和处理各类异常工单</p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">异常类型</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input-field"
              >
                {exceptionTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">全部状态</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS.exception[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">处理人</label>
              <select
                value={filters.assigneeId}
                onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
                className="input-field"
              >
                <option value="">全部处理人</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    关联对象
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    报告人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    处理人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedExceptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      <Empty message="暂无异常工单数据" icon={AlertTriangle} />
                    </td>
                  </tr>
                ) : (
                  paginatedExceptions.map((exc) => {
                    const RelatedIcon = relatedTypeIcons[exc.relatedType] || AlertTriangle;
                    return (
                      <tr key={exc.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${exceptionTypeColors[exc.type]}`}>
                            {exceptionTypeLabels[exc.type]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-neutral-800 max-w-xs truncate">{exc.title}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <RelatedIcon className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm text-neutral-700">
                              {relatedTypeLabels[exc.relatedType]} #{exc.relatedId}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {exc.reporter?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm text-neutral-800">{exc.reporter?.name || '-'}</p>
                              <p className="text-xs text-neutral-400">{getRoleLabel(exc.reporter?.role || 'buyer')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {exc.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {exc.assignee.name.charAt(0)}
                              </div>
                              <span className="text-sm text-neutral-700">{exc.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">未分配</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={exc.status} type="exception" />
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-500">
                          {formatDate(exc.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openDetailModal(exc)}
                              className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canAssign() && (
                              <button
                                onClick={() => openAssignModal(exc)}
                                className="p-2 text-neutral-500 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
                                title="分配处理人"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            {canHandle(exc) && exc.status !== 'closed' && (
                              <button
                                onClick={() => openRecordModal(exc)}
                                className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                title="添加处理记录"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}
                            {canResolve(exc) && (
                              <button
                                onClick={() => openResolveModal(exc)}
                                className="p-2 text-neutral-500 hover:text-success-700 hover:bg-success-50 rounded-lg transition-colors"
                                title="标记解决"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {canClose(exc) && (
                              <button
                                onClick={() => setConfirmModal({ open: true, type: 'close', exceptionId: exc.id })}
                                className="p-2 text-neutral-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                                title="关闭工单"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredExceptions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
              <div className="text-sm text-neutral-500">
                共 {filteredExceptions.length} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-700 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowDetailModal(false); setSelectedException(null); }} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">工单详情</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedException(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${exceptionTypeColors[selectedException.type]}`}>
                    {exceptionTypeLabels[selectedException.type]}
                  </span>
                  <StatusBadge status={selectedException.status} type="exception" />
                </div>
                <h4 className="text-lg font-semibold text-neutral-800">{selectedException.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">关联对象</p>
                    <p className="text-neutral-800 font-medium">{relatedTypeLabels[selectedException.relatedType]} #{selectedException.relatedId}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">创建时间</p>
                    <p className="text-neutral-800 font-medium">{formatDate(selectedException.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">报告人</p>
                    <p className="text-neutral-800 font-medium">{selectedException.reporter?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">处理人</p>
                    <p className="text-neutral-800 font-medium">{selectedException.assignee?.name || '未分配'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">问题描述</p>
                  <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg">{selectedException.description}</p>
                </div>
                {selectedException.resolution && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">解决方案</p>
                    <p className="text-sm text-neutral-700 bg-success-50 p-3 rounded-lg">{selectedException.resolution}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-500 mb-2">处理记录</p>
                  <div className="space-y-2">
                    {selectedException.handlingRecords.map((record) => (
                      <div key={record.id} className="bg-neutral-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-800">{record.operator?.name}</span>
                          <span className="text-xs text-neutral-500">{formatDate(record.createdAt)}</span>
                        </div>
                        <p className="text-xs text-primary-600 mb-1">{record.action}</p>
                        <p className="text-sm text-neutral-600">{record.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => { setShowDetailModal(false); setSelectedException(null); }} className="btn-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowAssignModal(false); setAssignTo(''); setSelectedException(null); }} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">分配处理人</h3>
              <button onClick={() => { setShowAssignModal(false); setAssignTo(''); setSelectedException(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-600 mb-2">选择处理人</label>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="input-field w-full">
                <option value="">请选择</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({getRoleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => { setShowAssignModal(false); setAssignTo(''); setSelectedException(null); }} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAssign} disabled={!assignTo} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecordModal && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowRecordModal(false); setRecordAction(''); setRecordComment(''); setSelectedException(null); }} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">添加处理记录</h3>
              <button onClick={() => { setShowRecordModal(false); setRecordAction(''); setRecordComment(''); setSelectedException(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">处理动作</label>
                <input
                  type="text"
                  value={recordAction}
                  onChange={(e) => setRecordAction(e.target.value)}
                  placeholder="如：联系客户、核实情况、协商方案等"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-2">处理内容</label>
                <textarea
                  value={recordComment}
                  onChange={(e) => setRecordComment(e.target.value)}
                  placeholder="请详细描述处理过程和结果"
                  rows={4}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => { setShowRecordModal(false); setRecordAction(''); setRecordComment(''); setSelectedException(null); }} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAddRecord} disabled={!recordAction || !recordComment} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                提交记录
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowResolveModal(false); setResolutionText(''); setSelectedException(null); }} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">标记解决</h3>
              <button onClick={() => { setShowResolveModal(false); setResolutionText(''); setSelectedException(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-neutral-600 mb-2">解决方案</label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="请详细描述问题的解决方案和处理结果"
                rows={4}
                className="input-field w-full resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button onClick={() => { setShowResolveModal(false); setResolutionText(''); setSelectedException(null); }} className="btn-secondary">
                取消
              </button>
              <button onClick={handleResolve} disabled={!resolutionText} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title="关闭工单"
        message="确定要关闭该工单吗？关闭后将无法继续处理。"
        confirmText="确认关闭"
        confirmButtonClass="bg-danger-600 hover:bg-danger-700"
        onConfirm={() => {
          if (confirmModal.exceptionId) {
            handleClose(confirmModal.exceptionId);
          }
        }}
        onCancel={() => setConfirmModal({ open: false, type: null, exceptionId: null })}
      />
    </div>
  );
}
