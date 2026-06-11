import { useState, useEffect } from 'react';
import { Package, ClipboardList, AlertTriangle, DollarSign } from 'lucide-react';
import api from '../services/api';
import { PACKAGE_STATUS_MAP, TASK_STATUS_MAP, BRAND_MAP } from '../types';

interface DashboardStats {
  totalPackages: number;
  todayTasks: number;
  activeAlerts: number;
  totalSettlementAmount: number;
  packagesByStatus: Record<string, number>;
  packagesByBrand: Record<string, number>;
  taskStatusCounts: Record<string, number>;
}

const STATUS_BAR_COLORS: Record<string, string> = {
  pending: 'bg-gray-400',
  inbound: 'bg-blue-500',
  stored: 'bg-indigo-500',
  outbound: 'bg-cyan-500',
  signed: 'bg-green-500',
  exception: 'bg-red-500',
};

const TASK_BAR_COLORS: Record<string, string> = {
  pending: 'bg-gray-400',
  assigned: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

const BRAND_COLORS: Record<string, string> = {
  sf: 'bg-red-100 text-red-700 border-red-200',
  zt: 'bg-blue-100 text-blue-700 border-blue-200',
  yt: 'bg-orange-100 text-orange-700 border-orange-200',
  yd: 'bg-purple-100 text-purple-700 border-purple-200',
  jt: 'bg-green-100 text-green-700 border-green-200',
};

export default function AdminPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any, { data: DashboardStats }>('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-400">暂无数据</div>;
  }

  const statCards = [
    { label: '总包裹数', value: stats.totalPackages, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: '今日任务', value: stats.todayTasks, icon: ClipboardList, color: 'bg-accent/10 text-accent' },
    { label: '活跃预警', value: stats.activeAlerts, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
    { label: '结算总额', value: `¥${stats.totalSettlementAmount.toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
  ];

  const statusEntries = Object.entries(stats.packagesByStatus || {});
  const maxStatusCount = Math.max(...statusEntries.map(([, v]) => v), 1);
  const statusTotal = statusEntries.reduce((a, [, v]) => a + v, 0);

  const taskEntries = Object.entries(stats.taskStatusCounts || {});
  const maxTaskCount = Math.max(...taskEntries.map(([, v]) => v), 1);
  const taskTotal = taskEntries.reduce((a, [, v]) => a + v, 0);

  const brandEntries = Object.entries(stats.packagesByBrand || {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">数据看板</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-500">{card.label}</div>
                <div className="text-xl font-bold text-gray-800">{card.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">包裹状态分布</h3>
        <div className="space-y-3">
          {statusEntries.map(([key, count]) => {
            const pct = Math.round((count / maxStatusCount) * 100);
            const percent = statusTotal > 0 ? ((count / statusTotal) * 100).toFixed(1) : '0';
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16 text-right shrink-0">
                  {PACKAGE_STATUS_MAP[key] || key}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500 ${STATUS_BAR_COLORS[key] || 'bg-gray-400'}`}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right shrink-0">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">品牌分布</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {brandEntries.map(([key, count]) => (
            <div
              key={key}
              className={`border rounded-xl p-4 text-center ${BRAND_COLORS[key] || 'border-gray-200 bg-gray-50 text-gray-700'}`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs mt-1 font-medium">{BRAND_MAP[key] || key}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">任务状态分布</h3>
        <div className="space-y-3">
          {taskEntries.map(([key, count]) => {
            const pct = Math.round((count / maxTaskCount) * 100);
            const percent = taskTotal > 0 ? ((count / taskTotal) * 100).toFixed(1) : '0';
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-16 text-right shrink-0">
                  {TASK_STATUS_MAP[key] || key}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500 ${TASK_BAR_COLORS[key] || 'bg-gray-400'}`}
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right shrink-0">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
