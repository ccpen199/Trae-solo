import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface PositionForm {
  title: string;
  requirements: string;
  slots: number;
  subsidy: string;
}

export default function BaseApply() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    type: 'enterprise' as 'enterprise' | 'village' | 'community',
    contactPerson: '',
    contactPhone: '',
    address: '',
    description: '',
  });
  const [positions, setPositions] = useState<PositionForm[]>([
    { title: '', requirements: '', slots: 1, subsidy: '' },
  ]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addPosition = () => {
    setPositions((prev) => [...prev, { title: '', requirements: '', slots: 1, subsidy: '' }]);
  };

  const removePosition = (index: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePosition = (index: number, field: keyof PositionForm, value: string | number) => {
    setPositions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/bases');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button onClick={() => navigate('/bases')} className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回基地列表
      </button>

      <h1 className="text-2xl font-bold text-surface-900">基地入驻申请</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-surface-900">基本信息</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">基地名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">基地类型</label>
              <select
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="enterprise">企业</option>
                <option value="village">乡村</option>
                <option value="community">社区</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">联系人</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => updateForm('contactPerson', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">联系电话</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => updateForm('contactPhone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">地址</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateForm('address', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">基地简介</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-surface-900">招聘岗位</h2>
            <button type="button" onClick={addPosition} className="btn-outline flex items-center gap-1 text-sm">
              <Plus className="w-4 h-4" />
              添加岗位
            </button>
          </div>
          {positions.map((pos, index) => (
            <div key={index} className="bg-surface-50 rounded-lg p-4 space-y-3 relative">
              {positions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePosition(index)}
                  className="absolute top-3 right-3 text-surface-400 hover:text-danger-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">岗位名称</label>
                  <input
                    type="text"
                    value={pos.title}
                    onChange={(e) => updatePosition(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">招聘人数</label>
                  <input
                    type="number"
                    min={1}
                    value={pos.slots}
                    onChange={(e) => updatePosition(index, 'slots', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-surface-700 mb-1">岗位要求</label>
                  <input
                    type="text"
                    value={pos.requirements}
                    onChange={(e) => updatePosition(index, 'requirements', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">补贴/待遇</label>
                  <input
                    type="text"
                    value={pos.subsidy}
                    onChange={(e) => updatePosition(index, 'subsidy', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如: 提供食宿"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/bases')} className="btn-outline">取消</button>
          <button type="submit" className="btn-primary">提交申请</button>
        </div>
      </form>
    </div>
  );
}
