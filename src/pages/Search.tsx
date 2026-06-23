import { useState, useEffect, useCallback } from 'react';
import { Search, X, Flame, AlertCircle, CheckCircle, Tag, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { searchApi } from '@/services/api';
import { SearchResult, GarbageItem } from '../../shared/types';
import CategoryBadge from '@/components/CategoryBadge';
import Empty from '@/components/Empty';

export default function Search() {
  const { currentCity } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hotSearches, setHotSearches] = useState<GarbageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (currentCity?.id) {
      loadHotSearches(currentCity.id);
    }
  }, [currentCity]);

  const loadHotSearches = async (cityId: string) => {
    try {
      const res = await searchApi.getHotSearches(cityId, 10);
      setHotSearches(res.hotItems);
    } catch (e) {
      console.error('Failed to load hot searches:', e);
    }
  };

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !currentCity?.id) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await searchApi.search(searchQuery, currentCity.id, 20);
      setResults(res.results);
    } catch (e) {
      console.error('Search failed:', e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCity]);

  const handleHotSearchClick = (itemName: string) => {
    setQuery(itemName);
    handleSearch(itemName);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value) {
      handleSearch(value);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          垃圾分类搜索
        </h1>

        <div className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="输入垃圾名称进行搜索..."
              className="w-full pl-12 pr-24 py-4 text-lg border-2 border-emerald-200 rounded-2xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-all bg-white shadow-lg"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
          {currentCity && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              当前城市：<span className="font-medium text-emerald-600">{currentCity.name}</span>
            </p>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <span className="ml-2 text-gray-500">搜索中...</span>
          </div>
        )}

        {!hasSearched && !isLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-gray-800">热门搜索</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotSearches.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleHotSearchClick(item.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    index < 3
                      ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 hover:from-orange-200 hover:to-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {index < 3 && <Flame className="w-3 h-3 inline mr-1" />}
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasSearched && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                搜索结果 <span className="text-emerald-600">({results.length})</span>
              </h2>
            </div>

            {results.length === 0 ? (
              <Empty
                icon={<Search className="w-12 h-12 text-gray-300" />}
                title="未找到相关结果"
                description="试试其他关键词，或检查拼写是否正确"
              />
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={`${result.item.id}-${index}`}
                    className="bg-white rounded-xl shadow-md border border-gray-100 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {result.item.name}
                          {result.matchedAlias && (
                            <span className="ml-2 text-sm font-normal text-gray-400">
                              （别名：{result.matchedAlias}）
                            </span>
                          )}
                        </h3>
                        <CategoryBadge category={result.category} size="sm" />
                      </div>
                      <div className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span>匹配度 {Math.round(result.matchScore * 100)}%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-100 p-1.5 rounded-lg mt-0.5">
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">投放要求</p>
                          <p className="text-sm text-gray-600">{result.item.requirements}</p>
                        </div>
                      </div>

                      {result.item.misconceptions && (
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 p-1.5 rounded-lg mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">常见误区</p>
                            <p className="text-sm text-gray-600">{result.item.misconceptions}</p>
                          </div>
                        </div>
                      )}

                      {result.item.aliases.length > 0 && (
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1.5">
                            {result.item.aliases.map((alias, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {alias}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!currentCity && (
          <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl mt-6">
            <AlertCircle className="w-5 h-5" />
            <span>请先选择城市以获取准确的分类标准</span>
          </div>
        )}
      </div>
    </div>
  );
}
