import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '@/utils/api';

export default function ApplicationNew() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    household_id: '',
    parcel_id: '',
    type: 'new_build',
    materials: '',
    remarks: '',
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        household_id: Number(form.household_id) || undefined,
        parcel_id: form.parcel_id ? Number(form.parcel_id) : undefined,
        type: form.type,
        materials: form.materials ? form.materials.split(',').map((s) => s.trim()) : [],
        remarks: form.remarks,
      };
      await api.post('/api/applications', payload);
      navigate('/applications');
    } catch (err: any) {
      setError(err.message || '提交失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/applications')} className="text-slate-400 hover:text-teal-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">提交新申请</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">申请信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">申请类型 <span className="text-red-500">*</span></label>
              <select value={form.type} onChange={(e) => updateForm('type', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" required>
                <option value="new_build">新建</option>
                <option value="rebuild">翻建</option>
                <option value="expand">扩建</option>
                <option value="exit">退出</option>
                <option value="transfer">流转</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">关联农户ID <span className="text-red-500">*</span></label>
              <input type="number" value={form.household_id} onChange={(e) => updateForm('household_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">关联地块ID</label>
              <input type="number" value={form.parcel_id} onChange={(e) => updateForm('parcel_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">材料(逗号分隔)</label>
              <input type="text" value={form.materials} onChange={(e) => updateForm('materials', e.target.value)} placeholder="如: 身份证,户口本,申请表" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea value={form.remarks} onChange={(e) => updateForm('remarks', e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>
        {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50">
            {saving ? '提交中...' : '提交申请'}
          </button>
          <button type="button" onClick={() => navigate('/applications')} className="px-6 py-2.5 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
