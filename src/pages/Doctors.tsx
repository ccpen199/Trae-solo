import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, Eye, Check, X, Filter,
  Clock, Building2, DollarSign, ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Doctor, Institution, TimeSlot, AgreementPrice, ComplianceReview } from '@/types';

const statusMap: Record<string, { label: string; class: string }> = {
  active: { label: '执业中', class: 'border-green-200 bg-green-50 text-green-700' },
  pending: { label: '待审核', class: 'border-amber-200 bg-amber-50 text-amber-700' },
  suspended: { label: '已暂停', class: 'border-red-200 bg-red-50 text-red-700' },
};

const complianceMap: Record<string, { label: string; class: string }> = {
  compliant: { label: '合规', class: 'text-green-600' },
  pending: { label: '待审核', class: 'text-amber-600' },
  non_compliant: { label: '不合规', class: 'text-red-600' },
};

const reviewResultMap: Record<string, { label: string; class: string }> = {
  pass: { label: '通过', class: 'text-green-600' },
  fail: { label: '未通过', class: 'text-red-600' },
  pending: { label: '待审核', class: 'text-amber-600' },
};

const dayOfWeekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface FormErrors {
  name?: string;
  licenseNo?: string;
  specialty?: string;
  title?: string;
  practiceScope?: string;
  visitPrice?: string;
  practiceCertExpiry?: string;
  timeSlots?: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const emptyFormData: Partial<Doctor> & {
  availableTimeSlots: TimeSlot[];
  agreementPrices: AgreementPrice[];
  complianceReviews: ComplianceReview[];
} = {
  name: '',
  licenseNo: '',
  specialty: '',
  title: '',
  practiceScope: '',
  status: 'pending',
  visitPrice: 0,
  complianceStatus: 'pending',
  availableInstitutions: [],
  availableTimeSlots: [],
  agreementPrices: [],
  practiceCertExpiry: '',
  complianceReviews: [],
};

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState<TimeSlot>({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  async function loadDoctors() {
    setLoading(true);
    try {
      const data = await api.doctors.list();
      setDoctors(data);
    } catch (error) {
      console.error('加载医生列表失败:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadInstitutions() {
    try {
      const data = await api.institutions.list();
      setInstitutions(data);
    } catch (error) {
      console.error('加载机构列表失败:', error);
    }
  }

  useEffect(() => {
    loadDoctors();
    loadInstitutions();
  }, []);

  const institutionMap = new Map(institutions.map((i) => [i.id, i]));

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.includes(searchTerm) ||
      doctor.licenseNo.includes(searchTerm) ||
      doctor.specialty.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function validate(): FormErrors {
    const errors: FormErrors = {};
    if (!formData.name?.trim()) errors.name = '请输入医生姓名';
    if (!formData.licenseNo?.trim()) errors.licenseNo = '请输入执业证号';
    if (!formData.specialty?.trim()) errors.specialty = '请输入专业领域';
    if (!formData.title?.trim()) errors.title = '请输入职称';
    if (!formData.practiceScope?.trim()) errors.practiceScope = '请输入执业范围';
    if (formData.visitPrice === undefined || formData.visitPrice < 0) errors.visitPrice = '请输入有效的出诊价格';
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      if (editingDoctor) {
        await api.doctors.update(editingDoctor.id, formData);
        addToast('success', '医生档案更新成功');
      } else {
        await api.doctors.create(formData);
        addToast('success', '医生档案创建成功');
      }
      await loadDoctors();
      setShowModal(false);
      setEditingDoctor(null);
      setFormData(emptyFormData);
      setFormErrors({});
    } catch (error: any) {
      addToast('error', error?.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(doctor: Doctor) {
    setEditingDoctor(doctor);
    setFormData({
      ...doctor,
      availableTimeSlots: doctor.availableTimeSlots || [],
      agreementPrices: doctor.agreementPrices || [],
      complianceReviews: doctor.complianceReviews || [],
    });
    setFormErrors({});
    setShowModal(true);
  }

  function handleDelete(id: number) {
    if (confirm('确定要删除该医生档案吗？')) {
      api.doctors.delete(id).then(() => {
        loadDoctors();
        addToast('success', '医生档案已删除');
      }).catch(() => {
        addToast('error', '删除失败，请重试');
      });
    }
  }

  function handleViewDetail(doctor: Doctor) {
    setDetailDoctor(doctor);
    setShowDetail(true);
  }

  function openCreateModal() {
    setEditingDoctor(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setShowModal(true);
  }

  function toggleInstitution(instId: number) {
    const current = formData.availableInstitutions || [];
    const updated = current.includes(instId)
      ? current.filter((id) => id !== instId)
      : [...current, instId];
    setFormData({ ...formData, availableInstitutions: updated });
    const currentPrices = formData.agreementPrices || [];
    if (!current.includes(instId)) {
      setFormData((prev) => ({
        ...prev,
        availableInstitutions: updated,
        agreementPrices: [...currentPrices, { institutionId: instId, price: prev.visitPrice || 0 }],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        availableInstitutions: updated,
        agreementPrices: currentPrices.filter((ap) => ap.institutionId !== instId),
      }));
    }
  }

  function addTimeSlot() {
    const overlap = (formData.availableTimeSlots || []).some(
      (s) => s.dayOfWeek === newTimeSlot.dayOfWeek && s.startTime === newTimeSlot.startTime && s.endTime === newTimeSlot.endTime,
    );
    if (overlap) {
      setFormErrors((prev) => ({ ...prev, timeSlots: '该时段已存在' }));
      return;
    }
    setFormErrors((prev) => {
      const { timeSlots, ...rest } = prev;
      return rest;
    });
    setFormData({
      ...formData,
      availableTimeSlots: [...(formData.availableTimeSlots || []), { ...newTimeSlot }],
    });
  }

  function removeTimeSlot(index: number) {
    const slots = [...(formData.availableTimeSlots || [])];
    slots.splice(index, 1);
    setFormData({ ...formData, availableTimeSlots: slots });
  }

  function updateAgreementPrice(institutionId: number, price: number) {
    const prices = (formData.agreementPrices || []).map((ap) =>
      ap.institutionId === institutionId ? { ...ap, price } : ap,
    );
    setFormData({ ...formData, agreementPrices: prices });
  }

  function fieldError(error?: string) {
    if (!error) return null;
    return <p className="mt-1 text-xs text-red-500">{error}</p>;
  }

  const inputClass = (error?: string) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'} outline-none`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">医生档案管理</h1>
          <p className="mt-1 text-sm text-gray-500">维护医生执业资质、专业领域、可服务机构和出诊价格</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新增医生
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索医生姓名、执业证号、专业..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">全部状态</option>
            <option value="active">执业中</option>
            <option value="pending">待审核</option>
            <option value="suspended">已暂停</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">医生信息</th>
                <th className="px-4 py-3 font-medium text-gray-500">执业证号</th>
                <th className="px-4 py-3 font-medium text-gray-500">专业/职称</th>
                <th className="px-4 py-3 font-medium text-gray-500">执业范围</th>
                <th className="px-4 py-3 font-medium text-gray-500">出诊价格</th>
                <th className="px-4 py-3 font-medium text-gray-500">合规状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>加载中...</td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>暂无医生档案数据</td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          {doctor.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{doctor.name}</div>
                          <div className="text-xs text-gray-500">{doctor.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-600">{doctor.licenseNo}</td>
                    <td className="px-4 py-4">
                      <div className="text-gray-900">{doctor.specialty}</div>
                      <div className="text-xs text-gray-500">{doctor.title}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{doctor.practiceScope}</td>
                    <td className="px-4 py-4 font-medium text-gray-900">¥{doctor.visitPrice}</td>
                    <td className="px-4 py-4">
                      <span className={`font-medium ${complianceMap[doctor.complianceStatus ?? 'pending']?.class || 'text-gray-600'}`}>
                        {complianceMap[doctor.complianceStatus ?? 'pending']?.label || doctor.complianceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMap[doctor.status]?.class || ''}`}>
                        {statusMap[doctor.status]?.label || doctor.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(doctor)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(doctor)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor.id)}
                          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              {toast.message}
            </div>
          ))}
        </div>
      )}

      {showDetail && detailDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">医生详情</h2>
              <button onClick={() => { setShowDetail(false); setDetailDoctor(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">医生姓名</p>
                  <p className="font-medium text-gray-900">{detailDoctor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">执业证号</p>
                  <p className="font-mono text-sm text-gray-900">{detailDoctor.licenseNo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">专业领域</p>
                  <p className="text-gray-900">{detailDoctor.specialty}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">职称</p>
                  <p className="text-gray-900">{detailDoctor.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">执业范围</p>
                  <p className="text-gray-900">{detailDoctor.practiceScope}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">出诊价格</p>
                  <p className="font-medium text-gray-900">¥{detailDoctor.visitPrice}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">执业证到期日</p>
                  <p className="text-gray-900">{detailDoctor.practiceCertExpiry || '未设置'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">合规状态</p>
                  <span className={`font-medium ${complianceMap[detailDoctor.complianceStatus ?? 'pending']?.class || 'text-gray-600'}`}>
                    {complianceMap[detailDoctor.complianceStatus ?? 'pending']?.label || '未设置'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">状态</p>
                  <span className={`rounded-lg border px-2 py-1 text-xs font-medium ${statusMap[detailDoctor.status]?.class || ''}`}>
                    {statusMap[detailDoctor.status]?.label || detailDoctor.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Building2 className="h-4 w-4" />
                  可服务机构
                </h3>
                {(detailDoctor.availableInstitutions?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-400">暂未关联机构</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detailDoctor.availableInstitutions.map((instId) => {
                      const inst = institutionMap.get(instId);
                      return (
                        <span key={instId} className="rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-700">
                          {inst?.name || `机构 #${instId}`}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="h-4 w-4" />
                  可出诊时段
                </h3>
                {(detailDoctor.availableTimeSlots?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-400">暂未设置出诊时段</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detailDoctor.availableTimeSlots!.map((slot, i) => (
                      <span key={i} className="rounded-lg bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                        {dayOfWeekLabels[slot.dayOfWeek - 1]} {slot.startTime}-{slot.endTime}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  协议价格明细
                </h3>
                {(detailDoctor.agreementPrices?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-400">暂未设置协议价格</p>
                ) : (
                  <div className="space-y-1">
                    {detailDoctor.agreementPrices!.map((ap) => {
                      const inst = institutionMap.get(ap.institutionId);
                      return (
                        <div key={ap.institutionId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <span className="text-sm text-gray-700">{inst?.name || `机构 #${ap.institutionId}`}</span>
                          <span className="font-medium text-gray-900">¥{ap.price}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <ShieldCheck className="h-4 w-4" />
                  合规审核记录
                </h3>
                {(detailDoctor.complianceReviews?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-400">暂无审核记录</p>
                ) : (
                  <div className="space-y-2">
                    {detailDoctor.complianceReviews!.map((review) => (
                      <div key={review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{review.reviewer}</span>
                          <span className={`text-sm font-medium ${reviewResultMap[review.result]?.class || 'text-gray-600'}`}>
                            {reviewResultMap[review.result]?.label || review.result}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{review.date}</p>
                        {review.remark && <p className="mt-1 text-sm text-gray-600">{review.remark}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDoctor ? '编辑医生档案' : '新增医生档案'}
              </h2>
              <button onClick={() => { setShowModal(false); setFormErrors({}); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">医生姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors((prev) => { const { name, ...rest } = prev; return rest; }); }}
                    className={inputClass(formErrors.name)}
                  />
                  {fieldError(formErrors.name)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">执业证号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.licenseNo || ''}
                    onChange={(e) => { setFormData({ ...formData, licenseNo: e.target.value }); setFormErrors((prev) => { const { licenseNo, ...rest } = prev; return rest; }); }}
                    className={inputClass(formErrors.licenseNo)}
                  />
                  {fieldError(formErrors.licenseNo)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">专业领域 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.specialty || ''}
                    onChange={(e) => { setFormData({ ...formData, specialty: e.target.value }); setFormErrors((prev) => { const { specialty, ...rest } = prev; return rest; }); }}
                    className={inputClass(formErrors.specialty)}
                  />
                  {fieldError(formErrors.specialty)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">职称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setFormErrors((prev) => { const { title, ...rest } = prev; return rest; }); }}
                    className={inputClass(formErrors.title)}
                  />
                  {fieldError(formErrors.title)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">执业范围 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.practiceScope || ''}
                  onChange={(e) => { setFormData({ ...formData, practiceScope: e.target.value }); setFormErrors((prev) => { const { practiceScope, ...rest } = prev; return rest; }); }}
                  className={inputClass(formErrors.practiceScope)}
                />
                {fieldError(formErrors.practiceScope)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">出诊价格 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    value={formData.visitPrice ?? 0}
                    onChange={(e) => { setFormData({ ...formData, visitPrice: Number(e.target.value) }); setFormErrors((prev) => { const { visitPrice, ...rest } = prev; return rest; }); }}
                    className={inputClass(formErrors.visitPrice)}
                  />
                  {fieldError(formErrors.visitPrice)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Doctor['status'] })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="pending">待审核</option>
                    <option value="active">执业中</option>
                    <option value="suspended">已暂停</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">执业证到期日</label>
                <input
                  type="date"
                  value={formData.practiceCertExpiry || ''}
                  onChange={(e) => setFormData({ ...formData, practiceCertExpiry: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  <Building2 className="mr-1 inline h-4 w-4" />
                  可服务机构
                </label>
                {institutions.length === 0 ? (
                  <p className="text-sm text-gray-400">暂无可选机构</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {institutions.map((inst) => (
                      <label
                        key={inst.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          (formData.availableInstitutions || []).includes(inst.id)
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={(formData.availableInstitutions || []).includes(inst.id)}
                          onChange={() => toggleInstitution(inst.id)}
                          className="rounded border-gray-300"
                        />
                        {inst.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  <Clock className="mr-1 inline h-4 w-4" />
                  可出诊时段
                </label>
                {(formData.availableTimeSlots || []).length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {(formData.availableTimeSlots || []).map((slot, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                        {dayOfWeekLabels[slot.dayOfWeek - 1]} {slot.startTime}-{slot.endTime}
                        <button type="button" onClick={() => removeTimeSlot(i)} className="ml-1 text-emerald-400 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-500">星期</label>
                    <select
                      value={newTimeSlot.dayOfWeek}
                      onChange={(e) => setNewTimeSlot({ ...newTimeSlot, dayOfWeek: Number(e.target.value) })}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none"
                    >
                      {dayOfWeekLabels.map((label, i) => (
                        <option key={i} value={i + 1}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">开始时间</label>
                    <input
                      type="time"
                      value={newTimeSlot.startTime}
                      onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">结束时间</label>
                    <input
                      type="time"
                      value={newTimeSlot.endTime}
                      onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    添加
                  </button>
                </div>
                {fieldError(formErrors.timeSlots)}
              </div>

              {(formData.availableInstitutions || []).length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    <DollarSign className="mr-1 inline h-4 w-4" />
                    协议价格明细
                  </label>
                  <div className="space-y-2">
                    {(formData.availableInstitutions || []).map((instId) => {
                      const inst = institutionMap.get(instId);
                      const price = (formData.agreementPrices || []).find((ap) => ap.institutionId === instId)?.price ?? formData.visitPrice ?? 0;
                      return (
                        <div key={instId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <span className="text-sm text-gray-700">{inst?.name || `机构 #${instId}`}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">¥</span>
                            <input
                              type="number"
                              min="0"
                              value={price}
                              onChange={(e) => updateAgreementPrice(instId, Number(e.target.value))}
                              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormErrors({}); }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
