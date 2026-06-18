import { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

const communities = [
  { id: '1', name: '幸福花园' },
  { id: '2', name: '阳光小区' },
  { id: '3', name: '翠湖名苑' },
];

const topicTrendData = [
  { date: '01-10', count: 45, activeUsers: 32 },
  { date: '01-11', count: 52, activeUsers: 38 },
  { date: '01-12', count: 48, activeUsers: 35 },
  { date: '01-13', count: 65, activeUsers: 42 },
  { date: '01-14', count: 58, activeUsers: 40 },
  { date: '01-15', count: 72, activeUsers: 48 },
  { date: '01-16', count: 80, activeUsers: 55 },
];

const salesTrendData = [
  { date: '01-10', orderCount: 28, totalAmount: 4500 },
  { date: '01-11', orderCount: 35, totalAmount: 5800 },
  { date: '01-12', orderCount: 30, totalAmount: 4900 },
  { date: '01-13', orderCount: 42, totalAmount: 7200 },
  { date: '01-14', orderCount: 38, totalAmount: 6500 },
  { date: '01-15', orderCount: 48, totalAmount: 8100 },
  { date: '01-16', orderCount: 55, totalAmount: 9200 },
];

export default function CommunityHealthPage() {
  const [selectedCommunity, setSelectedCommunity] = useState(communities[0].id);

  return (
    <div className="space-y-6">
      <PageHeader title="社区健康管理" subtitle="查看社区运营数据与健康指标" />

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">选择社区：</label>
        <select
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="input-field w-48"
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: Users, label: '活跃用户', value: '520', color: 'bg-blue-100 text-blue-600' },
          { icon: MessageSquare, label: '发帖数', value: '128', color: 'bg-green-100 text-green-600' },
          { icon: DollarSign, label: '交易额', value: '¥32,500', color: 'bg-orange-100 text-orange-600' },
          { icon: TrendingUp, label: '转化率', value: '4.2%', color: 'bg-purple-100 text-purple-600' },
          { icon: Clock, label: '投诉响应', value: '15分钟', color: 'bg-red-100 text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">话题趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={topicTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#0074c7" fill="#0074c7" fillOpacity={0.1} name="发帖数" />
              <Area type="monotone" dataKey="activeUsers" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="活跃用户" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">销售趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="totalAmount" stroke="#0074c7" strokeWidth={2} name="交易额" />
              <Line type="monotone" dataKey="orderCount" stroke="#f97316" strokeWidth={2} name="订单数" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">投诉指标</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: '总数', value: '45' },
            { label: '待处理', value: '8' },
            { label: '已解决', value: '37' },
            { label: '平均响应', value: '15分钟' },
            { label: '24h解决率', value: '82%' },
          ].map((item) => (
            <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
