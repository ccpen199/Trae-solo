import { useEffect, useState } from 'react';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Package, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { getProducts, getInventorySummary } from '../../services/api';
import type { Product } from '../../../shared/types';
import { Link } from 'react-router-dom';

const categoryConfig: Record<string, { label: string; color: string }> = {
  health: { label: '健康食品', color: 'bg-green-100 text-green-700' },
  skincare: { label: '护肤美容', color: 'bg-pink-100 text-pink-700' },
  daily: { label: '家居日用', color: 'bg-blue-100 text-blue-700' },
  nutrition: { label: '营养补充', color: 'bg-amber-100 text-amber-700' },
};

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const pageSize = 10;

  useEffect(() => {
    fetchProducts();
  }, [page, activeCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts({ 
        page, 
        pageSize, 
        category: activeCategory === 'all' ? undefined : activeCategory 
      });
      if (res.code === 0) {
        setProducts(res.data.list);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'health', label: '健康食品' },
    { key: 'skincare', label: '护肤美容' },
    { key: 'daily', label: '家居日用' },
    { key: 'nutrition', label: '营养补充' },
  ];

  const stats = [
    { label: '在售产品', value: total, icon: Package, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '库存预警', value: 3, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
    { label: '本月销量', value: 1258, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '销售额', value: '¥45.8万', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索产品名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-80"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/goods/inventory" className="btn btn-secondary">
            <Package className="w-4 h-4 mr-2" />
            库存管理
          </Link>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            添加产品
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.key
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="card overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${categoryConfig[product.category]?.color}`}>
                  {categoryConfig[product.category]?.label}
                </span>
              </div>
              {product.stock < 10 && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-danger-500 text-white rounded text-xs font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    库存不足
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h4>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold text-primary-600">¥{product.price}</span>
                  <span className="text-xs text-gray-400 line-through ml-2">¥{Math.round(product.price * 1.3)}</span>
                </div>
                <span className="text-xs text-gray-500">库存: {product.stock}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link
                  to={`/goods/trace/${product.id}`}
                  className="btn btn-secondary text-sm py-2"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  溯源
                </Link>
                <button className="btn btn-primary text-sm py-2">
                  <Plus className="w-4 h-4 mr-1" />
                  推广
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between card px-6 py-4">
        <p className="text-sm text-gray-500">
          共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize)} 页
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg">
            {page}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
            disabled={page >= Math.ceil(total / pageSize)}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
