import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getQuestions } from '../api/questions';
import { getCategories } from '../api/categories';
import { QuestionCard } from '../components/ContentCard';
import { PageLoading } from '../components/Loading';
import { ErrorState, EmptyState } from '../components/EmptyState';
import { Flame, Clock, Sparkles, ChevronDown, HelpCircle } from 'lucide-react';

export default function Questions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || null;
  const sort = searchParams.get('sort') || 'latest';

  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: 1, pageSize: 20, sort };
      if (categoryId) params.categoryId = categoryId;

      const [categoriesRes, questionsRes] = await Promise.all([
        getCategories(),
        getQuestions(params)
      ]);

      if (categoriesRes?.success) {
        setCategories(categoriesRes.data || []);
      }
      if (questionsRes?.success) {
        setQuestions(questionsRes.data?.list || []);
      }
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [categoryId, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSortChange = (newSort) => {
    const params = { sort: newSort };
    if (categoryId) params.categoryId = categoryId;
    setSearchParams(params);
  };

  const handleCategoryChange = (catId) => {
    const params = { sort };
    if (catId) params.categoryId = catId;
    setSearchParams(params);
    setShowCategoryDropdown(false);
  };

  const getCurrentCategory = () => {
    if (!categoryId) return null;
    return categories.find(c => String(c.id) === categoryId);
  };

  const sortOptions = [
    { value: 'latest', label: '最新', icon: <Clock size={16} /> },
    { value: 'hot', label: '热门', icon: <Flame size={16} /> },
    { value: 'featured', label: '精选', icon: <Sparkles size={16} /> }
  ];

  if (loading) return <PageLoading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle size={24} className="text-purple-600" />
          全部问答
        </h1>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {getCurrentCategory()?.name || '全部分类'}
            <ChevronDown size={16} className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${!categoryId ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
              >
                全部分类
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(String(cat.id))}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${categoryId === String(cat.id) ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sort === option.value ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<HelpCircle size={48} className="text-gray-300" />}
          title="暂无问答"
          description="还没有任何问题，快来提出第一个问题吧"
        />
      )}
    </div>
  );
}
