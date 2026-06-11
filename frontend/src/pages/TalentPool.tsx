import { useState, useEffect } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import api from '../services/api';
import ProviderCard from '../components/ProviderCard';
import { ProviderProfile, CATEGORY_MAP, LEVEL_MAP, PaginatedResult } from '../types';

const SORT_OPTIONS = [
  { value: '', label: '综合排序' },
  { value: 'rating', label: '评分最高' },
  { value: 'orders', label: '订单最多' },
  { value: 'price', label: '价格最低' },
];

export default function TalentPool() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProviders();
  }, [category, level, sort, page]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize: 12 };
      if (search) params.keyword = search;
      if (category) params.category = category;
      if (level) params.level = level;
      if (sort) params.sort = sort;
      const res = await api.get<any, { data: PaginatedResult<ProviderProfile> }>('/providers', { params });
      setProviders(res.data.list || []);
      setTotal(res.data.total || 0);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProviders();
  };

  const handleMatch = async () => {
    if (!category) return;
    setMatching(true);
    try {
      const res = await api.get<any, { data: PaginatedResult<ProviderProfile> }>('/providers/match', {
        params: { categoryId: category },
      });
      setProviders(res.data.list || []);
      setTotal(res.data.total || 0);
      setPage(1);
    } catch {
      setProviders([]);
    } finally {
      setMatching(false);
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">人才库</h1>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索服务商名称或技能..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部分类</option>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-500 mb-1">等级</label>
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              <option value="">全部等级</option>
              {Object.entries(LEVEL_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-500 mb-1">排序</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary py-2 text-sm">
            <Filter size={16} className="mr-1" />
            筛选
          </button>
          <button
            type="button"
            onClick={handleMatch}
            disabled={!category || matching}
            className="btn-accent py-2 text-sm flex items-center gap-1 disabled:opacity-40"
          >
            <Sparkles size={16} />
            智能匹配
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无服务商</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages} (共 {total} 条)
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
