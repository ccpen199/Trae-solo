import { useEffect, useState } from 'react';
import { Camera, CameraOff, AlertTriangle, HardDrive, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { AlertLevelBadge } from '@/components/Badges';
import { ALERT_TYPE_MAP } from '@/types';
import type { Alert } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface OverviewData {
  onlineCount: number;
  offlineCount: number;
  pendingAlerts: number;
  todayAlerts: number;
  storageUsage: number;
  alertTrend: { date: string; count: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '仪表盘 - 云瞳视频监控';
    Promise.all([
      api.get('/alerts/stats/overview'),
      api.get('/alerts?pageSize=5'),
    ]).then(([r1, r2]) => {
      if (r1.data.success) setData(r1.data as OverviewData);
      if (r2.data.success) setAlerts(r2.data.list);
    }).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: '在线设备', value: data?.onlineCount || 0, icon: Camera, color: 'emerald', delta: '+2 今日' },
    { label: '离线设备', value: data?.offlineCount || 0, icon: CameraOff, color: 'red', delta: '-1 今日' },
    { label: '待处理告警', value: data?.pendingAlerts || 0, icon: AlertTriangle, color: 'amber', delta: '+5 今日' },
    { label: '存储使用率', value: `${data?.storageUsage || 0}%`, icon: HardDrive, color: 'blue', delta: '↑ 2.3%' },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/30',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
  };

  const iconBgMap: Record<string, string> = {
    emerald: 'bg-emerald-500/20',
    red: 'bg-red-500/20',
    amber: 'bg-amber-500/20',
    blue: 'bg-blue-500/20',
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="监控中心概览"
        subtitle="实时掌握全平台设备状态与安全告警"
        breadcrumbs={[{ label: '仪表盘' }]}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-vms-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className={`vms-card p-5 bg-gradient-to-br ${colorMap[s.color]} border transition-transform hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${iconBgMap[s.color]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs opacity-80 flex items-center gap-0.5">
                      {s.delta} <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="text-3xl font-bold font-mono mb-1">{s.value}</div>
                  <div className="text-sm opacity-75">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 vms-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white font-mono">告警趋势（近 7 天）</h3>
                <span className="text-xs text-vms-text-muted">单位：次</span>
              </div>
              <div className="h-64">
                {data && data.alertTrend && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.alertTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#343c54" opacity={0.5} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#222839',
                          border: '1px solid #343c54',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#e2e8f0',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#alertGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="vms-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white font-mono">最近告警</h3>
                <Link to="/alerts" className="text-xs text-vms-primary hover:underline">查看全部</Link>
              </div>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-sm text-vms-text-muted text-center py-8">暂无告警</div>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-vms-surface-2/50 transition-colors">
                      <AlertLevelBadge status={a.level} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-vms-text truncate">
                          {a.device_name} · {ALERT_TYPE_MAP[a.type]}
                        </div>
                        <div className="text-xs text-vms-text-muted mt-0.5">{formatDateTime(a.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
