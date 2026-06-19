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
} from 'lucide-react';
import { useCouponStore } from '../stores/couponStore';
import { StatusBadge } from '../components/common/StatusBadge';
import { PageLoading } from '../components/common/Loading';
import { Modal } from '../components/common/Modal';
import dayjs from 'dayjs';

export default function CouponDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCoupon, fetchCouponById, isLoading, updateCoupon, deleteCoupon } =
    useCouponStore();
  const [deleteModal, setDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCouponById(id);
    }
  }, [id, fetchCouponById]);

  const handleStatusChange = async (newStatus: 'active' | 'paused') => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateCoupon(id, { status: newStatus });
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
              onClick={() => handleStatusChange('paused')}
              disabled={actionLoading}
            >
              <Pause className="w-4 h-4" />
              暂停
            </button>
          ) : selectedCoupon.status === 'paused' || selectedCoupon.status === 'draft' ? (
            <button
              className="btn-success flex items-center gap-2"
              onClick={() => handleStatusChange('active')}
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
