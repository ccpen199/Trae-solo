import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  MapPin,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Eye,
  Star,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { agentApi } from '../../utils/api';
import { formatPrice, formatDate, formatRelativeTime } from '../../utils/format';
import { useUserStore } from '../../store/useUserStore';
import type { ViewingRecord } from '@shared/types';

interface TodoItem {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
}

interface DashboardData {
  todayViewings: number;
  monthlyDeals: number;
  pendingClients: number;
  totalCommission: number;
  dealTrend: { month: string; count: number; amount: number }[];
  intentDistribution: { name: string; value: number }[];
  todos: TodoItem[];
  recentViewings: ViewingRecord[];
}

const mockDashboardData: DashboardData = {
  todayViewings: 5,
  monthlyDeals: 12,
  pendingClients: 28,
  totalCommission: 128500,
  dealTrend: [
    { month: '1月', count: 8, amount: 3200000 },
    { month: '2月', count: 10, amount: 4500000 },
    { month: '3月', count: 7, amount: 3800000 },
    { month: '4月', count: 12, amount: 5200000 },
    { month: '5月', count: 15, amount: 6800000 },
    { month: '6月', count: 12, amount: 5600000 },
  ],
  intentDistribution: [
    { name: '高意向', value: 12 },
    { name: '中意向', value: 18 },
    { name: '低意向', value: 8 },
    { name: '待跟进', value: 5 },
  ],
  todos: [
    { id: '1', title: '联系张先生确认签约时间', priority: 'high', deadline: '2026-06-14' },
    { id: '2', title: '带李女士看万科城房源', priority: 'high', deadline: '2026-06-14' },
    { id: '3', title: '更新王先生的购房需求', priority: 'medium', deadline: '2026-06-15' },
    { id: '4', title: '发送最新房源信息给陈女士', priority: 'medium', deadline: '2026-06-15' },
    { id: '5', title: '整理本月成交记录', priority: 'low', deadline: '2026-06-20' },
  ],
  recentViewings: [
    { id: '1', propertyId: 'p1', propertyTitle: '万科城 3室2厅 精装修', clientId: 'c1', clientName: '张先生', agentId: 'a1', date: '2026-06-14', timeSlot: '10:00-11:00', feedback: '对户型很满意，考虑中', interestLevel: 'high', createdAt: '2026-06-14T08:00:00Z' },
    { id: '2', propertyId: 'p2', propertyTitle: '碧桂园 2室1厅 朝南', clientId: 'c2', clientName: '李女士', agentId: 'a1', date: '2026-06-14', timeSlot: '14:00-15:00', feedback: '', interestLevel: 'medium', createdAt: '2026-06-14T09:00:00Z' },
    { id: '3', propertyId: 'p3', propertyTitle: '恒大绿洲 4室2厅 豪华装修', clientId: 'c3', clientName: '王先生', agentId: 'a1', date: '2026-06-13', timeSlot: '15:00-16:00', feedback: '价格偏高，需要再商量', interestLevel: 'medium', createdAt: '2026-06-13T10:00:00Z' },
    { id: '4', propertyId: 'p4', propertyTitle: '保利花园 1室1厅 小户型', clientId: 'c4', clientName: '陈女士', agentId: 'a1', date: '2026-06-13', timeSlot: '10:00-11:00', feedback: '非常满意，约房主面谈', interestLevel: 'high', createdAt: '2026-06-13T08:00:00Z' },
    { id: '5', propertyId: 'p5', propertyTitle: '龙湖天街 3室2厅 地铁房', clientId: 'c5', clientName: '刘先生', agentId: 'a1', date: '2026-06-12', timeSlot: '16:00-17:00', feedback: '位置好，但楼层不理想', interestLevel: 'low', createdAt: '2026-06-12T14:00:00Z' },
  ],
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6B7280'];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high': return '紧急';
    case 'medium': return '重要';
    case 'low': return '普通';
    default: return priority;
  }
};

const getInterestLevelColor = (level: string) => {
  switch (level) {
    case 'high': return 'bg-green-100 text-green-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getInterestLevelLabel = (level: string) => {
  switch (level) {
    case 'high': return '高意向';
    case 'medium': return '中意向';
    case 'low': return '低意向';
    default: return level;
  }
};

export default function AgentDashboard() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>(mockDashboardData);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const res = await agentApi.getDashboardStats(user.id);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch {
        setData(mockDashboardData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const stats = [
    { icon: Calendar, label: '今日带看', value: data.todayViewings, color: 'bg-blue-500', change: '+2', changeType: 'up' as const },
    { icon: TrendingUp, label: '本月成交', value: data.monthlyDeals, color: 'bg-green-500', change: '+3', changeType: 'up' as const },
    { icon: Users, label: '待跟进客户', value: data.pendingClients, color: 'bg-yellow-500', change: '-1', changeType: 'down' as const },
    { icon: DollarSign, label: '总佣金', value: formatPrice(data.totalCommission), color: 'bg-purple-500', change: '+12%', changeType: 'up' as const },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">经纪人工作台</h1>
        <p className="text-gray-500">欢迎回来，{user?.name || '经纪人'}！这是您今日的工作概览</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${stat.changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                成交趋势
              </h2>
              <p className="text-sm text-gray-500">近6个月成交数量与金额</p>
            </div>
            <Link to="/agent/deals" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dealTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [
                    name === 'amount' ? `${(value / 10000).toFixed(2)}万` : value,
                    name === 'amount' ? '成交金额' : '成交数量',
                  ]}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="count" name="成交数量" stroke="#1E40AF" strokeWidth={2} dot={{ fill: '#1E40AF', r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="amount" name="成交金额" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-secondary-500" />
                客户意向分布
              </h2>
              <p className="text-sm text-gray-500">按意向等级分类</p>
            </div>
          </div>
          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.intentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.intentDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
                待办事项
              </h2>
              <p className="text-sm text-gray-500">今日需要完成的任务</p>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="skeleton w-5 h-5 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : (
              data.todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{todo.title}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getPriorityColor(todo.priority)}`}>
                        {getPriorityLabel(todo.priority)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(todo.deadline)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-600" />
                最新带看记录
              </h2>
              <p className="text-sm text-gray-500">最近的带看情况</p>
            </div>
            <Link to="/agent/viewings" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="skeleton w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              data.recentViewings.map((viewing) => (
                <div key={viewing.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">{viewing.clientName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${getInterestLevelColor(viewing.interestLevel)}`}>
                        {getInterestLevelLabel(viewing.interestLevel)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 truncate mb-1">{viewing.propertyTitle}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(viewing.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {viewing.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {formatRelativeTime(viewing.createdAt)}
                      </span>
                    </div>
                    {viewing.feedback && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                        <MessageSquare className="w-3 h-3 inline mr-1" />
                        {viewing.feedback}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
