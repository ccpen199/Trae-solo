import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCouponStore } from '../stores/couponStore';
import { FormInput, FormSelect, FormTextarea } from '../components/common/FormInput';
import { PageLoading } from '../components/common/Loading';
import dayjs from 'dayjs';
import type { CouponType, CouponStatus } from '@shared/types';

interface CouponFormData {
  name: string;
  type: CouponType;
  value: number;
  threshold: number;
  totalQuantity: number;
  status: CouponStatus;
  startTime: string;
  endTime: string;
  description: string;
  applicableMerchants: string[];
}

export default function CouponCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { selectedCoupon, fetchCouponById, createCoupon, updateCoupon, isLoading } =
    useCouponStore();

  const [formData, setFormData] = useState<CouponFormData>({
    name: '',
    type: 'fixed',
    value: 30,
    threshold: 100,
    totalQuantity: 1000,
    status: 'draft',
    startTime: dayjs().format('YYYY-MM-DD'),
    endTime: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    description: '',
    applicableMerchants: ['m001'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      fetchCouponById(id);
    }
  }, [isEdit, id, fetchCouponById]);

  useEffect(() => {
    if (selectedCoupon && isEdit) {
      setFormData({
        name: selectedCoupon.name,
        type: selectedCoupon.type,
        value: selectedCoupon.value,
        threshold: selectedCoupon.threshold,
        totalQuantity: selectedCoupon.totalQuantity,
        status: selectedCoupon.status,
        startTime: dayjs(selectedCoupon.startTime).format('YYYY-MM-DD'),
        endTime: dayjs(selectedCoupon.endTime).format('YYYY-MM-DD'),
        description: selectedCoupon.description || '',
        applicableMerchants: selectedCoupon.applicableMerchants,
      });
    }
  }, [selectedCoupon, isEdit]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入优惠券名称';
    }
    if (formData.value <= 0) {
      newErrors.value = '优惠值必须大于0';
    }
    if (formData.threshold < 0) {
      newErrors.threshold = '使用门槛不能为负数';
    }
    if (formData.type === 'discount' && (formData.value <= 0 || formData.value >= 1)) {
      newErrors.value = '折扣值必须在0-1之间';
    }
    if (formData.totalQuantity <= 0) {
      newErrors.totalQuantity = '发行量必须大于0';
    }
    if (dayjs(formData.startTime).isAfter(dayjs(formData.endTime))) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const couponData = {
        ...formData,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
      };

      if (isEdit && id) {
        await updateCoupon(id, couponData);
      } else {
        await createCoupon(couponData);
      }
      navigate('/coupons');
    } catch (err) {
      console.error('保存失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && isLoading && !selectedCoupon) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? '编辑优惠券' : '创建优惠券'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? '修改优惠券活动信息' : '创建新的优惠券活动'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">基本信息</div>
              <div className="card-body space-y-4">
                <FormInput
                  label="优惠券名称"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入优惠券名称"
                  error={errors.name}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="优惠券类型"
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'fixed' | 'discount' | 'threshold',
                      })
                    }
                    options={[
                      { value: 'fixed', label: '满减券' },
                      { value: 'discount', label: '折扣券' },
                      { value: 'threshold', label: '门槛券' },
                    ]}
                  />

                  <FormInput
                    label={formData.type === 'discount' ? '折扣值(0-1)' : '优惠金额(元)'}
                    required
                    type="number"
                    step={formData.type === 'discount' ? '0.1' : '1'}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: Number(e.target.value) })
                    }
                    placeholder={formData.type === 'discount' ? '例如：0.8 表示8折' : '例如：30'}
                    error={errors.value}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="使用门槛(元)"
                    required
                    type="number"
                    value={formData.threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: Number(e.target.value) })
                    }
                    placeholder="0表示无门槛"
                    error={errors.threshold}
                  />

                  <FormInput
                    label="发行总量"
                    required
                    type="number"
                    value={formData.totalQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, totalQuantity: Number(e.target.value) })
                    }
                    placeholder="请输入发行总量"
                    error={errors.totalQuantity}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="开始日期"
                    required
                    type="date"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />

                  <FormInput
                    label="结束日期"
                    required
                    type="date"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    error={errors.endTime}
                  />
                </div>

                <FormTextarea
                  label="活动说明"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入活动说明（选填）"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="card-header">发布设置</div>
              <div className="card-body space-y-4">
                <FormSelect
                  label="初始状态"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'draft' | 'active' | 'paused',
                    })
                  }
                  options={[
                    { value: 'draft', label: '保存为草稿' },
                    { value: 'active', label: '立即发布' },
                    { value: 'paused', label: '暂停发布' },
                  ]}
                />

                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-600 font-medium mb-2">预览效果</p>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="font-bold text-lg text-gray-800">{formData.name || '优惠券名称'}</p>
                    <p className="text-2xl font-bold text-accent-500 mt-2">
                      {formData.type === 'discount'
                        ? `${formData.value * 10}折`
                        : `¥${formData.value}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.threshold > 0
                        ? `满${formData.threshold}元可用`
                        : '无门槛使用'}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        {formData.startTime} 至 {formData.endTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-end gap-3">
                  <Link to="/coupons" className="btn-outline">
                    取消
                  </Link>
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
