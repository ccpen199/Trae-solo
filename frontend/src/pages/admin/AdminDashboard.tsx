import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  Users,
  Activity,
  Watch,
  Dumbbell,
  Target,
  Bell,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import dayjs from 'dayjs';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      addToast('error', '加载看板数据失败');
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
    { label: '总用户数', value: data?.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { label: '7天活跃用户', value: data?.active_users_7d || 0, icon: Activity, color: 'bg-green-500' },
    { label: '设备总数', value: data?.total_devices || 0, icon: Watch, color: 'bg-purple-500' },
    { label: '运动总次数', value: data?.total_workouts || 0, icon: Dumbbell, color: 'bg-orange-500' },
    { label: '活跃计划数', value: data?.active_plans || 0, icon: Target, color: 'bg-teal-500' },
    { label: '待处理提醒', value: data?.pending_alerts || 0, icon: Bell, color: 'bg-yellow-500' },
    { label: '严重提醒数', value: data?.critical_alerts || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: '教练总数', value: data?.total_coaches || 0, icon: UserCheck, color: 'bg-indigo-500' }
  ];

  const ratioCards = [
    {
      label: '计划完成率',
      value: data?.plan_completion_rate ? `${(data.plan_completion_rate * 100).toFixed(1)}%` : '0%',
      trend: '+2.3%',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      label: '设备同步成功率',
      value: data?.sync_success_rate ? `${(data.sync_success_rate * 100).toFixed(1)}%` : '0%',
      trend: '+1.5%',
      icon: RefreshCw,
      color: 'text-blue-500'
    },
    {
      label: '教练转化率',
      value: data?.coach_conversion_rate ? `${(data.coach_conversion_rate * 100).toFixed(1)}%` : '0%',
      trend: '+0.8%',
      icon: TrendingUp,
      color: 'text-purple-500'
    }
  ];

  const retentionData = data?.weekly_retention?.map((item: any) => ({
    week: dayjs(item.week_start).format('MM-DD'),
    留存率: Math.round((item.retention_rate || 0) * 100),
    新用户: item.new_users || 0
  })) || [];

  const anomalyTypeData = data?.anomaly_types?.map((item: any) => ({
    name: item.type || '未知',
    value: item.count || 0
  })) || [];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const syncStatsData = data?.sync_stats?.map((item: any) => ({
    date: dayjs(item.date).format('MM-DD'),
    成功: item.success || 0,
    失败: item.failed || 0
  })) || [];

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">运营看板</h2>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ratioCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                    <span className="text-xs text-green-500">{card.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">周留存趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="留存率" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="新用户" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">异常类型分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={anomalyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${alertTypeLabels[name] || name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {anomalyTypeData.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: string) => [value, alertTypeLabels[name] || name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">设备同步统计</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={syncStatsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="成功" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="失败" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">同步失败设备</h3>
            <span className="text-xs text-gray-500">最近24小时</span>
          </div>
          <div className="space-y-3">
            {data?.failed_devices?.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">暂无同步失败设备</p>
            ) : (
              data?.failed_devices?.map((device: any) => (
                <div key={device.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{device.device_name}</p>
                    <p className="text-xs text-gray-500">
                      失败 {device.failed_count} 次 · {dayjs(device.last_failed_at).fromNow()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">高活跃教练</h3>
            <span className="text-xs text-gray-500">本周</span>
          </div>
          <div className="space-y-3">
            {data?.top_coaches?.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">暂无数据</p>
            ) : (
              data?.top_coaches?.map((coach: any) => (
                <div key={coach.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">{coach.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{coach.name}</p>
                    <p className="text-xs text-gray-500">
                      服务 {coach.served_users} 人 · 完成 {coach.completed_plans} 个计划
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">{coach.activity_score}分</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
