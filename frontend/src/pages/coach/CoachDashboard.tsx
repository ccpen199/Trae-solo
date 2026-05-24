import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachApi, alertApi } from '../../services/api';
import { useToastStore } from '../../store';
import { Users, Calendar, Target, Bell, MessageSquare, Plus, User, Activity, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

const CoachDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [interventionForm, setInterventionForm] = useState({
    intervention_type: 'adjust_intensity',
    notes: ''
  });
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, interventionsRes] = await Promise.all([
        coachApi.getAssignedUsers(),
        coachApi.getInterventions({ page_size: 10 })
      ]);
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
      if (interventionsRes.data.success) {
        setInterventions(interventionsRes.data.data.list || []);
      }
    } catch (error) {
      addToast('error', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!selectedUserId) {
      addToast('error', '请选择用户');
      return;
    }
    try {
      await coachApi.createIntervention({
        user_id: selectedUserId,
        intervention_type: interventionForm.intervention_type,
        notes: interventionForm.notes
      });
      addToast('success', '干预记录创建成功');
      setShowInterventionModal(false);
      setInterventionForm({ intervention_type: 'adjust_intensity', notes: '' });
      setSelectedUserId(null);
      loadData();
    } catch (error) {
      addToast('error', '创建失败');
    }
  };

  const handleImplementIntervention = async (id: number) => {
    try {
      await coachApi.implementIntervention(id);
      addToast('success', '已标记为已执行');
      loadData();
    } catch (error) {
      addToast('error', '操作失败');
    }
  };

  const interventionTypeLabels: Record<string, string> = {
    adjust_intensity: '调整强度',
    rest_day: '建议休息',
    course_suggestion: '课程建议',
    goal_adjust: '目标调整',
    health_advice: '健康建议'
  };

  const interventionTypeColors: Record<string, string> = {
    adjust_intensity: 'bg-blue-100 text-blue-700',
    rest_day: 'bg-green-100 text-green-700',
    course_suggestion: 'bg-purple-100 text-purple-700',
    goal_adjust: 'bg-orange-100 text-orange-700',
    health_advice: 'bg-red-100 text-red-700'
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
        <h1 className="text-2xl font-bold text-gray-800">教练工作台</h1>
        <button
          onClick={() => setShowInterventionModal(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建干预
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                我的学员
              </h3>
              <span className="text-sm text-gray-500">共 {users.length} 位学员</span>
            </div>
            <div className="space-y-3">
              {users.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">暂无分配的学员</p>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/coach/user/${user.id}`)}
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Activity className="w-4 h-4" />
                          <span className="font-semibold">{user.weekly_workouts || 0}</span>
                        </div>
                        <p className="text-xs text-gray-500">本周运动</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Target className="w-4 h-4" />
                          <span className="font-semibold">{user.active_plans || 0}</span>
                        </div>
                        <p className="text-xs text-gray-500">活跃计划</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Bell className="w-4 h-4" />
                          <span className="font-semibold text-red-500">{user.pending_alerts || 0}</span>
                        </div>
                        <p className="text-xs text-gray-500">待处理提醒</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                干预记录
              </h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {interventions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">暂无干预记录</p>
              ) : (
                interventions.map((intervention) => (
                  <div key={intervention.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${interventionTypeColors[intervention.intervention_type]}`}>
                        {interventionTypeLabels[intervention.intervention_type]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {dayjs(intervention.created_at).format('MM-DD HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{intervention.notes}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        用户: {intervention.user_name || '未知'}
                      </span>
                      {!intervention.implemented_at && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImplementIntervention(intervention.id);
                          }}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          标记执行
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showInterventionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">创建教练干预</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择用户</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">请选择用户</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
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
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="请输入干预说明..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowInterventionModal(false);
                    setSelectedUserId(null);
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
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;
