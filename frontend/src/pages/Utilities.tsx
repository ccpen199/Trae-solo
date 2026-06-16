import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { utilityApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Badge, Tag, EmptyState, ProgressBar, Icon } from '../components/ui';
import type { BusStation, TestSite, UtilityUpdate, UtilityService } from '../types';
import { formatDateTime, formatDistance, formatTime } from '../utils/format';

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

const UtilitiesPage: React.FC = () => {
  const { location, user } = useAuthStore();
  const [tab, setTab] = useState<'notice' | 'bus' | 'test' | 'service'>('notice');
  const [stations, setStations] = useState<BusStation[]>([]);
  const [testSites, setTestSites] = useState<TestSite[]>([]);
  const [updates, setUpdates] = useState<UtilityUpdate[]>([]);
  const [services, setServices] = useState<UtilityService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [location, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!location?.latitude || !location?.longitude) return;
      const params = { latitude: location.latitude, longitude: location.longitude };

      const [uRes, sRes] = await Promise.all([
        utilityApi.updates(),
        utilityApi.services(),
      ]);
      setUpdates(uRes.updates || []);
      setServices(sRes.services || []);

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

      {/* Notice Tab */}
      {tab === 'notice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">📢 停水停电及民生公告</h2>
            {user && (
              <Button variant="outline" size="sm" onClick={() => utilityApi.subscribe('EMERGENCY')}>
                🔔 一键订阅全部
              </Button>
            )}
          </div>

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
              {updates.map((u) => (
                <Card
                  key={u.id}
                  className={`p-5 border-l-4 ${
                    u.severity >= 3
                      ? 'border-l-red-500 bg-red-50/30'
                      : u.severity >= 2
                      ? 'border-l-yellow-500 bg-yellow-50/30'
                      : 'border-l-blue-500 bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        u.service?.type === 'POWER_NOTICE'
                          ? 'bg-yellow-100'
                          : u.service?.type === 'WATER_NOTICE'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        {u.service?.type === 'POWER_NOTICE' ? '⚡' : u.service?.type === 'WATER_NOTICE' ? '💧' : '📢'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{u.title}</h3>
                          {u.severity >= 3 && (
                            <Badge className="bg-red-500 text-white animate-pulse">重要</Badge>
                          )}
                          {u.severity >= 2 && u.severity < 3 && (
                            <Badge className="bg-yellow-500 text-white">注意</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {u.service?.name} · 发布于 {formatTime(u.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Tag>📍 {u.locationScope}</Tag>
                  </div>

                  <p className="text-gray-700 mt-4 leading-relaxed p-4 bg-white/60 rounded-xl">
                    {u.content}
                  </p>

                  {(u.startTime || u.endTime) && (
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <Badge className="bg-indigo-50 text-indigo-700">
                        📅 开始：{u.startTime && formatDateTime(u.startTime)}
                      </Badge>
                      {u.endTime && (
                        <Badge className="bg-indigo-50 text-indigo-700">
                          📅 结束：{formatDateTime(u.endTime)}
                        </Badge>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon="📭" title="暂无公告" description="近期一切正常，请安心生活～" />
          )}
        </div>
      )}

      {/* Bus Tab */}
      {tab === 'bus' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-800">🚌 周边公交实时到站</h2>

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
                {stations.length > 0 ? stations.map((s) => (
                  <Card key={s.id} className="p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 text-lg">
                            <span className="mr-2">🚌</span>{s.name}
                          </h3>
                        </div>
                        <div className="text-sm text-primary-600 mt-1">
                          📍 {formatDistance(s.distance)}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1">
                        {s.predictions.length}条线路
                      </Badge>
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
                )) : (
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
          <h2 className="text-lg font-bold text-gray-800">🧪 周边核酸检测点</h2>

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
                {testSites.length > 0 ? testSites.map((s) => (
                  <Card key={s.id} className="p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-gray-800">{s.name}</h3>
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
                      <div className="text-xs text-gray-500">
                        ⏰ 营业时间：{s.hours}
                      </div>
                      <Button size="sm" variant="outline">导航前往</Button>
                    </div>
                  </Card>
                )) : (
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
            ].map((s) => (
              <Card key={s.t} className="p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-3xl">
                    {s.i}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{s.l}</h3>
                    <p className="text-sm text-gray-500 mt-1">{s.d}</p>
                    <div className="mt-4">
                      {user ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            utilityApi.subscribe(s.t);
                            alert(`✅ 已订阅「${s.l}」`);
                          }}
                        >
                          🔔 立即订阅
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">登录后可订阅</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
