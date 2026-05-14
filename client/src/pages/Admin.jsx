import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAdminStats, getAdminUsers, getAdminArticles, getAdminQuestions, getAdminCategories } from '../api/admin';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { PageLoading } from '../components/Loading';
import { ErrorState } from '../components/EmptyState';
import {
  LayoutDashboard, Users, FileText, HelpCircle, Tags,
  TrendingUp, Eye, MessageCircle, Heart, Clock
} from 'lucide-react';
import dayjs from 'dayjs';

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = [
    { key: 'dashboard', label: '概览', icon: LayoutDashboard },
    { key: 'users', label: '用户管理', icon: Users },
    { key: 'articles', label: '文章管理', icon: FileText },
    { key: 'questions', label: '问题管理', icon: HelpCircle },
    { key: 'categories', label: '分类管理', icon: Tags },
  ];

  const isAdmin = user && (user.role === 'admin' || user.role === 'moderator' || user.role === 'editor');

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, articlesRes, questionsRes, categoriesRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminArticles(),
        getAdminQuestions(),
        getAdminCategories(),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (usersRes?.success) setUsers(usersRes.data?.list || []);
      if (articlesRes?.success) setArticles(articlesRes.data?.list || []);
      if (questionsRes?.success) setQuestions(questionsRes.data?.list || []);
      if (categoriesRes?.success) setCategories(categoriesRes.data?.list || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, isAdmin, navigate, fetchData]);

  if (!isAdmin) return null;
  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const statCards = stats ? [
    { label: '总用户数', value: stats.users || 0, icon: Users, color: 'bg-blue-500' },
    { label: '文章总数', value: stats.articles || 0, icon: FileText, color: 'bg-green-500' },
    { label: '问题总数', value: stats.questions || 0, icon: HelpCircle, color: 'bg-purple-500' },
    { label: '今日新增', value: stats.todayNew || 0, icon: TrendingUp, color: 'bg-orange-500' },
  ] : [];

  const roleLabels = {
    admin: '管理员',
    moderator: '审核',
    editor: '编辑',
    user: '用户',
  };

  const roleColors = {
    admin: 'bg-red-50 text-red-600',
    moderator: 'bg-purple-50 text-purple-600',
    editor: 'bg-green-50 text-green-600',
    user: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">管理后台</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                        <stat.icon size={20} className="text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">最新文章</h3>
                  {articles.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {articles.slice(0, 5).map((article) => (
                        <Link
                          key={article.id}
                          to={`/article/${article.id}`}
                          className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-lg -mx-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {dayjs(article.createdAt).format('MM-DD HH:mm')} · {article.author?.nickname}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无文章</p>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">最新问题</h3>
                  {questions.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {questions.slice(0, 5).map((question) => (
                        <Link
                          key={question.id}
                          to={`/question/${question.id}`}
                          className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-lg -mx-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{question.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {dayjs(question.createdAt).format('MM-DD HH:mm')} · {question.author?.nickname}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">暂无问题</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link to={`/user/${u.id}`}>
                              <img
                                src={u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.username}
                                alt={u.nickname}
                                className="w-8 h-8 rounded-full"
                              />
                            </Link>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{u.nickname || u.username}</div>
                              <div className="text-xs text-gray-400">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>
                            {roleLabels[u.role]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {dayjs(u.createdAt).format('YYYY-MM-DD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">暂无用户</div>
              )}
            </div>
          )}

          {activeTab === 'articles' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数据</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {articles.map((article) => (
                      <tr key={article.id}>
                        <td className="px-4 py-3">
                          <Link to={`/article/${article.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 block truncate max-w-xs">
                            {article.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{article.author?.nickname || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            article.status === 'published' ? 'bg-green-50 text-green-600' :
                            article.status === 'draft' ? 'bg-gray-50 text-gray-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {article.status === 'published' ? '已发布' : article.status === 'draft' ? '草稿' : '已删除'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-0.5"><Eye size={10} />{article.viewsCount || 0}</span>
                            <span className="flex items-center gap-0.5"><Heart size={10} />{article.likesCount || 0}</span>
                            <span className="flex items-center gap-0.5"><MessageCircle size={10} />{article.commentsCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {dayjs(article.createdAt).format('YYYY-MM-DD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {articles.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">暂无文章</div>
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">提问者</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">回答</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {questions.map((question) => (
                      <tr key={question.id}>
                        <td className="px-4 py-3">
                          <Link to={`/question/${question.id}`} className="text-sm font-medium text-gray-900 hover:text-purple-600 block truncate max-w-xs">
                            {question.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{question.author?.nickname || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            question.status === 'resolved' ? 'bg-green-50 text-green-600' :
                            question.status === 'closed' ? 'bg-gray-50 text-gray-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {question.status === 'resolved' ? '已解决' : question.status === 'closed' ? '已关闭' : '进行中'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{question.answersCount || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {dayjs(question.createdAt).format('YYYY-MM-DD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {questions.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">暂无问题</div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 border border-gray-100 rounded-lg hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                        {cat.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{cat.name}</div>
                        <div className="text-xs text-gray-400">{cat.description || '暂无描述'}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      文章: {cat.articlesCount || 0} · 问题: {cat.questionsCount || 0}
                    </div>
                  </div>
                ))}
              </div>
              {categories.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">暂无分类</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
