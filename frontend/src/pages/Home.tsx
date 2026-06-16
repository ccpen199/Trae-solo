import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postApi, topicApi, utilityApi } from '../api';
import { useAuthStore } from '../store/auth';
import { Card, Badge, Tag, EmptyState, Icon } from '../components/ui';
import PostCard from '../components/PostCard';
import type { Post, Topic, UtilityUpdate } from '../types';
import { formatTime, formatDateTime, getPostTypeColor, getPostTypeLabel } from '../utils/format';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { location, user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [updates, setUpdates] = useState<UtilityUpdate[]>([]);
  const [loading, setLoading] = useState(true);

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
    { icon: '📝', label: '探店笔记', desc: '分享消费体验', type: 'REVIEW', color: 'from-orange-400 to-red-500', actionText: '探店笔记' },
    { icon: '📰', label: '发布资讯', desc: '社区新鲜事', type: 'NEWS', color: 'from-blue-400 to-blue-600', actionText: '发布资讯 社区新鲜事' },
    { icon: '🤝', label: '发布互助', desc: '邻里互帮互助', type: 'HELP', page: '/help/create', color: 'from-green-400 to-emerald-600', actionText: '发布互助 邻里互帮互助' },
    { icon: '🎉', label: '活动召集', desc: '组织社区活动', type: 'ACTIVITY', color: 'from-purple-400 to-pink-500', actionText: '活动召集 组织社区活动' },
  ];

  const newsPosts = posts.filter(p => p.type === 'NOTICE' || p.type === 'NEWS' || p.type === 'EMERGENCY').slice(0, 3);

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
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-3 bg-amber-100 text-amber-800 rounded-xl font-semibold hover:bg-amber-200 transition-all shadow-lg"
            >
              后台管理
            </button>
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
          {updates.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate('/utilities')}
              className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                u.severity >= 3
                  ? 'bg-red-50 border border-red-200'
                  : u.severity >= 2
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className={`text-2xl ${u.severity >= 3 ? 'animate-pulse' : ''}`}>
                {u.severity >= 3 ? '🚨' : u.severity >= 2 ? '⚠️' : '📢'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    u.severity >= 3 ? 'bg-red-500 text-white' : u.severity >= 2 ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {u.service?.type === 'POWER_NOTICE' ? '停电通知' : u.service?.type === 'WATER_NOTICE' ? '停水通知' : '公告'}
                  </span>
                  <span className="text-xs text-gray-500">{formatTime(u.createdAt)}</span>
                </div>
                <h4 className="font-semibold text-gray-800 truncate">{u.title}</h4>
                <p className="text-sm text-gray-600 truncate mt-0.5">{u.content}</p>
                {u.startTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {formatDateTime(u.startTime)} ~ {u.endTime && formatDateTime(u.endTime)} · 📍 {u.locationScope}
                  </p>
                )}
              </div>
              <Icon name="back" className="text-xl rotate-180 text-gray-400" />
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">快速发布</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.page || `/create`, { state: { defaultType: action.type } })}
              aria-label={action.actionText}
              className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${action.color}`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h3 className="font-bold text-gray-800">{action.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
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
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
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
    </div>
  );
};

export default HomePage;
