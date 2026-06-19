import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Calendar,
  Tag,
  Package,
  Users,
  DollarSign,
  Clock,
  Play,
  Pause,
  Trash2,
  AlertTriangle,
  User,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  Clock3,
  ChevronRight,
} from 'lucide-react';
import { useCouponStore } from '../stores/couponStore';
import { useAuthStore } from '../stores/authStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import { FormSelect, FormTextarea } from '../components/common/FormInput';
import dayjs from 'dayjs';
import type { PauseReason, StatusChangeRecord, CouponStatus } from '@shared/types';

const pauseReasonOptions = [
  { value: 'system_maintenance', label: '系统维护' },
  { value: 'risk_control', label: '风险防控' },
  { value: 'inventory_adjustment', label: '库存调整' },
  { value: 'policy_adjustment', label: '政策调整' },
  { value: 'other', label: '其他原因' },
];

const getPauseReasonLabel = (reason: PauseReason | string | undefined): string => {
  const option = pauseReasonOptions.find((opt) => opt.value === reason);
  return option?.label || reason || '-';
};

const getStatusLabel = (status: CouponStatus | string): string => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    active: '已发布',
    paused: '已暂停',
    expired: '已过期',
  };
  return statusMap[status] || status;
};

export default function CouponDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCoupon, fetchCouponById, isLoading, updateCoupon, deleteCoupon } =
    useCouponStore();
  const { user } = useAuthStore();
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pauseModal, setPauseModal] = useState(false);
  const [resumeModal, setResumeModal] = useState(false);
  const [approvalModal, setApprovalModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<StatusChangeRecord | null>(null);

  const [pauseForm, setPauseForm] = useState({
    reason: '' as PauseReason | '',
    remark: '',
    expectedResumeTime: '',
    notifyMerchants: true,
  });
  const [pauseErrors, setPauseErrors] = useState<Record<string, string>>({});

  const [resumeForm, setResumeForm] = useState({
    remark: '',
  });
  const [resumeErrors, setResumeErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchCouponById(id);
    }
  }, [id, fetchCouponById]);

  const validatePauseForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!pauseForm.reason) {
      errors.reason = '请选择暂停原因';
    }
    setPauseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateResumeForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!resumeForm.remark.trim()) {
      errors.remark = '请填写恢复说明';
    }
    setResumeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePause = async () => {
    if (!validatePauseForm() || !id) return;
    setActionLoading(true);
    try {
      const now = new Date();
      const historyRecord: StatusChangeRecord = {
        id: `history-${Date.now()}`,
        fromStatus: selectedCoupon?.status || 'active',
        toStatus: 'paused',
        reason: getPauseReasonLabel(pauseForm.reason),
        remark: pauseForm.remark,
        operatorId: user?.id || 'system',
        operatorName: user?.name || '系统管理员',
        createdAt: now,
      };

      const existingHistory = selectedCoupon?.statusHistory || [];

      await updateCoupon(id, {
        status: 'paused',
        pauseReason: pauseForm.reason as PauseReason,
        pausedAt: now,
        pausedBy: user?.id,
        pausedByName: user?.name,
        pauseRemark: pauseForm.remark,
        expectedResumeTime: pauseForm.expectedResumeTime
          ? new Date(pauseForm.expectedResumeTime)
          : undefined,
        notifyMerchants: pauseForm.notifyMerchants,
        statusHistory: [historyRecord, ...existingHistory],
      });
      await fetchCouponById(id);
      setPauseModal(false);
      resetPauseForm();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!validateResumeForm() || !id || !selectedCoupon) return;

    const isRiskPause = selectedCoupon.pauseReason === 'risk_control';
    const isRiskOfficer = user?.role === 'risk_officer' || user?.role === 'admin';

    if (isRiskPause && !isRiskOfficer) {
      setActionLoading(true);
      try {
        const now = new Date();
        const historyRecord: StatusChangeRecord = {
          id: `history-${Date.now()}`,
          fromStatus: 'paused',
          toStatus: 'active',
          reason: '申请恢复',
          remark: resumeForm.remark,
          operatorId: user?.id || 'system',
          operatorName: user?.name || '系统管理员',
          createdAt: now,
          approvalStatus: 'pending',
        };

        const existingHistory = selectedCoupon.statusHistory || [];

        await updateCoupon(id, {
          resumePendingApproval: true,
          statusHistory: [historyRecord, ...existingHistory],
        });
        await fetchCouponById(id);
        setResumeModal(false);
        resetResumeForm();
        alert('恢复申请已提交，等待风控人员审批');
      } finally {
        setActionLoading(false);
      }
    } else {
      setActionLoading(true);
      try {
        const now = new Date();
        const historyRecord: StatusChangeRecord = {
          id: `history-${Date.now()}`,
          fromStatus: 'paused',
          toStatus: 'active',
          reason: '恢复使用',
          remark: resumeForm.remark,
          operatorId: user?.id || 'system',
          operatorName: user?.name || '系统管理员',
          createdAt: now,
          approvalStatus: isRiskPause ? 'approved' : undefined,
          approverId: isRiskPause ? user?.id : undefined,
          approverName: isRiskPause ? user?.name : undefined,
          approvedAt: isRiskPause ? now : undefined,
        };

        const existingHistory = selectedCoupon.statusHistory || [];

        await updateCoupon(id, {
          status: 'active',
          pauseReason: undefined,
          pausedAt: undefined,
          pausedBy: undefined,
          pausedByName: undefined,
          pauseRemark: undefined,
          expectedResumeTime: undefined,
          notifyMerchants: undefined,
          resumePendingApproval: false,
          statusHistory: [historyRecord, ...existingHistory],
        });
        await fetchCouponById(id);
        setResumeModal(false);
        resetResumeForm();
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const now = new Date();
      const historyRecord: StatusChangeRecord = {
        id: `history-${Date.now()}`,
        fromStatus: selectedCoupon?.status || 'draft',
        toStatus: 'active',
        reason: '发布优惠券',
        operatorId: user?.id || 'system',
        operatorName: user?.name || '系统管理员',
        createdAt: now,
      };

      const existingHistory = selectedCoupon?.statusHistory || [];

      await updateCoupon(id, {
        status: 'active',
        statusHistory: [historyRecord, ...existingHistory],
      });
      await fetchCouponById(id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCoupon(id);
      navigate('/coupons');
    } finally {
      setDeleteModal(false);
    }
  };

  const resetPauseForm = () => {
    setPauseForm({
      reason: '',
      remark: '',
      expectedResumeTime: '',
      notifyMerchants: true,
    });
    setPauseErrors({});
  };

  const resetResumeForm = () => {
    setResumeForm({
      remark: '',
    });
    setResumeErrors({});
  };

  const openPauseModal = () => {
    resetPauseForm();
    setPauseModal(true);
  };

  const openResumeModal = () => {
    resetResumeForm();
    setResumeModal(true);
  };

  const viewApprovalFlow = (record: StatusChangeRecord) => {
    setSelectedRecord(record);
    setApprovalModal(true);
  };

  if (isLoading && !selectedCoupon) {
    return <PageLoading />;
  }

  if (!selectedCoupon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 mb-4">优惠券不存在</p>
        <Link to="/coupons" className="btn-primary">
          返回列表
        </Link>
      </div>
    );
  }

  const usageRate = (
    (selectedCoupon.usedQuantity / selectedCoupon.totalQuantity) *
    100
  ).toFixed(1);

  const isRiskPause = selectedCoupon.pauseReason === 'risk_control';
  const isRiskOfficer = user?.role === 'risk_officer' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{selectedCoupon.name}</h1>
            <p className="text-gray-500 mt-1">优惠券详情</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedCoupon.status === 'active' ? (
            <button
              className="btn-outline flex items-center gap-2"
              onClick={openPauseModal}
              disabled={actionLoading}
            >
              <Pause className="w-4 h-4" />
              暂停
            </button>
          ) : selectedCoupon.status === 'paused' ? (
            <button
              className={`flex items-center gap-2 ${
                selectedCoupon.resumePendingApproval
                  ? 'btn-disabled opacity-60 cursor-not-allowed'
                  : 'btn-success'
              }`}
              onClick={openResumeModal}
              disabled={actionLoading || selectedCoupon.resumePendingApproval}
            >
              <Play className="w-4 h-4" />
              {selectedCoupon.resumePendingApproval ? '等待审批' : '恢复'}
            </button>
          ) : selectedCoupon.status === 'draft' ? (
            <button
              className="btn-success flex items-center gap-2"
              onClick={handlePublish}
              disabled={actionLoading}
            >
              <Play className="w-4 h-4" />
              发布
            </button>
          ) : null}
          <Link
            to={`/coupons/edit/${id}`}
            className="btn-primary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            编辑
          </Link>
          <button
            className="btn-danger flex items-center gap-2"
            onClick={() => setDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>

      {selectedCoupon.status === 'paused' && (
        <div className="card border-warning-300 bg-warning-50/50">
          <div className="card-header flex items-center gap-2 text-warning-700">
            <AlertTriangle className="w-5 h-5" />
            暂停信息
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">暂停原因</p>
                  <p className="font-medium text-gray-800">
                    {getPauseReasonLabel(selectedCoupon.pauseReason)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock3 className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">暂停时间</p>
                  <p className="font-medium text-gray-800">
                    {selectedCoupon.pausedAt
                      ? dayjs(selectedCoupon.pausedAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">操作人</p>
                  <p className="font-medium text-gray-800">
                    {selectedCoupon.pausedByName || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">预计恢复时间</p>
                  <p className="font-medium text-gray-800">
                    {selectedCoupon.expectedResumeTime
                      ? dayjs(selectedCoupon.expectedResumeTime).format('YYYY-MM-DD')
                      : '待定'}
                  </p>
                </div>
              </div>
            </div>
            {selectedCoupon.pauseRemark && (
              <div className="mt-4 pt-4 border-t border-warning-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">暂停说明</p>
                    <p className="font-medium text-gray-800">
                      {selectedCoupon.pauseRemark}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {isRiskPause && !isRiskOfficer && (
              <div className="mt-4 p-3 bg-danger-50 rounded-lg border border-danger-200">
                <p className="text-sm text-danger-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  此券因风险原因暂停，需风控人员审批后方可恢复
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">基本信息</div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">优惠券类型</p>
                    <p className="font-medium text-gray-800">
                      {selectedCoupon.type === 'fixed'
                        ? '满减券'
                        : selectedCoupon.type === 'discount'
                        ? '折扣券'
                        : '门槛券'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">优惠值</p>
                    <p className="font-medium text-gray-800">
                      {selectedCoupon.type === 'discount'
                        ? `${selectedCoupon.value * 10}折`
                        : `¥${selectedCoupon.value}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">使用门槛</p>
                    <p className="font-medium text-gray-800">
                      {selectedCoupon.threshold > 0
                        ? `¥${selectedCoupon.threshold}`
                        : '无门槛'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <StatusBadge
                      status={selectedCoupon.status}
                      type="coupon"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">当前状态</p>
                    <p className="font-medium text-gray-800">
                      <StatusBadge
                        status={selectedCoupon.status}
                        type="coupon"
                      />
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">有效期</p>
                    <p className="font-medium text-gray-800">
                      {dayjs(selectedCoupon.startTime).format('YYYY年MM月DD日')}
                      {' 至 '}
                      {dayjs(selectedCoupon.endTime).format('YYYY年MM月DD日')}
                    </p>
                  </div>
                </div>

                {selectedCoupon.description && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">活动说明</p>
                      <p className="font-medium text-gray-800">
                        {selectedCoupon.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-gray-600" />
                状态变更历史
              </div>
              <span className="text-sm text-gray-500">
                共 {selectedCoupon.statusHistory?.length || 0} 条记录
              </span>
            </div>
            <div className="card-body">
              {selectedCoupon.statusHistory && selectedCoupon.statusHistory.length > 0 ? (
                <div className="relative">
                  {selectedCoupon.statusHistory.map((record, index) => (
                    <div key={record.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            index === 0
                              ? 'bg-primary-500 border-primary-500'
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        {index < (selectedCoupon.statusHistory?.length || 0) - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {getStatusLabel(record.fromStatus)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-800">
                              {getStatusLabel(record.toStatus)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-500">原因：</span>
                            {record.reason}
                          </p>
                          {record.remark && (
                            <p className="text-sm text-gray-600">
                              <span className="text-gray-500">备注：</span>
                              {record.remark}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-500">操作人：</span>
                            {record.operatorName}
                          </p>
                        </div>
                        {record.approvalStatus && (
                          <div className="mt-2">
                            <button
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              onClick={() => viewApprovalFlow(record)}
                            >
                              查看审批流
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>暂无状态变更记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">使用情况</div>
            <div className="card-body">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gray-800 mb-2">{usageRate}%</p>
                <p className="text-sm text-gray-500">核销率</p>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">已使用</span>
                    <span className="font-medium text-gray-800">
                      {selectedCoupon.usedQuantity.toLocaleString()} 张
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">剩余库存</span>
                    <span className="font-medium text-gray-800">
                      {(
                        selectedCoupon.totalQuantity - selectedCoupon.usedQuantity
                      ).toLocaleString()}{' '}
                      张
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">总发行量</span>
                    <span className="font-medium text-gray-800">
                      {selectedCoupon.totalQuantity.toLocaleString()} 张
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${usageRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">时间信息</div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">创建时间</span>
                <span className="text-gray-800">
                  {dayjs(selectedCoupon.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">更新时间</span>
                <span className="text-gray-800">
                  {dayjs(selectedCoupon.updatedAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        visible={pauseModal}
        onClose={() => setPauseModal(false)}
        title="暂停优惠券"
        size="md"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => setPauseModal(false)}
              disabled={actionLoading}
            >
              取消
            </button>
            <button
              className="btn-warning"
              onClick={handlePause}
              disabled={actionLoading}
            >
              {actionLoading ? '处理中...' : '确认暂停'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            确定要暂停优惠券{' '}
            <span className="font-medium text-gray-800">{selectedCoupon.name}</span>{' '}
            吗？暂停后用户将无法领取和使用该优惠券。
          </p>

          <FormSelect
            label="暂停原因"
            required
            options={[{ value: '', label: '请选择暂停原因' }, ...pauseReasonOptions]}
            value={pauseForm.reason}
            onChange={(e) =>
              setPauseForm({ ...pauseForm, reason: e.target.value as PauseReason | '' })
            }
            error={pauseErrors.reason}
          />

          <FormTextarea
            label="详细说明"
            placeholder="请输入暂停的详细说明（选填）"
            rows={3}
            value={pauseForm.remark}
            onChange={(e) => setPauseForm({ ...pauseForm, remark: e.target.value })}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              预计恢复时间
            </label>
            <input
              type="date"
              className="input"
              value={pauseForm.expectedResumeTime}
              onChange={(e) =>
                setPauseForm({ ...pauseForm, expectedResumeTime: e.target.value })
              }
              min={dayjs().format('YYYY-MM-DD')}
            />
            <p className="text-xs text-gray-500">选填，预计恢复优惠券的时间</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">通知关联商户</p>
                <p className="text-xs text-gray-500">同步通知所有关联商户</p>
              </div>
            </div>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                pauseForm.notifyMerchants ? 'bg-primary-600' : 'bg-gray-200'
              }`}
              onClick={() =>
                setPauseForm({ ...pauseForm, notifyMerchants: !pauseForm.notifyMerchants })
              }
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  pauseForm.notifyMerchants ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        visible={resumeModal}
        onClose={() => setResumeModal(false)}
        title="恢复优惠券"
        size="md"
        footer={
          <>
            <button
              className="btn-outline"
              onClick={() => setResumeModal(false)}
              disabled={actionLoading}
            >
              取消
            </button>
            <button
              className="btn-success"
              onClick={handleResume}
              disabled={actionLoading}
            >
              {actionLoading
                ? '处理中...'
                : isRiskPause && !isRiskOfficer
                ? '提交申请'
                : '确认恢复'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            确定要恢复优惠券{' '}
            <span className="font-medium text-gray-800">{selectedCoupon.name}</span>{' '}
            吗？恢复后用户可以正常领取和使用该优惠券。
          </p>

          {isRiskPause && !isRiskOfficer && (
            <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
              <p className="text-sm text-warning-700 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  此券因风险原因暂停，您的恢复申请需要风控人员审批后才能生效。
                  审批通过后优惠券将自动恢复。
                </span>
              </p>
            </div>
          )}

          {isRiskPause && isRiskOfficer && (
            <div className="p-3 bg-success-50 rounded-lg border border-success-200">
              <p className="text-sm text-success-700 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  您是风控人员，可直接审批并恢复此优惠券。
                </span>
              </p>
            </div>
          )}

          <FormTextarea
            label="恢复说明"
            required
            placeholder="请输入恢复说明"
            rows={4}
            value={resumeForm.remark}
            onChange={(e) => setResumeForm({ ...resumeForm, remark: e.target.value })}
            error={resumeErrors.remark}
          />

          {selectedCoupon.pauseReason && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">原暂停原因</p>
              <p className="text-sm font-medium text-gray-800 mt-1">
                {getPauseReasonLabel(selectedCoupon.pauseReason)}
              </p>
              {selectedCoupon.pauseRemark && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCoupon.pauseRemark}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        visible={approvalModal}
        onClose={() => setApprovalModal(false)}
        title="审批流详情"
        size="md"
        footer={
          <button
            className="btn-primary"
            onClick={() => setApprovalModal(false)}
          >
            关闭
          </button>
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="relative">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary-500" />
                  <div className="w-0.5 flex-1 bg-gray-200 my-1" style={{ height: '24px' }} />
                  <div
                    className={`w-4 h-4 rounded-full ${
                      selectedRecord.approvalStatus === 'approved'
                        ? 'bg-success-500'
                        : selectedRecord.approvalStatus === 'rejected'
                        ? 'bg-danger-500'
                        : 'bg-warning-500'
                    }`}
                  />
                </div>
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">提交申请</p>
                      <span className="text-sm text-gray-500">
                        {dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      操作人：{selectedRecord.operatorName}
                    </p>
                    <p className="text-sm text-gray-600">
                      原因：{selectedRecord.reason}
                    </p>
                    {selectedRecord.remark && (
                      <p className="text-sm text-gray-600">
                        备注：{selectedRecord.remark}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">
                        {selectedRecord.approvalStatus === 'approved'
                          ? '审批通过'
                          : selectedRecord.approvalStatus === 'rejected'
                          ? '审批拒绝'
                          : '待审批'}
                      </p>
                      <span className="text-sm text-gray-500">
                        {selectedRecord.approvedAt
                          ? dayjs(selectedRecord.approvedAt).format('YYYY-MM-DD HH:mm')
                          : '-'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      审批人：{selectedRecord.approverName || '待分配'}
                    </p>
                    {selectedRecord.approvalStatus === 'pending' && (
                      <div className="mt-2 p-2 bg-warning-50 rounded">
                        <p className="text-sm text-warning-700 flex items-center gap-1">
                          <Clock3 className="w-4 h-4" />
                          等待风控人员审批
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        visible={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <button className="btn-outline" onClick={() => setDeleteModal(false)}>
              取消
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              确认删除
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          确定要删除优惠券{' '}
          <span className="font-medium text-gray-800">{selectedCoupon.name}</span>{' '}
          吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  );
}
