import { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  FileText,
  LogIn,
  X,
  ChevronDown,
  ChevronRight,
  Monitor,
  MapPin,
  AlertCircle,
  CheckCircle2,
  User,
  Clock,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Table, type Column } from '@/components/common/Table';
import { cn } from '@/lib/utils';
import { get } from '@/utils/request';
import type { LoginStatus } from '../../../shared/types';

interface OperationLog {
  id: string;
  userId?: string;
  username?: string;
  realName?: string;
  operationType: string;
  operationDesc: string;
  detail?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface LoginLogItem {
  id: string;
  userId?: string;
  username: string;
  realName?: string;
  status: LoginStatus;
  ip?: string;
  location?: string;
  device?: string;
  failReason?: string;
  createdAt: string;
}

type TabType = 'operation' | 'login';

const operationTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'login', label: '登录' },
  { value: 'exception_review', label: '异常复核' },
  { value: 'user_create', label: '创建用户' },
  { value: 'user_permissions_update', label: '权限变更' },
  { value: 'order_feedback', label: '指令反馈' },
];

const loginStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
];

const operationTypeLabelMap: Record<string, { label: string; color: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default' }> = {
  login: { label: '登录', color: 'info' },
  exception_review: { label: '异常复核', color: 'warning' },
  user_create: { label: '创建用户', color: 'success' },
  user_permissions_update: { label: '权限变更', color: 'primary' },
  order_feedback: { label: '指令反馈', color: 'default' },
};

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState<TabType>('operation');
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperationLog | LoginLogItem | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    operationType: '',
    loginStatus: '' as LoginStatus | '',
    keyword: '',
  });

  const fetchOperationLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.operationType) params.append('operationType', filters.operationType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const res = await get<{ list: OperationLog[]; total: number }>(
        `/audit/logs?${params.toString()}`
      );
      setOperationLogs(res.list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.loginStatus) params.append('status', filters.loginStatus);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      const res = await get<{ list: LoginLogItem[]; total: number }>(
        `/audit/login-logs?${params.toString()}`
      );
      setLoginLogs(res.list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'operation') {
      fetchOperationLogs();
    } else {
      fetchLoginLogs();
    }
  }, [activeTab, filters]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openDetailDrawer = (log: OperationLog | LoginLogItem) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  const operationColumns: Column<OperationLog>[] = [
    {
      key: 'expand',
      title: '',
      width: 40,
      render: (record) => (
        <button
          onClick={() => toggleExpand(record.id)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {expandedId === record.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: 'operationType',
      title: '操作类型',
      render: (record) => {
        const t = operationTypeLabelMap[record.operationType] || {
          label: record.operationType,
          color: 'default' as const,
        };
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    {
      key: 'operator',
      title: '操作人',
      render: (record) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700">{record.realName || record.username || '-'}</span>
        </div>
      ),
    },
    {
      key: 'operationDesc',
      title: '操作描述',
      render: (record) => (
        <span
          className="cursor-pointer text-gray-700 hover:text-primary"
          onClick={() => openDetailDrawer(record)}
        >
          {record.operationDesc}
        </span>
      ),
    },
    {
      key: 'ip',
      title: 'IP地址',
      render: (record) => <span className="font-mono text-sm text-gray-600">{record.ip || '-'}</span>,
    },
    {
      key: 'createdAt',
      title: '操作时间',
      dataIndex: 'createdAt' as never,
      sortable: true,
      render: (record) => (
        <span className="text-gray-500">
          {new Date(record.createdAt).toLocaleString('zh-CN')}
        </span>
      ),
    },
  ];

  const loginColumns: Column<LoginLogItem>[] = [
    {
      key: 'expand',
      title: '',
      width: 40,
      render: (record) => (
        <button
          onClick={() => toggleExpand(record.id)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {expandedId === record.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: 'username',
      title: '用户名',
      dataIndex: 'username' as never,
      sortable: true,
      render: (record) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{record.username}</span>
          {record.realName && <span className="text-sm text-gray-500">({record.realName})</span>}
        </div>
      ),
    },
    {
      key: 'status',
      title: '登录状态',
      render: (record) =>
        record.status === 'success' ? (
          <Tag color="success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            成功
          </Tag>
        ) : (
          <Tag color="danger">
            <AlertCircle className="mr-1 h-3 w-3" />
            失败
          </Tag>
        ),
    },
    {
      key: 'ip',
      title: '登录IP',
      render: (record) => <span className="font-mono text-sm text-gray-600">{record.ip || '-'}</span>,
    },
    {
      key: 'location',
      title: '登录地点',
      render: (record) => (
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {record.location || '-'}
        </div>
      ),
    },
    {
      key: 'device',
      title: '设备信息',
      render: (record) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Monitor className="h-3.5 w-3.5 text-gray-400" />
          {record.device || '-'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: '登录时间',
      dataIndex: 'createdAt' as never,
      sortable: true,
      render: (record) => (
        <span className="text-gray-500">
          {new Date(record.createdAt).toLocaleString('zh-CN')}
        </span>
      ),
    },
  ];

  const renderExpandedRow = (record: OperationLog | LoginLogItem) => {
    if (expandedId !== record.id) return null;
    const isLogin = 'status' in record;

    return (
      <tr>
        <td colSpan={isLogin ? 7 : 6} className="bg-gray-50 px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            {!isLogin && 'detail' in record && record.detail && (
              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-medium text-gray-600">详细数据</p>
                <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">
                  {JSON.stringify(record.detail, null, 2)}
                </pre>
              </div>
            )}
            {isLogin && 'failReason' in record && record.failReason && (
              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-gray-600">失败原因</p>
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {record.failReason}
                </div>
              </div>
            )}
            {'userAgent' in record && record.userAgent && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">浏览器/UserAgent</p>
                <p className="text-sm text-gray-700">{record.userAgent}</p>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">日志审计</h1>
        <p className="mt-1 text-sm text-gray-500">查看系统操作日志和用户登录日志</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('operation')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors',
              activeTab === 'operation'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <FileText className="h-4 w-4" />
            操作日志
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={cn(
              'flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors',
              activeTab === 'login'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <LogIn className="h-4 w-4" />
            登录日志
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                <Calendar className="h-3 w-3" />
                开始日期
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-600">
                <Calendar className="h-3 w-3" />
                结束日期
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {activeTab === 'operation' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">操作类型</label>
                <select
                  value={filters.operationType}
                  onChange={(e) => setFilters({ ...filters, operationType: e.target.value })}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {operationTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">状态</label>
                <select
                  value={filters.loginStatus}
                  onChange={(e) =>
                    setFilters({ ...filters, loginStatus: e.target.value as LoginStatus | '' })
                  }
                  className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {loginStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative flex-1 max-w-sm space-y-1.5">
              <label className="text-xs font-medium text-gray-600">关键词搜索</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({
                  startDate: '',
                  endDate: '',
                  operationType: '',
                  loginStatus: '',
                  keyword: '',
                });
              }}
            >
              重置
            </Button>
          </div>
        </div>

        <div className="px-5 pb-5">
          {activeTab === 'operation' ? (
            <Table
              columns={operationColumns}
              data={operationLogs}
              rowKey="id"
              loading={loading}
              pageSize={20}
              onRowClick={(record) => toggleExpand(record.id)}
            />
          ) : (
            <Table
              columns={loginColumns}
              data={loginLogs}
              rowKey="id"
              loading={loading}
              pageSize={20}
              onRowClick={(record) => toggleExpand(record.id)}
            />
          )}
        </div>
      </div>

      {drawerOpen && selectedLog && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">日志详情</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto p-6">
              <div className="space-y-5">
                {'operationType' in selectedLog && (
                  <div>
                    <p className="text-xs text-gray-500">操作类型</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {operationTypeLabelMap[selectedLog.operationType]?.label ||
                        selectedLog.operationType}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">用户</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <User className="h-4 w-4 text-gray-400" />
                    {selectedLog.realName ||
                      ('username' in selectedLog ? selectedLog.username : '-')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">时间</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                {'ip' in selectedLog && selectedLog.ip && (
                  <div>
                    <p className="text-xs text-gray-500">IP地址</p>
                    <p className="mt-1 font-mono text-sm text-gray-900">{selectedLog.ip}</p>
                  </div>
                )}
                {'location' in selectedLog && selectedLog.location && (
                  <div>
                    <p className="text-xs text-gray-500">地点</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {selectedLog.location}
                    </p>
                  </div>
                )}
                {'device' in selectedLog && selectedLog.device && (
                  <div>
                    <p className="text-xs text-gray-500">设备</p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      {selectedLog.device}
                    </p>
                  </div>
                )}
                {'operationDesc' in selectedLog && (
                  <div>
                    <p className="text-xs text-gray-500">操作描述</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.operationDesc}</p>
                  </div>
                )}
                {'status' in selectedLog && (
                  <div>
                    <p className="text-xs text-gray-500">登录状态</p>
                    <p className="mt-1">
                      {selectedLog.status === 'success' ? (
                        <Tag color="success">成功</Tag>
                      ) : (
                        <Tag color="danger">失败</Tag>
                      )}
                    </p>
                  </div>
                )}
                {'failReason' in selectedLog && selectedLog.failReason && (
                  <div>
                    <p className="text-xs text-gray-500">失败原因</p>
                    <div className="mt-1 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      {selectedLog.failReason}
                    </div>
                  </div>
                )}
                {'detail' in selectedLog && selectedLog.detail && (
                  <div>
                    <p className="text-xs text-gray-500">详细数据</p>
                    <pre className="mt-1 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">
                      {JSON.stringify(selectedLog.detail, null, 2)}
                    </pre>
                  </div>
                )}
                {'userAgent' in selectedLog && selectedLog.userAgent && (
                  <div>
                    <p className="text-xs text-gray-500">浏览器信息</p>
                    <p className="mt-1 flex items-start gap-2 text-sm text-gray-900">
                      <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
