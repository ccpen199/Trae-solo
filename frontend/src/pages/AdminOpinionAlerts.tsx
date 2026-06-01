import { useEffect, useState } from 'react';
import { getOpinionAlerts, updateOpinionAlert } from '@/api/admin';
import type { OpinionAlert } from '@/types';

const statusLabel: Record<string, string> = { pending: '待处理', reviewed: '已审阅', dismissed: '已忽略' };
const statusColor: Record<string, string> = { pending: 'badge-yellow', reviewed: 'badge-green', dismissed: 'badge-gray' };

export default function AdminOpinionAlerts() {
  const [alerts, setAlerts] = useState<OpinionAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<OpinionAlert | null>(null);

  const pageSize = 10;

  const fetchAlerts = () => {
    setLoading(true);
    getOpinionAlerts({ status: statusFilter || undefined, page, pageSize })
      .then((res) => {
        setAlerts(res.list);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, [page, statusFilter]);

  const handleUpdate = async (id: number, status: 'reviewed' | 'dismissed') => {
    try {
      await updateOpinionAlert(id, { status });
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (selectedAlert?.id === id) setSelectedAlert((a) => a ? { ...a, status } : null);
    } catch {
      alert('操作失败');
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-yellow-500';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-slate-800 mb-6">舆情监测</h1>

      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select-field w-40">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="reviewed">已审阅</option>
            <option value="dismissed">已忽略</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-slate-400">暂无预警信息</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-red">{alert.alert_type}</span>
                      <span className={statusColor[alert.status]}>{statusLabel[alert.status]}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{alert.content_snippet || '无内容摘要'}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      {alert.job_title && <span>岗位: {alert.job_title}</span>}
                      <span>{alert.created_at?.slice(0, 16)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-2xl font-bold ${getRiskColor(alert.risk_score)}`}>
                      {alert.risk_score}
                    </p>
                    <p className="text-xs text-slate-400">风险分</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <button onClick={() => setSelectedAlert(alert)} className="text-sm text-brand-500 hover:text-brand-600 font-medium">查看详情</button>
                  {alert.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(alert.id, 'reviewed')} className="btn-accent text-xs px-3 py-1.5">审阅</button>
                      <button onClick={() => handleUpdate(alert.id, 'dismissed')} className="btn-secondary text-xs px-3 py-1.5">忽略</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
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

      {selectedAlert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">预警详情 #{selectedAlert.id}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">预警类型</span><span className="text-slate-800 font-medium">{selectedAlert.alert_type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">风险评分</span><span className={`font-bold ${getRiskColor(selectedAlert.risk_score)}`}>{selectedAlert.risk_score}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">状态</span><span className={statusColor[selectedAlert.status]}>{statusLabel[selectedAlert.status]}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">关联岗位</span><span className="text-slate-700">{selectedAlert.job_title || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">时间</span><span className="text-slate-700">{selectedAlert.created_at}</span></div>
              {selectedAlert.content_snippet && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-slate-500 mb-1">内容摘要</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedAlert.content_snippet}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              {selectedAlert.status === 'pending' && (
                <>
                  <button onClick={() => { handleUpdate(selectedAlert.id, 'reviewed'); setSelectedAlert((a) => a ? { ...a, status: 'reviewed' } : null); }} className="btn-accent text-sm">审阅</button>
                  <button onClick={() => { handleUpdate(selectedAlert.id, 'dismissed'); setSelectedAlert((a) => a ? { ...a, status: 'dismissed' } : null); }} className="btn-secondary text-sm">忽略</button>
                </>
              )}
              <button onClick={() => setSelectedAlert(null)} className="btn-secondary text-sm">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
