import { useState, useMemo } from 'react';
import { Search, Building2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { mockServices, bureauList } from '@/data/mockData';
import ServiceCard from '@/components/ServiceCard';
import type { Category } from '@/types';

const allCategories: Category[] = [
  '人社', '卫健', '医疗保障', '公积金', '公安', '不动产', '市场监管',
  '教育', '民政', '税务', '住建', '交通',
];

export default function Services() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [activeBureau, setActiveBureau] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  const handleSearch = () => {
    setSearchText(keyword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const clearSearch = () => {
    setKeyword('');
    setSearchText('');
  };

  const filtered = useMemo(() => {
    return mockServices.filter((s) => {
      if (searchText && !s.name.includes(searchText) && !s.description.includes(searchText)) return false;
      if (activeBureau && s.bureau !== activeBureau) return false;
      if (activeCategory && s.category !== activeCategory) return false;
      return true;
    });
  }, [searchText, activeBureau, activeCategory]);

  const hasFilters = searchText || activeBureau || activeCategory;

  const clearAll = () => {
    setKeyword('');
    setSearchText('');
    setActiveBureau(null);
    setActiveCategory(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="bg-gov-gradient py-8 px-4">
        <div className="container max-w-5xl">
          <h1 className="text-2xl font-bold text-white mb-1">服务大厅</h1>
          <p className="text-gov-200 text-sm mb-6">为您提供便捷的政务服务在线办理</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索服务名称..."
                className="input-field pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {keyword && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="btn-primary shrink-0">
              <Search className="w-4 h-4" />
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mt-6 px-4">
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
            <Building2 className="w-4 h-4 text-gov-500" />
            委办局筛选
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveBureau(null)}
              className={cn(!activeBureau ? 'tab-btn-active' : 'tab-btn')}
            >
              全部
            </button>
            {bureauList.map((b) => (
              <button
                key={b}
                onClick={() => setActiveBureau(activeBureau === b ? null : b)}
                className={cn('tab-btn text-xs', activeBureau === b && 'tab-btn-active')}
              >
                {b.replace(/局|委员会|中心/g, '').slice(0, 6)}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-700">
            服务类别
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(!activeCategory ? 'tab-btn-active' : 'tab-btn')}
            >
              全部
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={cn('tab-btn', activeCategory === cat && 'tab-btn-active')}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            共找到 <span className="font-semibold text-gov-600">{filtered.length}</span> 项服务
          </p>
          {hasFilters && (
            <button onClick={clearAll} className="text-sm text-gov-600 hover:text-gov-700 hover:underline">
              清除筛选
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((service, i) => (
              <div key={service.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <ServiceCard
                  service={service}
                  onClick={() => navigate(`/services/${service.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">未找到相关服务</h3>
            <p className="text-sm text-slate-400 mb-4">请尝试更换关键词或调整筛选条件</p>
            <button onClick={clearAll} className="btn-secondary text-sm">
              清除筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
