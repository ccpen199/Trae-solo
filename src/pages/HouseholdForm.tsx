import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '@/utils/api';

interface MemberInput {
  name: string;
  relationship: string;
  id_card: string;
  household_registration: string;
}

export default function HouseholdForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    head_name: '',
    id_card: '',
    address: '',
    phone: '',
    eligibility_status: 'pending',
  });
  const [members, setMembers] = useState<MemberInput[]>([
    { name: '', relationship: '', id_card: '', household_registration: '' },
  ]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMember = () => {
    setMembers((prev) => [...prev, { name: '', relationship: '', id_card: '', household_registration: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof MemberInput, value: string) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, members };
      if (isEdit && id) {
        await api.put(`/api/households/${id}`, payload);
      } else {
        await api.post('/api/households', payload);
      }
      navigate('/households');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/households')} className="text-slate-400 hover:text-teal-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{isEdit ? '编辑农户档案' : '新增农户档案'}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">户主姓名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.head_name}
                onChange={(e) => updateForm('head_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">身份证号 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.id_card}
                onChange={(e) => updateForm('id_card', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">地址 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">联系电话 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">资格状态</label>
              <select
                value={form.eligibility_status}
                onChange={(e) => updateForm('eligibility_status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="qualified">符合资格</option>
                <option value="disqualified">不符合资格</option>
                <option value="pending">待审核</option>
                <option value="restricted">受限</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">家庭成员</h2>
            <button
              type="button"
              onClick={addMember}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <Plus size={14} />
              添加成员
            </button>
          </div>
          <div className="space-y-4">
            {members.map((member, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-200 relative">
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">关系 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={member.relationship}
                      onChange={(e) => updateMember(idx, 'relationship', e.target.value)}
                      placeholder="如：配偶、子女"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">身份证号 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={member.id_card}
                      onChange={(e) => updateMember(idx, 'id_card', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">户籍 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={member.household_registration}
                      onChange={(e) => updateMember(idx, 'household_registration', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/households')}
            className="px-6 py-2.5 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
