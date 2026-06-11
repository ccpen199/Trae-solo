import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, TrendingUp, AlertTriangle, EyeOff, Settings } from 'lucide-react';

const API = '/api';

type RiskLevel = 'high' | 'medium' | 'low';
type AlertStatus = 'active' | 'pending' | 'resolved' | 'ignored';
type AlertType = 'overtime' | 'unsigned_contract' | 'abnormal_attendance' | 'abnormal_behavior' | 'low_credit';

interface RiskAlert {
  id: number;
  title: string;
  description: string;
  type: AlertType;
  level: RiskLevel;
  status: AlertStatus;
  time: string;
  source: string;
}

interface RiskConfig {
  overtime_threshold_hours: number;
  overtime_weekly_hours: number;
  unsigned_contract_days: number;
  late_threshold_count: number;
}

interface RiskAlertListPayload {
  items?: unknown[];
}

const levelConfig: Record<RiskLevel, { label: string; borderClass: string; bgClass: string; iconClass: string }> = {
  high: { label: '高风险', borderClass: 'border-l-red-500', bgClass: 'bg-red-50/50', iconClass: 'text-red-500' },
  medium: { label: '中风险', borderClass: 'border-l-amber-500', bgClass: 'bg-amber-50/50', iconClass: 'text-amber-500' },
  low: { label: '低风险', borderClass: 'border-l-orange-400', bgClass: 'bg-orange-50/50', iconClass: 'text-orange-400' },
};

const typeLabels: Record<AlertType, string> = {
  overtime: '超时加班',
  unsigned_contract: '未签合同',
  abnormal_attendance: '异常考勤',
  abnormal_behavior: '异常行为',
  low_credit: '信用预警',
};

const trendData = [
  { month: '1月', high: 2, medium: 5, low: 8 },
  { month: '2月', high: 1, medium: 4, low: 6 },
  { month: '3月', high: 3, medium: 6, low: 9 },
  { month: '4月', high: 2, medium: 3, low: 7 },
  { month: '5月', high: 1, medium: 5, low: 5 },
  { month: '6月', high: 3, medium: 4, low: 4 },
];

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

function normalizeRiskAlert(item: unknown): RiskAlert {
  const row = (item || {}) as Record<string, unknown>;
  const type = String(row.type || row.alert_type || 'abnormal_behavior') as AlertType;
  const status = String(row.status || 'pending') as AlertStatus;
  return {
    id: Number(row.id || 0),
    title: String(row.title || typeLabels[type] || '风控预警'),
    description: String(row.description || row.message || '系统检测到需要人工复核的风险记录'),
    type,
    level: (['high', 'medium', 'low'].includes(String(row.level)) ? row.level : 'medium') as RiskLevel,
    status: status === 'pending' ? 'active' : status,
    time: String(row.time || row.created_at || ''),
    source: String(row.source || row.org_name || row.related_user_name || '系统风控'),
  };
}

function normalizeRiskAlertsPayload(payload: RiskAlert[] | RiskAlertListPayload): RiskAlert[] {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
  return rows.map(normalizeRiskAlert);
}

export default function Risk() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [config, setConfig] = useState<RiskConfig | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (levelFilter !== 'all') params.set('level', levelFilter);
      const query = params.toString();
      const data = await apiFetch<RiskAlert[] | RiskAlertListPayload>(`/risk/alerts${query ? `?${query}` : ''}`);
      setAlerts(normalizeRiskAlertsPayload(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [levelFilter]);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiFetch<RiskConfig>('/risk/config');
      setConfig(data);
    } catch {
      // config fetch failed silently
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchConfig();
  }, [fetchAlerts, fetchConfig]);

  const filtered = alerts.filter(a => levelFilter === 'all' || a.level === levelFilter);
  const activeCount = filtered.filter(a => a.status === 'active' || a.status === 'pending').length;
  const resolvedCount = filtered.filter(a => a.status === 'resolved').length;

  const handleResolve = async (id: number) => {
    try {
      await apiFetch(`/risk/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      fetchAlerts();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleIgnore = async (id: number) => {
    try {
      await apiFetch(`/risk/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      });
      fetchAlerts();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const maxTotal = Math.max(...trendData.map(d => d.high + d.medium + d.low));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">风控预警</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="badge-danger">{activeCount} 未处理</span>
          <span className="badge-success">{resolvedCount} 已处理</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        {['all', 'high', 'medium', 'low'].map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter(level)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
              levelFilter === level ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {level === 'all' ? '全部' : levelConfig[level as RiskLevel].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无预警</div>
          ) : (
            filtered.map((alert) => {
              const lc = levelConfig[alert.level];
              return (
                <div key={alert.id} className={`card-base border-l-4 ${lc.borderClass} ${lc.bgClass} p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className={lc.iconClass} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-semibold text-gray-800">{alert.title}</h4>
                          <span className="badge-info text-[10px]">{typeLabels[alert.type] || alert.type}</span>
                          <span className={`text-xs ${alert.status === 'active' ? 'badge-danger' : alert.status === 'ignored' ? 'badge-warning' : 'badge-success'}`}>
                            {alert.status === 'active' ? '未处理' : alert.status === 'ignored' ? '已忽略' : '已处理'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{alert.time}</span>
                          <span>来源：{alert.source}</span>
                        </div>
                      </div>
                    </div>
                    {(alert.status === 'active' || alert.status === 'pending') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="btn-outline text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />一键处理
                        </button>
                        <button
                          onClick={() => handleIgnore(alert.id)}
                          className="btn-outline text-xs flex items-center gap-1 text-gray-400 border-gray-200 hover:text-gray-600"
                        >
                          <EyeOff size={12} />忽略
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-5">
          <div className="card-base p-5">
            <h3 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={16} />预警趋势
            </h3>
            <div className="space-y-3">
              {trendData.map((d) => {
                const total = d.high + d.medium + d.low;
                const widthPercent = (total / maxTotal) * 100;
                return (
                  <div key={d.month}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">{d.month}</span>
                      <span className="font-mono text-gray-500">{total}条</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="bg-red-400 h-full transition-all duration-500" style={{ width: `${(d.high / total) * widthPercent}%` }} />
                      <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${(d.medium / total) * widthPercent}%` }} />
                      <div className="bg-orange-300 h-full transition-all duration-500" style={{ width: `${(d.low / total) * widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />高风险</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />中风险</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-300" />低风险</span>
            </div>
          </div>

          {config && (
            <div className="card-base p-5">
              <h3 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Settings size={16} />预警阈值配置
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">单日加班阈值</span>
                  <span className="font-mono font-medium text-primary">{config.overtime_threshold_hours}小时</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">周加班上限</span>
                  <span className="font-mono font-medium text-primary">{config.overtime_weekly_hours}小时</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">未签合同天数</span>
                  <span className="font-mono font-medium text-amber-600">{config.unsigned_contract_days}天</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">迟到次数阈值</span>
                  <span className="font-mono font-medium text-red-600">{config.late_threshold_count}次</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
