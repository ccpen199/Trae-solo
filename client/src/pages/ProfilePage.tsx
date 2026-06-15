import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatDate } from '../utils/format';
import { statusLabels } from '../utils/constants';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Loading from '../components/Loading';
import Tag from '../components/Tag';
import { useAuthStore } from '../stores/authStore';
import type { Post, Activity } from '@/types/shared';

const tabs = [
  { key: 'info', label: '基本信息' },
  { key: 'posts', label: '我的爆料' },
  { key: 'activities', label: '我的活动' },
];

export default function ProfilePage() {
  const { user, fetchProfile, isLoading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchMyPosts();
    } else if (activeTab === 'activities') {
      fetchMyActivities();
    }
  }, [activeTab]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/posts/my');
      setPosts(res.data.data.data || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities/my');
      setActivities(res.data.data.data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="py-12">
        <Loading text="加载中..." />
      </div>
    );
  }

  const statusColorMap: Record<string, 'warning' | 'success' | 'danger'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Card className="p-6 text-center">
          <Avatar src={user.avatar} alt={user.nickname} size="xl" className="mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-1">{user.nickname}</h2>
          <p className="text-sm text-gray-500 mb-4">@{user.username}</p>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-primary-500">🌸</span>
            <span className="font-bold text-primary-600">{user.points}</span>
            <span className="text-sm text-gray-500">小红花</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">等级</span>
              <span className="font-medium text-gray-800">Lv.{user.level}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: '60%' }} />
            </div>
          </div>

          {user.isAdmin && (
            <Link to="/admin">
              <Button variant="outline" className="w-full mb-2">
                管理后台
              </Button>
            </Link>
          )}
          
          <Button variant="secondary" className="w-full" onClick={handleLogout}>
            退出登录
          </Button>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <div className="flex gap-2 mb-6 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">基本信息</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-500">用户名</span>
                <span className="text-gray-800">{user.username}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-500">昵称</span>
                <span className="text-gray-800">{user.nickname}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-500">手机号</span>
                <span className="text-gray-800">{user.phone || '未绑定'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-500">注册时间</span>
                <span className="text-gray-800">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'posts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">我的爆料</h3>
              <Link to="/create-post">
                <Button size="sm">+ 发布爆料</Button>
              </Link>
            </div>
            {loading ? (
              <Loading text="加载中..." />
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                暂无爆料，快去发布第一条吧
              </Card>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4">
                    <Link to={`/post/${post.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-800 flex-1">{post.title}</h4>
                        <Tag color={statusColorMap[post.status]} size="sm">
                          {statusLabels[post.status]}
                        </Tag>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{formatDate(post.createdAt)}</span>
                        <span>👁️ {post.views}</span>
                        <span>❤️ {post.likes}</span>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">我的活动</h3>
              <Link to="/activities">
                <Button size="sm" variant="outline">浏览活动</Button>
              </Link>
            </div>
            {loading ? (
              <Loading text="加载中..." />
            ) : activities.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                还没有参加任何活动
              </Card>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <Card key={activity.id} className="p-4">
                    <Link to={`/activity/${activity.id}`}>
                      <div className="flex gap-4">
                        <img
                          src={activity.coverImage}
                          alt={activity.title}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">{activity.title}</h4>
                          <p className="text-xs text-gray-500 mb-1">
                            {formatDate(activity.startTime)}
                          </p>
                          {activity.circleName && (
                            <Tag color="secondary" size="sm">{activity.circleName}</Tag>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
