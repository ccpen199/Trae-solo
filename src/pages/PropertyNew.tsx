import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import { PROPERTY_TYPE_MAP, DECORATION_MAP } from '../utils/constants';
import { ChevronLeft, Save, Building2, Upload, Layers } from 'lucide-react';

const PropertyNew: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'second_hand',
    address: '',
    area: '',
    price: '',
    owner_id: 4,
    agent_id: 2,
    vr_url: '',
    floor: '',
    total_floor: '',
    decoration_level: 'medium',
    community: '',
    rooms: '',
    halls: '',
    description: '',
  });

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.type || !form.address || !form.area || !form.price) {
      alert('请填写完整的房源信息');
      return;
    }

    setLoading(true);
    try {
      const floorPlanJson = JSON.stringify({
        rooms: [
          { id: 'living', name: '客厅', x: 0, y: 0, width: 8, height: 6, area: Math.round(parseFloat(form.area) * 0.35) },
          { id: 'bedroom1', name: '主卧', x: 8, y: 0, width: 6, height: 5, area: Math.round(parseFloat(form.area) * 0.25) },
          { id: 'kitchen', name: '厨房', x: 0, y: 6, width: 4, height: 3, area: Math.round(parseFloat(form.area) * 0.1) },
          { id: 'bathroom', name: '卫生间', x: 4, y: 6, width: 4, height: 3, area: Math.round(parseFloat(form.area) * 0.08) },
        ],
        totalArea: parseFloat(form.area)
      });

      const res = await propertyApi.create({
        ...form,
        area: parseFloat(form.area),
        price: parseFloat(form.price),
        floor: form.floor ? parseInt(form.floor) : null,
        total_floor: form.total_floor ? parseInt(form.total_floor) : null,
        rooms: form.rooms ? parseInt(form.rooms) : null,
        halls: form.halls ? parseInt(form.halls) : null,
        floor_plan_json: floorPlanJson,
      });

      await propertyApi.valuation(res.id);

      alert('房源创建成功，已自动完成智能估价！');
      navigate(`/properties/${res.id}`);
    } catch (e: any) {
      alert(e.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: '基本信息' },
    { num: 2, title: '详细信息' },
    { num: 3, title: '多媒体与描述' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/properties')}
          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">新增房源</h2>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {s.num}
                </div>
                <span className={`ml-3 font-medium ${step >= s.num ? 'text-gray-800' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded ${step > s.num ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房源名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
                placeholder="如：阳光花园精装三居室"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">房源类型 <span className="text-red-500">*</span></label>
                <select
                  value={form.type}
                  onChange={e => updateForm('type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(PROPERTY_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">装修情况</label>
                <select
                  value={form.decoration_level}
                  onChange={e => updateForm('decoration_level', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(DECORATION_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房源地址 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                placeholder="如：朝阳区阳光花园小区3号楼2单元1502"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">建筑面积（㎡） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={form.area}
                  onChange={e => updateForm('area', e.target.value)}
                  placeholder="如：122"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  挂牌价格（{form.type === 'second_hand' ? '元' : '元/月'}） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => updateForm('price', e.target.value)}
                  placeholder={form.type === 'second_hand' ? '如：5800000' : '如：6500'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">室</label>
                <input
                  type="number"
                  value={form.rooms}
                  onChange={e => updateForm('rooms', e.target.value)}
                  placeholder="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">厅</label>
                <input
                  type="number"
                  value={form.halls}
                  onChange={e => updateForm('halls', e.target.value)}
                  placeholder="2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">小区名称</label>
                <input
                  type="text"
                  value={form.community}
                  onChange={e => updateForm('community', e.target.value)}
                  placeholder="阳光花园"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所在楼层</label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={e => updateForm('floor', e.target.value)}
                  placeholder="如：15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">总楼层</label>
                <input
                  type="number"
                  value={form.total_floor}
                  onChange={e => updateForm('total_floor', e.target.value)}
                  placeholder="如：28"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">业主ID</label>
                <input
                  type="number"
                  value={form.owner_id}
                  onChange={e => updateForm('owner_id', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">经纪人ID</label>
                <input
                  type="number"
                  value={form.agent_id}
                  onChange={e => updateForm('agent_id', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">VR全景链接</label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={form.vr_url}
                  onChange={e => updateForm('vr_url', e.target.value)}
                  placeholder="https://example.com/vr/12345"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  className="px-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  上传
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">系统将自动生成示例户型图标注</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房源描述</label>
              <textarea
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                rows={5}
                placeholder="请详细描述房源特点、周边配套、交通情况等"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
            <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">智能提示</span>
              </div>
              <p className="text-sm text-blue-700">
                保存后系统将基于小区成交价、装修指数和楼层系数自动执行智能估价，
                并为您生成结构化户型图标注。
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一步
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '保存并估价'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyNew;
