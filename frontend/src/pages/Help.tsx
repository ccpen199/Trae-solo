import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { helpApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Button, Avatar, Badge, EmptyState, Tag } from '../components/ui';
import type { HelpRequest } from '../types';
import {
  formatTime,
  formatDistance,
  getHelpTypeColor,
  getHelpTypeLabel,
  getHelpStatusColor,
  getHelpStatusLabel,
} from '../utils/format';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { location, user } = useAuthStore();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [activeType, setActiveType] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const types = [
    { v: '', l: '全部', icon: '🤝' },
    { v: 'EMERGENCY', l: '紧急求助', icon: '🚨' },
    { v: 'SECOND_HAND', l: '闲置置换', icon: '📦' },
    { v: 'SKILL_EXCHANGE', l: '技能交换', icon: '🎓' },
    { v: 'OTHER', l: '其他', icon: '📌' },
  ];

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      loadRequests();
    }
  }, [location, activeType, activeStatus]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await helpApi.listRequests({
        latitude: location!.latitude,
        longitude: location!.longitude,
        type: activeType || undefined,
        status: activeStatus || undefined,
      });
      setRequests(res.helpRequests || []);
    } finally {
      setLoading(false);
    }
  };

  const urgencyLabels = ['', '普通', '较急', '紧急'];
  const urgencyColors = ['', 'bg-gray-100 text-gray-600', 'bg-yellow-100 text-yellow-700', 'bg-red-100 text-red-700'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>🤝</span> 邻里互助
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            距离 {location?.locationName || '当前位置'} · 周边5公里 · {requests.length} 条求助
          </p>
        </div>
        {user && (
          <Button size="lg" onClick={() => navigate('/help/create')}>
            ✏️ 发布求助
          </Button>
        )}
      </div>

      {/* Emergency Banner */}
      {requests.filter(r => r.type === 'EMERGENCY' && r.status !== 'CLOSED').length > 0 && (
        <div className="p-5 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 rounded-2xl border border-red-200 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🚨</span>
            <div>
              <div className="font-bold text-red-700">
                当前有 {requests.filter(r => r.type === 'EMERGENCY' && r.status !== 'CLOSED').length} 条紧急求助
              </div>
              <p className="text-sm text-red-600/80">伸出援手，帮助有需要的邻居</p>
            </div>
            <Button variant="danger" className="ml-auto" onClick={() => setActiveType('EMERGENCY')}>
              立即查看
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: '待响应', v: requests.filter(r => r.status === 'OPEN').length, c: 'from-yellow-400 to-yellow-500' },
          { l: '处理中', v: requests.filter(r => r.status === 'IN_PROGRESS').length, c: 'from-blue-400 to-blue-500' },
          { l: '已解决', v: requests.filter(r => r.status === 'RESOLVED').length, c: 'from-green-400 to-green-500' },
          { l: '我的参与', v: 0, c: 'from-purple-400 to-purple-500' },
        ].map((s) => (
          <Card key={s.l} className="p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center text-white text-xl mb-3`}>
              ❤️
            </div>
            <div className="text-3xl font-bold text-gray-800">{s.v}</div>
            <div className="text-sm text-gray-500">{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {types.map((t) => (
            <button
              key={t.v}
              onClick={() => setActiveType(t.v)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeType === t.v
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                  : t.v === 'EMERGENCY'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{t.icon}</span>
              {t.l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
            <Tag
              key={s}
              active={activeStatus === s}
              onClick={() => setActiveStatus(s)}
            >
              {s ? getHelpStatusLabel(s) : '全部状态'}
            </Tag>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card
              key={r.id}
              className={`p-5 hover:shadow-lg transition-all cursor-pointer overflow-hidden relative ${
                r.type === 'EMERGENCY' ? 'border-2 border-red-200' : ''
              }`}
              onClick={() => navigate(`/help/${r.id}`)}
            >
              {r.type === 'EMERGENCY' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent" />
              )}

              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar src={r.user.avatar} name={r.user.nickname} />
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-lg">
                    📍
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getHelpTypeColor(r.type)}>
                        {getHelpTypeLabel(r.type)}
                      </Badge>
                      <Badge className={`${getHelpStatusColor(r.status)} text-white`}>
                        {getHelpStatusLabel(r.status)}
                      </Badge>
                      {r.urgency > 1 && (
                        <Badge className={urgencyColors[r.urgency]}>
                          ⚡ {urgencyLabels[r.urgency]}
                        </Badge>
                      )}
                    </div>
                    {r.distance !== undefined && (
                      <span className="text-sm text-primary-600 font-medium flex-shrink-0">
                        {formatDistance(r.distance)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mt-3 line-clamp-2">
                    {r.title}
                  </h3>
                  <p className="text-gray-600 mt-2 line-clamp-2">{r.content}</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="text-sm">👤</span>
                        {r.user.nickname}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="text-sm">📍</span>
                        {r.locationName}
                      </span>
                      <span>·</span>
                      <span>{formatTime(r.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        💬 {r.responses?.length || 0} 条响应
                      </span>
                      <span className="text-primary-600 font-medium">查看详情 →</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🤝"
          title="暂无互助信息"
          description="成为第一个发起互助的人吧！"
        />
      )}
    </div>
  );
};

export default HelpPage;
