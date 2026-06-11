import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, CheckCircle, Clock, DollarSign, AlertTriangle, UserPlus,
  TrendingUp, ArrowRight, Plus, FileText, Users, MessageSquare
} from 'lucide-react';
import { financeApi, taskApi, messageApi } from '../lib/api';
import { useAuth } from '../store/authStore';
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '../../shared/types';
import type { Task, DashboardStats } from '../../shared/types';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, tasksData] = await Promise.all([
          financeApi.getDashboardStats(),
          taskApi.getList({ page: 1, pageSize: 5 }),
        ]);
        setStats(statsData);
        setRecentTasks(tasksData.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-blue-100 text-blue-700',
      bidding: 'bg-yellow-100 text-yellow-700',
      selected: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-indigo-100 text-indigo-700',
      submitted: 'bg-orange-100 text-orange-700',
      reviewing: 'bg-pink-100 text-pink-700',
      revising: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const statCards = [
    { label: '总任务数', value: stats?.totalTasks || 0, icon: Briefcase, color: 'from-blue-500 to-blue-600' },
    { label: '进行中', value: stats?.activeTasks || 0, icon: Clock, color: 'from-amber-500 to-orange-500' },
    { label: '已完成', value: stats?.completedTasks || 0, icon: CheckCircle, color: 'from-emerald-500 to-green-500' },
    { label: user?.role === 'employer' ? '累计支出' : '累计收入', value: `¥${(stats?.totalAmount || 0).toLocaleString()}`, icon: DollarSign, color: 'from-indigo-500 to-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            您好，{user?.name} 👋
          </h2>
          <p className="text-slate-500 mt-1">欢迎回到创意众包平台工作台</p>
        </div>
        {user?.role === 'employer' && (
          <button
            onClick={() => navigate('/tasks/publish')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            发布需求
          </button>
        )}
      </div>

      {(stats?.pendingReviews || stats?.pendingDisputes || stats?.newTalents) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.pendingReviews! > 0 && user?.role === 'employer' && (
            <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-orange-600 font-medium">待评审稿件</p>
                <p className="text-2xl font-bold text-orange-700">{stats.pendingReviews} 个</p>
              </div>
              <ArrowRight className="w-5 h-5 text-orange-400" />
            </div>
          )}
          {stats.pendingDisputes! > 0 && user?.role === 'admin' && (
            <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-600 font-medium">待处理争议</p>
                <p className="text-2xl font-bold text-red-700">{stats.pendingDisputes} 个</p>
              </div>
              <ArrowRight className="w-5 h-5 text-red-400" />
            </div>
          )}
          {stats.newTalents! > 0 && user?.role === 'admin' && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-600 font-medium">待审核服务商</p>
                <p className="text-2xl font-bold text-blue-700">{stats.newTalents} 位</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              {idx === 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {stats?.monthlyGrowth || 0}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">最近任务</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="p-6 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-800 hover:text-blue-600 transition-colors">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {TASK_TYPE_LABELS[task.type]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        ¥{task.budgetMin.toLocaleString()} - {task.budgetMax.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">{task.durationDays} 天</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>暂无任务</p>
                {user?.role === 'employer' && (
                  <button
                    onClick={() => navigate('/tasks/publish')}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    立即发布需求
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">快捷操作</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {user?.role === 'employer' && (
                <>
                  <button
                    onClick={() => navigate('/tasks/publish')}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors"
                  >
                    <Plus className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-blue-700">发布需求</p>
                  </button>
                  <button
                    onClick={() => navigate('/talents')}
                    className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-center transition-colors"
                  >
                    <Users className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">寻找人才</p>
                  </button>
                </>
              )}
              {user?.role === 'provider' && (
                <>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-colors"
                  >
                    <Briefcase className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-blue-700">浏览需求</p>
                  </button>
                  <button
                    onClick={() => navigate('/finance')}
                    className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-center transition-colors"
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">财务管理</p>
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/messages')}
                className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-center transition-colors"
              >
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                <p className="text-sm font-medium text-amber-700">消息中心</p>
              </button>
              <button
                onClick={() => navigate('/finance')}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors"
              >
                <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-purple-700">交易记录</p>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-2">平台公告</h3>
            <p className="text-sm text-blue-100 mb-4">
              平台新增知识产权存证功能，所有提交稿件将自动生成不可篡改的存证记录，保护您的创意成果。
            </p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              了解详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
