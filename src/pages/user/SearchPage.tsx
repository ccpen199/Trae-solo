import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, ShoppingBag, GraduationCap, Heart, Plane } from 'lucide-react';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { TrendBadge } from '@/components/ui/TrendBadge';

const categoryIcons = {
  consumer: ShoppingBag,
  education: GraduationCap,
  medical: Heart,
  travel: Plane,
};

interface SearchResultItem {
  id: number;
  name: string;
  category: keyof typeof categoryIcons;
  categoryName: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  city: string;
  reportCount: number;
  highlight?: string;
}

const mockResults: SearchResultItem[] = [
  { id: 1, name: '蒙牛乳业', category: 'consumer', categoryName: '消费品牌', score: 92, trend: 'up', trendValue: 3, city: '全国', reportCount: 12 },
  { id: 3, name: '伊利集团', category: 'consumer', categoryName: '消费品牌', score: 87, trend: 'up', trendValue: 1, city: '全国', reportCount: 10 },
  { id: 11, name: '蒙牛特仑苏', category: 'consumer', categoryName: '消费品牌', score: 90, trend: 'stable', trendValue: 0, city: '全国', reportCount: 5 },
  { id: 101, name: '新东方教育', category: 'education', categoryName: '教育服务', score: 91, trend: 'up', trendValue: 2, city: '北京', reportCount: 8 },
  { id: 102, name: '学而思', category: 'education', categoryName: '教育服务', score: 88, trend: 'stable', trendValue: 0, city: '北京', reportCount: 7 },
  { id: 201, name: '北京协和医院', category: 'medical', categoryName: '医疗健康', score: 94, trend: 'stable', trendValue: 0, city: '北京', reportCount: 15 },
  { id: 301, name: '携程旅行', category: 'travel', categoryName: '旅游出行', score: 89, trend: 'up', trendValue: 2, city: '全国', reportCount: 9 },
];

const categories = [
  { code: 'all', name: '全部' },
  { code: 'consumer', name: '消费品牌' },
  { code: 'education', name: '教育服务' },
  { code: 'medical', name: '医疗健康' },
  { code: 'travel', name: '旅游出行' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'score' | 'trend'>('relevance');

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const filteredResults = mockResults
    .filter((r) => {
      if (activeCategory !== 'all' && r.category !== activeCategory) return false;
      if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'trend') {
        const trendOrder = { up: 0, stable: 1, down: 2 };
        return trendOrder[a.trend] - trendOrder[b.trend];
      }
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-white mb-4">搜索结果</h1>
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="搜索品牌、机构、报告..."
            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </form>
        {query && (
          <p className="text-sm text-slate-400 mt-3">
            为您找到 <span className="text-primary font-medium">{filteredResults.length}</span> 个与 "
            <span className="text-white">{query}</span>" 相关的结果
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 mr-2">分类：</span>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.code}
                  onClick={() => setActiveCategory(cat.code)}
                  className={`px-3 py-1 rounded text-xs transition-all ${
                    activeCategory === cat.code
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-slate-400 hover:text-white hover:bg-surface-light'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-light border border-border rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-primary"
            >
              <option value="relevance">相关度</option>
              <option value="score">评分最高</option>
              <option value="trend">趋势优先</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredResults.length > 0 ? (
        <div className="space-y-3">
          {filteredResults.map((item, idx) => {
            const CategoryIcon = categoryIcons[item.category];
            return (
              <Link
                key={item.id}
                to={`/report/${item.id}`}
                className="card p-5 flex items-center gap-4 hover:border-primary/30 transition-all group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <ScoreRing score={item.score} size={56} strokeWidth={5} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 text-xs">
                      <CategoryIcon className="w-3 h-3" />
                      {item.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span>{item.city}</span>
                    <span>·</span>
                    <span>{item.reportCount} 份报告</span>
                    <TrendBadge trend={item.trend} value={item.trendValue} />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">暂无匹配的搜索结果</p>
          <p className="text-sm text-slate-500 mt-1">请尝试其他关键词或调整筛选条件</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
