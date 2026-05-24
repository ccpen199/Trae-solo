import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachApi, alertApi, goalApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  Bell,
  Activity,
  Heart,
  Footprints,
  Edit,
  MessageSquare,
  Plus,
  ChevronLeft,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import dayjs from 'dayjs';

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showAdjustPlanModal, setShowAdjustPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [interventionForm, setInterventionForm] = useState({
    intervention_type: 'adjust_intensity',
    notes: ''
  });
  const [adjustPlanForm, setAdjustPlanForm] = useState({
    adjustment_type: 'intensity',
    value: '',
    reason: ''
  });
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [trendRes, plansRes, alertsRes] = await Promise.all([
        coachApi.getUserTrend(Number(userId), { period: '30d' }),
        goalApi.getPlans({ user_id: userId, status: 'active' }),
        alertApi.getAlerts({ user_id: userId, status: 'pending', page_size: 5 })
      ]);

      if (trendRes.data.success) {
        const data = trendRes.data.data;
        setUserInfo(data.user);
        const dailyData = data.daily || [];
        setTrendData(dailyData.map((d: any) => ({
          date: dayjs(d.date).format('MM-DD'),
          运动时长: d.minutes || 0,
          平均心率: d.avg_heart_rate || 0,
          步数: d.steps || 0
        })));
      }
      if (plansRes.data.success) {
        setActivePlans(plansRes.data.data.list || plansRes.data.data || []);
      }
      if (alertsRes.data.success) {
        setPendingAlerts(alertsRes.data.data.list || []);
      }
    } catch (error) {
      addToast('error', '加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!userId) return;
    try {
      await coachApi.createIntervention({
        user_id: Number(userId),
        intervention_type: interventionForm.intervention_type,
        notes: interventionForm.notes
      });
      addToast('success', '干预记录创建成功');
      setShowInterventionModal(false);
      setInterventionForm({ intervention_type: 'adjust_intensity', notes: '' });
    } catch (error) {
      addToast('error', '创建失败');
    }
  };

  const handleAdjustPlan = async () => {
    if (!selectedPlanId) {
      addToast('error', '请选择训练计划');
      return;
    }
    try {
      await coachApi.adjustPlan(selectedPlanId, {
        adjustment_type: adjustPlanForm.adjustment_type,
        value: adjustPlanForm.value,
        reason: adjustPlanForm.reason
      });
      addToast('success', '训练计划已调整');
      setShowAdjustPlanModal(false);
      setAdjustPlanForm({ adjustment_type: 'intensity', value: '', reason: '' });
      setSelectedPlanId(null);
      loadData();
    } catch (error) {
      addToast('error', '调整失败');
    }
  };

  const interventionTypeLabels: Record<string, string> = {
    adjust_intensity: '调整强度',
    rest_day: '建议休息',
    course_suggestion: '课程建议',
    goal_adjust: '目标调整',
    health_advice: '健康建议'
  };

  const severityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/coach')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">用户详情</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{userInfo?.name}</h2>
              <p className="text-gray-500">@{userInfo?.username}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {userInfo?.email || '未设置'}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {userInfo?.phone || '未设置'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdjustPlanModal(true)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              调整训练计划
            </button>
            <button
              onClick={() => setShowInterventionModal(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              创建教练干预
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            30天运动趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="运动时长" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="运动时长(分钟)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            30天心率趋势
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="平均心率" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="平均心率(bpm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Footprints className="w-5 h-5 text-blue-500" />
          30天步数趋势
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="步数" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="步数" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              活跃计划
            </h3>
            <span className="text-sm text-gray-500">共 {activePlans.length} 个</span>
          </div>
          <div className="space-y-3">
            {activePlans.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">暂无活跃计划</p>
            ) : (
              activePlans.map((plan) => (
                <div key={plan.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium">
                      {plan.plan_type || '训练计划'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dayjs(plan.start_date).format('MM-DD')} ~ {dayjs(plan.end_date).format('MM-DD')}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800">{plan.name || '训练计划'}</p>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                  )}
                  {plan.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>完成进度</span>
                        <span>{Math.round(plan.progress)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, plan.progress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" />
              待处理提醒
            </h3>
            <span className="text-sm text-gray-500">共 {pendingAlerts.length} 条</span>
          </div>
          <div className="space-y-3">
            {pendingAlerts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">暂无待处理提醒</p>
            ) : (
              pendingAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[alert.severity]}`}>
                        {alert.severity === 'critical' ? '严重' : alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                      </span>
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                        {alertTypeLabels[alert.alert_type] || alert.alert_type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dayjs(alert.created_at).format('MM-DD HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                  {alert.message && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showInterventionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              创建教练干预
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">干预类型</label>
                <select
                  value={interventionForm.intervention_type}
                  onChange={(e) => setInterventionForm({ ...interventionForm, intervention_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="adjust_intensity">调整强度</option>
                  <option value="rest_day">建议休息</option>
                  <option value="course_suggestion">课程建议</option>
                  <option value="goal_adjust">目标调整</option>
                  <option value="health_advice">健康建议</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">干预说明</label>
                <textarea
                  value={interventionForm.notes}
                  onChange={(e) => setInterventionForm({ ...interventionForm, notes: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入详细的干预说明..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowInterventionModal(false);
                    setInterventionForm({ intervention_type: 'adjust_intensity', notes: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateIntervention}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  创建干预
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary-500" />
              调整训练计划
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择计划</label>
                <select
                  value={selectedPlanId || ''}
                  onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择训练计划</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name || '训练计划'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调整类型</label>
                <select
                  value={adjustPlanForm.adjustment_type}
                  onChange={(e) => setAdjustPlanForm({ ...adjustPlanForm, adjustment_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="intensity">调整强度</option>
                  <option value="duration">调整时长</option>
                  <option value="frequency">调整频率</option>
                  <option value="rest">增加休息</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调整值</label>
                <input
                  type="text"
                  value={adjustPlanForm.value}
                  onChange={(e) => setAdjustPlanForm({ ...adjustPlanForm, value: e.target.value })}
                  placeholder="例如：降低20%强度"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调整原因</label>
                <textarea
                  value={adjustPlanForm.reason}
                  onChange={(e) => setAdjustPlanForm({ ...adjustPlanForm, reason: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请说明调整原因..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAdjustPlanModal(false);
                    setSelectedPlanId(null);
                    setAdjustPlanForm({ adjustment_type: 'intensity', value: '', reason: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAdjustPlan}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  确认调整
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
