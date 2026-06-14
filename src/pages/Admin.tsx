import { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  MessageCircle,
  Video,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  BarChart3,
  Calendar,
  MapPin,
  Search,
  ClipboardList,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { admin } from '@/api/client';
import type { AdminStatistics, QAQuestion, User } from '../../shared/types';

type TabType = 'dashboard' | 'review' | 'desensitize';

const reviewStatusConfig = {
  pending: { label: '待审核', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  approved: { label: '已审核', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: '已拒绝', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  answered: { label: '已回答', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  resolved: { label: '已通过', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  closed: { label: '已关闭', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

const roleConfig = {
  student: { label: '考生', color: '#3B82F6' },
  parent: { label: '家长', color: '#10B981' },
  teacher: { label: '教师', color: '#F59E0B' },
  expert: { label: '专家', color: '#8B5CF6' },
  admin: { label: '管理员', color: '#EF4444' },
};

interface QuestionWithUser extends QAQuestion {
  user: User;
  tags?: string[];
}

interface HeatmapProvinceData {
  province: string;
  totalSearchCount: number;
  totalApplicationCount: number;
  universityBreakdown: Array<{
    universityId: number;
    universityName: string;
    searchCount: number;
    applicationCount: number;
  }>;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapProvinceData[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<QuestionWithUser[]>([]);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [desensitizing, setDesensitizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStatistics();
      loadHeatmap();
    } else if (activeTab === 'review') {
      loadPendingQuestions();
    }
  }, [activeTab]);

  const loadStatistics = async () => {
    setStatisticsLoading(true);
    setError(null);
    try {
      const response = await admin.getStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (err) {
      setError('加载统计数据失败');
      console.error('加载统计数据失败:', err);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const loadHeatmap = async () => {
    setHeatmapLoading(true);
    setError(null);
    try {
      const response = await admin.getHeatmap();
      if (response.success && response.data) {
        setHeatmapData(response.data as HeatmapProvinceData[]);
      }
    } catch (err) {
      setError('加载热力图数据失败');
      console.error('加载热力图数据失败:', err);
    } finally {
      setHeatmapLoading(false);
    }
  };

  const loadPendingQuestions = async () => {
    setQuestionsLoading(true);
    setError(null);
    try {
      const response = await admin.getPendingQuestions();
      if (response.success && response.data) {
        setPendingQuestions(response.data as QuestionWithUser[]);
      }
    } catch (err) {
      setError('加载待审核问题失败');
      console.error('加载待审核问题失败:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleApprove = async (questionId: number) => {
    setApprovingId(questionId);
    setError(null);
    try {
      const response = await admin.approveQuestion(questionId);
      if (response.success) {
        setPendingQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setSuccessMessage('问题已通过审核');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('审核操作失败');
      console.error('审核操作失败:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (questionId: number) => {
    setRejectingId(questionId);
    setError(null);
    try {
      const response = await admin.rejectQuestion(questionId);
      if (response.success) {
        setPendingQuestions((prev) => prev.filter((q) => q.id !== questionId));
        setSuccessMessage('问题已拒绝');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('审核操作失败');
      console.error('审核操作失败:', err);
    } finally {
      setRejectingId(null);
    }
  };

  const handleDesensitize = async () => {
    setDesensitizing(true);
    setError(null);
    try {
      const response = await admin.desensitize();
      if (response.success && response.data) {
        setSuccessMessage(`数据脱敏完成，共处理 ${response.data.maskedCount} 条数据`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('数据脱敏失败');
      console.error('数据脱敏失败:', err);
    } finally {
      setDesensitizing(false);
    }
  };

  const statsCards = statistics
    ? [
        {
          icon: Users,
          label: '总用户数',
          value: statistics.totalUsers?.toLocaleString() || '0',
          change: statistics.recentActivity?.last7DaysNewUsers
            ? `+${statistics.recentActivity.last7DaysNewUsers} 本周新增`
            : null,
          color: 'from-blue-500 to-blue-600',
        },
        {
          icon: FileText,
          label: '志愿方案',
          value: statistics.totalPlans?.toLocaleString() || '0',
          change: statistics.recentActivity?.last7DaysNewPlans
            ? `+${statistics.recentActivity.last7DaysNewPlans} 本周新增`
            : null,
          color: 'from-green-500 to-green-600',
        },
        {
          icon: MessageCircle,
          label: '问答总数',
          value: statistics.totalQuestions?.toLocaleString() || '0',
          change: statistics.recentActivity?.last7DaysNewQuestions
            ? `+${statistics.recentActivity.last7DaysNewQuestions} 本周新增`
            : null,
          color: 'from-purple-500 to-purple-600',
        },
        {
          icon: Video,
          label: '直播课程',
          value: statistics.totalLiveSessions?.toLocaleString() || '0',
          change: null,
          color: 'from-orange-500 to-orange-600',
        },
      ]
    : [];

  const userRoleChartData = statistics?.userRoleBreakdown
    ? Object.entries(statistics.userRoleBreakdown).map(([role, count]) => ({
        role: roleConfig[role as keyof typeof roleConfig]?.label || role,
        count: count as number,
        color: roleConfig[role as keyof typeof roleConfig]?.color || '#6B7280',
      }))
    : [];

  const heatmapChartData = heatmapData
    .slice(0, 15)
    .map((item) => ({
      province: item.province,
      搜索次数: item.totalSearchCount,
      申请次数: item.totalApplicationCount,
    }))
    .sort((a, b) => b.搜索次数 - a.搜索次数);

  const tabs = [
    { id: 'dashboard' as TabType, label: '仪表盘', icon: BarChart3 },
    { id: 'review' as TabType, label: '问题审核', icon: AlertCircle },
    { id: 'desensitize' as TabType, label: '数据脱敏', icon: EyeOff },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">管理后台</h1>
          <p className="text-gray-600">平台数据管理和审核</p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div className="text-green-700">{successMessage}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-8 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'review' && pendingQuestions.length > 0 && (
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  {pendingQuestions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statisticsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-pulse"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))
              ) : (
                statsCards.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                    {stat.change && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {stat.change}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {statistics?.userRoleBreakdown && userRoleChartData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">用户角色分布</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRoleChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="role" type="category" width={60} />
                      <Tooltip />
                      <Bar dataKey="count" name="用户数" radius={[0, 8, 8, 0]}>
                        {userRoleChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {heatmapData.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">省份热度热力图</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      按搜索次数排序，展示前 15 个省份的热度数据
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500" />
                      搜索次数
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-500" />
                      申请次数
                    </span>
                  </div>
                </div>
                {heatmapLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={heatmapChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="province"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{
                            paddingTop: '20px',
                          }}
                        />
                        <Bar
                          dataKey="搜索次数"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                          name="搜索次数"
                        />
                        <Bar
                          dataKey="申请次数"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                          name="申请次数"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {heatmapData.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                      热度排行详情
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-l-lg">
                              排名
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              省份
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                搜索次数
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <ClipboardList className="w-3 h-3" />
                                申请次数
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-r-lg">
                              热门院校
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {heatmapData
                            .sort((a, b) => b.totalSearchCount - a.totalSearchCount)
                            .slice(0, 10)
                            .map((item, index) => (
                              <tr key={item.province} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                      index < 3
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium text-gray-900">{item.province}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="text-blue-600 font-semibold">
                                    {item.totalSearchCount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="text-emerald-600 font-semibold">
                                    {item.totalApplicationCount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex flex-wrap gap-1">
                                    {item.universityBreakdown
                                      .sort((a, b) => b.searchCount - a.searchCount)
                                      .slice(0, 2)
                                      .map((uni) => (
                                        <span
                                          key={uni.universityId}
                                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                                        >
                                          {uni.universityName}
                                        </span>
                                      ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {statistics?.recentActivity && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">近期活动</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">新增用户</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {statistics.recentActivity.last7DaysNewUsers || 0}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">近 7 天</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">新增方案</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {statistics.recentActivity.last7DaysNewPlans || 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">近 7 天</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">新增问题</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {statistics.recentActivity.last7DaysNewQuestions || 0}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">近 7 天</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">待审核问题</h3>
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    {pendingQuestions.length} 条待审核
                  </span>
                </div>
              </div>

              {questionsLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600">正在加载待审核问题...</p>
                </div>
              ) : pendingQuestions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pendingQuestions.map((question) => (
                    <div key={question.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {question.title}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              reviewStatusConfig[question.status as keyof typeof reviewStatusConfig]?.bgColor || 'bg-gray-100'
                            } ${
                              reviewStatusConfig[question.status as keyof typeof reviewStatusConfig]?.textColor || 'text-gray-700'
                            }`}
                          >
                            {
                              reviewStatusConfig[question.status as keyof typeof reviewStatusConfig]?.label || '未知'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(question.id)}
                            disabled={approvingId === question.id || rejectingId === question.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {approvingId === question.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            通过
                          </button>
                          <button
                            onClick={() => handleReject(question.id)}
                            disabled={approvingId === question.id || rejectingId === question.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {rejectingId === question.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            拒绝
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-3">{question.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {(question.user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {question.user?.name || '匿名用户'}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(question.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {question.category && (
                          <div className="flex gap-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {question.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <CheckCircle className="w-20 h-20 mx-auto text-green-300 mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无待审核问题</h3>
                  <p className="text-gray-600">所有问题都已审核完成</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'desensitize' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">数据脱敏管理</h3>
              <p className="text-gray-600">
                对平台中的敏感数据进行脱敏处理，保护用户隐私。脱敏后的数据将无法恢复原始内容。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">用户数据</h4>
                </div>
                <p className="text-sm text-gray-600">
                  脱敏用户姓名、手机号等个人信息，将手机号中间四位替换为 ****
                </p>
              </div>

              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">问答内容</h4>
                </div>
                <p className="text-sm text-gray-600">
                  脱敏问题和回答中的个人信息，包括手机号、身份证号、联系方式等
                </p>
              </div>

              <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900">其他数据</h4>
                </div>
                <p className="text-sm text-gray-600">
                  扫描并脱敏其他可能包含敏感信息的数据字段
                </p>
              </div>
            </div>

            <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200 mb-8">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-4 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">重要提示</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 数据脱敏操作不可逆，请谨慎操作</li>
                    <li>• 建议在脱敏前备份重要数据</li>
                    <li>• 脱敏过程可能需要较长时间，请耐心等待</li>
                    <li>• 仅授权管理员可执行此操作</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleDesensitize}
                disabled={desensitizing}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {desensitizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    脱敏处理中...
                  </>
                ) : (
                  <>
                    <EyeOff className="w-5 h-5" />
                    一键脱敏所有数据
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
