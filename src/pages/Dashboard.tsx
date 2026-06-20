import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, CheckCircle, AlertTriangle, TrendingUp, 
  Play, QrCode, Printer, MessageSquare, Wallet, Users,
  ChevronRight, Bell, Loader2, Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useDashboardStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

const quickActions = [
  { id: 'pickup', label: '开始揽收', icon: Play, color: 'from-blue-500 to-blue-600', path: '/tasks' },
  { id: 'scan', label: '扫码核销', icon: QrCode, color: 'from-green-500 to-green-600', path: '/offline-pickup' },
  { id: 'print', label: '面单打印', icon: Printer, color: 'from-purple-500 to-purple-600', path: '/waybill-template' },
  { id: 'message', label: '消息中心', icon: MessageSquare, color: 'from-orange-500 to-orange-600', path: '/messages' },
  { id: 'finance', label: '财务对账', icon: Wallet, color: 'from-pink-500 to-pink-600', path: '/finance' },
  { id: 'courier', label: '快递员管理', icon: Users, color: 'from-cyan-500 to-cyan-600', path: '/couriers' },
];

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待揽收', className: 'bg-yellow-100 text-yellow-700' },
  assigned: { label: '已分配', className: 'bg-blue-100 text-blue-700' },
  picked: { label: '已揽收', className: 'bg-green-100 text-green-700' },
  in_transit: { label: '运输中', className: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', className: 'bg-gray-100 text-gray-700' },
  exception: { label: '异常', className: 'bg-red-100 text-red-700' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stats, recentTasks, hourlyTrend, messages, isLoading, fetchDashboardData } = useDashboardStore();
  const [marqueeIndex, setMarqueeIndex] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      setMarqueeIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const statCards = [
    { 
      label: '待揽收', 
      value: stats.pending, 
      icon: Package, 
      trend: '+12%', 
      trendUp: true,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: '已完成', 
      value: stats.completed, 
      icon: CheckCircle, 
      trend: '+8%', 
      trendUp: true,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    { 
      label: '异常', 
      value: stats.exception, 
      icon: AlertTriangle, 
      trend: '-2%', 
      trendUp: false,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    { 
      label: '今日收入', 
      value: `¥${stats.todayIncome.toLocaleString()}`, 
      icon: TrendingUp, 
      trend: '+15%', 
      trendUp: true,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
            <p className="text-gray-500 mt-1">
              {user?.name}，欢迎回来！今天是 {dayjs().format('YYYY年MM月DD日 dddd')}
            </p>
          </div>
          <button className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>

        {messages.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white overflow-hidden">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 flex-shrink-0 animate-bounce" />
              <div className="overflow-hidden flex-1">
                <div 
                  className="whitespace-nowrap transition-transform duration-500"
                  style={{ transform: `translateY(-${marqueeIndex * 100}%)` }}
                >
                  {messages.map((msg, idx) => (
                    <div key={idx} className="py-0.5">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.label}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={cn('p-3 rounded-xl bg-gradient-to-br', card.color, 'shadow-lg')}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  <TrendingUp className={cn('w-4 h-4', card.trendUp ? 'text-green-500' : 'text-red-500 rotate-180')} />
                  <span className={cn('text-sm font-medium', card.trendUp ? 'text-green-600' : 'text-red-600')}>
                    {card.trend}
                  </span>
                  <span className="text-gray-400 text-sm ml-1">较昨日</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={cn('w-12 h-12 mx-auto rounded-xl bg-gradient-to-br', action.color, 'flex items-center justify-center mb-3 group-hover:scale-110 transition-transform')}>
                  <ActionIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-700 font-medium text-center">{action.label}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">最近任务</h3>
                <p className="text-sm text-gray-500">最新的5个揽收任务</p>
              </div>
              <button 
                onClick={() => navigate('/tasks')}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地址</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">重量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTasks.map((task) => {
                    const status = statusMap[task.status] || statusMap.pending;
                    return (
                      <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{task.taskNo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 max-w-xs truncate block">{task.senderAddress}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{task.estimatedWeight}kg</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', status.className)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {dayjs(task.createdAt).format('HH:mm')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">今日揽收趋势</h3>
              <p className="text-sm text-gray-500">每小时揽收数量统计</p>
            </div>
            <div className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [`${value} 单`, '揽收量']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasks" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
