import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '@/utils/api';

export default function ParcelForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    household_id: '',
    parcel_code: '',
    coordinates: '',
    area: '',
    usage: 'residence',
    ownership_cert: '',
    ownership_status: 'unconfirmed',
    boundary_east: '',
    boundary_west: '',
    boundary_south: '',
    boundary_north: '',
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
        ...form,
        household_id: Number(form.household_id) || undefined,
        area: Number(form.area) || 0,
      };
      if (isEdit && id) {
        await api.put(`/api/parcels/${id}`, payload);
      } else {
        await api.post('/api/parcels', payload);
      }
      navigate('/parcels');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/parcels')} className="text-slate-400 hover:text-teal-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{isEdit ? '编辑地块' : '新增地块'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">地块编号 <span className="text-red-500">*</span></label>
              <input type="text" value={form.parcel_code} onChange={(e) => updateForm('parcel_code', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">所属农户ID <span className="text-red-500">*</span></label>
              <input type="number" value={form.household_id} onChange={(e) => updateForm('household_id', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">面积(㎡) <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" value={form.area} onChange={(e) => updateForm('area', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">用途 <span className="text-red-500">*</span></label>
              <select value={form.usage} onChange={(e) => updateForm('usage', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" required>
                <option value="residence">住宅</option>
                <option value="production">生产</option>
                <option value="business">经营</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">坐标</label>
              <input type="text" value={form.coordinates} onChange={(e) => updateForm('coordinates', e.target.value)} placeholder="经度,纬度" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">权属证书</label>
              <input type="text" value={form.ownership_cert} onChange={(e) => updateForm('ownership_cert', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">权属状态</label>
              <select value={form.ownership_status} onChange={(e) => updateForm('ownership_status', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                <option value="confirmed">已确权</option>
                <option value="unconfirmed">未确权</option>
                <option value="transferring">流转中</option>
                <option value="exited">已退出</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">四至信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">东至</label>
              <input type="text" value={form.boundary_east} onChange={(e) => updateForm('boundary_east', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">西至</label>
              <input type="text" value={form.boundary_west} onChange={(e) => updateForm('boundary_west', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">南至</label>
              <input type="text" value={form.boundary_south} onChange={(e) => updateForm('boundary_south', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">北至</label>
              <input type="text" value={form.boundary_north} onChange={(e) => updateForm('boundary_north', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" onClick={() => navigate('/parcels')} className="px-6 py-2.5 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
