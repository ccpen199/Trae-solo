import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { helpApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Button, Card } from '../components/ui';

const CreateHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, location } = useAuthStore();
  const [form, setForm] = useState({
    type: 'OTHER',
    title: '',
    content: '',
    urgency: 1,
    radiusMeters: 1000,
    latitude: location?.latitude,
    longitude: location?.longitude,
    locationName: location?.locationName || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const types = [
    { v: 'EMERGENCY', l: '🚨 紧急求助', d: '急需帮助，优先推送', c: 'from-red-500 to-orange-500' },
    { v: 'SECOND_HAND', l: '📦 闲置置换', d: '物品转让/交换', c: 'from-green-500 to-emerald-500' },
    { v: 'SKILL_EXCHANGE', l: '🎓 技能交换', d: '互相学习技能', c: 'from-blue-500 to-indigo-500' },
    { v: 'OTHER', l: '📌 其他求助', d: '其他类型帮助', c: 'from-gray-500 to-slate-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('标题和内容不能为空');
      return;
    }
    if (!form.latitude || !form.longitude || !form.locationName.trim()) {
      setError('请填写位置信息');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await helpApi.createRequest(form);
      navigate(`/help/${res.helpRequest.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>✏️</span> 发布求助
        </h1>
        <p className="text-gray-500 text-sm mt-1">好邻居，齐互助 · 让社区更温暖</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            选择求助类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {types.map((t) => (
              <button
                type="button"
                key={t.v}
                onClick={() => update('type', t.v)}
                className={`relative p-5 rounded-xl text-left transition-all border-2 ${
                  form.type === t.v
                    ? 'border-transparent shadow-lg'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {form.type === t.v && (
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${t.c} opacity-10`} />
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.c} flex items-center justify-center text-2xl mb-3`}>
                  {t.l.split(' ')[0]}
                </div>
                <div className="font-bold text-gray-800">{t.l.split(' ').slice(1).join(' ')}</div>
                <div className="text-sm text-gray-500 mt-1">{t.d}</div>
                {form.type === t.v && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Urgency */}
        {form.type === 'EMERGENCY' && (
          <Card className="p-6 mb-6 bg-red-50/30 border border-red-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ⚡ 紧急程度
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => update('urgency', u)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    form.urgency === u
                      ? u === 1
                        ? 'border-yellow-400 bg-yellow-50'
                        : u === 2
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-red-500 bg-red-100 animate-pulse'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1">{u === 1 ? '😊' : u === 2 ? '😟' : '🚨'}</div>
                  <div className="font-semibold text-sm">
                    {u === 1 ? '一般' : u === 2 ? '较急' : '非常紧急'}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Title & Content */}
        <Card className="p-6 mb-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="一句话描述你的需求..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
              maxLength={50}
            />
            <div className="text-right text-xs text-gray-400 mt-1">{form.title.length}/50</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              详细内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="请详细描述你的需求，例如物品规格、技能要求、具体情况等..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none leading-relaxed"
            />
          </div>
        </Card>

        {/* Location */}
        <Card className="p-6 mb-6 space-y-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📍</span> 位置信息
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">地点名称</label>
              <input
                type="text"
                value={form.locationName}
                onChange={(e) => update('locationName', e.target.value)}
                placeholder="如：望京西园三区北门"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">广播范围</label>
              <select
                value={form.radiusMeters}
                onChange={(e) => update('radiusMeters', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value={500}>500米（小区内）</option>
                <option value={1000}>1公里（周边）</option>
                <option value={2000}>2公里（社区）</option>
                <option value={3000}>3公里（街道）</option>
                <option value={5000}>5公里（全区域）</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl text-sm flex items-center justify-between">
            <div>
              <span className="text-gray-500">当前坐标：</span>
              <span className="font-mono text-gray-700">
                {form.latitude?.toFixed(6)}, {form.longitude?.toFixed(6) || '获取中...'}
              </span>
            </div>
            <button
              type="button"
              className="text-primary-600 hover:underline"
              onClick={() => {
                update('latitude', location?.latitude);
                update('longitude', location?.longitude);
                update('locationName', location?.locationName || '');
              }}
            >
              使用我的位置
            </button>
          </div>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur -mx-4 px-4 py-4 border-t border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
            <div className="text-sm text-gray-500 hidden md:block">
              🔒 内容将被审核，严禁发布虚假信息
            </div>
            <div className="flex gap-3 ml-auto">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                取消
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className={form.type === 'EMERGENCY' ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600' : ''}
              >
                {submitting ? '发布中...' : form.type === 'EMERGENCY' ? '🚨 紧急发布' : '🚀 发布求助'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateHelpPage;
