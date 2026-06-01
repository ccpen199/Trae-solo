import { useEffect, useState } from 'react';
import {
  Plus, Search, Edit, X, Check, Filter, Building2,
  MapPin, Phone, GraduationCap, Clock, DoorOpen, Tag, Trash2
} from 'lucide-react';
import { api } from '@/lib/api';
import { Institution, Department } from '@/types';

const statusMap = {
  active: { label: '启用', class: 'border-green-200 bg-green-50 text-green-700' },
  inactive: { label: '停用', class: 'border-red-200 bg-red-50 text-red-700' },
};

const qualificationOptions = [
  { value: '住院医师', label: '住院医师' },
  { value: '主治医师', label: '主治医师' },
  { value: '副主任医师', label: '副主任医师' },
  { value: '主任医师', label: '主任医师' },
];

const serviceTypeOptions = [
  { value: '初诊', label: '初诊' },
  { value: '复诊', label: '复诊' },
  { value: '专家门诊', label: '专家门诊' },
  { value: '特需门诊', label: '特需门诊' },
];

function createEmptyDepartment(): Department {
  return {
    id: Date.now() + Math.random(),
    institutionId: 0,
    name: '',
    roomCount: 1,
    slotCount: 20,
    morningStart: '08:00',
    morningEnd: '12:00',
    afternoonStart: '14:00',
    afternoonEnd: '17:00',
    serviceTypes: [],
    createdAt: new Date().toISOString(),
  };
}

function validateForm(data: Partial<Institution>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name?.trim()) errors.name = '请输入机构名称';
  if (!data.address?.trim()) errors.address = '请输入机构地址';
  if (!data.contact?.trim()) errors.contact = '请输入联系方式';
  if (!data.minQualification) errors.minQualification = '请选择最低资质要求';
  (data.departments || []).forEach((dept, i) => {
    if (!dept.name.trim()) errors[`dept_name_${i}`] = '请输入科室名称';
    if (dept.roomCount < 1) errors[`dept_room_${i}`] = '诊室数量至少为1';
    if (dept.slotCount < 1) errors[`dept_slot_${i}`] = '号源数量至少为1';
    if (!dept.morningStart || !dept.morningEnd) errors[`dept_morning_${i}`] = '请设置上午时段';
    if (!dept.afternoonStart || !dept.afternoonEnd) errors[`dept_afternoon_${i}`] = '请设置下午时段';
    if (dept.serviceTypes.length === 0) errors[`dept_service_${i}`] = '请至少选择一种服务类型';
  });
  return errors;
}

export default function Institutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState<Partial<Institution>>({
    name: '',
    address: '',
    contact: '',
    minQualification: '',
    status: 'active',
    departments: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadInstitutions() {
    setLoading(true);
    try {
      const data = await api.institutions.list();
      setInstitutions(data);
    } catch (error) {
      console.error('加载机构列表失败:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstitutions();
  }, []);

  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch =
      institution.name.includes(searchTerm) ||
      institution.address.includes(searchTerm) ||
      institution.contact.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || institution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function updateDepartment(index: number, updates: Partial<Department>) {
    const departments = [...(formData.departments || [])];
    departments[index] = { ...departments[index], ...updates };
    setFormData({ ...formData, departments });
  }

  function addDepartment() {
    const departments = [...(formData.departments || []), createEmptyDepartment()];
    setFormData({ ...formData, departments });
  }

  function removeDepartment(index: number) {
    const departments = (formData.departments || []).filter((_, i) => i !== index);
    setFormData({ ...formData, departments });
  }

  function toggleServiceType(deptIndex: number, type: string) {
    const dept = formData.departments![deptIndex];
    const current = dept.serviceTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateDepartment(deptIndex, { serviceTypes: updated });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      if (editingInstitution) {
        await api.institutions.update(editingInstitution.id, formData);
        showToast('success', '机构信息更新成功');
      } else {
        await api.institutions.create(formData);
        showToast('success', '机构创建成功');
      }
      await loadInstitutions();
      setShowModal(false);
    } catch (error) {
      showToast('error', editingInstitution ? '更新失败，请重试' : '创建失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(institution: Institution) {
    setEditingInstitution(institution);
    setFormData({
      ...institution,
      departments: institution.departments.map((d) => ({
        ...d,
        slotCount: d.slotCount || 20,
        morningStart: d.morningStart || '08:00',
        morningEnd: d.morningEnd || '12:00',
        afternoonStart: d.afternoonStart || '14:00',
        afternoonEnd: d.afternoonEnd || '17:00',
        serviceTypes: d.serviceTypes || [],
      })),
    });
    setErrors({});
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingInstitution(null);
    setFormData({
      name: '',
      address: '',
      contact: '',
      minQualification: '',
      status: 'active',
      departments: [],
    });
    setErrors({});
    setShowModal(true);
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="mr-2 inline h-4 w-4" /> : <X className="mr-2 inline h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">合作机构管理</h1>
          <p className="mt-1 text-sm text-gray-500">维护合作机构信息、科室配置与资质要求</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新增机构
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索机构名称、地址、联系方式..."
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
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            加载中...
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            暂无机构数据
          </div>
        ) : (
          filteredInstitutions.map((institution) => (
            <div key={institution.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{institution.name}</h3>
                      <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${statusMap[institution.status].class}`}>
                        {statusMap[institution.status].label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {institution.address || '未填写'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {institution.contact || '未填写'}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {institution.minQualification || '未设置'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(institution)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                >
                  <Edit className="h-5 w-5" />
                </button>
              </div>

              {institution.departments.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  {institution.departments.map((dept) => (
                    <div key={dept.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="h-3.5 w-3.5 text-blue-500" />
                          <span>诊室 {dept.roomCount} 间</span>
                          <span className="text-gray-300">|</span>
                          <span>号源 {dept.slotCount || '-'} 个/时段</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>上午 {(dept.morningStart || '08:00')}~{(dept.morningEnd || '12:00')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-orange-500" />
                          <span>下午 {(dept.afternoonStart || '14:00')}~{(dept.afternoonEnd || '17:00')}</span>
                        </div>
                        {(dept.serviceTypes || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <Tag className="h-3 w-3 text-purple-500" />
                            {(dept.serviceTypes || []).map((st) => (
                              <span key={st} className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                                {st}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-4 text-sm text-gray-400">暂未配置科室</div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingInstitution ? '编辑机构信息' : '新增合作机构'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  机构名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                    errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    联系方式 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      errors.contact ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  {errors.contact && <p className="mt-1 text-xs text-red-500">{errors.contact}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    最低资质要求 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.minQualification || ''}
                    onChange={(e) => setFormData({ ...formData, minQualification: e.target.value })}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
                      errors.minQualification ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">请选择</option>
                    {qualificationOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors.minQualification && <p className="mt-1 text-xs text-red-500">{errors.minQualification}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">状态</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Institution['status'] })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">科室配置</label>
                  <button
                    type="button"
                    onClick={addDepartment}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    添加科室
                  </button>
                </div>

                {(formData.departments || []).length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                    暂未添加科室，请点击上方按钮添加
                  </div>
                )}

                <div className="space-y-4">
                  {(formData.departments || []).map((dept, index) => (
                    <div key={dept.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">科室 {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeDepartment(index)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500">
                            科室名称 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={dept.name}
                            onChange={(e) => updateDepartment(index, { name: e.target.value })}
                            className={`mt-1 w-full rounded-lg border px-3 py-1.5 text-sm ${
                              errors[`dept_name_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                          />
                          {errors[`dept_name_${index}`] && (
                            <p className="mt-0.5 text-xs text-red-500">{errors[`dept_name_${index}`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            诊室数量 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={dept.roomCount}
                            onChange={(e) => updateDepartment(index, { roomCount: parseInt(e.target.value) || 1 })}
                            className={`mt-1 w-full rounded-lg border px-3 py-1.5 text-sm ${
                              errors[`dept_room_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                          />
                          {errors[`dept_room_${index}`] && (
                            <p className="mt-0.5 text-xs text-red-500">{errors[`dept_room_${index}`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            号源数量/时段 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={dept.slotCount}
                            onChange={(e) => updateDepartment(index, { slotCount: parseInt(e.target.value) || 1 })}
                            className={`mt-1 w-full rounded-lg border px-3 py-1.5 text-sm ${
                              errors[`dept_slot_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                          />
                          {errors[`dept_slot_${index}`] && (
                            <p className="mt-0.5 text-xs text-red-500">{errors[`dept_slot_${index}`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500">
                            上午时段 <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              type="time"
                              value={dept.morningStart}
                              onChange={(e) => updateDepartment(index, { morningStart: e.target.value })}
                              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                                errors[`dept_morning_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                            <span className="text-gray-400">~</span>
                            <input
                              type="time"
                              value={dept.morningEnd}
                              onChange={(e) => updateDepartment(index, { morningEnd: e.target.value })}
                              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                                errors[`dept_morning_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                          </div>
                          {errors[`dept_morning_${index}`] && (
                            <p className="mt-0.5 text-xs text-red-500">{errors[`dept_morning_${index}`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            下午时段 <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              type="time"
                              value={dept.afternoonStart}
                              onChange={(e) => updateDepartment(index, { afternoonStart: e.target.value })}
                              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                                errors[`dept_afternoon_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                            <span className="text-gray-400">~</span>
                            <input
                              type="time"
                              value={dept.afternoonEnd}
                              onChange={(e) => updateDepartment(index, { afternoonEnd: e.target.value })}
                              className={`w-full rounded-lg border px-2 py-1.5 text-sm ${
                                errors[`dept_afternoon_${index}`] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                              }`}
                            />
                          </div>
                          {errors[`dept_afternoon_${index}`] && (
                            <p className="mt-0.5 text-xs text-red-500">{errors[`dept_afternoon_${index}`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs text-gray-500">
                          服务类型 <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 flex flex-wrap gap-3">
                          {serviceTypeOptions.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-1.5 text-sm">
                              <input
                                type="checkbox"
                                checked={(dept.serviceTypes || []).includes(opt.value)}
                                onChange={() => toggleServiceType(index, opt.value)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                        {errors[`dept_service_${index}`] && (
                          <p className="mt-0.5 text-xs text-red-500">{errors[`dept_service_${index}`]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
