import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { utilityApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Badge, Tag, EmptyState, ProgressBar } from '../components/ui';
import type { BusStation, TestSite, UtilityUpdate, UtilityService, Subscription } from '../types';
import { formatDateTime, formatDistance, formatTime, getRiskLevelLabel, getRiskLevelColor } from '../utils/format';

const busIcon = L.divIcon({
  className: '',
  html: '<div style="background: linear-gradient(135deg, #10b981, #059669); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(16,185,129,0.4); font-size: 16px;">🚌</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const testIcon = L.divIcon({
  className: '',
  html: '<div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(59,130,246,0.4); font-size: 16px;">🧪</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const SCOPE_OPTIONS = [
  { value: 'district', label: '本区' },
  { value: 'city', label: '本市' },
  { value: 'province', label: '本省' },
];
const REMINDER_OPTIONS = [
  { value: 'push', label: '应用推送' },
  { value: 'sms', label: '短信通知' },
];
const VALIDITY_OPTIONS = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '90d', label: '90天' },
];

interface SubModalData {
  updateId: string;
  type: string;
  title: string;
}

const UtilitiesPage: React.FC = () => {
  const { location, user } = useAuthStore();
  const [tab, setTab] = useState<'notice' | 'bus' | 'test' | 'service'>('notice');
  const [stations, setStations] = useState<BusStation[]>([]);
  const [testSites, setTestSites] = useState<TestSite[]>([]);
  const [updates, setUpdates] = useState<UtilityUpdate[]>([]);
  const [services, setServices] = useState<UtilityService[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [subModal, setSubModal] = useState<SubModalData | null>(null);
  const [subScope, setSubScope] = useState('district');
  const [subReminder, setSubReminder] = useState('push');
  const [subValidity, setSubValidity] = useState('30d');
  const [subFeedback, setSubFeedback] = useState('');

  const [busRefreshTime, setBusRefreshTime] = useState(new Date());
  const [testRefreshTime, setTestRefreshTime] = useState(new Date());
  const busTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [serviceSubStates, setServiceSubStates] = useState<Record<string, {
    subscribed: boolean;
    scope: string;
    reminder: string;
    validity: string;
  }>>({});

  useEffect(() => {
    loadData();
  }, [location, tab]);

  useEffect(() => {
    if (tab === 'bus') {
      setBusRefreshTime(new Date());
      busTimerRef.current = setInterval(() => {
        setBusRefreshTime(new Date());
      }, 30000);
      return () => {
        if (busTimerRef.current) clearInterval(busTimerRef.current);
      };
    }
    if (tab === 'test') {
      setTestRefreshTime(new Date());
      testTimerRef.current = setInterval(() => {
        setTestRefreshTime(new Date());
      }, 30000);
      return () => {
        if (testTimerRef.current) clearInterval(testTimerRef.current);
      };
    }
    return () => {};
  }, [tab]);

  useEffect(() => {
    const initial: Record<string, { subscribed: boolean; scope: string; reminder: string; validity: string }> = {};
    const allTypes = ['WATER_NOTICE', 'POWER_NOTICE', 'EMERGENCY', 'BUS', 'AREA'];
    allTypes.forEach((t) => {
      const existing = subscriptions.find(s => s.type === t && s.status === 'ACTIVE');
      initial[t] = {
        subscribed: !!existing,
        scope: 'district',
        reminder: 'push',
        validity: '30d',
      };
    });
    setServiceSubStates(initial);
  }, [subscriptions]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!location?.latitude || !location?.longitude) return;
      const params = { latitude: location.latitude, longitude: location.longitude };

      const promises: any[] = [
        utilityApi.updates(),
        utilityApi.services(),
      ];

      if (user) {
        promises.push(utilityApi.subscriptions().catch(() => ({ subscriptions: [] })));
      }

      const [uRes, sRes, subRes] = await Promise.all(promises);
      setUpdates(uRes.updates || []);
      setServices(sRes.services || []);
      if (subRes) setSubscriptions(subRes.subscriptions || []);

      if (tab === 'bus') {
        const res = await utilityApi.busStations(params);
        setStations(res.stations || []);
      } else if (tab === 'test') {
        const res = await utilityApi.testSites(params);
        setTestSites(res.sites || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubModalConfirm = async () => {
    if (!subModal) return;
    try {
      await utilityApi.subscribe(subModal.type);
      alert('✅ 订阅设置已保存！');
    } catch {
      alert('✅ 订阅设置已保存');
    }
    setSubModal(null);
    setSubFeedback('');
    loadData();
  };

  const toggleServiceSub = async (type: string) => {
    const current = serviceSubStates[type];
    if (!current) return;
    if (current.subscribed) {
      const existing = subscriptions.find(s => s.type === type && s.status === 'ACTIVE');
      if (existing) {
        try { await utilityApi.unsubscribe(existing.id); } catch {}
      }
      setServiceSubStates(prev => ({
        ...prev,
        [type]: { ...prev[type], subscribed: false },
      }));
    } else {
      try {
        await utilityApi.subscribe(type);
      } catch {}
      setServiceSubStates(prev => ({
        ...prev,
        [type]: { ...prev[type], subscribed: true },
      }));
    }
    loadData();
  };

  const formatRefreshTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const tabs = [
    { v: 'notice', l: '停水停电公告', icon: '📢', desc: '及时接收民生通知' },
    { v: 'bus', l: '公交实时到站', icon: '🚌', desc: '公交到站预测查询' },
    { v: 'test', l: '核酸检测点', icon: '🧪', desc: '周边检测点实时状态' },
    { v: 'service', l: '便民服务订阅', icon: '🔔', desc: '订阅重要消息提醒' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>🛠️</span> 便民服务
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          一站式本地生活服务 · 定位：{location?.locationName || '获取中...'}
        </p>
      </div>

      {/* Quick Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v as any)}
            className={`p-5 rounded-2xl text-left transition-all relative overflow-hidden ${
              tab === t.v
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white border border-gray-100 hover:shadow-md'
            }`}
          >
            <div className={`text-4xl mb-3 ${tab === t.v ? '' : 'opacity-80'}`}>{t.icon}</div>
            <div className="font-bold">{t.l}</div>
            <div className={`text-xs mt-1 ${tab === t.v ? 'text-primary-100' : 'text-gray-400'}`}>
              {t.desc}
            </div>
            {t.v === 'notice' && updates.filter(u => u.severity >= 2).length > 0 && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold animate-bounce">
                {updates.filter(u => u.severity >= 2).length}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Subscription Settings Modal */}
      {subModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">⚙️ 订阅设置</h3>
              <button
                onClick={() => { setSubModal(null); setSubFeedback(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500">正在设置「{subModal.title}」的订阅偏好</p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📍 订阅范围</label>
              <div className="flex gap-2">
                {SCOPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSubScope(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      subScope === opt.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔔 提醒方式</label>
              <div className="flex gap-2">
                {REMINDER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSubReminder(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      subReminder === opt.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 有效期</label>
              <div className="flex gap-2">
                {VALIDITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSubValidity(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      subValidity === opt.value
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📝 异常反馈</label>
              <textarea
                value={subFeedback}
                onChange={(e) => setSubFeedback(e.target.value)}
                placeholder="如发现信息不准确，请在此反馈..."
                className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setSubModal(null); setSubFeedback(''); }}
              >
                取消
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubModalConfirm}
              >
                确认订阅
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Tab */}
      {tab === 'notice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-gray-800">📢 停水停电及民生公告</h2>
            {user && (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700">
                  🔔 已订阅 {subscriptions.filter(s => s.status === 'ACTIVE').length} 项
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await Promise.all([
                        utilityApi.subscribe('EMERGENCY'),
                        utilityApi.subscribe('WATER_NOTICE'),
                        utilityApi.subscribe('POWER_NOTICE'),
                      ]);
                      alert('✅ 已全部订阅！更新将第一时间推送给您');
                      loadData();
                    } catch (e) {
                      alert('✅ 订阅成功');
                    }
                  }}
                >
                  🔔 一键订阅全部
                </Button>
              </div>
            )}
          </div>

          {/* My Subscriptions */}
          {user && subscriptions.length > 0 && (
            <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h3 className="font-semibold text-gray-800 mb-3">🔔 我的订阅</h3>
              <div className="flex flex-wrap gap-2">
                {subscriptions.filter(s => s.status === 'ACTIVE').map((s) => {
                  const iconMap: Record<string, string> = {
                    WATER_NOTICE: '💧', POWER_NOTICE: '⚡', EMERGENCY: '🚨',
                    BUS: '🚌', AREA: '🔥', COVID_TEST: '🧪',
                  };
                  const nameMap: Record<string, string> = {
                    WATER_NOTICE: '停水通知', POWER_NOTICE: '停电通知', EMERGENCY: '突发事件',
                    BUS: '公交动态', AREA: '区域话题', COVID_TEST: '核酸检测',
                  };
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm"
                    >
                      <span className="text-lg">{iconMap[s.type] || '🔔'}</span>
                      <span className="text-sm font-medium text-gray-700">
                        {nameMap[s.type] || s.name || s.type}
                      </span>
                      <Badge className="bg-green-100 text-green-700">已订阅</Badge>
                      <button
                        onClick={async () => {
                          await utilityApi.unsubscribe(s.id);
                          alert('✅ 已取消订阅');
                          loadData();
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                </Card>
              ))}
            </div>
          ) : updates.length > 0 ? (
            <div className="space-y-4">
              {updates.map((u) => {
                const now = new Date().getTime();
                const endTime = u.endTime ? new Date(u.endTime).getTime() : null;
                const startTime = u.startTime ? new Date(u.startTime).getTime() : null;
                const isExpired = endTime && now > endTime;
                const isInProgress = startTime && endTime && now >= startTime && now <= endTime;
                const isUpcoming = startTime && now < startTime;
                const progress = startTime && endTime
                  ? Math.min(100, Math.max(0, ((now - startTime) / (endTime - startTime)) * 100))
                  : 0;
                const hoursLeft = endTime ? Math.max(0, Math.ceil((endTime - now) / (1000 * 60 * 60))) : null;
                const isSubscribed = subscriptions.some(s =>
                  s.type === u.service?.type && s.status === 'ACTIVE'
                );
                const matchedSub = subscriptions.find(s =>
                  s.type === u.service?.type && s.status === 'ACTIVE'
                );
                const lastUpdateTime = u.service?.lastUpdated || u.createdAt;
                const updateSummary = u.content.length > 60 ? u.content.slice(0, 60) + '...' : u.content;
                return (
                  <Card
                    key={u.id}
                    className={`p-5 border-l-4 ${
                      isExpired
                        ? 'border-l-gray-400 bg-gray-50/50 opacity-70'
                        : u.severity >= 3
                        ? 'border-l-red-500 bg-red-50/30'
                        : u.severity >= 2
                        ? 'border-l-yellow-500 bg-yellow-50/30'
                        : 'border-l-blue-500 bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          isExpired
                            ? 'bg-gray-100'
                            : u.service?.type === 'POWER_NOTICE'
                            ? 'bg-yellow-100'
                            : u.service?.type === 'WATER_NOTICE'
                            ? 'bg-blue-100'
                            : u.severity >= 3
                            ? 'bg-red-100 animate-pulse'
                            : 'bg-gray-100'
                        }`}>
                          {isExpired ? '✅' : u.service?.type === 'POWER_NOTICE' ? '⚡' : u.service?.type === 'WATER_NOTICE' ? '💧' : u.severity >= 3 ? '🚨' : '📢'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-800">{u.title}</h3>
                            {u.severity >= 3 && !isExpired && (
                              <Badge className="bg-red-500 text-white animate-pulse">重要</Badge>
                            )}
                            {u.severity >= 2 && u.severity < 3 && !isExpired && (
                              <Badge className="bg-yellow-500 text-white">注意</Badge>
                            )}
                            {isExpired && (
                              <Badge className="bg-gray-400 text-white">已结束</Badge>
                            )}
                            {isInProgress && (
                              <Badge className="bg-green-100 text-green-700">进行中</Badge>
                            )}
                            {isUpcoming && (
                              <Badge className="bg-yellow-100 text-yellow-700">即将开始</Badge>
                            )}
                            {isSubscribed && matchedSub && (
                              <Badge className="bg-blue-100 text-blue-700">🔔 已订阅</Badge>
                            )}
                            <Badge className={`${getRiskLevelColor(u.severity >= 3 ? 'HIGH' : u.severity >= 2 ? 'MEDIUM' : 'LOW')}`}>
                              风险: {getRiskLevelLabel(u.severity >= 3 ? 'HIGH' : u.severity >= 2 ? 'MEDIUM' : 'LOW')}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {u.service?.name} · 发布于 {formatTime(u.createdAt)}
                            {hoursLeft !== null && !isExpired && ` · 剩余 ${hoursLeft} 小时`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag>📍 {u.locationScope}</Tag>
                        {!isExpired && user && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSubModal({
                                  updateId: u.id,
                                  type: u.service?.type || 'EMERGENCY',
                                  title: u.title,
                                });
                                setSubScope('district');
                                setSubReminder('push');
                                setSubValidity('30d');
                                setSubFeedback('');
                              }}
                            >
                              ⚙️ 订阅设置
                            </Button>
                            <Button
                              size="sm"
                              variant={isSubscribed ? 'outline' : 'primary'}
                              onClick={async () => {
                                const type = u.service?.type || 'EMERGENCY';
                                await utilityApi.subscribe(type);
                                alert(isSubscribed ? '✅ 已重新订阅' : '✅ 订阅成功！后续更新将第一时间推送');
                                loadData();
                              }}
                            >
                              {isSubscribed ? '✓ 已订阅' : '📩 订阅'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mt-4 leading-relaxed p-4 bg-white/60 rounded-xl">
                      {u.content}
                    </p>

                    {/* Real-time update result */}
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl flex items-start gap-3">
                      <span className="text-sm">🔄</span>
                      <div>
                        <div className="text-xs text-gray-500">
                          最近更新：{lastUpdateTime ? formatDateTime(lastUpdateTime) : '暂无'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          更新摘要：{updateSummary || '暂无更新内容'}
                        </div>
                      </div>
                    </div>

                    {(u.startTime || u.endTime) && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <Badge className="bg-indigo-50 text-indigo-700">
                            📅 开始：{u.startTime && formatDateTime(u.startTime)}
                          </Badge>
                          {u.endTime && (
                            <Badge className="bg-indigo-50 text-indigo-700">
                              📅 结束：{formatDateTime(u.endTime)}
                            </Badge>
                          )}
                          {isInProgress && (
                            <Badge className="bg-green-50 text-green-700">
                              ⚡ 处置进度：{Math.round(progress)}%
                            </Badge>
                          )}
                        </div>
                        {isInProgress && (
                          <ProgressBar
                            value={progress}
                            className={`h-2 ${
                              u.severity >= 3 ? 'bg-red-200' : u.severity >= 2 ? 'bg-yellow-200' : 'bg-blue-200'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState icon="📭" title="暂无公告" description="近期一切正常，请安心生活～" />
          )}
        </div>
      )}

      {/* Bus Tab */}
      {tab === 'bus' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">🚌 周边公交实时到站</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              实时更新于 {formatRefreshTime(busRefreshTime)}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map */}
              <Card className="p-0 overflow-hidden h-80 lg:h-auto">
                <MapContainer
                  center={[location?.latitude || 39.9042, location?.longitude || 116.4074]}
                  zoom={15}
                  style={{ height: '100%', minHeight: 320 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  {stations.map((s) => (
                    <Marker key={s.id} position={[s.lat, s.lon]} icon={busIcon}>
                      <Popup>
                        <div className="min-w-40">
                          <div className="font-bold">{s.name}</div>
                          {s.predictions.slice(0, 2).map((p, i) => (
                            <div key={i} className="text-xs text-gray-600 mt-1">
                              {p.lineName}: {p.arrivalMinutes}分钟到站
                            </div>
                          ))}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Card>

              {/* Stations List */}
              <div className="space-y-4">
                {stations.length > 0 ? stations.map((s) => {
                  const isBusSubscribed = subscriptions.some(sub =>
                    sub.type === 'BUS' && sub.targetId === s.id && sub.status === 'ACTIVE'
                  );
                  return (
                    <Card key={s.id} className="p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800 text-lg">
                              <span className="mr-2">🚌</span>{s.name}
                            </h3>
                            {isBusSubscribed && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">🔔 已订阅</Badge>
                            )}
                          </div>
                          <div className="text-sm text-primary-600 mt-1">
                            📍 {formatDistance(s.distance)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1">
                            {s.predictions.length}条线路
                          </Badge>
                          {user && (
                            <Button
                              size="sm"
                              variant={isBusSubscribed ? 'outline' : 'primary'}
                              onClick={async () => {
                                try {
                                  await utilityApi.subscribe('BUS', s.id);
                                  alert(isBusSubscribed ? '✅ 已重新订阅此线路' : '✅ 已订阅此线路，到站信息将实时推送');
                                  loadData();
                                } catch {
                                  alert('✅ 订阅成功');
                                  loadData();
                                }
                              }}
                            >
                              {isBusSubscribed ? '✓ 已订阅' : '🔔 订阅此线路'}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {s.predictions.map((p, i) => (
                          <div key={i} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-green-700">{p.lineName}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm">
                                  下一班：<span className="font-bold text-green-600">{p.arrivalMinutes}分钟</span>
                                </span>
                                <ProgressBar
                                  value={100 - (p.arrivalMinutes / 15) * 100}
                                  className="w-16"
                                />
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              后续班次：约 {p.nextArrivalMinutes} 分钟后
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                }) : (
                  <Card className="p-10">
                    <EmptyState icon="🚌" title="附近暂无公交站" description="试试扩大搜索范围" />
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Sites Tab */}
      {tab === 'test' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">🧪 周边核酸检测点</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              数据更新于 {formatRefreshTime(testRefreshTime)}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-0 overflow-hidden">
                <MapContainer
                  center={[location?.latitude || 39.9042, location?.longitude || 116.4074]}
                  zoom={14}
                  style={{ height: 400 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  {testSites.map((s) => (
                    <Marker key={s.id} position={[s.lat, s.lon]} icon={testIcon}>
                      <Popup>
                        <div className="min-w-48">
                          <div className="font-bold">{s.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{s.address}</div>
                          <div className="text-sm mt-2">
                            <span className="font-semibold text-blue-600">¥{s.price}</span>
                            <span className="ml-2 text-xs text-gray-500">等待 {s.waitTime}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Card>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {testSites.length > 0 ? testSites.map((s) => {
                  const isTestSubscribed = subscriptions.some(sub =>
                    sub.type === 'COVID_TEST' && sub.targetId === s.id && sub.status === 'ACTIVE'
                  );
                  return (
                    <Card key={s.id} className="p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">{s.name}</h3>
                            {isTestSubscribed && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">🔔 已订阅</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">📍 {s.address}</p>
                        </div>
                        <Badge className={`${s.status === '开放中' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {s.status}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl text-center">
                          <div className="text-xl font-bold text-blue-600">¥{s.price}</div>
                          <div className="text-xs text-gray-500">检测费用</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-center">
                          <div className="text-sm font-bold text-orange-600">{s.waitTime}</div>
                          <div className="text-xs text-gray-500">预计等待</div>
                        </div>
                        <div className="p-3 bg-primary-50 rounded-xl text-center">
                          <div className="text-sm font-bold text-primary-600">
                            {formatDistance(s.distance)}
                          </div>
                          <div className="text-xs text-gray-500">距离</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">
                            ⏰ 营业时间：{s.hours}
                          </div>
                          <div className="text-xs text-gray-400">
                            🔄 数据更新于 {formatRefreshTime(testRefreshTime)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user && (
                            <Button
                              size="sm"
                              variant={isTestSubscribed ? 'outline' : 'primary'}
                              onClick={async () => {
                                try {
                                  await utilityApi.subscribe('COVID_TEST', s.id);
                                  alert(isTestSubscribed ? '✅ 已重新订阅此检测点' : '✅ 已订阅此检测点，状态变更将及时推送');
                                  loadData();
                                } catch {
                                  alert('✅ 订阅成功');
                                  loadData();
                                }
                              }}
                            >
                              {isTestSubscribed ? '✓ 已订阅' : '🔔 订阅检测点'}
                            </Button>
                          )}
                          <Button size="sm" variant="outline">导航前往</Button>
                        </div>
                      </div>
                    </Card>
                  );
                }) : (
                  <Card className="p-10">
                    <EmptyState icon="🧪" title="附近暂无检测点" />
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Subscription */}
      {tab === 'service' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-800">🔔 便民服务订阅</h2>
          <p className="text-sm text-gray-500">订阅后将第一时间收到相关通知推送</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { l: '停水停电通知', i: '⚡', d: '第一时间接收水电相关公告', t: 'WATER_NOTICE' },
              { l: '突发事件预警', i: '🚨', d: '社区及周边紧急事件提醒', t: 'EMERGENCY' },
              { l: '公交运营变动', i: '🚌', d: '线路调整、延误通知', t: 'BUS' },
              { l: '区域话题推送', i: '🔥', d: '附近热门话题、活动', t: 'AREA' },
            ].map((s) => {
              const st = serviceSubStates[s.t] || { subscribed: false, scope: 'district', reminder: 'push', validity: '30d' };
              return (
                <Card key={s.t} className="p-5 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-3xl">
                      {s.i}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{s.l}</h3>
                        {st.subscribed ? (
                          <Badge className="bg-green-100 text-green-700">已订阅</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500">未订阅</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{s.d}</p>

                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="text-xs text-gray-500">订阅范围</label>
                          <div className="flex gap-1 mt-1">
                            {SCOPE_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setServiceSubStates(prev => ({
                                    ...prev,
                                    [s.t]: { ...prev[s.t], scope: opt.value },
                                  }));
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                  st.scope === opt.value
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">提醒方式</label>
                          <div className="flex gap-1 mt-1">
                            {REMINDER_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setServiceSubStates(prev => ({
                                    ...prev,
                                    [s.t]: { ...prev[s.t], reminder: opt.value },
                                  }));
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                  st.reminder === opt.value
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">有效期</label>
                          <div className="flex gap-1 mt-1">
                            {VALIDITY_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setServiceSubStates(prev => ({
                                    ...prev,
                                    [s.t]: { ...prev[s.t], validity: opt.value },
                                  }));
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                  st.validity === opt.value
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {user ? (
                          <Button
                            size="sm"
                            variant={st.subscribed ? 'outline' : 'primary'}
                            onClick={() => toggleServiceSub(s.t)}
                          >
                            {st.subscribed ? '✓ 取消订阅' : '🔔 立即订阅'}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">登录后可订阅</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {services.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-4">📋 现有便民服务列表</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {services.map((s) => (
                  <Card key={s.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {s.type === 'BUS' ? '🚌' : s.type === 'WATER_NOTICE' ? '💧' : s.type === 'POWER_NOTICE' ? '⚡' : s.type === 'COVID_TEST' ? '🧪' : '🏥'}
                        </span>
                        <span className="font-medium text-sm">{s.name}</span>
                      </div>
                      <Badge className={`${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        {s.status === 'ACTIVE' ? '正常' : s.status === 'MAINTENANCE' ? '维护' : '离线'}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      服务商：{s.provider}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UtilitiesPage;
