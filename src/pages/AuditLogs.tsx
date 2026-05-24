import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  User as UserIcon,
  Clock,
  FileText,
  Globe,
  Hash,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getAuditLogs } from '@/api/modules/audit';
import type { AuditLog, User, UserRole } from '@/types';
import { formatDate, getRoleLabel } from '@/utils';
import Empty from '@/components/Empty';

const actionTypes = [
  { value: '', label: '全部操作' },
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'status', label: '状态变更' },
  { value: 'login', label: '登录' },
  { value: 'logout', label: '登出' },
];

const resourceTypes = [
  { value: '', label: '全部资源' },
  { value: 'car', label: '车辆' },
  { value: 'inspection', label: '检测报告' },
  { value: 'appointment', label: '预约' },
  { value: 'deposit', label: '订金' },
  { value: 'contract', label: '合同' },
  { value: 'transfer', label: '过户' },
  { value: 'settlement', label: '结算' },
  { value: 'user', label: '用户' },
  { value: 'exception', label: '异常工单' },
];

const mockUserList: User[] = [
  { id: 1, username: 'admin', name: '系统管理员', role: 'admin' as UserRole, phone: '13800138000', email: 'admin@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
  { id: 2, username: 'dealer1', name: '诚信二手车行', role: 'dealer' as UserRole, phone: '13800138001', email: 'dealer1@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
  { id: 3, username: 'buyer1', name: '张先生', role: 'buyer' as UserRole, phone: '13800138002', email: 'buyer1@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
  { id: 4, username: 'inspector1', name: '李检测师', role: 'inspector' as UserRole, phone: '13800138003', email: 'inspector1@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
  { id: 5, username: 'sales1', name: '王销售', role: 'sales' as UserRole, phone: '13800138004', email: 'sales1@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
  { id: 6, username: 'cs1', name: '赵客服', role: 'customer_service' as UserRole, phone: '13800138005', email: 'cs1@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
  { id: 7, username: 'finance1', name: '孙财务', role: 'finance' as UserRole, phone: '13800138006', email: 'finance1@example.com', status: 'active' as const, createdAt: '2024-01-01T00:00:00Z' },
];

const generateMockAuditLogs = (): AuditLog[] => {
  const logs: AuditLog[] = [];
  const actions = ['create', 'update', 'delete', 'status', 'login', 'logout'];
  const resources = ['car', 'inspection', 'appointment', 'deposit', 'contract', 'transfer', 'settlement', 'user', 'exception'];
  const actionsInChinese: Record<string, string> = {
    create: '创建了',
    update: '更新了',
    delete: '删除了',
    status: '变更了',
    login: '登录系统',
    logout: '退出系统',
  };
  const resourcesInChinese: Record<string, string> = {
    car: '车辆信息',
    inspection: '检测报告',
    appointment: '预约记录',
    deposit: '订金记录',
    contract: '合同',
    transfer: '过户记录',
    settlement: '结算记录',
    user: '用户信息',
    exception: '异常工单',
  };

  for (let i = 1; i <= 50; i++) {
    const userIndex = Math.floor(Math.random() * mockUserList.length);
    const action = actions[Math.floor(Math.random() * actions.length)];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    const user = mockUserList[userIndex];
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72));

    const hasChanges = action === 'update' || action === 'status';

    logs.push({
      id: i,
      userId: user.id,
      user: user,
      role: user.role,
      action: actionsInChinese[action] + resourcesInChinese[resource],
      resourceType: resource,
      resourceId: Math.floor(Math.random() * 1000),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      changeSummary: hasChanges ? `变更了${resourcesInChinese[resource]}的关键字段` : undefined,
      oldValue: hasChanges ? {
        status: 'draft',
        price: 250000,
        title: '待售'
      } : undefined,
      newValue: hasChanges ? {
        status: 'pending_inspection',
        price: 248000,
        title: '已售出'
      } : undefined,
      createdAt: date.toISOString(),
    });
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const mockAuditLogs = generateMockAuditLogs();

export default function AuditLogs() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.userId) params.userId = Number(filters.userId);
      if (filters.action) params.action = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      try {
        const data = await getAuditLogs(params);
        setLogs(data);
      } catch {
        setLogs(mockAuditLogs);
      }
    } catch (error) {
      console.error('加载审计日志失败:', error);
      setLogs(mockAuditLogs);
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
      userId: '',
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
  };

  const toggleRowExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredLogs = logs.filter(log => {
    if (filters.userId && log.userId !== Number(filters.userId)) return false;
    if (filters.action && !log.action.includes(filters.action)) return false;
    if (filters.resourceType && log.resourceType !== filters.resourceType) return false;
    if (filters.startDate && new Date(log.createdAt) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(log.createdAt) > new Date(filters.endDate + 'T23:59:59')) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionIcon = (action: string) => {
    if (action.includes('创建')) return <PlusCircle className="w-4 h-4 text-success-600" />;
    if (action.includes('更新')) return <Edit className="w-4 h-4 text-primary-600" />;
    if (action.includes('删除')) return <Trash2 className="w-4 h-4 text-danger-600" />;
    if (action.includes('变更')) return <RefreshCw className="w-4 h-4 text-warning-600" />;
    if (action.includes('登录')) return <CheckCircle className="w-4 h-4 text-success-600" />;
    if (action.includes('登出')) return <XCircle className="w-4 h-4 text-neutral-600" />;
    return <FileText className="w-4 h-4 text-neutral-600" />;
  };

  const getResourceLabel = (type: string) => {
    const map: Record<string, string> = {
      car: '车辆',
      inspection: '检测报告',
      appointment: '预约',
      deposit: '订金',
      contract: '合同',
      transfer: '过户',
      settlement: '结算',
      user: '用户',
      exception: '异常工单',
    };
    return map[type] || type;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              审计日志
            </h1>
            <p className="text-sm text-neutral-500">查看系统操作记录和变更历史</p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-neutral-500" />
            <span className="font-medium text-neutral-700">筛选条件</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">操作用户</label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="input-field"
              >
                <option value="">全部用户</option>
                {mockUserList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({getRoleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">操作类型</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="input-field"
              >
                {actionTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">资源类型</label>
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="input-field"
              >
                {resourceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input-field"
              />
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider w-10">
                    <span className="sr-only">展开</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作人
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    操作
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    资源类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    资源ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    IP地址
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    变更摘要
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-700 rounded-full mx-auto" />
                    </td>
                  </tr>
                ) : paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12">
                      <Empty message="暂无审计日志数据" icon={FileText} />
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <>
                      <tr
                      key={log.id}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => toggleRowExpand(log.id)}
                    >
                      <td className="px-4 py-4">
                        {log.oldValue || log.newValue ? (
                          expandedRow === log.id ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-700">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {log.user?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm font-medium text-neutral-800">{log.user?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          {getRoleLabel(log.role)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-sm text-neutral-700">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-700">{getResourceLabel(log.resourceType)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-neutral-400" />
                          <span className="font-mono text-sm text-neutral-700">{log.resourceId || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-neutral-400" />
                          <span className="font-mono text-sm text-neutral-700">{log.ipAddress}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-600">{log.changeSummary || '-'}</span>
                      </td>
                    </tr>
                    {expandedRow === log.id && (log.oldValue || log.newValue) && (
                      <tr className="bg-neutral-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {log.oldValue && (
                              <div className="p-4 bg-danger-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-danger-700 mb-2 flex items-center gap-2">
                                  <XCircle className="w-4 h-4" />
                                  变更前 (old_value)
                                </h4>
                                <pre className="text-xs text-neutral-700 bg-white p-3 rounded border border-danger-200 overflow-x-auto">
                                  {JSON.stringify(log.oldValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="p-4 bg-success-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-success-700 mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  变更后 (new_value)
                                </h4>
                                <pre className="text-xs text-neutral-700 bg-white p-3 rounded border border-success-200 overflow-x-auto">
                                  {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredLogs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
              <div className="text-sm text-neutral-500">
                共 {filteredLogs.length} 条记录，第 {currentPage} / {totalPages} 页
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
    </div>
  );
}
