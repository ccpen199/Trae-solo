import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Users,
  Coins,
  TrendingUp,
  TrendingDown,
  Award,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { get } from '../../utils/request';

interface DashboardStats {
  totalUsers: number;
  todayNewUsers: number;
  totalCoins: number;
  todayWithdrawAmount: number;
  taskParticipationRate: number;
  averageEarnings: number;
  totalInvites: number;
  pendingWithdrawCount: number;
}

interface TaskStats {
  totalTasks: number;
  activeTasks: number;
  pendingTasks: number;
  todayCompletions: number;
}

interface FunnelData {
  totalVisits: number;
  registrations: number;
  firstTask: number;
  firstWithdraw: number;
}

interface WeeklyData {
  date: string;
  income: number;
  expense: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await get('/admin/statistics/overview');
      if (res.success) {
        setStats(res.stats);
        setTaskStats(res.taskStats);
        setFunnel(res.funnel);
        setWeekly(res.weekly);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: '总用户数',
          value: stats.totalUsers.toLocaleString(),
          change: `+${stats.todayNewUsers}`,
          changeType: 'up',
          icon: Users,
          color: 'from-blue-500 to-blue-600',
        },
        {
          label: '金币总量',
          value: stats.totalCoins.toLocaleString(),
          change: '流通中',
          changeType: 'neutral',
          icon: Coins,
          color: 'from-yellow-500 to-orange-500',
        },
        {
          label: '任务参与率',
          value: `${stats.taskParticipationRate}%`,
          change: '较昨日+5%',
          changeType: 'up',
          icon: TrendingUp,
          color: 'from-green-500 to-emerald-600',
        },
        {
          label: '人均收益',
          value: stats.averageEarnings.toFixed(1),
          change: '金币/人',
          changeType: 'neutral',
          icon: Award,
          color: 'from-purple-500 to-violet-600',
        },
        {
          label: '今日提现',
          value: stats.todayWithdrawAmount.toLocaleString(),
          change: '金币',
          changeType: 'down',
          icon: Wallet,
          color: 'from-red-500 to-rose-600',
        },
        {
          label: '待审核提现',
          value: stats.pendingWithdrawCount,
          change: '笔',
          changeType: 'neutral',
          icon: TrendingDown,
          color: 'from-amber-500 to-orange-600',
        },
      ]
    : [];

  const funnelSteps = funnel
    ? [
        { label: '访问用户', value: funnel.totalVisits, color: 'bg-blue-500' },
        { label: '注册用户', value: funnel.registrations, color: 'bg-green-500' },
        { label: '完成首单', value: funnel.firstTask, color: 'bg-yellow-500' },
        { label: '首次提现', value: funnel.firstWithdraw, color: 'bg-red-500' },
      ]
    : [];

  const maxFunnelValue = funnel ? funnel.totalVisits : 1;

  return (
    <AdminLayout title="数据概览">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon size={24} className="text-white" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      card.changeType === 'up'
                        ? 'text-green-500'
                        : card.changeType === 'down'
                        ? 'text-red-500'
                        : 'text-gray-400'
                    }`}
                  >
                    {card.changeType === 'up' && <ArrowUpRight size={14} />}
                    {card.changeType === 'down' && <ArrowDownRight size={14} />}
                    {card.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-1">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">7日金币收支趋势</h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {weekly.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end h-48">
                    <div
                      className="flex-1 bg-gradient-to-t from-green-400 to-green-500 rounded-t transition-all duration-500"
                      style={{
                        height: `${(day.income / Math.max(...weekly.map((d) => d.income), 1)) * 100}%`,
                        minHeight: '4px',
                      }}
                    ></div>
                    <div
                      className="flex-1 bg-gradient-to-t from-red-400 to-red-500 rounded-t transition-all duration-500"
                      style={{
                        height: `${(day.expense / Math.max(...weekly.map((d) => d.income), 1)) * 100}%`,
                        minHeight: '4px',
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">收入</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-sm text-gray-600">支出</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">邀请转化漏斗</h3>
            <div className="space-y-4">
              {funnelSteps.map((step, index) => {
                const width = (step.value / maxFunnelValue) * 100;
                const rate = index === 0 ? 100 : ((step.value / funnelSteps[0].value) * 100).toFixed(1);
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{step.label}</span>
                      <span className="text-sm font-medium text-gray-800">
                        {step.value.toLocaleString()} ({rate}%)
                      </span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${step.color} rounded-lg transition-all duration-700 flex items-center justify-end pr-3`}
                        style={{ width: `${width}%`, minWidth: '80px' }}
                      >
                        <span className="text-xs text-white font-medium">{rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {taskStats && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">任务数据统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{taskStats.totalTasks}</p>
                <p className="text-sm text-blue-600 mt-1">全部任务</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{taskStats.activeTasks}</p>
                <p className="text-sm text-green-600 mt-1">进行中</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-3xl font-bold text-yellow-600">{taskStats.pendingTasks}</p>
                <p className="text-sm text-yellow-600 mt-1">待审核</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{taskStats.todayCompletions}</p>
                <p className="text-sm text-purple-600 mt-1">今日完成</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
