import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/api/admin';
import type { AuditLog } from '@/types';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs({
      action: actionFilter || undefined,
      user_id: userIdFilter ? Number(userIdFilter) : undefined,
      page,
      pageSize,
    })
      .then((res) => {
        setLogs(res.list);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const handleFilter = () => { setPage(1); fetchLogs(); };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">审计日志</h1>

      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field flex-1"
            placeholder="操作类型筛选..."
          />
          <input
            type="number"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            className="input-field w-36"
            placeholder="用户ID"
          />
          <button onClick={handleFilter} className="btn-primary text-sm">筛选</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">用户</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">操作</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">目标类型</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">目标ID</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">IP</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-400">#{log.id}</td>
                      <td className="py-3 px-4 text-slate-700">{log.user_nickname || `#${log.user_id}`}</td>
                      <td className="py-3 px-4">
                        <span className="badge-blue">{log.action}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{log.target_type || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">{log.target_id || '-'}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{log.ip_address || '-'}</td>
                      <td className="py-3 px-4 text-slate-400">{log.created_at?.slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-30">上一页</button>
              <span className="text-sm text-slate-500">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-30">下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
