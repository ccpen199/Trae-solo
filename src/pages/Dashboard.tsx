import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, CheckCircle, AlertTriangle, TrendingUp,
  Play, QrCode, Printer, MessageSquare, Wallet, Users,
  ChevronRight, Bell, Loader2, Clock,
  AlertOctagon, CreditCard, DollarSign, Ban,
  ArrowRight, RefreshCw, X,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useDashboardStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

const quickActionsForRole = (role?: string) => {
  const all = [
    { id: 'pickup', label: '开始揽收', icon: Play, color: 'from-blue-500 to-blue-600', path: '/tasks', roles: ['courier', 'admin', 'operator'] },
    { id: 'scan', label: '扫码核销', icon: QrCode, color: 'from-green-500 to-green-600', path: '/offline-pickup', roles: ['courier', 'admin'] },
    { id: 'print', label: '面单打印', icon: Printer, color: 'from-purple-500 to-purple-600', path: '/waybill-template', roles: ['courier', 'admin', 'operator'] },
    { id: 'message', label: '消息中心', icon: MessageSquare, color: 'from-orange-500 to-orange-600', path: '/messages', roles: ['courier', 'admin', 'operator'] },
    { id: 'finance', label: '财务对账', icon: Wallet, color: 'from-pink-500 to-pink-600', path: '/finance', roles: ['admin', 'operator'] },
    { id: 'courier', label: '快递员管理', icon: Users, color: 'from-cyan-500 to-cyan-600', path: '/couriers', roles: ['admin', 'operator'] },
  ];
  return all.filter(a => role && a.roles.includes(role));
};

const alertLevelStyle: Record<string, { bg: string; border: string; iconBg: string; icon: any; title: string; action: string }> = {
  danger: { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-500', icon: AlertOctagon, title: 'text-red-800', action: 'bg-red-500 hover:bg-red-600 text-white' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-500', icon: AlertTriangle, title: 'text-amber-800', action: 'bg-amber-500 hover:bg-amber-600 text-white' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-500', icon: Bell, title: 'text-blue-800', action: 'bg-blue-500 hover:bg-blue-600 text-white' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-500', icon: CheckCircle, title: 'text-emerald-800', action: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { stats, recentTasks, hourlyTrend, messages, alerts, unreadCount, waybill, isLoading, error, fetchDashboardData } = useDashboardStore();
  const [marqueeIndex, setMarqueeIndex] = useState(0);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

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

  const visibleAlerts = useMemo(() => alerts.filter(a => !dismissedAlerts[a.id]), [alerts, dismissedAlerts]);
  const quickActions = quickActionsForRole(user?.role);

  const statCards = [
    {
      label: '待揽收',
      value: stats.pending,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: '已完成',
      value: stats.completed,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: '异常',
      value: stats.exception,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      label: '今日收入',
      value: `¥${stats.todayIncome.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
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
              {user?.name}（{user?.role === 'courier' ? '快递员' : user?.role === 'admin' ? '网点管理员' : '平台运营'}），
              欢迎回来！今天是 {dayjs().format('YYYY年MM月DD日 dddd')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              title="刷新数据"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate('/messages')}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
            <button onClick={fetchDashboardData} className="text-sm text-red-600 hover:text-red-700 underline">
              重试
            </button>
          </div>
        )}

        {visibleAlerts.length > 0 && (
          <div className="space-y-3 animate-slide-down">
            {visibleAlerts.map((alert) => {
              const style = alertLevelStyle[alert.level] || alertLevelStyle.info;
              const Icon = style.icon;
              return (
                <div
                  key={alert.id}
                  className={cn('rounded-xl p-4 border flex items-start gap-4', style.bg, style.border)}
                >
                  <div className={cn('p-2 rounded-lg text-white shadow-sm flex-shrink-0 mt-0.5', style.iconBg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold mb-1', style.title)}>{alert.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{alert.content}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.actionLabel && alert.actionPath && (
                      <button
                        onClick={() => navigate(alert.actionPath)}
                        className={cn('px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors', style.action)}
                      >
                        {alert.actionLabel}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setDismissedAlerts(p => ({ ...p, [alert.id]: true }))}
                      className="p-1.5 rounded-lg hover:bg-black/5 transition-colors text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {messages.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white overflow-hidden shadow-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 flex-shrink-0 animate-bounce" />
              <div className="overflow-hidden flex-1 h-6">
                <div
                  className="whitespace-nowrap transition-transform duration-700"
                  style={{ transform: `translateY(-${marqueeIndex * 100}%)` }}
                >
                  {messages.map((msg, idx) => (
                    <div key={idx} className="h-6 leading-6">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {waybill && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">电子面单账户余额 · {waybill.outletName}</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-bold text-gray-900">¥{waybill.balance.toFixed(2)}</span>
                    {waybill.balance <= waybill.lowBalanceThreshold && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                        低于阈值 ¥{waybill.lowBalanceThreshold.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    已冻结 ¥{waybill.frozenBalance.toFixed(2)} · 累计充值 ¥{waybill.totalRecharged.toFixed(2)} · 累计消耗 ¥{waybill.totalUsed.toFixed(2)}
                  </p>
                </div>
              </div>
              {(user?.role === 'admin' || user?.role === 'operator') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/waybill-account')}
                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    账户详情
                  </button>
                  <button
                    onClick={() => navigate('/waybill-recharge')}
                    className="px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                    立即充值
                  </button>
                </div>
              )}
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
                  <span className="text-gray-400 text-sm">
                    共 {stats.totalTasks} 个任务
                  </span>
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
                <p className="text-sm text-gray-500">
                  {user?.role === 'courier' ? '您最近的揽收任务' : '网点最新揽收任务'}（{recentTasks.length}）
                </p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {recentTasks.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p>暂无任务数据</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">任务单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预约时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">重量</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">运费</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentTasks.map((task) => {
                      return (
                        <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-medium text-gray-900">{task.taskNo}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 max-w-[200px] truncate block">{task.senderAddress}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {dayjs(task.appointmentTime || task.createdAt).format('MM-DD HH:mm')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {task.actualWeight ?? task.estimatedWeight}kg
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-orange-600">
                              {task.freight !== undefined ? `¥${Number(task.freight).toFixed(2)}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={task.status} type="task" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">今日揽收趋势</h3>
              <p className="text-sm text-gray-500">每小时揽收数量统计</p>
            </div>
            <div className="p-6">
              <div className="h-64">
                {hourlyTrend.reduce((s, i) => s + i.tasks, 0) === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Ban className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">今日暂无揽收数据</p>
                  </div>
                ) : (
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
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number) => [`${value} 单`, '揽收量']}
                      />
                      <Line
                        type="monotone"
                        dataKey="tasks"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
