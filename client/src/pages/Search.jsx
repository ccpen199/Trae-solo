import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search } from '../api/search';
import { PageLoading } from '../components/Loading';
import { ErrorState, EmptyState } from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { Search, FileText, HelpCircle, User, Clock, Eye, MessageCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  const [results, setResults] = useState({
    articles: { list: [], total: 0 },
    questions: { list: [], total: 0 },
    users: { list: [], total: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localQuery, setLocalQuery] = useState(query);

  const tabs = [
    { key: 'all', label: '综合' },
    { key: 'article', label: '文章' },
    { key: 'question', label: '问题' },
    { key: 'user', label: '用户' },
  ];

  const doSearch = useCallback(async (q, t) => {
    if (!q.trim()) {
      setResults({
        articles: { list: [], total: 0 },
        questions: { list: [], total: 0 },
        users: { list: [], total: 0 }
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await search({ q: q.trim(), type: t, page: 1, pageSize: 20 });
      if (res?.success) {
        setResults(res.data || { articles: [], questions: [], users: [] });
      }
    } catch (err) {
      setError(err.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLocalQuery(query);
    doSearch(query, type);
  }, [query, type, doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!localQuery.trim()) return;
    setSearchParams({ q: localQuery.trim(), type });
  };

  const handleTabChange = (newType) => {
    setSearchParams({ q: query, type: newType });
  };

  const renderArticle = (article) => (
    <Link
      key={article.id}
      to={`/article/${article.id}`}
      className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <FileText size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-1 mb-1">
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
        </div>
      </div>
    </Link>
  );

  const renderQuestion = (question) => (
    <Link
      key={question.id}
      to={`/question/${question.id}`}
      className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <HelpCircle size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-purple-600 line-clamp-1 mb-1">
            {question.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{question.content}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock size={12} />{dayjs(question.createdAt).format('MM-DD')}</span>
            <span className="flex items-center gap-1"><Eye size={12} />{question.viewsCount || 0}</span>
            <span className="flex items-center gap-1"><MessageCircle size={12} />{question.answersCount || 0} 回答</span>
          </div>
        </div>
      </div>
    </Link>
  );

  const renderUser = (user) => (
    <Link
      key={user.id}
      to={`/user/${user.id}`}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all group"
    >
      <Avatar src={user.avatar} alt={user.nickname} size="lg" />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 group-hover:text-green-600">
          {user.nickname || user.username}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-1">{user.bio || '暂无简介'}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          <span>{user.followersCount || 0} 粉丝</span>
          <span>{user.articlesCount || 0} 文章</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="搜索文章、问题或用户..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            搜索
          </button>
        </div>
      </form>

      {query && (
        <div className="mb-4">
          <div className="flex items-center gap-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  type === tab.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {type === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            搜索 "{query}" 的结果
          </p>
        </div>
      )}

      {loading ? (
        <PageLoading />
      ) : error ? (
        <ErrorState message={error} onRetry={() => doSearch(query, type)} />
      ) : !query ? (
        <EmptyState
          icon={<Search size={48} className="text-gray-300" />}
          title="开始搜索"
          description="输入关键词搜索文章、问题或用户"
        />
      ) : (
        <div className="space-y-3">
          {(type === 'all' || type === 'article') &&
            results.articles?.list?.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3 px-1">文章</h2>
                <div className="space-y-3">{results.articles.list.map(renderArticle)}</div>
              </div>
            )}

          {(type === 'all' || type === 'question') &&
            results.questions?.list?.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3 px-1">问题</h2>
                <div className="space-y-3">{results.questions.list.map(renderQuestion)}</div>
              </div>
            )}

          {(type === 'all' || type === 'user') &&
            results.users?.list?.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-3 px-1">用户</h2>
                <div className="space-y-3">{results.users.list.map(renderUser)}</div>
              </div>
            )}

          {(!results.articles?.list?.length &&
            !results.questions?.list?.length &&
            !results.users?.list?.length) && (
            <EmptyState
              icon={<Search size={48} className="text-gray-300" />}
              title="未找到结果"
              description={`没有找到与 "${query}" 相关的内容`}
            />
          )}
        </div>
      )}
    </div>
  );
}
