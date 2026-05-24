import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Watch,
  Target,
  Download,
  Calendar
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import dayjs from 'dayjs';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'anomaly' | 'sync' | 'plan'>('anomaly');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [anomalyData, setAnomalyData] = useState<any>(null);
  const [syncData, setSyncData] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const addToast = useToastStore((s) => s.addToast);

  const tabs = [
    { key: 'anomaly' as const, label: '异常报告', icon: AlertTriangle },
    { key: 'sync' as const, label: '同步报告', icon: RefreshCw },
    { key: 'plan' as const, label: '计划完成报告', icon: Target }
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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

  const severityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  };

  const planTypeLabels: Record<string, string> = {
    fat_loss: '减脂',
    muscle_gain: '增肌',
    running: '跑步',
    rehabilitation: '康复',
    general: '综合'
  };

  const loadAnomalyReport = useCallback(async () => {
    try {
      const params = {
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      };
      const response = await adminApi.getAnomalyReport(params);
      if (response.data.success) {
        setAnomalyData(response.data.data);
      }
    } catch (error) {
      addToast('error', '加载异常报告失败');
    }
  }, [dateRange, addToast]);

  const loadSyncReport = useCallback(async () => {
    try {
      const params = {
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      };
      const response = await adminApi.getSyncReport(params);
      if (response.data.success) {
        setSyncData(response.data.data);
      }
    } catch (error) {
      addToast('error', '加载同步报告失败');
    }
  }, [dateRange, addToast]);

  const loadPlanReport = useCallback(async () => {
    try {
      const params = {
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      };
      const response = await adminApi.getPlanCompletionReport(params);
      if (response.data.success) {
        setPlanData(response.data.data);
      }
    } catch (error) {
      addToast('error', '加载计划完成报告失败');
    }
  }, [dateRange, addToast]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'anomaly') {
        await loadAnomalyReport();
      } else if (activeTab === 'sync') {
        await loadSyncReport();
      } else {
        await loadPlanReport();
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadAnomalyReport, loadSyncReport, loadPlanReport]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: 'anomaly' | 'sync' | 'plan') => {
    setActiveTab(tab);
  };

  const handleExport = () => {
    addToast('info', '导出功能开发中');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const anomalyByTypeData = anomalyData?.by_type?.map((item: any) => ({
    name: alertTypeLabels[item.type] || item.type,
    value: item.count || 0
  })) || [];

  const anomalyBySeverityData = anomalyData?.by_severity?.map((item: any) => ({
    name: severityLabels[item.severity] || item.severity,
    value: item.count || 0
  })) || [];

  const anomalyDailyData = anomalyData?.daily_trend?.map((item: any) => ({
    date: dayjs(item.date).format('MM-DD'),
    数量: item.count || 0
  })) || [];

  const anomalyTopDevicesData = anomalyData?.top_devices?.slice(0, 10).map((item: any) => ({
    name: item.device_name || `设备${item.device_id}`,
    异常数: item.count || 0
  })) || [];

  const syncStatusData = syncData?.by_status?.map((item: any) => ({
    name: item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '重试',
    value: item.count || 0
  })) || [];

  const syncByDeviceData = syncData?.by_device?.slice(0, 15).map((item: any) => ({
    name: item.device_name || `设备${item.device_id}`,
    成功: item.success || 0,
    失败: item.failed || 0
  })) || [];

  const syncByHourData = syncData?.by_hour?.map((item: any) => ({
    hour: `${item.hour}:00`,
    同步数: item.count || 0
  })) || [];

  const planByTypeData = planData?.by_type?.map((item: any) => ({
    name: planTypeLabels[item.plan_type] || item.plan_type,
    总数: item.total || 0,
    已完成: item.completed || 0,
    进行中: item.in_progress || 0,
    已取消: item.cancelled || 0
  })) || [];

  const planByCoachData = planData?.by_coach?.slice(0, 10).map((item: any) => ({
    name: item.coach_name || `教练${item.coach_id}`,
    完成率: Math.round(((item.completed || 0) / (item.total || 1)) * 100),
    完成数: item.completed || 0,
    总数: item.total || 0
  })) || [];

  const planCompletionTrendData = planData?.completion_trend?.map((item: any) => ({
    date: dayjs(item.date).format('MM-DD'),
    完成计划: item.completed || 0,
    新建计划: item.created || 0
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-500" />
            数据报表
          </h2>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {activeTab === 'anomaly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">异常总数</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {anomalyData?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">严重异常</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {anomalyData?.critical_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已处理</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {anomalyData?.acknowledged_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">待处理</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {anomalyData?.pending_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">异常类型分布</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={anomalyByTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {anomalyByTypeData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">异常严重程度分布</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={anomalyBySeverityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {anomalyBySeverityData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#9ca3af', '#eab308', '#f97316', '#ef4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">异常日趋势</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={anomalyDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="数量"
                      stroke="#ef4444"
                      fill="#fee2e2"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">异常最多的设备 TOP10</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={anomalyTopDevicesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="异常数" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">同步总次数</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {syncData?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">同步成功率</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {syncData?.success_rate ? `${(syncData.success_rate * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">同步设备数</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {syncData?.device_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Watch className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">平均同步耗时</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {syncData?.avg_duration ? `${syncData.avg_duration.toFixed(1)}s` : '0s'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">同步状态分布</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={syncStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {syncStatusData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={['#22c55e', '#ef4444', '#f59e0b'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">同步按小时分布</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={syncByHourData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="同步数"
                      stroke="#3b82f6"
                      fill="#dbeafe"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">同步按设备统计 TOP15</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={syncByDeviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="成功" fill="#22c55e" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="失败" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">计划总数</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {planData?.total?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">完成率</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {planData?.completion_rate ? `${(planData.completion_rate * 100).toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">进行中</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {planData?.in_progress?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">已取消</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {planData?.cancelled?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">计划完成趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={planCompletionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="新建计划" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="完成计划" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">按计划类型统计</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planByTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="已完成" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="进行中" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="已取消" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">按教练统计 TOP10</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planByCoachData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={80} />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        name === '完成率' ? `${value}%` : value,
                        name
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="完成率" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
