import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { goalApi } from '../../services/api';
import { useToastStore } from '../../store';
import {
  Dumbbell,
  Plus,
  Check,
  X,
  RotateCcw,
  XCircle,
  Settings,
  Clock,
  User,
  History,
  Zap,
  Eye
} from 'lucide-react';
import dayjs from 'dayjs';

const PlanList: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [planHistory, setPlanHistory] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [planDetail, setPlanDetail] = useState<any>(null);
  const addToast = useToastStore((s) => s.addToast);

  const planTypeLabels: Record<string, string> = {
    fat_loss: '减脂计划',
    muscle_gain: '增肌计划',
    running: '跑步计划',
    rehabilitation: '康复计划',
    general: '综合计划'
  };

  const planTypeColors: Record<string, string> = {
    fat_loss: 'bg-orange-100 text-orange-700',
    muscle_gain: 'bg-blue-100 text-blue-700',
    running: 'bg-green-100 text-green-700',
    rehabilitation: 'bg-purple-100 text-purple-700',
    general: 'bg-gray-100 text-gray-700'
  };

  const intensityLabels: Record<string, string> = {
    low: '低强度',
    medium: '中等强度',
    high: '高强度'
  };

  const intensityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    active: '进行中',
    suspended: '已暂停',
    completed: '已完成',
    cancelled: '已取消',
    returned: '已退回'
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_approval: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-orange-100 text-orange-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-gray-200 text-gray-600',
    returned: 'bg-pink-100 text-pink-700'
  };

  useEffect(() => {
    loadPlans();
  }, [statusFilter]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await goalApi.getPlans(params);
      if (response.data.success) {
        setPlans(response.data.data.list || response.data.data || []);
      }
    } catch (error) {
      addToast('error', '加载计划列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await goalApi.approvePlan(id);
      addToast('success', '计划已批准');
      loadPlans();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async () => {
    if (!selectedPlan) return;
    try {
      await goalApi.rejectPlan(selectedPlan.id, { rejection_reason: rejectReason });
      addToast('success', '计划已拒绝');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedPlan(null);
      loadPlans();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '操作失败');
    }
  };

  const handleReturn = async () => {
    if (!selectedPlan) return;
    try {
      await goalApi.returnPlan(selectedPlan.id, { return_reason: returnReason });
      addToast('success', '计划已退回');
      setShowReturnModal(false);
      setReturnReason('');
      setSelectedPlan(null);
      loadPlans();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '操作失败');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('确定要取消该计划吗？')) return;
    try {
      await goalApi.cancelPlan(id);
      addToast('success', '计划已取消');
      loadPlans();
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '操作失败');
    }
  };

  const handleAdjust = async (id: number) => {
    addToast('info', '调整功能开发中');
  };

  const handleViewDetail = async (id: number) => {
    try {
      const response = await goalApi.getPlan(id);
      if (response.data.success) {
        setPlanDetail(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      addToast('error', '获取计划详情失败');
    }
  };

  const handleViewHistory = async (id: number) => {
    try {
      const response = await goalApi.getPlanHistory(id);
      if (response.data.success) {
        setPlanHistory(response.data.data.list || response.data.data || []);
        setShowHistory(true);
      }
    } catch (error) {
      addToast('error', '获取历史版本失败');
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
          <Dumbbell className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">训练计划</h1>
        </div>
        <Link
          to="/plans/generate"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          生成计划
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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

      {plans.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">暂无训练计划</p>
          <Link
            to="/plans/generate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            生成第一个计划
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">计划名称</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">类型</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">强度</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">状态</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">版本</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">创建者</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">创建时间</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{plan.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        planTypeColors[plan.plan_type] || planTypeColors.general
                      }`}
                    >
                      {planTypeLabels[plan.plan_type] || plan.plan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        intensityColors[plan.intensity] || intensityColors.medium
                      }`}
                    >
                      {intensityLabels[plan.intensity] || plan.intensity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[plan.status] || statusColors.draft
                      }`}
                    >
                      {statusLabels[plan.status] || plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">v{plan.version || 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{plan.created_by?.name || '系统'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {dayjs(plan.created_at).format('YYYY-MM-DD')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleViewDetail(plan.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleViewHistory(plan.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="历史版本"
                      >
                        <History className="w-4 h-4 text-gray-600" />
                      </button>
                      {plan.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApprove(plan.id)}
                            className="p-2 hover:bg-green-50 rounded-lg transition"
                            title="批准"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowRejectModal(true);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="拒绝"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowReturnModal(true);
                            }}
                            className="p-2 hover:bg-yellow-50 rounded-lg transition"
                            title="退回"
                          >
                            <RotateCcw className="w-4 h-4 text-yellow-600" />
                          </button>
                        </>
                      )}
                      {(plan.status === 'active' || plan.status === 'approved') && (
                        <button
                          onClick={() => handleCancel(plan.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="取消"
                        >
                          <XCircle className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                      {(plan.status === 'active' || plan.status === 'approved') && (
                        <button
                          onClick={() => handleAdjust(plan.id)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition"
                          title="调整"
                        >
                          <Settings className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && planDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">{planDetail.name}</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">计划类型</p>
                  <p className="font-medium text-gray-800">
                    {planTypeLabels[planDetail.plan_type] || planDetail.plan_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">强度</p>
                  <p className="font-medium text-gray-800">
                    {intensityLabels[planDetail.intensity] || planDetail.intensity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">持续周数</p>
                  <p className="font-medium text-gray-800">{planDetail.duration_weeks || '-'} 周</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">每周频率</p>
                  <p className="font-medium text-gray-800">{planDetail.frequency || '-'} 次/周</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">运动项目</p>
                <div className="flex flex-wrap gap-2">
                  {planDetail.exercises?.map((ex: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {ex.name}
                    </span>
                  )) || <span className="text-gray-400">暂无</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">休息日</p>
                <div className="flex flex-wrap gap-2">
                  {planDetail.rest_days?.map((day: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {day}
                    </span>
                  )) || <span className="text-gray-400">暂无</span>}
                </div>
              </div>
              {planDetail.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">描述</p>
                  <p className="text-gray-800">{planDetail.description}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">历史版本</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {planHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无历史版本</p>
              ) : (
                <div className="space-y-4">
                  {planHistory.map((version, idx) => (
                    <div
                      key={idx}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary-500" />
                          <span className="font-medium text-gray-800">
                            v{version.version}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {dayjs(version.created_at).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[version.status] || statusColors.draft
                          }`}
                        >
                          {statusLabels[version.status] || version.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          {version.created_by?.name || '系统'}
                        </span>
                      </div>
                      {version.change_note && (
                        <p className="text-sm text-gray-600">{version.change_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowHistory(false)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">拒绝计划</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拒绝原因
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">退回计划</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退回原因
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="请输入退回原因"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition resize-none"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason('');
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleReturn}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanList;
