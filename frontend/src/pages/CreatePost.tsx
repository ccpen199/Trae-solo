import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { postApi, merchantApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Button, Card, Badge } from '../components/ui';
import type { Merchant } from '../types';
import { getPostTypeLabel } from '../utils/format';

const CreatePostPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, location: userLocation } = useAuthStore();
  const state = location.state as any;

  const [form, setForm] = useState({
    type: state?.defaultType || 'NEWS',
    title: '',
    content: '',
    merchantId: '',
    priceAnchor: '',
    hasProof: false,
    isPitfall: false,
    topics: '' as string,
    latitude: userLocation?.latitude,
    longitude: userLocation?.longitude,
    locationName: userLocation?.locationName || '',
    radiusMeters: 5000,
    enableResponseChain: true,
    enableSubscription: false,
    proofImage: '',
    urgency: 1,
    expireHours: 72,
    sourceLevel: 'ORDINARY',
    sourceOrg: '',
    riskLevel: 'LOW',
    pushScope: 'COMMUNITY',
    officialDoc: '',
  });
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      loadMerchants();
    }
  }, []);

  const loadMerchants = async () => {
    try {
      const res = await merchantApi.nearby({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        radius: 5000,
      });
      setMerchants(res.merchants || []);
    } catch {}
  };

  const update = (k: string, v: any) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('标题和内容不能为空');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const topics = form.topics
        ? form.topics.split(/[,，\s]+/).map(t => (t.startsWith('#') ? t : `#${t}`)).filter(Boolean)
        : undefined;

      const res = await postApi.create({
        ...form,
        priceAnchor: form.priceAnchor ? parseFloat(form.priceAnchor) : undefined,
        topics,
      });
      navigate(`/posts/${res.post.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const types = [
    { v: 'NEWS', l: '本地资讯', icon: '📰', desc: '分享社区新鲜事' },
    { v: 'REVIEW', l: '探店笔记', icon: '🍜', desc: '消费体验分享' },
    { v: 'NOTICE', l: '政务通知', icon: '📢', desc: '官方公告发布' },
    { v: 'EMERGENCY', l: '突发事件', icon: '🚨', desc: '紧急事件播报' },
    { v: 'ACTIVITY', l: '活动召集', icon: '🎉', desc: '组织社区活动' },
    { v: 'INFO', l: '便民信息', icon: 'ℹ️', desc: '实用信息共享' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">发布新内容</h1>
        <p className="text-gray-500">分享你的发现，连接更多邻里</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Type Selection */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-4">选择内容类型</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {types.map((t) => (
              <button
                type="button"
                key={t.v}
                onClick={() => update('type', t.v)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.type === t.v
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="font-semibold text-gray-800">{t.l}</div>
                <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Title */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder={`起个吸引人的标题...（当前类型：${getPostTypeLabel(form.type)}）`}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
            maxLength={100}
          />
          <div className="text-right text-xs text-gray-400 mt-1">{form.title.length}/100</div>
        </Card>

        {/* Content */}
        <Card className="p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">正文内容 *</label>
          <textarea
            value={form.content}
            onChange={(e) => update('content', e.target.value)}
            placeholder="详细描述你想分享的内容，图文并茂更容易获得关注哦~"
            rows={10}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none leading-relaxed"
          />
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
              />
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">
                📷 添加图片
              </span>
            </label>
            <span className="text-xs">(演示版本：图片为模拟占位)</span>
          </div>
        </Card>

        {/* Review Specific */}
        {form.type === 'REVIEW' && (
          <Card className="p-6 mb-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">探店专属设置</h3>
                <p className="text-sm text-gray-500">让你的分享更有参考价值</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">关联商户</label>
              <select
                value={form.merchantId}
                onChange={(e) => update('merchantId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">-- 选择商户（可选）--</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName}（{m.category}）
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 人均消费（元）
              </label>
              <input
                type="number"
                value={form.priceAnchor}
                onChange={(e) => update('priceAnchor', e.target.value)}
                placeholder="例如：75"
                className="w-full md:w-64 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📷 真实消费凭证
              </label>
              <div className="flex gap-3">
                <div
                  className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    form.proofImage ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  }`}
                  onClick={() => update('proofImage', form.proofImage ? '' : 'proof_demo')}
                >
                  {form.proofImage ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-xs text-primary-600 mt-1">已上传</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📷</span>
                      <span className="text-xs text-gray-500 mt-1">上传小票</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-auto">
                  <p>支持上传消费小票、支付截图</p>
                  <p>通过核验后将展示「真实消费」标识</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasProof}
                  onChange={(e) => update('hasProof', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <Badge className="bg-green-50 text-green-700">✅ 有真实消费凭证</Badge>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPitfall}
                  onChange={(e) => update('isPitfall', e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <Badge className="bg-red-50 text-red-700">⚠️ 避坑提醒（置顶）</Badge>
              </label>
            </div>
          </Card>
        )}

        {/* Emergency Specific */}
        {form.type === 'EMERGENCY' && (
          <Card className="p-6 mb-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">
                🚨
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">紧急事件设置</h3>
                <p className="text-sm text-gray-500">紧急内容将优先推送至周边用户</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">紧急程度</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update('urgency', level)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      form.urgency === level
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level === 1 && '一般'}
                    {level === 2 && '注意'}
                    {level === 3 && '重要'}
                    {level === 4 && '紧急'}
                    {level === 5 && '特急'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⚠️ 风险等级
                </label>
                <select
                  value={form.riskLevel}
                  onChange={(e) => update('riskLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="LOW">低风险</option>
                  <option value="MEDIUM">中风险</option>
                  <option value="HIGH">高风险</option>
                  <option value="CRITICAL">极高风险</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">预估风险等级将影响推送优先级</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ 有效期（小时）
                </label>
                <input
                  type="number"
                  value={form.expireHours}
                  onChange={(e) => update('expireHours', e.target.value)}
                  min="1"
                  max="168"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">超时后内容将自动转为历史状态</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📡 推送范围
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: 'BUILDING', l: '本楼栋', icon: '🏢' },
                  { v: 'COMMUNITY', l: '本社区', icon: '🏘️' },
                  { v: 'STREET', l: '街道范围', icon: '🛣️' },
                  { v: 'DISTRICT', l: '全区覆盖', icon: '🗺️' },
                  { v: 'CITY', l: '全市推送', icon: '🌆' },
                ].map(scope => (
                  <button
                    key={scope.v}
                    type="button"
                    onClick={() => update('pushScope', scope.v)}
                    className={`flex-1 min-w-[100px] py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                      form.pushScope === scope.v
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{scope.icon}</span>
                    {scope.l}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Notice Specific */}
        {form.type === 'NOTICE' && (
          <Card className="p-6 mb-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                📢
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">政务通知设置</h3>
                <p className="text-sm text-gray-500">官方认证内容将获得最高推送优先级</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏛️ 信源等级
                </label>
                <select
                  value={form.sourceLevel}
                  onChange={(e) => update('sourceLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="ORDINARY">普通用户</option>
                  <option value="V">实名认证个人</option>
                  <option value="OFFICIAL">官方机构</option>
                  <option value="GOV">政府部门</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">信源等级越高，推送权重越大</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 发布机构
                </label>
                <input
                  type="text"
                  value={form.sourceOrg}
                  onChange={(e) => update('sourceOrg', e.target.value)}
                  placeholder="如：望京街道办事处"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">政务通知必填发布机构名称</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📄 官方文件编号/文号
              </label>
              <input
                type="text"
                value={form.officialDoc}
                onChange={(e) => update('officialDoc', e.target.value)}
                placeholder="如：朝办发〔2024〕12号"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">填写官方文号可增强内容可信度</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📡 推送范围
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: 'COMMUNITY', l: '本社区', icon: '🏘️' },
                  { v: 'STREET', l: '街道范围', icon: '🛣️' },
                  { v: 'DISTRICT', l: '全区覆盖', icon: '🗺️' },
                  { v: 'CITY', l: '全市推送', icon: '🌆' },
                ].map(scope => (
                  <button
                    key={scope.v}
                    type="button"
                    onClick={() => update('pushScope', scope.v)}
                    className={`flex-1 min-w-[100px] py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                      form.pushScope === scope.v
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{scope.icon}</span>
                    {scope.l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">选择通知覆盖的地理范围</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-2">
                <span className="text-xl">🔐</span>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">政务通知审核说明</p>
                  <p className="text-blue-600">
                    政务/官方内容需经过人工复审后方可发布，审核通过后将获得
                    <span className="font-bold mx-1">最高优先级推送</span>
                    并在列表顶部置顶展示。
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* LBS & Response Settings */}
        <Card className="p-6 mb-6 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">📍 LBS 广播范围</h3>
            <p className="text-sm text-gray-500">设置内容可见的地理范围</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              广播半径
            </label>
            <div className="flex gap-2">
              {[1000, 3000, 5000, 10000, 50000].map(radius => (
                <button
                  key={radius}
                  type="button"
                  onClick={() => update('radiusMeters', radius)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    form.radiusMeters === radius
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {radius < 1000 ? `${radius}m` : `${radius / 1000}km`}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={form.radiusMeters}
                onChange={(e) => update('radiusMeters', parseInt(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>500m</span>
                <span className="text-primary-500 font-medium">
                  当前：{form.radiusMeters < 1000 ? `${form.radiusMeters}m` : `${(form.radiusMeters / 1000).toFixed(1)}km`}
                </span>
                <span>50km</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableResponseChain}
                onChange={(e) => update('enableResponseChain', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">🔗 开启响应链（可被其他人接单/回应）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enableSubscription}
                onChange={(e) => update('enableSubscription', e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">🔔 允许订阅（更新时通知订阅者）</span>
            </label>
          </div>
        </Card>

        {/* Location & Topics */}
        <Card className="p-6 mb-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📍 位置信息
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.locationName || ''}
                onChange={(e) => update('locationName', e.target.value)}
                placeholder="地点名称（如：望京SOHO）"
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-500">
                <span>🌐</span>
                <span>
                  {form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4) || '定位中...'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏷️ 话题标签
            </label>
            <input
              type="text"
              value={form.topics}
              onChange={(e) => update('topics', e.target.value)}
              placeholder="多个话题用逗号分隔，如：望京美食探店, 周末好去处"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              热门推荐：#望京美食探店 #今日望京新鲜事 #邻里互助
            </p>
          </div>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="sticky bottom-0 bg-gray-50/95 backdrop-blur -mx-4 px-4 py-4 border-t border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
            <div className="text-sm text-gray-500 hidden md:block">
              <span className="text-yellow-500">🔒</span>
              发布后将经过AI审核，违规内容将被拦截
            </div>
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                取消
              </Button>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? '发布中...' : '🚀 立即发布'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePostPage;
