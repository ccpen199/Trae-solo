import React, { useState, useEffect, useCallback } from 'react';
import { getArticles } from '../api/articles';
import { getQuestions } from '../api/questions';
import { getCategories } from '../api/categories';
import { ArticleCard, QuestionCard } from '../components/ContentCard';
import { PageLoading } from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { ErrorState } from '../components/EmptyState';
import { Flame, Clock, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('mixed');
  const [sort, setSort] = useState('latest');
  const [categoryId, setCategoryId] = useState(null);
  const [articles, setArticles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: 1, pageSize: 10, sort };
      if (categoryId) params.categoryId = categoryId;

      const [categoriesRes, articlesRes, questionsRes] = await Promise.all([
        getCategories(),
        activeTab !== 'questions' ? getArticles(params) : null,
        activeTab !== 'articles' ? getQuestions(params) : null
      ]);

      if (categoriesRes?.success) {
        setCategories(categoriesRes.data || []);
      }
      if (articlesRes?.success) {
        setArticles(articlesRes.data?.list || []);
      }
      if (questionsRes?.success) {
        setQuestions(questionsRes.data?.list || []);
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, sort, categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getMixedList = () => {
    const mixed = [];
    const maxLen = Math.max(articles.length, questions.length);
    for (let i = 0; i < maxLen; i++) {
      if (articles[i]) mixed.push({ ...articles[i], _type: 'article' });
      if (questions[i]) mixed.push({ ...questions[i], _type: 'question' });
    }
    return mixed.slice(0, 15);
  };

  const sortOptions = [
    { value: 'latest', label: '最新', icon: <Clock size={16} /> },
    { value: 'hot', label: '热门', icon: <Flame size={16} /> },
    { value: 'featured', label: '精选', icon: <Sparkles size={16} /> }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex gap-6">
        <main className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'mixed', label: '混合' },
                  { key: 'articles', label: '文章' },
                  { key: 'questions', label: '问答' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-1 ml-4">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSort(option.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      sort === option.value
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto relative">
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value || null)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-600 focus:outline-none focus:border-blue-500"
                >
                  <option value="">全部分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <PageLoading />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : activeTab === 'mixed' ? (
            getMixedList().length > 0 ? (
              <div className="space-y-4">
                {getMixedList().map((item) => (
                  item._type === 'article' ? (
                    <ArticleCard key={`a-${item.id}`} article={item} />
                  ) : (
                    <QuestionCard key={`q-${item.id}`} question={item} />
                  )
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无内容"
                description="快来发布第一篇文章或提问吧"
                icon="search"
              />
            )
          ) : activeTab === 'articles' ? (
            articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <EmptyState title="暂无文章" description="快来分享你的产品经验" icon="article" />
            )
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          ) : (
            <EmptyState title="暂无问题" description="有什么产品问题想问吗？" icon="question" />
          )}
        </main>

        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              热门分类
            </h3>
            <div className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    categoryId == cat.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-5 text-white">
            <h3 className="font-semibold mb-2">加入产品经理社区</h3>
            <p className="text-sm text-blue-100 mb-4">
              与百万产品人一起交流、学习、成长
            </p>
            <button className="w-full bg-white text-blue-600 font-medium py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
              立即加入
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
