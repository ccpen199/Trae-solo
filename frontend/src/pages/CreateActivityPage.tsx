import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityApi, couponApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { ActivityCreateInput, Coupon } from '../types';

export default function CreateActivityPage() {
  const navigate = useNavigate();
  const { currentUser, showToast } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<ActivityCreateInput>({
    title: '',
    description: '',
    category: 'food',
    tags: [],
    location: {
      name: '',
      address: '',
      latitude: 39.9,
      longitude: 116.4,
      city: currentUser?.location.city || '北京'
    },
    startTime: '',
    endTime: '',
    meetingTime: '',
    maxParticipants: 6,
    minParticipants: 2,
    feePerPerson: 0,
    genderPreference: 'any',
    ageRange: { min: 20, max: 40 },
    minCreditScore: 650
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location.name) {
      showToast('请填写活动标题和地点', 'error');
      return;
    }
    if (!form.startTime || !form.endTime) {
      showToast('请选择活动时间', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await activityApi.create({
        ...form,
        startTime: new Date(form.startTime),
        endTime: new Date(form.endTime),
        meetingTime: form.meetingTime ? new Date(form.meetingTime) : new Date(new Date(form.startTime).getTime() - 1800000),
        couponId: selectedCoupon || undefined
      } as never);
      showToast('活动创建成功！', 'success');
      const r = res as unknown as { id: string };
      navigate(`/activities/${r.id}`);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await couponApi.list({ city: form.location.city, pageSize: 10 });
      setCoupons((res as unknown as { items: Coupon[] }).items || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">🎉 发起新组局</h1>

      <form onSubmit={handleSubmit} className="card card-body space-y-6">
        <div className="grid grid-2 gap-4">
          <div className="form-group">
            <label className="form-label">活动标题 *</label>
            <input className="input" placeholder="例如：周末三里屯火锅局" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">活动类型</label>
            <select className="input" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as never }))}>
              <option value="food">🍜 美食</option>
              <option value="sports">⚽ 运动</option>
              <option value="movie">🎬 影视</option>
              <option value="travel">✈️ 旅行</option>
              <option value="study">📚 学习</option>
              <option value="game">🎮 游戏</option>
              <option value="music">🎵 音乐</option>
              <option value="outdoor">🏕️ 户外</option>
              <option value="party">🥳 派对</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">活动描述 *</label>
          <textarea className="input" rows={4} value={form.description}
            placeholder="介绍一下活动内容、预期效果、注意事项等"
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="text-xs text-gray-400 mt-1">系统会自动进行内容风控审核，违规内容会被拦截</div>
        </div>

        <div className="grid grid-2 gap-4">
          <div className="form-group">
            <label className="form-label">活动地点名称 *</label>
            <input className="input" placeholder="如：海底捞（三里屯店）" value={form.location.name}
              onChange={e => setForm(f => ({ ...f, location: { ...f.location, name: e.target.value } }))} />
          </div>
          <div className="form-group">
            <label className="form-label">详细地址</label>
            <input className="input" placeholder="街道门牌号" value={form.location.address}
              onChange={e => setForm(f => ({ ...f, location: { ...f.location, address: e.target.value } }))} />
          </div>
        </div>

        <div className="grid grid-2 gap-4">
          <div className="form-group">
            <label className="form-label">开始时间 *</label>
            <input type="datetime-local" className="input" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">结束时间 *</label>
            <input type="datetime-local" className="input" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-3 gap-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="form-group">
            <label className="form-label">人数上限</label>
            <input type="number" className="input" min={2} max={50} value={form.maxParticipants}
              onChange={e => setForm(f => ({ ...f, maxParticipants: parseInt(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">成行人限</label>
            <input type="number" className="input" min={2} max={form.maxParticipants} value={form.minParticipants}
              onChange={e => setForm(f => ({ ...f, minParticipants: parseInt(e.target.value) }))} />
          </div>
          <div className="form-group">
            <label className="form-label">费用/人 (元)</label>
            <input type="number" className="input" min={0} value={form.feePerPerson}
              onChange={e => setForm(f => ({ ...f, feePerPerson: parseFloat(e.target.value) || 0 }))} />
          </div>
        </div>

        <div className="grid grid-2 gap-4">
          <div className="form-group">
            <label className="form-label">性别偏好</label>
            <select className="input" value={form.genderPreference}
              onChange={e => setForm(f => ({ ...f, genderPreference: e.target.value as never }))}>
              <option value="any">不限</option>
              <option value="balanced">男女均衡</option>
              <option value="male_only">仅限男性</option>
              <option value="female_only">仅限女性</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">最低信用分: {form.minCreditScore}</label>
            <input type="range" className="w-full mt-1" min={500} max={800} step={50}
              value={form.minCreditScore}
              onChange={e => setForm(f => ({ ...f, minCreditScore: parseInt(e.target.value) }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">活动标签</label>
          <div className="flex gap-2">
            <input className="input" value={tagInput} placeholder="回车添加标签"
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
            <button type="button" onClick={addTag} className="btn btn-secondary">添加</button>
          </div>
          <div className="mt-2">
            {form.tags.map((t, i) => (
              <span key={t} className="tag tag-primary mr-2 cursor-pointer"
                onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))}>
                {t} ×
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            🎫 关联小壶优选团购券
            <button type="button" className="text-xs text-indigo-600 hover:underline"
              onClick={loadCoupons}>加载可关联券</button>
          </label>
          <select className="input" value={selectedCoupon}
            onChange={e => setSelectedCoupon(e.target.value)}>
            <option value="">不关联优惠券</option>
            {coupons.map(c => (
              <option key={c.id} value={c.id}>{c.title} (省¥{c.originalPrice - c.discountedPrice})</option>
            ))}
          </select>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
          <div className="font-medium mb-2">🔒 风控承诺</div>
          <ul className="space-y-1 text-xs">
            <li>• 参与者需满足信用分要求才能报名</li>
            <li>• 活动内容经敏感词系统自动审核</li>
            <li>• 建议开启平安哨守护功能保障出行安全</li>
            <li>• 活动结束后可互相评价，影响信用分动态调整</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary btn-lg flex-1" disabled={loading}>
            {loading ? '创建中...' : '🚀 发起组局'}
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/activities')}>取消</button>
        </div>
      </form>
    </div>
  );
}
