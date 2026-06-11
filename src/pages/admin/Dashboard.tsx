import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Activity,
  Database,
  Zap,
  Shield,
  TrendingUp,
  Settings,
  AlertTriangle,
  Key,
} from 'lucide-react';
import { adminApi } from '../../api';
import type { DataSource, ApiCallStats, AuditLog } from '../../../shared/types';
import { cn } from '../../lib/utils';

interface QualityTrendItem {
  date: string;
  score: number;
}

export default function Dashboard() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [apiStats, setApiStats] = useState<ApiCallStats | null>(null);
  const [qualityTrend, setQualityTrend] = useState<QualityTrendItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sources, stats, audit] = await Promise.all([
          adminApi.getDataSources(),
          adminApi.getApiStats(),
          adminApi.getAuditLogs(10),
        ]);
        setDataSources(sources);
        setApiStats(stats);
        setAuditLogs(audit.logs);

        const trendData = generateQualityTrend();
        setQualityTrend(trendData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateQualityTrend = (): QualityTrendItem[] => {
    const data: QualityTrendItem[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        score: 85 + Math.random() * 12,
      });
    }
    return data;
  };

  const onlineCount = dataSources.filter((s) => s.status === 'online').length;
  const degradedCount = dataSources.filter((s) => s.status === 'degraded').length;
  const circuitBreakCount = dataSources.filter(
    (s) => s.status === 'circuit_break'
  ).length;

  const avgQualityScore =
    dataSources.length > 0
      ? dataSources.reduce((sum, s) => sum + s.qualityScore, 0) / dataSources.length
      : 0;

  const quickActions = [
    {
      label: '数据质量',
      icon: Shield,
      path: '/admin/quality',
      color: 'from-emerald-500 to-teal-400',
    },
    {
      label: '熔断管理',
      icon: AlertTriangle,
      path: '/admin/circuit-breaker',
      color: 'from-amber-500 to-orange-400',
    },
    {
      label: '指数配置',
      icon: Settings,
      path: '/admin/index-config',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      label: '接口管理',
      icon: Key,
      path: '/admin/api',
      color: 'from-purple-500 to-pink-400',
    },
    {
      label: '合规监控',
      icon: Shield,
      path: '/admin/compliance',
      color: 'from-teal-500 to-emerald-400',
    },
    {
      label: '预警管理',
      icon: AlertTriangle,
      path: '/admin/alerts',
      color: 'from-red-500 to-rose-400',
    },
  ];

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    color: string;
  }) => (
    <div className="glass-card glow-blue p-6 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            color
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-700/50 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-700/30 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-2">管理控制台</h1>
        <p className="text-slate-400">实时监控系统运行状态与数据质量</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="在线数据源"
          value={onlineCount}
          icon={Database}
          color="from-emerald-500 to-teal-400"
        />
        <StatCard
          title="降级数据源"
          value={degradedCount}
          icon={Activity}
          color="from-amber-500 to-orange-400"
        />
        <StatCard
          title="熔断数据源"
          value={circuitBreakCount}
          icon={Zap}
          color="from-red-500 to-rose-400"
        />
        <StatCard
          title="平均质量分"
          value={avgQualityScore.toFixed(1)}
          icon={Shield}
          trend="+2.3% 较上周"
          color="from-blue-500 to-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            API 调用趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={apiStats?.dailyStats || []}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#colorCalls)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            数据质量趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} domain={[70, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          数据源状态
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => (
            <div
              key={source.id}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-white">{source.name}</span>
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    source.status === 'online' && 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
                    source.status === 'degraded' && 'bg-amber-500 shadow-lg shadow-amber-500/50',
                    source.status === 'circuit_break' && 'bg-red-500 shadow-lg shadow-red-500/50',
                    source.status === 'offline' && 'bg-slate-500'
                  )}
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">延迟</span>
                  <span className="text-slate-200">{source.latency}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">成功率</span>
                  <span className="text-slate-200">{(source.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">质量分</span>
                  <span
                    className={cn(
                      'font-medium',
                      source.qualityScore >= 90 && 'text-emerald-400',
                      source.qualityScore >= 70 && source.qualityScore < 90 && 'text-amber-400',
                      source.qualityScore < 70 && 'text-red-400'
                    )}
                  >
                    {source.qualityScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.path}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/60 transition-all group"
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br group-hover:scale-110 transition-transform',
                    action.color
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-6 mt-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          最近操作记录
        </h3>
        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">时间</th>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">操作者</th>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">操作</th>
                  <th className="text-left text-slate-400 font-medium pb-3 pr-4">对象</th>
                  <th className="text-left text-slate-400 font-medium pb-3">详情</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pr-4 text-slate-400 text-xs">
                      {new Date(log.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 pr-4 text-white font-medium">{log.operator}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">{log.action}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{log.targetType} {log.targetId}</td>
                    <td className="py-3 text-slate-500 text-xs max-w-xs truncate">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">暂无操作记录</p>
        )}
      </div>
    </div>
  );
}
