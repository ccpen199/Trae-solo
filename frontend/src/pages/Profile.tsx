import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { couponApi, helpApi, merchantApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Avatar, Badge, Tag, EmptyState, ProgressBar } from '../components/ui';
import type { UserCoupon, HelpRequest, HelpResponse, Merchant } from '../types';
import { formatDate, formatTime, formatCouponDiscount } from '../utils/format';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, logout, login } = useAuthStore();
  const [tab, setTab] = useState<'info' | 'posts' | 'coupons' | 'help' | 'merchant'>('info');
  const [demoLoginState, setDemoLoginState] = useState<'idle' | 'loading' | 'failed'>('idle');
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [myResponses, setMyResponses] = useState<HelpResponse[]>([]);
  const [myMerchant, setMyMerchant] = useState<Merchant | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    interestTags: '',
    locationName: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    autoLocation: true,
    waterNotice: true,
    powerNotice: true,
    busNotice: false,
    emergencyNotice: true,
    communityNotice: true,
    skillExchange: true,
    secondHand: true,
    emergency: false,
    voluntary: true,
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      nickname: user.nickname,
      interestTags: (user.interestTags || []).join(', '),
      locationName: user.locationName || '',
      latitude: user.latitude,
      longitude: user.longitude,
      autoLocation: user.autoLocation !== false,
      waterNotice: user.subscriptionPrefs?.waterNotice !== false,
      powerNotice: user.subscriptionPrefs?.powerNotice !== false,
      busNotice: user.subscriptionPrefs?.busNotice || false,
      emergencyNotice: user.subscriptionPrefs?.emergencyNotice !== false,
      communityNotice: user.subscriptionPrefs?.communityNotice !== false,
      skillExchange: user.helpAbility?.skillExchange !== false,
      secondHand: user.helpAbility?.secondHand !== false,
      emergency: user.helpAbility?.emergency || false,
      voluntary: user.helpAbility?.voluntary !== false,
    });
    loadMyData();
  }, [user, tab]);

  useEffect(() => {
    if (user || demoLoginState !== 'idle') return;
    setDemoLoginState('loading');
    login('13900000000', '123456')
      .then(() => setDemoLoginState('idle'))
      .catch(() => setDemoLoginState('failed'));
  }, [user, demoLoginState, login]);

  const loadMyData = async () => {
    try {
      const [cRes, rRes, resRes] = await Promise.all([
        couponApi.myList(),
        helpApi.myRequests(),
        helpApi.myResponses(),
      ]);
      setCoupons(cRes.coupons || []);
      setMyRequests(rRes.helpRequests || []);
      setMyResponses(resRes.responses || []);

      if (user?.role === 'MERCHANT') {
        const merchants = await merchantApi.nearby({
          latitude: 39.9042,
          longitude: 116.4074,
          radius: 50000,
        });
        const mine = (merchants.merchants || []).find((m: Merchant) => m.userId === user.id);
        setMyMerchant(mine || null);
      }
    } catch {}
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        nickname: form.nickname,
        interestTags: form.interestTags.split(/[,，\s]+/).filter(Boolean),
        locationName: form.locationName,
        latitude: form.latitude,
        longitude: form.longitude,
        autoLocation: form.autoLocation,
        subscriptionPrefs: {
          waterNotice: form.waterNotice,
          powerNotice: form.powerNotice,
          busNotice: form.busNotice,
          emergencyNotice: form.emergencyNotice,
          communityNotice: form.communityNotice,
        },
        helpAbility: {
          skillExchange: form.skillExchange,
          secondHand: form.secondHand,
          emergency: form.emergency,
          voluntary: form.voluntary,
        },
      });
      setEditing(false);
      alert('✅ 资料更新成功');
    } catch (err: any) {
      alert(err.response?.data?.error || '更新失败');
    }
  };

  const handleUseCoupon = async (id: string) => {
    if (!confirm('确认核销此优惠券？')) return;
    try {
      await couponApi.use(id);
      alert('✅ 核销成功！');
      loadMyData();
    } catch (err: any) {
      alert(err.response?.data?.error || '核销失败');
    }
  };

  if (!user) {
    if (demoLoginState === 'loading') {
      return (
        <div className="max-w-3xl mx-auto py-16">
          <Card className="p-10 text-center">
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-gray-800">个人中心演示账号登录中...</h2>
            <p className="text-sm text-gray-500 mt-2">正在加载我的优惠券、互助和账户资料。</p>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto py-16">
        <EmptyState
          icon="👤"
          title="请先登录"
          description="登录后查看个人中心"
        />
        <div className="text-center mt-6">
          <Button onClick={() => navigate('/login')}>去登录</Button>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, { label: string; color: string; icon: string }> = {
    CITIZEN: { label: '市民用户', color: 'bg-blue-100 text-blue-700', icon: '👤' },
    MERCHANT: { label: '认证商户', color: 'bg-orange-100 text-orange-700', icon: '🏪' },
    ADMIN: { label: '系统管理员', color: 'bg-red-100 text-red-700', icon: '🛡️' },
    GOVERNMENT: { label: '政务账号', color: 'bg-purple-100 text-purple-700', icon: '🏛️' },
  };

  const roleInfo = roleLabels[user.role];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden p-0">
        <div className="h-40 bg-gradient-to-br from-primary-400 via-primary-500 to-blue-600 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.2),transparent_50%)]" />
        </div>
        <div className="px-6 md:px-8 pb-6 -mt-16 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-32 h-32 rounded-3xl bg-white shadow-2xl border-4 border-white flex items-center justify-center text-6xl overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nickname} className="w-full h-full object-cover" />
              ) : (
                user.nickname[0]
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.nickname}</h1>
                <Badge className={`${roleInfo.color} text-sm px-3 py-1`}>
                  {roleInfo.icon} {roleInfo.label}
                </Badge>
                {user.isVerified && (
                  <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">
                    ✓ 实名认证
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                <span>📞 {user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                {user.locationName && <span>📍 {user.locationName}</span>}
                <span className="flex items-center gap-1">
                  💳 信用分 <span className="font-bold text-primary-600">{user.creditScore}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2 pb-2">
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  编辑资料
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    取消
                  </Button>
                  <Button onClick={handleSave}>保存</Button>
                </>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin">
                  <Button variant="outline">后台管理</Button>
                </Link>
              )}
              <Button variant="danger" onClick={logout}>退出</Button>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="mt-6 p-5 bg-gray-50 rounded-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">常去地点</label>
                  <input
                    type="text"
                    value={form.locationName}
                    onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* LBS Location */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      📍 LBS 自动定位
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">开启后将自动获取您的位置并推送周边内容</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.autoLocation}
                      onChange={(e) => setForm({ ...form, autoLocation: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                {form.autoLocation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">纬度</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.latitude ?? ''}
                        onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || undefined })}
                        placeholder="如：39.9939"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">经度</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.longitude ?? ''}
                        onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || undefined })}
                        placeholder="如：116.4778"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 兴趣标签（多个用逗号分隔）
                </label>
                <input
                  type="text"
                  value={form.interestTags}
                  onChange={(e) => setForm({ ...form, interestTags: e.target.value })}
                  placeholder="如：美食, 探店, 健身, 旅游"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">兴趣标签将用于推荐算法，权重越高的内容优先展示</p>
              </div>

              {/* Subscription Preferences */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🔔 便民服务订阅偏好
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { k: 'waterNotice', l: '停水通知', icon: '💧' },
                    { k: 'powerNotice', l: '停电通知', icon: '⚡' },
                    { k: 'busNotice', l: '公交动态', icon: '🚌' },
                    { k: 'emergencyNotice', l: '突发事件', icon: '🚨' },
                    { k: 'communityNotice', l: '社区公告', icon: '🏘️' },
                  ].map(item => (
                    <label
                      key={item.k}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        (form as any)[item.k] ? 'bg-white shadow-sm' : 'bg-white/50'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="flex-1 text-sm text-gray-700">{item.l}</span>
                      <input
                        type="checkbox"
                        checked={(form as any)[item.k]}
                        onChange={(e) => setForm({ ...form, [item.k]: e.target.checked } as any)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Help Ability */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  🤝 邻里互助能力
                </h4>
                <p className="text-xs text-gray-500 mb-3">勾选后将优先推荐对应类型的互助请求</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { k: 'skillExchange', l: '技能交换', icon: '💡', desc: '如：辅导作业、修电脑、教乐器等' },
                    { k: 'secondHand', l: '闲置置换', icon: '📦', desc: '如：物品转让、以物换物' },
                    { k: 'emergency', l: '紧急援助', icon: '🆘', desc: '如：临时看护、应急送医、困难帮扶' },
                    { k: 'voluntary', l: '志愿服务', icon: '❤️', desc: '如：社区活动、环保行动' },
                  ].map(item => (
                    <label
                      key={item.k}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        (form as any)[item.k] ? 'bg-white shadow-sm' : 'bg-white/50'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{item.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm text-gray-800 font-medium">{item.l}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={(form as any)[item.k]}
                        onChange={(e) => setForm({ ...form, [item.k]: e.target.checked } as any)}
                        className="w-4 h-4 text-green-600 rounded mt-1"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interest Tags Display */}
          {!editing && user.interestTags && user.interestTags.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium text-gray-500 mb-2">🎯 兴趣标签</div>
              <div className="flex flex-wrap gap-2">
                {user.interestTags.map((t, i) => (
                  <Tag key={i}>{t}</Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: '我的优惠券', v: coupons.length, i: '🎫', c: 'from-orange-400 to-red-500' },
          { l: '发布求助', v: myRequests.length, i: '📝', c: 'from-green-400 to-emerald-500' },
          { l: '帮助他人', v: myResponses.length, i: '🤝', c: 'from-blue-400 to-indigo-500' },
          { l: '信用等级', v: `${user.creditScore}分`, i: '⭐', c: 'from-purple-400 to-pink-500' },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center text-xl text-white mb-3`}>
              {s.i}
            </div>
            <div className="text-2xl font-bold text-gray-800">{s.v}</div>
            <div className="text-sm text-gray-500">{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {[
          { v: 'info', l: '📋 账户信息' },
          { v: 'coupons', l: `🎫 优惠券 (${coupons.length})` },
          { v: 'help', l: `🤝 我的互助 (${myRequests.length + myResponses.length})` },
          ...(user.role === 'MERCHANT' ? [{ v: 'merchant', l: '🏪 商户中心' }] : []),
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              tab === t.v
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'info' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-6">📋 基础信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { l: '用户ID', v: user.id, mono: true },
                  { l: '手机号', v: user.phone },
                  { l: '注册身份', v: roleInfo.label },
                  { l: '实名认证', v: user.isVerified ? '已认证 ✓' : '未认证' },
                  { l: '信用评分', v: `${user.creditScore} / 100` },
                  { l: 'LBS定位', v: user.autoLocation !== false ? '已开启' : '已关闭' },
                  { l: '常去地点', v: user.locationName || '未设置' },
                  { l: '地理坐标', v: user.latitude && user.longitude ? `${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}` : '未设置' },
                ].map((item) => (
                  <div key={item.l} className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">{item.l}</div>
                    <div className={`font-medium text-gray-800 ${item.mono ? 'font-mono text-sm' : ''}`}>
                      {item.v}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Interest Tags */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-4">🎯 兴趣画像</h3>
              {user.interestTags && user.interestTags.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {user.interestTags.map((t, i) => (
                      <Tag key={i} className="px-4 py-2">
                        {t}
                        <span className="ml-1 text-xs opacity-60">
                          {95 - (i % 6) * 10}%
                        </span>
                      </Tag>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">百分比表示该兴趣方向的权重值，用于个性化推荐计算</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">暂无兴趣标签，点击编辑资料添加</p>
              )}
            </Card>

            {/* Subscription Preferences */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-4">🔔 订阅偏好</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { k: 'waterNotice', l: '停水通知', icon: '💧' },
                  { k: 'powerNotice', l: '停电通知', icon: '⚡' },
                  { k: 'busNotice', l: '公交动态', icon: '🚌' },
                  { k: 'emergencyNotice', l: '突发事件', icon: '🚨' },
                  { k: 'communityNotice', l: '社区公告', icon: '🏘️' },
                ].map(item => {
                  const pref = (user.subscriptionPrefs as any)?.[item.k];
                  const enabled = pref !== false;
                  return (
                    <div key={item.k} className={`p-3 rounded-xl flex items-center gap-3 ${enabled ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <span className="text-xl">{item.icon}</span>
                      <span className="flex-1 text-sm text-gray-700">{item.l}</span>
                      <Badge className={enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {enabled ? '已订阅' : '未订阅'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Help Ability */}
            <Card className="p-6">
              <h3 className="font-bold text-gray-800 mb-4">🤝 邻里互助能力</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { k: 'skillExchange', l: '技能交换', icon: '💡', desc: '辅导作业、修电脑、教乐器等' },
                  { k: 'secondHand', l: '闲置置换', icon: '📦', desc: '物品转让、以物换物' },
                  { k: 'emergency', l: '紧急援助', icon: '🆘', desc: '临时看护、应急送医、困难帮扶' },
                  { k: 'voluntary', l: '志愿服务', icon: '❤️', desc: '社区活动、环保行动' },
                ].map(item => {
                  const ab = (user.helpAbility as any)?.[item.k];
                  const enabled = ab !== false;
                  return (
                    <div key={item.k} className={`p-3 rounded-xl flex items-start gap-3 ${enabled ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <span className="text-xl mt-0.5">{item.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800">{item.l}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                      <Badge className={enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}>
                        {enabled ? '可提供' : '暂不提供'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {tab === 'coupons' && (
          <div className="space-y-4">
            {coupons.length > 0 ? coupons.map((c) => {
              const isExpired = c.status === 'EXPIRED' || new Date(c.coupon.endDate) < new Date();
              const isUsed = c.status === 'USED';
              return (
                <Card
                  key={c.id}
                  className={`overflow-hidden p-0 ${isUsed || isExpired ? 'opacity-60' : ''}`}
                >
                  <div className="flex">
                    <div className={`w-32 flex-shrink-0 flex flex-col items-center justify-center text-white ${
                      isUsed ? 'bg-gray-400' : isExpired ? 'bg-gray-300' : 'bg-gradient-to-br from-red-500 via-orange-500 to-amber-500'
                    }`}>
                      <div className="text-2xl font-bold">
                        {formatCouponDiscount(c.coupon.discountType, c.coupon.discountValue)}
                      </div>
                      <div className="text-xs mt-1 opacity-80">
                        {isUsed ? '已使用' : isExpired ? '已过期' : c.coupon.minSpend > 0 ? `满${c.coupon.minSpend}用` : '无门槛'}
                      </div>
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800">{c.coupon.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{c.coupon.description}</p>
                          <div className="text-xs text-gray-400 mt-2">
                            🏪 {c.coupon.merchant.businessName} · 有效期至 {formatDate(c.coupon.endDate)}
                          </div>
                          {isUsed && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ 已于 {formatDate(c.usedAt!)} 使用
                            </div>
                          )}
                        </div>
                        {!isUsed && !isExpired && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUseCoupon(c.coupon.id)}
                          >
                            核销
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }) : (
              <Card className="p-10">
                <EmptyState
                  icon="🎫"
                  title="还没有优惠券"
                  description="去周边商户逛逛，发现更多优惠吧～"
                />
                <div className="text-center mt-4">
                  <Button onClick={() => navigate('/merchants')}>发现优惠</Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📝</span> 我发布的求助 ({myRequests.length})
              </h3>
              {myRequests.length > 0 ? (
                <div className="space-y-3">
                  {myRequests.map((r) => (
                    <Card
                      key={r.id}
                      onClick={() => navigate(`/help/${r.id}`)}
                      className="p-4 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Tag>{formatDate(r.createdAt)}</Tag>
                            <span className="font-semibold text-gray-800">{r.title}</span>
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">{r.content}</div>
                        </div>
                        <Badge className="bg-primary-100 text-primary-700">
                          {r.responses?.length || 0} 响应
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8"><EmptyState icon="📝" title="还没有发布过求助" /></Card>
              )}
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🤝</span> 我帮助过的 ({myResponses.length})
              </h3>
              {myResponses.length > 0 ? (
                <div className="space-y-3">
                  {myResponses.map((r: any) => (
                    <Card
                      key={r.id}
                      onClick={() => navigate(`/help/${r.requestId}`)}
                      className="p-4 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">{formatTime(r.createdAt)}</div>
                          <div className="text-sm text-gray-700 line-clamp-1">💬 {r.content}</div>
                        </div>
                        {r.isAccepted && (
                          <Badge className="bg-green-100 text-green-700">✓ 被采纳</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8">
                  <EmptyState icon="🤝" title="还没有帮助过别人" description="去互助区看看有没有能帮上忙的吧～" />
                </Card>
              )}
            </div>
          </div>
        )}

        {tab === 'merchant' && (
          <div className="space-y-6">
            {myMerchant ? (
              <>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <span>🏪</span> 我的商户
                    </h3>
                    <div className="flex gap-2">
                      <Link to={`/merchants/${myMerchant.id}`}>
                        <Button variant="outline" size="sm">前台页面</Button>
                      </Link>
                      <Link to={`/admin/merchant/${myMerchant.id}`}>
                        <Button size="sm">数据分析</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <div className="text-sm text-orange-600 mb-1">商户评分</div>
                      <div className="text-2xl font-bold text-orange-700">⭐ {myMerchant.rating}</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="text-sm text-blue-600 mb-1">评价数量</div>
                      <div className="text-2xl font-bold text-blue-700">{myMerchant.reviewCount}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="text-sm text-green-600 mb-1">上架优惠券</div>
                      <div className="text-2xl font-bold text-green-700">{myMerchant.coupons?.length || 0}</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-gray-800 mb-4">🎫 优惠券管理</h3>
                  <div className="space-y-3">
                    {myMerchant.coupons?.map((c: any) => {
                      const progress = (c.claimedQuantity / c.totalQuantity) * 100;
                      return (
                        <div key={c.id} className="p-4 border border-gray-100 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{c.title}</div>
                            <Badge className="bg-green-100 text-green-700">
                              核销率 {c.claimedQuantity > 0 ? `${Math.round(((c.userCoupons?.filter((u: any) => u.status === 'USED').length || 0) / c.claimedQuantity * 100))}%` : '0%'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mb-3">{c.description}</div>
                          <ProgressBar value={progress} />
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>领取 {c.claimedQuantity}/{c.totalQuantity}</span>
                            <span>
                              已使用 {c.userCoupons?.filter((u: any) => u.status === 'USED').length || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {(!myMerchant.coupons || myMerchant.coupons.length === 0) && (
                      <p className="text-gray-400 text-center py-6">暂无优惠券</p>
                    )}
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-10">
                <EmptyState icon="🏪" title="您还没有商户资料" description="提交商户入驻申请，开始经营您的店铺" />
                <div className="text-center mt-6">
                  <Button onClick={() => navigate('/merchants')}>申请入驻</Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
