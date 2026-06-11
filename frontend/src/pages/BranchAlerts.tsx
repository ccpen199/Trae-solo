import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Alert, ALERT_TYPE_MAP, PaginatedResult } from '../types';

type StatusFilter = '' | 'active' | 'resolved';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'active', label: '活跃' },
  { key: 'resolved', label: '已处理' },
];

export default function BranchAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ warningCount: 0, criticalCount: 0 });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, pageSize: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<any, { data: PaginatedResult<Alert> }>('/alerts', { params });
      const list = res.data.list || [];
      setAlerts(list);
      setTotal(res.data.total || 0);
      setStats({
        warningCount: list.filter(a => a.level === 'warning' && a.status === 'active').length,
        criticalCount: list.filter(a => a.level === 'critical' && a.status === 'active').length,
      });
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = () => {
    setStats({
      warningCount: alerts.filter(a => a.level === 'warning' && a.status === 'active').length,
      criticalCount: alerts.filter(a => a.level === 'critical' && a.status === 'active').length,
    });
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleResolve = async (id: number) => {
    setSubmitting(true);
    try {
      await api.post(`/alerts/${id}/resolve`);
      fetchAlerts();
      computeStats();
    } catch (err: any) {
      alert(err.message || '处理失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getLevelIcon = (level: string) => {
    if (level === 'critical') return <ShieldAlert size={18} className="text-red-500" />;
    return <AlertTriangle size={18} className="text-amber-500" />;
  };

  const getLevelBg = (level: string) => {
    if (level === 'critical') return 'border-l-4 border-red-500';
    return 'border-l-4 border-amber-400';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">异常预警</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">预警中</div>
            <div className="text-xl font-bold text-amber-600">{stats.warningCount}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <ShieldAlert size={20} className="text-red-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">严重</div>
            <div className="text-xl font-bold text-red-600">{stats.criticalCount}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={statusFilter === f.key ? 'btn-primary' : 'btn-outline'}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无预警</div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`card ${getLevelBg(alert.level)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">{getLevelIcon(alert.level)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={alert.level} type="alert" />
                      <span className="text-xs text-gray-400">
                        {ALERT_TYPE_MAP[alert.type] || alert.type}
                      </span>
                      <StatusBadge status={alert.status} type="alert" />
                    </div>
                    <h3 className="font-medium text-gray-800 mb-1">{alert.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{alert.created_at}</span>
                    </div>
                  </div>
                </div>
                {alert.status === 'active' && (
                  <button
                    className="btn-success text-xs px-3 py-1.5 flex items-center gap-1 ml-4"
                    onClick={() => handleResolve(alert.id)}
                    disabled={submitting}
                  >
                    <CheckCircle2 size={14} />
                    处理
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
