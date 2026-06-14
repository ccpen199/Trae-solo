import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Calendar, Users, MapPin, Plus, X, Image as ImageIcon, Send, ShieldCheck, Clock, CheckCircle, AlertTriangle, Phone, Building, Tag, ChevronRight, Trash2, Edit3, UserCheck, Ban } from 'lucide-react';
import { socialApi } from '@/api';
import { useAuthStore } from '@/store';
import type { Circle, Post, Activity, PostComment, ApiResponse } from '@shared/types';
import StatusBadge from '@/components/common/StatusBadge';

type TabType = 'circles' | 'feed' | 'activities' | 'idle';

interface PostWithUser extends Post {
  user_name?: string;
  user_avatar?: string;
  circle_name?: string;
  is_verified?: boolean;
}

interface ActivityWithOrganizer extends Activity {
  organizer_name?: string;
  organizer_avatar?: string;
  is_verified?: boolean;
}

interface IdleItem {
  id: number;
  title: string;
  price: number;
  original_price?: number;
  description: string;
  contact: string;
  images: string[];
  status: 'available' | 'reserved' | 'sold' | 'cancelled';
  category: string;
  location: string;
  publisher_name: string;
  publisher_verified: boolean;
  created_at: string;
  view_count: number;
  like_count: number;
}

interface CircleWithExtra extends Circle {
  type?: 'building' | 'interest';
  is_verified?: boolean;
  building?: string;
  admin_name?: string;
  member_limit?: number;
  rules?: string[];
  is_joined?: boolean;
  announcement?: string;
}

const mockImages = [
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
];

const mockIdleItems: IdleItem[] = [
  { id: 1, title: '九成新婴儿车转让', price: 299, original_price: 899, description: '宝宝长大了，婴儿车用不上了，九成新，附赠防雨罩和蚊帐。品牌是好孩子的，购买于2023年，使用很爱惜。', contact: '138****0001', images: [mockImages[0]], status: 'available', category: '母婴用品', location: '1号楼2单元', publisher_name: '张先生', publisher_verified: true, created_at: '2024-01-15 10:30', view_count: 128, like_count: 15 },
  { id: 2, title: '闲置跑步机', price: 800, original_price: 2500, description: '买了没怎么用，现低价转让，需自提。亿健品牌，可折叠，有心率监测功能。', contact: '139****0002', images: [mockImages[1]], status: 'reserved', category: '健身器材', location: '3号楼1单元', publisher_name: '李女士', publisher_verified: true, created_at: '2024-01-14 15:20', view_count: 86, like_count: 8 },
  { id: 3, title: '儿童绘本全套', price: 150, original_price: 380, description: '3-6岁儿童绘本50本，九成新，包含经典绘本和认知类书籍。', contact: '137****0003', images: [mockImages[2]], status: 'sold', category: '图书文具', location: '5号楼3单元', publisher_name: '王女士', publisher_verified: true, created_at: '2024-01-13 09:15', view_count: 234, like_count: 32 },
  { id: 4, title: '小米空气净化器Pro H', price: 1200, original_price: 1699, description: '使用半年，滤芯还有80%寿命，除甲醛PM2.5效果很好，适合新房使用。', contact: '136****0004', images: [mockImages[0]], status: 'available', category: '家用电器', location: '2号楼1单元', publisher_name: '陈先生', publisher_verified: true, created_at: '2024-01-12 14:00', view_count: 156, like_count: 23 },
];

const idleStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  available: { label: '在售', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  reserved: { label: '已预订', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  sold: { label: '已成交', color: 'bg-gray-100 text-gray-500', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700', icon: X },
};

const tabs: { key: TabType; label: string; icon: any }[] = [
  { key: 'circles', label: '楼栋群/圈子', icon: Users },
  { key: 'feed', label: '动态广场', icon: MessageCircle },
  { key: 'activities', label: '社区活动', icon: Calendar },
  { key: 'idle', label: '二手闲置', icon: Tag },
];

const SocialPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('circles');
  const [circles, setCircles] = useState<CircleWithExtra[]>([]);
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [activities, setActivities] = useState<ActivityWithOrganizer[]>([]);
  const [idleItems, setIdleItems] = useState<IdleItem[]>(mockIdleItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showCircleDetail, setShowCircleDetail] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostWithUser | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<CircleWithExtra | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '', circleId: '', images: [] as string[] });
  const [joinedCircles, setJoinedCircles] = useState<Set<number>>(new Set());
  const [idleFilter, setIdleFilter] = useState<string>('all');
├── api/
│   ├── app.ts                    # 主应用，路由注册
│   ├── index.ts                  # 服务入口
│   ├── src/
│   │   ├── controllers/          # 7 个控制器模块
│   │   ├── routes/               # 7 个路由模块
│   │   ├── middleware/auth.ts    # JWT 认证中间件
│   │   └── database/             # SQLite 连接、初始化、种子数据
├── src/
│   ├── pages/                    # 10 个页面组件
│   ├── components/layout/        # 侧边栏、顶部导航、主布局
│   ├── components/common/        # 状态徽章等通用组件
│   ├── api/                      # axios 请求封装、API 接口
│   ├── store/                    # Zustand 状态管理
│   └── App.tsx                   # 路由配置、权限守卫
├── shared/types.ts               # 共享 TypeScript 类型定义
└── data/app.sqlite               # SQLite 数据库（已初始化+种子数据）├── api/
│   ├── app.ts                    # 主应用，路由注册
│   ├── index.ts                  # 服务入口
│   ├── src/
│   │   ├── controllers/          # 7 个控制器模块
│   │   ├── routes/               # 7 个路由模块
│   │   ├── middleware/auth.ts    # JWT 认证中间件
│   │   └── database/             # SQLite 连接、初始化、种子数据
├── src/
│   ├── pages/                    # 10 个页面组件
│   ├── components/layout/        # 侧边栏、顶部导航、主布局
│   ├── components/common/        # 状态徽章等通用组件
│   ├── api/                      # axios 请求封装、API 接口
│   ├── store/                    # Zustand 状态管理
│   └── App.tsx                   # 路由配置、权限守卫
├── shared/types.ts               # 共享 TypeScript 类型定义
└── data/app.sqlite               # SQLite 数据库（已初始化+种子数据）├── api/
│   ├── app.ts                    # 主应用，路由注册
│   ├── index.ts                  # 服务入口
│   ├── src/
│   │   ├── controllers/          # 7 个控制器模块
│   │   ├── routes/               # 7 个路由模块
│   │   ├── middleware/auth.ts    # JWT 认证中间件
│   │   └── database/             # SQLite 连接、初始化、种子数据
├── src/
│   ├── pages/                    # 10 个页面组件
│   ├── components/layout/        # 侧边栏、顶部导航、主布局
│   ├── components/common/        # 状态徽章等通用组件
│   ├── api/                      # axios 请求封装、API 接口
│   ├── store/                    # Zustand 状态管理
│   └── App.tsx                   # 路由配置、权限守卫
├── shared/types.ts               # 共享 TypeScript 类型定义
└── data/app.sqlite               # SQLite 数据库（已初始化+种子数据）├── api/
│   ├── app.ts                    # 主应用，路由注册
│   ├── index.ts                  # 服务入口
│   ├── src/
│   │   ├── controllers/          # 7 个控制器模块
│   │   ├── routes/               # 7 个路由模块
│   │   ├── middleware/auth.ts    # JWT 认证中间件
│   │   └── database/             # SQLite 连接、初始化、种子数据
├── src/
│   ├── pages/                    # 10 个页面组件
│   ├── components/layout/        # 侧边栏、顶部导航、主布局
│   ├── components/common/        # 状态徽章等通用组件
│   ├── api/                      # axios 请求封装、API 接口
│   ├── store/                    # Zustand 状态管理
│   └── App.tsx                   # 路由配置、权限守卫
├── shared/types.ts               # 共享 TypeScript 类型定义
└── data/app.sqlite               # SQLite 数据库（已初始化+种子数据）
  const loadCircles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await socialApi.getCircles() as unknown as ApiResponse<CircleWithExtra[]>;
      if (res.success && res.data) {
        const enrichedCircles = res.data.map((circle, idx) => ({
          ...circle,
          type: (idx % 2 === 0 ? 'building' : 'interest') as 'building' | 'interest',
          is_verified: idx % 2 === 0,
          building: idx % 2 === 0 ? `${idx + 1}号楼业主群` : undefined,
          admin_name: idx % 2 === 0 ? '物业王管理员' : '张业主',
          member_limit: idx % 2 === 0 ? 200 : 50,
          rules: idx % 2 === 0 
            ? ['实名入群', '禁止广告', '文明交流', '邻里互助']
            : ['兴趣交流', '禁止无关内容', '活动组织需报备'],
          announcement: idx % 2 === 0 
            ? '【重要通知】本周六下午2点将进行电梯维护，请各位业主提前做好安排。'
            : '本周末将组织户外徒步活动，有意向的邻居请在群内报名。',
        }));
        setCircles(enrichedCircles);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '获取圈子列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await socialApi.getPosts() as unknown as ApiResponse<PostWithUser[]>;
      if (res.success && res.data) {
        const enrichedPosts = res.data.map((post, idx) => ({
          ...post,
          is_verified: idx % 3 !== 2,
        }));
        setPosts(enrichedPosts);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await socialApi.getActivities() as unknown as ApiResponse<ActivityWithOrganizer[]>;
      if (res.success && res.data) {
        const enrichedActivities = res.data.map((activity, idx) => ({
          ...activity,
          is_verified: true,
        }));
        setActivities(enrichedActivities);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '获取活动列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'circles') loadCircles();
    if (activeTab === 'feed') loadPosts();
    if (activeTab === 'activities') loadActivities();
  }, [activeTab, loadCircles, loadPosts, loadActivities]);

  const handleJoinCircle = (circleId: number) => {
    setJoinedCircles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(circleId)) {
        newSet.delete(circleId);
      } else {
        newSet.add(circleId);
      }
      return newSet;
    });
  };

  const handleLikePost = async (postId: number) => {
    try {
      await socialApi.likePost(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, like_count: p.like_count + 1 } : p
      ));
    } catch (err: any) {
      console.error('点赞失败:', err);
    }
  };

  const handleLikeIdleItem = (itemId: number) => {
    setIdleItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, like_count: item.like_count + 1 } : item
    ));
  };

  const handleShowComments = async (post: PostWithUser) => {
    setSelectedPost(post);
    try {
      const res = await socialApi.getPostComments(post.id) as unknown as ApiResponse<PostComment[]>;
      if (res.success && res.data) {
        setComments(res.data);
      }
      setShowCommentModal(true);
    } catch (err: any) {
      console.error('获取评论失败:', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    try {
      await socialApi.addComment(selectedPost.id, commentText.trim());
      setCommentText('');
      const res = await socialApi.getPostComments(selectedPost.id) as unknown as ApiResponse<PostComment[]>;
      if (res.success && res.data) {
        setComments(res.data);
      }
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p
      ));
    } catch (err: any) {
      console.error('评论失败:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    try {
      await socialApi.createPost({
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        circleId: newPost.circleId ? parseInt(newPost.circleId) : undefined,
        images: newPost.images.length > 0 ? newPost.images : undefined,
      });
      setShowCreateModal(false);
      setNewPost({ title: '', content: '', circleId: '', images: [] });
      loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败');
    }
  };

  const handleSignupActivity = async (activityId: number) => {
    try {
      await socialApi.signupActivity(activityId);
      setActivities(prev => prev.map(a => 
        a.id === activityId ? { ...a, participant_count: a.participant_count + 1 } : a
      ));
      alert('报名成功！');
    } catch (err: any) {
      console.error('报名失败:', err);
    }
  };

  const handleShowCircleDetail = (circle: CircleWithExtra) => {
    setSelectedCircle(circle);
    setShowCircleDetail(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatActivityTime = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} ${start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const filteredIdleItems = idleFilter === 'all' 
    ? idleItems 
    : idleItems.filter(item => item.status === idleFilter);

  const idleStats = {
    all: idleItems.length,
    available: idleItems.filter(i => i.status === 'available').length,
    reserved: idleItems.filter(i => i.status === 'reserved').length,
    sold: idleItems.filter(i => i.status === 'sold').length,
  };

  if (loading && circles.length === 0 && posts.length === 0 && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">邻里社交</h1>
        <p className="text-gray-600">连接邻里，共建温馨社区</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {activeTab === 'circles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center space-x-3 mb-2">
                <Building className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-800">实名楼栋群</h3>
                <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  官方认证
                </span>
              </div>
              <p className="text-sm text-gray-600">已验证业主身份，仅限本楼栋居民加入，安全可靠</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-800">兴趣圈子</h3>
              </div>
              <p className="text-sm text-gray-600">基于共同爱好的社区交流群，找到志同道合的邻居</p>
            </div>
          </div>

          <div className="grid gap-4">
            {circles.map(circle => {
              const isJoined = joinedCircles.has(circle.id);
              return (
                <div 
                  key={circle.id} 
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleShowCircleDetail(circle)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {circle.type === 'building' ? circle.building : circle.name}
                        </h3>
                        {circle.is_verified && (
                          <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            已认证
                          </span>
                        )}
                        {circle.type === 'building' ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            楼栋群
                          </span>
                        ) : (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            兴趣圈
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{circle.member_count}{circle.member_limit ? ` / ${circle.member_limit}` : ''} 位成员</span>
                        </div>
                        <div className="flex items-center">
                          <UserCheck className="w-4 h-4 mr-1" />
                          <span>管理员: {circle.admin_name}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{circle.description}</p>
                      {circle.announcement && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <span className="font-medium">📢 公告: </span>
                            {circle.announcement}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleJoinCircle(circle.id); }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 ${
                        isJoined
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isJoined ? '已加入' : '加入'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              发布动态
            </button>
          </div>

          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                  {(post.user_name || '用')[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800">{post.user_name || '匿名用户'}</p>
                    {post.is_verified && (
                      <span className="flex items-center text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3 mr-0.5" />
                        实名
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                </div>
                {post.circle_name && (
                  <span className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                    {post.circle_name}
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4 whitespace-pre-wrap">{post.content}</p>

              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {post.images.map((img, idx) => (
                    <img key={idx} src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">{post.like_count}</span>
                </button>
                <button
                  onClick={() => handleShowComments(post)}
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comment_count}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">分享</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              发起活动
            </button>
          </div>

          {activities.map(activity => {
            const isFull = activity.max_participants !== undefined && activity.participant_count >= activity.max_participants;
            const isEnded = activity.status !== 'active';
            
            return (
              <div key={activity.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{activity.title}</h3>
                      <StatusBadge status={activity.status} />
                      {activity.is_verified && (
                        <span className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          官方
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatActivityTime(activity.start_time, activity.end_time)}</span>
                      </div>
                      {activity.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{activity.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{activity.participant_count}{activity.max_participants ? ` / ${activity.max_participants}` : ''} 人已报名</span>
                      </div>
                      {activity.organizer_name && (
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4" />
                          <span>发起人: {activity.organizer_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSignupActivity(activity.id)}
                    disabled={isEnded || isFull}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                  >
                    {isEnded ? '已结束' : isFull ? '已满员' : '立即报名'}
                  </button>
                </div>
                {isFull && !isEnded && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      名额已满，您可以加入候补队列
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'idle' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              {[
                { key: 'all', label: '全部' },
                { key: 'available', label: '在售' },
                { key: 'reserved', label: '已预订' },
                { key: 'sold', label: '已成交' },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setIdleFilter(filter.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    idleFilter === filter.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.label} ({idleStats[filter.key as keyof typeof idleStats]})
                </button>
              ))}
            </div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200">
              <Plus className="w-4 h-4" />
              发布闲置
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIdleItems.map(item => {
              const statusInfo = idleStatusMap[item.status];
              const discount = item.original_price ? Math.round((1 - item.price / item.original_price) * 100) : 0;
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all ${
                    item.status !== 'available' ? 'opacity-75' : ''
                  }`}
                >
                  {item.images.length > 0 && (
                    <div className="relative">
                      <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <statusInfo.icon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                        {discount > 0 && (
                          <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                      {item.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="bg-white px-6 py-2 rounded-full font-bold text-gray-800">
                            已成交
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 flex-1">{item.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>{item.view_count} 浏览</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-red-500">¥{item.price}</span>
                      {item.original_price && (
                        <span className="text-sm text-gray-400 line-through">¥{item.original_price}</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        {item.category}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.location}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {(item.publisher_name || '用')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-700">{item.publisher_name}</span>
                            {item.publisher_verified && (
                              <ShieldCheck className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          onClick={() => handleLikeIdleItem(item.id)}
                        >
                          <Heart className="w-4 h-4" />
                          <span className="text-xs ml-0.5">{item.like_count}</span>
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          disabled={item.status !== 'available'}
                        >
                          {item.status === 'available' ? '联系卖家' : '已下架'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                发布{activeTab === 'activities' ? '活动' : '动态'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入标题"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="请输入内容"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {activeTab !== 'activities' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择圈子（可选）</label>
                  <select
                    value={newPost.circleId}
                    onChange={(e) => setNewPost(prev => ({ ...prev, circleId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">不选择圈子（公开发布）</option>
                    {circles.map(circle => (
                      <option key={circle.id} value={circle.id}>{circle.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">添加图片（可选）</label>
                <div className="flex gap-2 flex-wrap">
                  {newPost.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded-xl" />
                      <button
                        onClick={() => setNewPost(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewPost(prev => ({ ...prev, images: [...prev.images, mockImages[prev.images.length % mockImages.length]] }))}
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs">添加</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.title.trim() || !newPost.content.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">评论 ({comments.length})</h2>
              <button onClick={() => setShowCommentModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无评论，快来抢沙发吧</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {(comment.user_name || '用')[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800 text-sm">{comment.user_name || '匿名用户'}</span>
                        <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="说点什么..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCircleDetail && selectedCircle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">圈子详情</h2>
              <button onClick={() => setShowCircleDetail(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  <Users className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {selectedCircle.type === 'building' ? selectedCircle.building : selectedCircle.name}
                    </h3>
                    {selectedCircle.is_verified && (
                      <span className="flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        已认证
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {selectedCircle.member_count}{selectedCircle.member_limit ? ` / ${selectedCircle.member_limit}` : ''} 成员
                    </span>
                    <span className="flex items-center">
                      <UserCheck className="w-4 h-4 mr-1" />
                      管理员: {selectedCircle.admin_name}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedCircle.description}</p>
                </div>
              </div>

              {selectedCircle.announcement && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    群公告
                  </h4>
                  <p className="text-yellow-700 text-sm">{selectedCircle.announcement}</p>
                </div>
              )}

              {selectedCircle.rules && selectedCircle.rules.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                    群规
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCircle.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleJoinCircle(selectedCircle.id)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    joinedCircles.has(selectedCircle.id)
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200'
                  }`}
                >
                  {joinedCircles.has(selectedCircle.id) ? '退出群聊' : '加入群聊'}
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  <Phone className="w-4 h-4" />
                </button>
              </div>

              {user?.role === 'property' && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-3">管理操作</h4>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                      <Edit3 className="w-4 h-4" />
                      编辑资料
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm">
                      <Users className="w-4 h-4" />
                      成员管理
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm">
                      <Ban className="w-4 h-4" />
                      解散群聊
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPage;
