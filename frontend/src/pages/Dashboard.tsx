import { useState, useEffect } from 'react';
import {
  AppWindow,
  ScanLine,
  AlertTriangle,
  Bug,
  TrendingUp,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { statsApi } from '../api/client';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import type { DashboardStats, Alert, ScanTask } from '../types';

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#3b82f6',
};

const severityLabels: Record<string, string> = {
  critical: '严重',
  high: '高危',
  medium: '中危',
  low: '低危',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsApi.dashboard() as DashboardStats;
      setStats(data);
    } catch {
      error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: '应用总数',
          value: stats.totalApplications,
          icon: AppWindow,
          color: 'bg-blue-500',
          link: '/applications',
        },
        {
          label: '扫描任务',
          value: stats.totalTasks,
          icon: ScanLine,
          color: 'bg-green-500',
          link: '/tasks',
        },
        {
          label: '待处理告警',
          value: stats.openAlerts,
          icon: AlertTriangle,
          color: 'bg-orange-500',
          link: '/alerts',
        },
        {
          label: '漏洞总数',
          value: stats.totalVulnerabilities,
          icon: Bug,
          color: 'bg-red-500',
          link: '/tasks',
        },
      ]
    : [];

  const pieData = stats
    ? [
        { name: '严重', value: stats.criticalVulns, color: severityColors.critical },
        { name: '高危', value: stats.highVulns, color: severityColors.high },
        { name: '中危', value: stats.mediumVulns, color: severityColors.medium },
        { name: '低危', value: stats.lowVulns, color: severityColors.low },
      ]
    : [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-10 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <p className="text-gray-500 mt-1">风险概览与待处理事项</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-navy-900" />
              漏洞趋势
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.vulnTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '2px',
                  }}
                />
                <Legend />
                {['critical', 'high', 'medium', 'low'].map((severity) => (
                  <Line
                    key={severity}
                    type="monotone"
                    dataKey="count"
                    name={severityLabels[severity]}
                    stroke={severityColors[severity]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bug className="w-5 h-5 text-navy-900" />
              漏洞等级分布
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-navy-900" />
              最近扫描任务
            </h3>
            <Link
              to="/tasks"
              className="text-sm text-navy-900 hover:text-navy-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.recentTasks || []).length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无扫描任务</p>
            ) : (
              (stats?.recentTasks || []).map((task: ScanTask) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {task.app?.name || `任务 #${task.id}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(task.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-navy-900" />
              最近告警
            </h3>
            <Link
              to="/alerts"
              className="text-sm text-navy-900 hover:text-navy-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.recentAlerts || []).length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无告警</p>
            ) : (
              (stats?.recentAlerts || []).map((alert: Alert) => (
                <Link
                  key={alert.id}
                  to={`/alerts/${alert.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={alert.severity} />
                    <div>
                      <p className="font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={alert.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
