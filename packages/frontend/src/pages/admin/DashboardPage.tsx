import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  MessageCircleWarning,
  ArrowUpRight,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

const statCards = [
  { icon: Building2, label: '总社区数', value: '24', color: 'bg-blue-100 text-blue-600' },
  { icon: Users, label: '总用户数', value: '12,580', color: 'bg-green-100 text-green-600' },
  { icon: TrendingUp, label: '今日活跃', value: '3,240', color: 'bg-purple-100 text-purple-600' },
  { icon: DollarSign, label: '总交易额', value: '¥856,200', color: 'bg-orange-100 text-orange-600' },
  { icon: MessageCircleWarning, label: '待处理投诉', value: '18', color: 'bg-red-100 text-red-600' },
  { icon: ArrowUpRight, label: '待审核提现', value: '7', color: 'bg-yellow-100 text-yellow-600' },
];

const topicTrendData = [
  { date: '01-10', count: 120, activeUsers: 85 },
  { date: '01-11', count: 145, activeUsers: 92 },
  { date: '01-12', count: 132, activeUsers: 78 },
  { date: '01-13', count: 168, activeUsers: 110 },
  { date: '01-14', count: 155, activeUsers: 98 },
  { date: '01-15', count: 180, activeUsers: 125 },
  { date: '01-16', count: 195, activeUsers: 130 },
];

const salesTrendData = [
  { date: '01-10', orderCount: 85, totalAmount: 12500, conversionRate: 3.2 },
  { date: '01-11', orderCount: 92, totalAmount: 14800, conversionRate: 3.5 },
  { date: '01-12', orderCount: 78, totalAmount: 11200, conversionRate: 2.9 },
  { date: '01-13', orderCount: 105, totalAmount: 16800, conversionRate: 3.8 },
  { date: '01-14', orderCount: 98, totalAmount: 15200, conversionRate: 3.4 },
  { date: '01-15', orderCount: 115, totalAmount: 18500, conversionRate: 4.1 },
  { date: '01-16', orderCount: 128, totalAmount: 20100, conversionRate: 4.5 },
];

const riskAlerts = [
  { id: 1, title: '用户异常提现', severity: 'high', time: '10分钟前' },
  { id: 2, title: '敏感话题预警', severity: 'medium', time: '30分钟前' },
  { id: 3, title: '可疑登录行为', severity: 'low', time: '1小时前' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">发帖活跃度趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={topicTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0074c7" strokeWidth={2} name="发帖数" />
              <Line type="monotone" dataKey="activeUsers" stroke="#22c55e" strokeWidth={2} name="活跃用户" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">交易转化率</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="conversionRate" fill="#0074c7" radius={[4, 4, 0, 0]} name="转化率(%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">红包池余额</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <Gift className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">¥52,300</p>
              <p className="text-xs text-gray-400 mt-0.5">累计发放 ¥128,500</p>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近风险预警</h3>
            <Link to="/admin/risk-control" className="text-sm text-primary-600 hover:underline">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {riskAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    alert.severity === 'high'
                      ? 'text-red-500'
                      : alert.severity === 'medium'
                      ? 'text-orange-500'
                      : 'text-yellow-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                </div>
                <span className="text-xs text-gray-400">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/admin/community-health" className="card hover:shadow-md transition-shadow text-center">
          <Building2 className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">社区健康度</p>
        </Link>
        <Link to="/admin/trace-logs" className="card hover:shadow-md transition-shadow text-center">
          <TrendingUp className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">话题追踪</p>
        </Link>
        <Link to="/admin/risk-control" className="card hover:shadow-md transition-shadow text-center">
          <AlertTriangle className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">风控中心</p>
        </Link>
        <Link to="/admin/transactions" className="card hover:shadow-md transition-shadow text-center">
          <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">交易管理</p>
        </Link>
      </div>
    </div>
  );
}
