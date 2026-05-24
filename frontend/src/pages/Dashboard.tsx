import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workoutApi, deviceApi, goalApi, alertApi } from '../services/api';
import { useToastStore } from '../store';
import {
  Activity,
  Watch,
  Target,
  Dumbbell,
  Bell,
  TrendingUp,
  Flame,
  Clock,
  MapPin
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [activeDevices, setActiveDevices] = useState<any[]>([]);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryRes, workoutsRes, devicesRes, goalsRes, alertsRes] = await Promise.all([
        workoutApi.getAnalysisSummary({ period: '7d' }),
        workoutApi.getWorkouts({ page_size: 5 }),
        deviceApi.getDevices({ status: 'active' }),
        goalApi.getGoals({ status: 'active' }),
        alertApi.getAlerts({ status: 'pending', page_size: 5 })
      ]);

      setStats(summaryRes.data.data);
      setRecentWorkouts(workoutsRes.data.data.list);
      setActiveDevices(devicesRes.data.data);
      setActiveGoals(goalsRes.data.data);
      setPendingAlerts(alertsRes.data.data.list);
    } catch (error) {
      addToast('error', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: '本周运动次数',
      value: stats?.totals?.total_workouts || 0,
      icon: Activity,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      label: '消耗卡路里',
      value: Math.round(stats?.totals?.total_calories || 0),
      icon: Flame,
      color: 'bg-orange-500',
      unit: 'kcal'
    },
    {
      label: '运动时长',
      value: Math.round(stats?.totals?.total_minutes || 0),
      icon: Clock,
      color: 'bg-green-500',
      unit: '分钟'
    },
    {
      label: '运动距离',
      value: (stats?.totals?.total_distance || 0).toFixed(1),
      icon: MapPin,
      color: 'bg-purple-500',
      unit: 'km'
    }
  ];

  const workoutChartData = stats?.daily?.slice().reverse().map((d: any) => ({
    date: dayjs(d.date).format('MM-DD'),
    分钟: d.minutes || 0,
    卡路里: d.calories || 0
  })) || [];

  const typeChartData = stats?.by_type?.map((t: any) => ({
    name: t.workout_type,
    次数: t.total_workouts
  })) || [];

  const severityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
  };

  const severityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  };

  const alertTypeLabels: Record<string, string> = {
    heart_rate_anomaly: '心率异常',
    overtraining: '过度训练',
    missed_plan: '未完成计划',
    device_disconnect: '设备断连',
    track_drift: '轨迹漂移',
    data_duplicate: '数据重复',
    privacy_revoked: '隐私撤权',
    high_risk: '高风险'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {card.value}
                    <span className="text-sm font-normal text-gray-500 ml-1">{card.unit}</span>
                  </p>
                  {card.change && (
                    <p className="text-xs text-green-500 mt-1">{card.change} vs 上周</p>
                  )}
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">近7天运动趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workoutChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="分钟" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="卡路里" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">运动类型分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="次数" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">最近运动</h3>
            <Link to="/workouts" className="text-sm text-primary-600 hover:underline">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {recentWorkouts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">暂无运动记录</p>
            ) : (
              recentWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{workout.workout_type}</p>
                    <p className="text-xs text-gray-500">
                      {dayjs(workout.start_time).format('MM-DD HH:mm')} · {Math.round(workout.duration_seconds / 60)}分钟
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">{workout.performance_score}分</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">已绑定设备</h3>
            <Link to="/devices" className="text-sm text-primary-600 hover:underline">
              管理设备
            </Link>
          </div>
          <div className="space-y-3">
            {activeDevices.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                暂无绑定设备
                <Link to="/devices/bind" className="block text-primary-600 mt-2 hover:underline">
                  立即绑定
                </Link>
              </p>
            ) : (
              activeDevices.map((device) => (
                <div key={device.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Watch className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{device.device_name}</p>
                    <p className="text-xs text-gray-500">
                      最后同步: {device.last_sync_at ? dayjs(device.last_sync_at).fromNow() : '未同步'}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">待处理提醒</h3>
            <Link to="/alerts" className="text-sm text-primary-600 hover:underline">
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {pendingAlerts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">暂无待处理提醒</p>
            ) : (
              pendingAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${
                        alert.severity === 'critical' ? 'text-red-500' : 
                        alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                      <span className={`px-2 py-0.5 rounded-full text-xs ${severityColors[alert.severity]}`}>
                        {severityLabels[alert.severity]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{dayjs(alert.created_at).fromNow()}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{alertTypeLabels[alert.alert_type] || alert.alert_type}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">进行中的目标</h3>
          <Link to="/goals" className="text-sm text-primary-600 hover:underline">
            管理目标
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.length === 0 ? (
            <p className="text-gray-500 text-sm col-span-full text-center py-4">
              暂无进行中的目标
              <Link to="/goals/create" className="block text-primary-600 mt-2 hover:underline">
                创建目标
              </Link>
            </p>
          ) : (
            activeGoals.map((goal) => {
              const progress = goal.current_value && goal.target_value 
                ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
                : 0;
              const goalTypeLabels: Record<string, string> = {
                fat_loss: '减脂',
                muscle_gain: '增肌',
                running: '跑步',
                rehabilitation: '康复',
                general: '综合'
              };
              return (
                <div key={goal.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium">
                      {goalTypeLabels[goal.goal_type]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {dayjs(goal.start_date).format('MM-DD')} ~ {dayjs(goal.end_date).format('MM-DD')}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 mt-3">目标进度</p>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{Math.round(progress)}% 完成</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
