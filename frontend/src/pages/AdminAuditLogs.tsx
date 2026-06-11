import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import api from '../services/api';
import { AuditLog, PaginatedResult, ROLE_MAP } from '../types';

const ROLE_OPTIONS = [
  { value: '', label: '全部角色' },
  ...Object.entries(ROLE_MAP).map(([k, v]) => ({ value: k, label: v })),
];

const PAGE_SIZE = 15;

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchLogs = useCallback((p: number) => {
    setLoading(true);
    const params: Record<string, string | number> = { page: p, pageSize: PAGE_SIZE };
    if (roleFilter) params.user_role = roleFilter;
    api.get<any, { data: PaginatedResult<AuditLog> }>('/audit-logs', { params })
      .then((res) => {
        setLogs(res.data.list);
        setTotal(res.data.total);
        setPage(res.data.page);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'platform': return 'bg-accent/10 text-accent';
      case 'ops': return 'bg-success/10 text-success';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field text-sm w-32"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">目标类型</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">目标ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">详情</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">IP地址</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{log.user_name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(log.user_role)}`}>
                    {ROLE_MAP[log.user_role] || log.user_role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{log.target_type || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{log.target_id ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate" title={log.details || ''}>
                  {log.details || '-'}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ip_address || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">暂无日志记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600 px-2">{page}</span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages}
              className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
