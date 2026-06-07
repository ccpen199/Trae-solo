import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, Filter } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  user_name: string;
  action: string;
  resource: string;
  details: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const data = await api<AuditLog[]>(`/admin/audit?${params.toString()}`);
      setLogs(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1E293B]">审计日志</h1>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">操作类型</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
              >
                <option value="">全部</option>
                <option value="login">登录</option>
                <option value="create">创建</option>
                <option value="update">更新</option>
                <option value="delete">删除</option>
                <option value="dispatch">派单</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
            />
          </div>
          <button onClick={fetchLogs} className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]">
            <Search className="w-4 h-4" /> 查询
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-gray-200 rounded" />))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">用户</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">资源</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">详情</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">暂无日志</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4">{log.user_name}</td>
                    <td className="py-3 px-4"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{log.action}</span></td>
                    <td className="py-3 px-4">{log.resource}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
