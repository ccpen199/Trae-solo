import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, TrendingUp, TrendingDown, Thermometer, Users, Heart, Shield, ShoppingBag, Loader2 } from 'lucide-react';
import PostCard from '@/components/PostCard';
import type { Post } from '@/types';
import { apiRequest } from '@/utils/api';

const categories = [
  { value: 'all', label: '全部' },
  { value: '活动通知', label: '活动通知' },
  { value: '物业通知', label: '物业通知' },
  { value: '互助求助', label: '互助求助' },
  { value: '生活分享', label: '生活分享' },
];

const categoryLabels: Record<string, string> = {
  activity: '活动通知',
  notice: '物业通知',
  news: '生活分享',
  help: '互助求助',
};

const normalizePost = (post: any): Post => {
  const views = post.views ?? 0;
  return {
    ...post,
    author: post.author || post.author_name || '社区管理处',
    authorAvatar: post.authorAvatar || post.author_avatar,
    likes: post.likes ?? post.likes_count ?? views,
    comments: post.comments ?? post.comments_count ?? 0,
    isLiked: post.isLiked ?? false,
    createdAt: post.createdAt || post.created_at || '',
    category: categoryLabels[post.category] || post.category || '生活分享',
    views,
  };
};

interface CommunityMetrics {
  temperature: number;
  weeklyActivity: number;
  mutualAidRate: number;
  conflictResolutionRate: number;
  tempTrend: 'up' | 'down';
  activityTrend: 'up' | 'down';
  aidTrend: 'up' | 'down';
  conflictTrend: 'up' | 'down';
}

const CommunityFeed: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CommunityMetrics>({
    temperature: 25,
    weeklyActivity: 42,
    mutualAidRate: 89,
    conflictResolutionRate: 95,
    tempTrend: 'up',
    activityTrend: 'up',
    aidTrend: 'up',
    conflictTrend: 'up',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await apiRequest.get<{ items: Post[]; total: number }>('/posts/published');
      if (response.success && response.data) {
        const items = (response.data.items || []).map(normalizePost);
        const filteredPosts = items.filter((post) => post.category !== '闲置转让');
        setPosts(filteredPosts);
        calculateMetrics(items);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (allPosts: Post[]) => {
    const totalPosts = allPosts.length || 1;
    const totalInteractions = allPosts.reduce((sum, post) => sum + (post.likes || 0) + (post.comments || 0), 0);
    const temperature = Math.min(30, Math.max(20, Math.round(20 + (totalInteractions / totalPosts) * 0.5)));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyActivity = allPosts.filter((post) => new Date(post.createdAt) >= oneWeekAgo).length;

    const helpPosts = allPosts.filter((post) => post.category === '互助求助');
    const helpPostsWithComments = helpPosts.filter((post) => post.comments > 0);
    const mutualAidRate = helpPosts.length > 0 ? Math.round((helpPostsWithComments.length / helpPosts.length) * 100) : 0;

    const reportedPosts = allPosts.filter((post) => (post.reports || 0) > 0);
    const resolvedReports = reportedPosts.filter((post) => post.report_status === 'resolved');
    const conflictResolutionRate = reportedPosts.length > 0 ? Math.round((resolvedReports.length / reportedPosts.length) * 100) : 95;

    setMetrics({
      temperature,
      weeklyActivity,
      mutualAidRate,
      conflictResolutionRate,
      tempTrend: temperature > 24 ? 'up' : 'down',
      activityTrend: weeklyActivity > 35 ? 'up' : 'down',
      aidTrend: mutualAidRate >= 85 ? 'up' : 'down',
      conflictTrend: conflictResolutionRate >= 90 ? 'up' : 'down',
    });
  };

  const filteredPosts = posts.filter((post) => {
    const matchSearch = post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.content.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleCreatePost = () => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/posts/create');
    } else {
      navigate('/login');
    }
  };

  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    unit: string,
    trend: 'up' | 'down',
    iconBg: string
  ) => (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">{title}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">{value}</span>
            <span className="text-xs text-gray-500">{unit}</span>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderMetricCard(
          <Thermometer className="w-5 h-5 text-orange-500" />,
          '社区温度',
          metrics.temperature,
          '°C',
          metrics.tempTrend,
          'bg-orange-50'
        )}
        {renderMetricCard(
          <Users className="w-5 h-5 text-blue-500" />,
          '本周活跃度',
          metrics.weeklyActivity,
          '帖',
          metrics.activityTrend,
          'bg-blue-50'
        )}
        {renderMetricCard(
          <Heart className="w-5 h-5 text-pink-500" />,
          '互助响应率',
          metrics.mutualAidRate,
          '%',
          metrics.aidTrend,
          'bg-pink-50'
        )}
        {renderMetricCard(
          <Shield className="w-5 h-5 text-green-500" />,
          '矛盾化解率',
          metrics.conflictResolutionRate,
          '%',
          metrics.conflictTrend,
          'bg-green-50'
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">邻里社区</h1>
          <p className="text-gray-500 mt-1">分享生活动态，共建和谐社区</p>
        </div>
        <button
          onClick={handleCreatePost}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          发布帖子
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input pl-10"
            placeholder="搜索帖子内容..."
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === cat.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div
        onClick={() => navigate('/marketplace')}
        className="card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-lg transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">闲置物品集市</h3>
            <p className="text-sm text-gray-600">邻里互助，物尽其用，去集市逛逛吧</p>
          </div>
          <span className="px-4 py-2 bg-amber-500 text-white rounded-full text-sm font-medium">
            去闲置集市 →
          </span>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {!loading && filteredPosts.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">暂无符合条件的帖子</p>
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
