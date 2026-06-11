import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle, Filter } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Alert, ALERT_LEVEL_MAP, ALERT_TYPE_MAP } from '../types';

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'active', label: '活跃' },
  { value: 'resolved', label: '已处理' },
];

const LEVEL_OPTIONS = [
  { value: '', label: '全部等级' },
  { value: 'warning', label: '预警' },
  { value: 'critical', label: '严重' },
];

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [resolving, setResolving] = useState<number | null>(null);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (levelFilter) params.level = levelFilter;
    api.get<any, { data: Alert[] }>('/alerts', { params })
      .then((res) => setAlerts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, levelFilter]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      await api.post(`/alerts/${id}/resolve`);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'resolved' } : a))
      );
    } catch {} finally {
      setResolving(null);
    }
  };

  const activeWarnings = alerts.filter((a) => a.status === 'active' && a.level === 'warning').length;
  const activeCriticals = alerts.filter((a) => a.status === 'active' && a.level === 'critical').length;

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">异常预警 - 全网点</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-sm text-gray-500">活跃预警</div>
            <div className="text-lg font-bold text-amber-600">{activeWarnings}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
            <AlertOctagon size={20} />
          </div>
          <div>
            <div className="text-sm text-gray-500">活跃严重</div>
            <div className="text-lg font-bold text-red-600">{activeCriticals}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-sm w-28"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="input-field text-sm w-28"
        >
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={alert.level} type="alert" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                  {ALERT_TYPE_MAP[alert.type] || alert.type}
                </span>
              </div>
              <StatusBadge status={alert.status} />
            </div>

            <h4 className="font-semibold text-gray-800 mb-1">{alert.title}</h4>
            {alert.description && (
              <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>网点 #{alert.branch_id}</span>
                {alert.package_id && <span>包裹 #{alert.package_id}</span>}
                <span>{new Date(alert.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {alert.status === 'active' && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolving === alert.id}
                  className="btn-success px-3 py-1 text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  {resolving === alert.id ? '处理中...' : '标记已处理'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无预警记录</div>
      )}
    </div>
  );
}
