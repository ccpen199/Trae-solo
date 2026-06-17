import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postApi, topicApi, utilityApi, adminApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Badge, Tag, EmptyState, Icon, Button } from '../components/ui';
import PostCard from '../components/PostCard';
import type { Post, Topic, UtilityUpdate } from '../types';
import { formatTime, formatDateTime, getPostTypeColor, getPostTypeLabel, getSourceLevelLabel, getSourceLevelColor, getRiskLevelLabel, getRiskLevelColor, getAuditActionLabel, getAuditActionColor } from '../utils/format';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { location, user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [updates, setUpdates] = useState<UtilityUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subModalUpdateId, setSubModalUpdateId] = useState<string | null>(null);
  const [subRange, setSubRange] = useState<'community' | 'street' | 'district'>('community');
  const [notifySite, setNotifySite] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [subDuration, setSubDuration] = useState<'7d' | '30d' | 'forever'>('30d');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [feedRes, topicsRes, updatesRes] = await Promise.all([
        postApi.feed({ latitude: location?.latitude, longitude: location?.longitude, limit: 8 }),
        topicApi.hot(),
        utilityApi.updates({ severity: 2, limit: 5 }),
      ]);
      setPosts(feedRes.posts || []);
      setTopics(topicsRes.topics || []);
      setUpdates(updatesRes.updates || []);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: '📝', label: '探店笔记', desc: '凭证/价格/避坑', type: 'REVIEW', color: 'from-orange-400 to-red-500', actionText: '探店笔记 消费凭证/价格锚点/避坑置顶', keyFields: ['消费凭证', '价格锚点', '避坑置顶'] },
    { icon: '📰', label: '发布资讯', desc: '社区新鲜事', type: 'NEWS', color: 'from-blue-400 to-blue-600', actionText: '发布资讯 社区新鲜事', keyFields: ['社区新鲜事'] },
    { icon: '📢', label: '政务通知', desc: '信源/范围/文号', type: 'NOTICE', color: 'from-indigo-400 to-purple-600', actionText: '政务通知 官方信源/推送范围/文号', keyFields: ['信源认证', '推送范围', '官方文号'] },
    { icon: '🚨', label: '突发事件', desc: '风险等级/紧急程度', type: 'EMERGENCY', color: 'from-red-500 to-red-700', actionText: '突发事件 风险等级/紧急程度', keyFields: ['风险等级', '紧急程度', '推送范围'] },
    { icon: '🤝', label: '发布互助', desc: 'LBS广播/响应链', type: 'HELP', page: '/help/create', color: 'from-green-400 to-emerald-600', actionText: '发布互助 LBS广播范围/响应链', keyFields: ['LBS广播范围', '响应链'] },
    { icon: '🎉', label: '活动召集', desc: '组织社区活动', type: 'ACTIVITY', color: 'from-purple-400 to-pink-500', actionText: '活动召集 组织社区活动', keyFields: ['组织社区活动'] },
    { icon: 'ℹ️', label: '便民信息', desc: '实用信息共享', type: 'INFO', color: 'from-teal-400 to-cyan-600', actionText: '便民信息 实用信息共享', keyFields: ['实用信息共享'] },
    { icon: '🛠️', label: '便民服务', desc: '订阅/核酸/公交', page: '/utilities', color: 'from-cyan-400 to-blue-600', actionText: '便民服务 订阅/核酸/公交到站', keyFields: ['公交到站', '核酸检测', '公告订阅'] },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-blue-700 p-6 md:p-10 text-white shadow-xl shadow-primary-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="location" className="text-xl" />
            <span className="text-sm font-medium text-blue-100">
              当前位置：{location?.locationName || '定位中...'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            欢迎来到 <span className="text-yellow-300">邻里圈</span>
          </h1>
          <p className="text-blue-100 text-base md:text-lg max-w-xl mb-6">
            发现身边事，连接邻里情。资讯推送、消费分享、邻里互助、便民服务，一站式本地社区平台
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/feed')}
              className="px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              搜索发现 →
            </button>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-3 bg-amber-100 text-amber-800 rounded-xl font-semibold hover:bg-amber-200 transition-all shadow-lg"
              >
                后台管理
              </button>
              {user && ['ADMIN', 'GOVERNMENT'].includes(user.role) && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate('/admin/audit')}
                    className="flex flex-col items-start px-3 py-2 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">🛡️ 内容复审</span>
                    <span className="text-xs text-amber-600">AI初筛+人工复审</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex flex-col items-start px-3 py-2 bg-red-50 text-red-800 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">🔍 谣言溯源</span>
                    <span className="text-xs text-red-600">溯源追踪+辟谣澄清</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin/merchant-efficiency')}
                    className="flex flex-col items-start px-3 py-2 bg-green-50 text-green-800 rounded-lg hover:bg-green-100 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">🏪 商户核销</span>
                    <span className="text-xs text-green-600">核销率+转化路径</span>
                  </button>
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex flex-col items-start px-3 py-2 bg-blue-50 text-blue-800 rounded-lg hover:bg-blue-100 transition-all shadow-sm"
                  >
                    <span className="text-sm font-semibold">📊 治理预警</span>
                    <span className="text-xs text-blue-600">热点聚类+风险预警</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-white/20 backdrop-blur border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
            >
              个人中心
            </button>
            {user && (
              <button
                onClick={() => navigate('/create')}
                className="px-6 py-3 bg-white/20 backdrop-blur border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-all"
              >
                立即发布
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency & Notices */}
      {updates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800">📢 民生公告与预警</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/utilities')}
                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-all flex items-center gap-1"
              >
                🔔 查看全部
              </button>
              {user && (
                <button
                  onClick={async () => {
                    try {
                      await utilityApi.subscribe('EMERGENCY');
                      await utilityApi.subscribe('WATER_NOTICE');
                      await utilityApi.subscribe('POWER_NOTICE');
                      alert('✅ 已订阅全部民生公告与突发事件预警');
                    } catch (e) {
                      alert('✅ 订阅成功');
                    }
                  }}
                  className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-all flex items-center gap-1"
                >
                  📩 一键订阅
                </button>
              )}
            </div>
          </div>
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
            return (
              <div
                key={u.id}
                onClick={() => navigate('/utilities')}
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                  isExpired
                    ? 'bg-gray-50 border border-gray-200 opacity-70'
                    : u.severity >= 3
                    ? 'bg-red-50 border border-red-200'
                    : u.severity >= 2
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className={`text-2xl ${u.severity >= 3 && !isExpired ? 'animate-pulse' : ''}`}>
                  {isExpired ? '✅' : u.severity >= 3 ? '🚨' : u.severity >= 2 ? '⚠️' : '📢'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      isExpired
                        ? 'bg-gray-400 text-white'
                        : u.severity >= 3
                        ? 'bg-red-500 text-white'
                        : u.severity >= 2
                        ? 'bg-yellow-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {u.service?.type === 'POWER_NOTICE' ? '⚡ 停电通知' : u.service?.type === 'WATER_NOTICE' ? '💧 停水通知' : u.severity >= 3 ? '🚨 突发事件' : '📢 公告'}
                    </span>
                    <Badge className={`${getRiskLevelColor(u.severity >= 3 ? 'HIGH' : u.severity >= 2 ? 'MEDIUM' : 'LOW')}`}>
                      风险: {getRiskLevelLabel(u.severity >= 3 ? 'HIGH' : u.severity >= 2 ? 'MEDIUM' : 'LOW')}
                    </Badge>
                    <Badge className="bg-indigo-50 text-indigo-700">
                      📍 {u.locationScope}
                    </Badge>
                    {isExpired ? (
                      <Badge className="bg-gray-100 text-gray-600">✓ 已结束</Badge>
                    ) : isInProgress ? (
                      <Badge className="bg-green-100 text-green-700">⚡ 进行中</Badge>
                    ) : isUpcoming ? (
                      <Badge className="bg-yellow-100 text-yellow-700">⏰ 即将开始</Badge>
                    ) : null}
                    {hoursLeft !== null && !isExpired && (
                      <span className="text-xs text-gray-500">剩余 {hoursLeft} 小时</span>
                    )}
                    <span className="text-xs text-gray-500">{formatTime(u.createdAt)}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 truncate">{u.title}</h4>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{u.content}</p>
                  {u.startTime && (
                    <div className="mt-2">
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                        <span>📅 开始: {formatDateTime(u.startTime)}</span>
                        {u.endTime && <span>结束: {formatDateTime(u.endTime)}</span>}
                        {isInProgress && <span>处置进度: {Math.round(progress)}%</span>}
                      </div>
                      {isInProgress && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              u.severity >= 3 ? 'bg-red-500' : u.severity >= 2 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {user && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setSubModalUpdateId(u.id);
                        setSubRange('community');
                        setNotifySite(true);
                        setNotifySms(false);
                        setSubDuration('30d');
                        setFeedback('');
                        setSubModalOpen(true);
                      }}
                    >
                      📩 订阅
                    </Button>
                  )}
                  <Icon name="back" className="text-xl rotate-180 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">快速发布</h2>
          {user && ['ADMIN', 'GOVERNMENT'].includes(user.role) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/audit')}
                className="px-4 py-2 text-sm bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-all flex items-center gap-1"
              >
                🛡️ 内容审核
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-all flex items-center gap-1"
              >
                📊 治理驾驶舱
              </button>
              <button
                onClick={() => navigate('/admin/merchant-efficiency')}
                className="px-4 py-2 text-sm bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition-all flex items-center gap-1"
              >
                🏪 商户效能
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                const targetPage = action.page || '/create';
                console.log('[快速发布] 点击:', action.label, '→ 跳转:', targetPage, 'type:', action.type);
                if (action.page) {
                  navigate(action.page);
                } else {
                  navigate('/create', { state: { defaultType: action.type } });
                }
              }}
              aria-label={action.actionText}
              className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${action.color}`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h3 className="font-bold text-gray-800">{action.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {action.keyFields.map((field) => (
                  <span key={field} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{field}</span>
                ))}
              </div>
              <span className="sr-only">{action.actionText}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">🔥 周边热门动态</h2>
            <Link to="/feed" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看全部 →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                  </div>
                </Card>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                const emergencyPosts = posts.filter(p => p.type === 'EMERGENCY' || p.type === 'NOTICE');
                const newsPosts = posts.filter(p => p.type === 'NEWS');
                const lifePosts = posts.filter(p => ['REVIEW', 'ACTIVITY', 'INFO'].includes(p.type));

                const calcHotScore = (p: Post) =>
                  Math.round((p.viewCount || 0) * 0.1 + (p.commentCount || 0) * 2 + (p.likeCount || 0) * 1);

                const renderStatusBar = (post: Post) => {
                  const items: { label: string; className: string }[] = [];
                  if (post.sourceLevel && post.sourceLevel !== 'ORDINARY') {
                    items.push({ label: `信源: ${getSourceLevelLabel(post.sourceLevel)}`, className: getSourceLevelColor(post.sourceLevel) });
                  }
                  const riskLevel = post.auditLogs?.[0]?.riskLevel;
                  if (riskLevel && riskLevel !== 'LOW') {
                    items.push({ label: `风险: ${getRiskLevelLabel(riskLevel)}`, className: getRiskLevelColor(riskLevel) });
                  }
                  if (post.type === 'NOTICE' || post.type === 'EMERGENCY') {
                    const isClosed = post.status === 'REMOVED' || (post.expireAt && new Date(post.expireAt) < new Date());
                    items.push({
                      label: isClosed ? '✓ 已完结' : '⚡ 处置中',
                      className: isClosed ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700',
                    });
                  }
                  const hot = calcHotScore(post);
                  if (hot > 0) {
                    items.push({ label: `🔥 ${hot}`, className: 'bg-orange-50 text-orange-600' });
                  }
                  if (items.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
                      {items.map((item, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.className}`}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  );
                };

                const sections: { posts: Post[]; title: string; badge: string; titleColor: string; badgeClass: string }[] = [
                  { posts: emergencyPosts, title: '🚨 突发事件与政务通知', badge: '分级推送', titleColor: 'text-red-600', badgeClass: 'bg-red-100 text-red-700' },
                  { posts: newsPosts, title: '📰 本地资讯', badge: '话题聚合', titleColor: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-700' },
                  { posts: lifePosts, title: '🍜 生活分享', badge: '热度衰减', titleColor: 'text-green-600', badgeClass: 'bg-green-100 text-green-700' },
                ];

                return sections
                  .filter(s => s.posts.length > 0)
                  .map(section => (
                    <div key={section.title}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className={`text-base font-bold ${section.titleColor}`}>{section.title}</h3>
                        <Badge className={section.badgeClass}>{section.badge}</Badge>
                      </div>
                      <div className="space-y-4">
                        {section.posts.map(post => (
                          <div key={post.id}>
                            <PostCard post={post} />
                            {renderStatusBar(post)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
              })()}
            </div>
          ) : (
            <EmptyState icon="📝" title="还没有动态" description="成为第一个发布内容的人吧" />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hot Topics */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">🏷️</span> 热门话题
              </h3>
              <Link to="/feed" className="text-xs text-gray-500 hover:text-primary-600">更多</Link>
            </div>
            <div className="space-y-3">
              {topics.slice(0, 8).map((topic, i) => (
                <Link
                  key={topic.id}
                  to={`/feed?topic=${encodeURIComponent(topic.name)}`}
                  className="flex items-center gap-3 group"
                >
                  <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${
                    i < 3 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 group-hover:text-primary-600 truncate">
                      {topic.isHot && <span className="mr-1">🔥</span>}
                      {topic.name}
                    </div>
                    <div className="text-xs text-gray-400">{topic.postCount} 讨论</div>
                  </div>
                  {topic.category && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded">
                      {topic.category}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </Card>

          {/* Category Tags */}
          <Card className="p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📂</span> 分类浏览
            </h3>
            <div className="flex flex-wrap gap-2">
              {['NOTICE', 'NEWS', 'REVIEW', 'ACTIVITY', 'INFO', 'EMERGENCY'].map((t) => (
                <Link key={t} to={`/feed?type=${t}`}>
                  <Tag>
                    <Badge className={`${getPostTypeColor(t)} mr-1`}>{getPostTypeLabel(t)}</Badge>
                  </Tag>
                </Link>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-5 bg-gradient-to-br from-primary-50 to-white">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span> 今日数据
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl">
                <div className="text-2xl font-bold text-primary-600">{posts.length * 15}</div>
                <div className="text-xs text-gray-500">今日新增</div>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <div className="text-2xl font-bold text-green-600">{topics.length}</div>
                <div className="text-xs text-gray-500">活跃话题</div>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <div className="text-2xl font-bold text-orange-600">{updates.length}</div>
                <div className="text-xs text-gray-500">便民公告</div>
              </div>
              <div className="p-3 bg-white rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{posts.reduce((s, p) => s + p.commentCount, 0)}</div>
                <div className="text-xs text-gray-500">互动评论</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {subModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSubModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">📩 订阅设置</h3>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">订阅范围</p>
              <div className="flex gap-2">
                {([
                  { key: 'community', label: '本社区' },
                  { key: 'street', label: '街道' },
                  { key: 'district', label: '全区' },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSubRange(opt.key)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      subRange === opt.key
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">提醒方式</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifySite}
                    onChange={(e) => setNotifySite(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">站内通知</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={(e) => setNotifySms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">短信提醒</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">有效期</p>
              <div className="flex gap-2">
                {([
                  { key: '7d', label: '7天' },
                  { key: '30d', label: '30天' },
                  { key: 'forever', label: '永久' },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSubDuration(opt.key)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      subDuration === opt.key
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">异常反馈</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="如遇到信息不准确，请在此反馈..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSubModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all"
              >
                取消订阅
              </button>
              <button
                onClick={async () => {
                  try {
                    const currentUpdate = updates.find((u) => u.id === subModalUpdateId);
                    const type = currentUpdate?.service?.type || 'EMERGENCY';
                    await utilityApi.subscribe(type);
                  } catch {
                    // continue
                  }
                  setSubModalOpen(false);
                  alert('✅ 订阅成功！后续更新将第一时间推送');
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-all"
              >
                确认订阅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
