import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { goalApi } from '../../services/api';
import { useToastStore } from '../../store';
import { Target, Plus, Pause, Play, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';

const GoalList: React.FC = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const addToast = useToastStore((s) => s.addToast);

  const goalTypeLabels: Record<string, string> = {
    fat_loss: '减脂',
    muscle_gain: '增肌',
    running: '跑步',
    rehabilitation: '康复',
    general: '综合'
  };

  const goalTypeColors: Record<string, string> = {
    fat_loss: 'bg-orange-100 text-orange-700',
    muscle_gain: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    rehabilitation: 'bg-purple-100 text-purple-700',
    general: 'bg-gray-100 text-gray-700'
  };

  const statusLabels: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    suspended: '已暂停',
    cancelled: '已取消'
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    suspended: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  useEffect(() => {
    loadGoals();
  }, [statusFilter]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await goalApi.getGoals(params);
      if (response.data.success) {
        setGoals(response.data.data.list || response.data.data || []);
      }
    } catch (error) {
      addToast('error', '加载目标列表失败');
    } finally {
      setLoading(false);
    }
  };

  const updateGoalStatus = async (id: number, status: string) => {
    try {
      await goalApi.updateGoal(id, { status });
      addToast('success', '状态更新成功');
      loadGoals();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '状态更新失败');
    }
  };

  const getProgress = (goal: any) => {
    if (!goal.current_value || !goal.target_value) return 0;
    return Math.min(100, (goal.current_value / goal.target_value) * 100);
  };

  const getTargetUnit = (goalType: string) => {
    switch (goalType) {
      case 'fat_loss':
        return 'kg';
      case 'muscle_gain':
        return 'kg';
      case 'running':
        return 'km';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">我的目标</h1>
        </div>
        <Link
          to="/goals/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          创建目标
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            statusFilter === ''
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          全部
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">暂无目标</p>
          <Link
            to="/goals/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            创建第一个目标
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const unit = getTargetUnit(goal.goal_type);
            return (
              <div
                key={goal.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      goalTypeColors[goal.goal_type] || goalTypeColors.general
                    }`}
                  >
                    {goalTypeLabels[goal.goal_type] || goal.goal_type}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[goal.status] || statusColors.active
                    }`}
                  >
                    {statusLabels[goal.status] || goal.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">{goal.name || goal.description || '目标'}</h3>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {dayjs(goal.start_date).format('YYYY-MM-DD')} ~{' '}
                    {dayjs(goal.end_date).format('YYYY-MM-DD')}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">目标进度</span>
                    <span className="font-medium text-gray-800">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">
                      {goal.current_value || 0}
                      {unit} / {goal.target_value}
                      {unit}
                    </span>
                  </div>
                </div>

                {goal.status === 'active' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateGoalStatus(goal.id, 'suspended')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-sm transition"
                    >
                      <Pause className="w-4 h-4" />
                      暂停
                    </button>
                    <button
                      onClick={() => updateGoalStatus(goal.id, 'cancelled')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition"
                    >
                      <XCircle className="w-4 h-4" />
                      取消
                    </button>
                  </div>
                )}

                {goal.status === 'suspended' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateGoalStatus(goal.id, 'active')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm transition"
                    >
                      <Play className="w-4 h-4" />
                      继续
                    </button>
                    <button
                      onClick={() => updateGoalStatus(goal.id, 'cancelled')}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition"
                    >
                      <XCircle className="w-4 h-4" />
                      取消
                    </button>
                  </div>
                )}

                {goal.status === 'active' && progress >= 100 && (
                  <button
                    onClick={() => updateGoalStatus(goal.id, 'completed')}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    标记完成
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalList;
