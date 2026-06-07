import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClipboardList, CheckCircle, Star, Users, Activity, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  total_orders: number;
  completion_rate: number;
  avg_rating: number;
  active_nurses: number;
  today_services: number;
  total_revenue: number;
  monthly_trends: { month: string; orders: number }[];
  category_data: { category: string; count: number }[];
  status_data: { status: string; value: number }[];
  recent_orders: { id: number; service_name: string; patient_name: string; status: string; created_at: string }[];
}

const statusLabels: Record<string, string> = {
  pending: '待派单', dispatched: '已派单', accepted: '已接单',
  in_progress: '进行中', completed: '已完成', cancelled: '已取消',
};

const PIE_COLORS = ['#F59E0B', '#0F6CBD', '#06B6D4', '#6366F1', '#108043', '#DC2626'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<DashboardStats>('/admin/dashboard')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: '总订单', value: stats.total_orders, icon: ClipboardList, color: 'bg-blue-50 text-[#0F6CBD]' },
    { label: '完成率', value: `${stats.completion_rate}%`, icon: CheckCircle, color: 'bg-green-50 text-[#108043]' },
    { label: '平均评分', value: stats.avg_rating, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
    { label: '活跃护士', value: stats.active_nurses, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: '今日服务', value: stats.today_services, icon: Activity, color: 'bg-cyan-50 text-cyan-600' },
    { label: '总收入', value: `¥${stats.total_revenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">管理仪表盘</h1>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">月度订单趋势</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.monthly_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#0F6CBD" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">订单分类统计</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.category_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0F6CBD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">订单状态分布</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.status_data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ status, value }) => `${statusLabels[status] || status}: ${value}`}
              >
                {stats.status_data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">最近订单</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">服务</th>
                <th className="text-left py-2 text-gray-500 font-medium">患者</th>
                <th className="text-left py-2 text-gray-500 font-medium">状态</th>
                <th className="text-left py-2 text-gray-500 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50">
                  <td className="py-2">{order.service_name}</td>
                  <td className="py-2">{order.patient_name}</td>
                  <td className="py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{statusLabels[order.status] || order.status}</span>
                  </td>
                  <td className="py-2 text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
