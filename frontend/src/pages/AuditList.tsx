import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Shield, User } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { auditApi } from '../api/client';
import type { AuditLog, ListResponse } from '../types';

const actionTypeColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  login: 'bg-purple-100 text-purple-700 border-purple-200',
  logout: 'bg-gray-100 text-gray-700 border-gray-200',
  execute: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function AuditList() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { error } = useToast();

  useEffect(() => {
    loadLogs();
  }, [page, search, actionFilter, resourceFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resourceType = resourceFilter;

      const response = await auditApi.list(params) as ListResponse<AuditLog>;
      setLogs(response.items);
      setTotal(response.total);
    } catch {
      error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const tryParseJson = (str: string) => {
    if (!str) return '-';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const getActionColor = (action: string) => {
    for (const key of Object.keys(actionTypeColors)) {
      if (action.includes(key)) return actionTypeColors[key];
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const columns = [
    {
      key: 'action',
      header: '操作',
      width: '150px',
      render: (item: AuditLog) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${getActionColor(
            item.action
          )}`}
        >
          {item.action}
        </span>
      ),
    },
    {
      key: 'resourceType',
      header: '资源类型',
      width: '120px',
      render: (item: AuditLog) => (
        <code className="font-mono text-sm">{item.resourceType}</code>
      ),
    },
    {
      key: 'resourceId',
      header: '资源ID',
      width: '100px',
      render: (item: AuditLog) => (
        <code className="font-mono text-sm">#{item.resourceId}</code>
      ),
    },
    {
      key: 'user',
      header: '操作人',
      width: '120px',
      render: (item: AuditLog) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs">
            {item.user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <span>{item.user?.username || '-'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '操作时间',
      render: (item: AuditLog) =>
        new Date(item.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'actions',
      header: '操作',
      width: '80px',
      render: (item: AuditLog) => (
        <button
          onClick={() => handleViewDetail(item)}
          className="p-1 hover:bg-gray-100 text-blue-600"
          title="查看详情"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">权限审计</h1>
          <p className="text-gray-500 mt-1">查看所有操作审计记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">今日操作</p>
              <p className="text-xl font-bold">128</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">安全操作</p>
              <p className="text-xl font-bold">45</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">敏感操作</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">风险操作</p>
              <p className="text-xl font-bold">3</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索操作或资源..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部操作</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="login">登录</option>
              <option value="execute">执行</option>
            </select>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">全部资源</option>
              <option value="application">应用</option>
              <option value="user">用户</option>
              <option value="task">扫描任务</option>
              <option value="alert">告警</option>
              <option value="change">变更单</option>
              <option value="secret">密钥</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="审计详情"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-500">操作类型</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${getActionColor(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">资源类型</label>
                <p className="mt-1 font-mono">{selectedLog.resourceType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">资源ID</label>
                <p className="mt-1 font-mono">#{selectedLog.resourceId}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">操作人</label>
                <p className="mt-1">{selectedLog.user?.username || '-'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">操作时间</label>
              <p className="mt-1">
                {new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            {selectedLog.oldValue && (
              <div>
                <label className="text-sm text-gray-500">变更前</label>
                <pre className="mt-1 bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {tryParseJson(selectedLog.oldValue)}
                </pre>
              </div>
            )}
            {selectedLog.newValue && (
              <div>
                <label className="text-sm text-gray-500">变更后</label>
                <pre className="mt-1 bg-green-50 p-4 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {tryParseJson(selectedLog.newValue)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
