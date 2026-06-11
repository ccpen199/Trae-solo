import { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import type { AuditLog } from '../../../shared/types';
import { cn } from '../../lib/utils';

const AdminAudit = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const query: any = { page, pageSize };
        if (actionFilter) query.action = actionFilter;
        if (resourceTypeFilter) query.resourceType = resourceTypeFilter;
        if (startDate) query.startDate = startDate;
        if (endDate) query.endDate = endDate;
        const data = await adminApi.getAuditLogs(query);
        setLogs(data.data);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, actionFilter, resourceTypeFilter, startDate, endDate]);

  const filteredLogs = logs.filter(log =>
    !searchKeyword ||
    log.action.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    log.resourceType.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    log.ipAddress.includes(searchKeyword) ||
    JSON.stringify(log.details).toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const actions = [
    { value: '', label: '全部操作' },
    { value: 'login', label: '登录' },
    { value: 'logout', label: '登出' },
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'publish', label: '发布' },
    { value: 'submit', label: '提交' },
    { value: 'review', label: '评审' },
    { value: 'payment', label: '支付' },
    { value: 'withdraw', label: '提现' },
    { value: 'verify', label: '认证' },
    { value: 'resolve', label: '仲裁' },
  ];

  const resourceTypes = [
    { value: '', label: '全部资源' },
    { value: 'task', label: '任务' },
    { value: 'user', label: '用户' },
    { value: 'talent', label: '人才' },
    { value: 'submission', label: '稿件' },
    { value: 'bid', label: '投标' },
    { value: 'message', label: '消息' },
    { value: 'transaction', label: '交易' },
    { value: 'dispute', label: '争议' },
    { value: 'ip_record', label: 'IP存证' },
  ];

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      login: 'bg-green-100 text-green-700',
      logout: 'bg-slate-100 text-slate-700',
      create: 'bg-blue-100 text-blue-700',
      update: 'bg-amber-100 text-amber-700',
      delete: 'bg-red-100 text-red-700',
      publish: 'bg-indigo-100 text-indigo-700',
      submit: 'bg-purple-100 text-purple-700',
      review: 'bg-pink-100 text-pink-700',
      payment: 'bg-emerald-100 text-emerald-700',
      withdraw: 'bg-orange-100 text-orange-700',
      verify: 'bg-cyan-100 text-cyan-700',
      resolve: 'bg-teal-100 text-teal-700',
    };
    return colors[action] || 'bg-slate-100 text-slate-700';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: '登录',
      logout: '登出',
      create: '创建',
      update: '更新',
      delete: '删除',
      publish: '发布',
      submit: '提交',
      review: '评审',
      payment: '支付',
      withdraw: '提现',
      verify: '认证',
      resolve: '仲裁',
    };
    return labels[action] || action;
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: '任务',
      user: '用户',
      talent: '人才',
      submission: '稿件',
      bid: '投标',
      message: '消息',
      transaction: '交易',
      dispute: '争议',
      ip_record: 'IP存证',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">合规审计日志</h2>
          <p className="text-slate-500 mt-1">记录平台所有关键操作，用于审计追踪</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" />
          导出日志
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索操作内容、用户、IP..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {actions.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {resourceTypes.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <span className="text-slate-500">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => (
              <div key={log.id} className="hover:bg-slate-50 transition-colors">
                <div
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', getActionColor(log.action))}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getActionColor(log.action))}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          {getResourceTypeLabel(log.resourceType)}
                        </span>
                        {log.resourceId && (
                          <span className="text-xs text-slate-500">ID: {log.resourceId}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <User className="w-3.5 h-3.5" />
                          {log.user?.name || '系统'}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        <span className="text-slate-500 font-mono text-xs">
                          {log.ipAddress}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLog(expandedLog === log.id ? null : log.id);
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                {expandedLog === log.id && (
                  <div className="px-6 pb-4">
                    <div className="ml-14 p-4 bg-slate-50 rounded-xl space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">操作详情</p>
                        <pre className="text-sm text-slate-700 bg-slate-100 p-3 rounded-lg overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">用户代理</p>
                          <p className="text-sm text-slate-600 break-all">{log.userAgent}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">IP地址</p>
                          <p className="text-sm text-slate-600 font-mono">{log.ipAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无审计日志</h3>
            <p className="text-slate-500">尝试调整筛选条件</p>
          </div>
        )}

        {total > pageSize && (
          <div className="flex items-center justify-center gap-2 p-6 border-t border-slate-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-slate-600">
              {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAudit;
