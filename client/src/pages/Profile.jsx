import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUser, getUserArticles, getUserQuestions, getUserFollowers, getUserFollowing, followUser } from '../api/users';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading } from '../components/Loading';
import { ErrorState, EmptyState } from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { User, FileText, HelpCircle, Users, UserPlus, Clock, Eye, MessageCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const toast = useToastStore();

  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('articles');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  const tabs = [
    { key: 'articles', label: '文章', icon: FileText },
    { key: 'questions', label: '提问', icon: HelpCircle },
    { key: 'followers', label: '粉丝', icon: Users },
    { key: 'following', label: '关注', icon: User },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes] = await Promise.all([getUser(id)]);
      if (profileRes?.success) {
        setProfile(profileRes.data);
      } else {
        throw new Error(profileRes?.message || '获取用户信息失败');
      }

      const [articlesRes, questionsRes, followersRes, followingRes] = await Promise.all([
        getUserArticles(id, { page: 1, pageSize: 20 }),
        getUserQuestions(id, { page: 1, pageSize: 20 }),
        getUserFollowers(id, { page: 1, pageSize: 20 }),
        getUserFollowing(id, { page: 1, pageSize: 20 }),
      ]);

      if (articlesRes?.success) setArticles(articlesRes.data?.list || []);
      if (questionsRes?.success) setQuestions(questionsRes.data?.list || []);
      if (followersRes?.success) setFollowers(followersRes.data?.list || []);
      if (followingRes?.success) setFollowing(followingRes.data?.list || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    try {
      const res = await followUser(id);
      if (res?.success) {
        setProfile({
          ...profile,
          isFollowing: res.data.isFollowing,
          followersCount: res.data.followersCount
        });
        toast.success(res.data.isFollowing ? '关注成功' : '已取消关注');
      }
    } catch (err) {
      toast.error(err.message || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!profile) return <ErrorState message="用户不存在" />;

  const isSelf = currentUser && currentUser.id === parseInt(id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-5">
          <Avatar src={profile.avatar} alt={profile.nickname} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">
                {profile.nickname || profile.username}
              </h1>
              {profile.role !== 'user' && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  profile.role === 'admin' ? 'bg-red-50 text-red-600' :
                  profile.role === 'moderator' ? 'bg-purple-50 text-purple-600' :
                  'bg-green-50 text-green-600'
                }`}>
                  {profile.role === 'admin' ? '管理员' : profile.role === 'moderator' ? '审核' : '编辑'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {profile.bio || '这个人很懒，什么都没留下'}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <span>{profile.articlesCount || 0} 文章</span>
              <span>{profile.questionsCount || 0} 提问</span>
              <span>{profile.followersCount || 0} 粉丝</span>
              <span>{profile.followingCount || 0} 关注</span>
            </div>
            <div className="flex items-center gap-3">
              {!isSelf && currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50`}
                >
                  {profile.isFollowing ? '已关注' : '+ 关注'}
                </button>
              )}
              {isSelf && (
                <Link
                  to="/settings"
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  编辑资料
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'articles' && (
            articles.length > 0 ? (
              <div className="space-y-3">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.id}`}
                    className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                  >
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {article.summary || article.content?.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} />{dayjs(article.createdAt).format('MM-DD')}</span>
                      <span className="flex items-center gap-1"><Eye size={12} />{article.viewsCount || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />{article.commentsCount || 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<FileText size={40} className="text-gray-300" />} title="暂无文章" description="该用户还没有发布任何文章" />
            )
          )}

          {activeTab === 'questions' && (
            questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((question) => (
                  <Link
                    key={question.id}
                    to={`/question/${question.id}`}
                    className="block p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all group"
                  >
                    <h3 className="font-medium text-gray-900 group-hover:text-purple-600 mb-1">
                      {question.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{question.content}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} />{dayjs(question.createdAt).format('MM-DD')}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />{question.answersCount || 0} 回答</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<HelpCircle size={40} className="text-gray-300" />} title="暂无提问" description="该用户还没有提出任何问题" />
            )
          )}

          {activeTab === 'followers' && (
            followers.length > 0 ? (
              <div className="space-y-3">
                {followers.map((item) => (
                  <Link
                    key={item.follower?.id || item.id}
                    to={`/user/${item.follower?.id || item.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Avatar src={item.follower?.avatar || item.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{item.follower?.nickname || item.follower?.username || item.nickname || item.username}</h4>
                      <p className="text-xs text-gray-500">{item.follower?.bio || item.bio || '暂无简介'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Users size={40} className="text-gray-300" />} title="暂无粉丝" description="还没有人关注该用户" />
            )
          )}

          {activeTab === 'following' && (
            following.length > 0 ? (
              <div className="space-y-3">
                {following.map((item) => (
                  <Link
                    key={item.following?.id || item.id}
                    to={`/user/${item.following?.id || item.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Avatar src={item.following?.avatar || item.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{item.following?.nickname || item.following?.username || item.nickname || item.username}</h4>
                      <p className="text-xs text-gray-500">{item.following?.bio || item.bio || '暂无简介'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<UserPlus size={40} className="text-gray-300" />} title="暂无关注" description="该用户还没有关注任何人" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
