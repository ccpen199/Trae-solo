import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyApi } from '../utils/api';
import {
  PROPERTY_TYPE_MAP, PROPERTY_STATUS_MAP, PROPERTY_STATUS_COLOR,
  DECORATION_MAP, formatPrice, formatDate
} from '../utils/constants';
import {
  Building2, Search, Plus, Filter, Grid, List, LayoutGrid, Edit2, Trash2, Eye
} from 'lucide-react';

const PropertyList: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '', status: '', community: '', minPrice: '', maxPrice: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [page, filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.community) params.community = filters.community;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      const res = await propertyApi.list(params);
      setProperties(res.list);
      setTotal(res.total);
    } catch (e) {
      console.error('Load properties error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此房源吗？')) return;
    try {
      await propertyApi.delete(id);
      loadProperties();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const totalPages = Math.ceil(total / 12);

  if (loading && properties.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">房源管理</h2>
          <p className="text-gray-500 text-sm">共 {total} 套房源</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'} transition-colors flex items-center gap-2`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => navigate('/properties/new')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增房源
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">房源类型</label>
              <select
                value={filters.type}
                onChange={e => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">全部</option>
                {Object.entries(PROPERTY_TYPE_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">全部</option>
                {Object.entries(PROPERTY_STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">小区名称</label>
              <input
                type="text"
                placeholder="请输入小区名称"
                value={filters.community}
                onChange={e => setFilters({ ...filters, community: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低价格</label>
              <input
                type="number"
                placeholder="元"
                value={filters.minPrice}
                onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高价格</label>
              <input
                type="number"
                placeholder="元"
                value={filters.maxPrice}
                onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setFilters({ type: '', status: '', community: '', minPrice: '', maxPrice: '' })}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              重置
            </button>
            <button
              onClick={loadProperties}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => navigate(`/properties/${p.id}`)}
            >
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <Building2 className="w-16 h-16 text-primary-300 group-hover:scale-110 transition-transform" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${PROPERTY_STATUS_COLOR[p.status]}`}>
                    {PROPERTY_STATUS_MAP[p.status]}
                  </span>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/properties/${p.id}`); }}
                      className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow"
                      title="查看"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                      className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-600 hover:bg-white shadow"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {p.vr_url && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" /> VR
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium text-gray-800 mb-1 line-clamp-1">{p.name}</div>
                <div className="text-sm text-gray-500 mb-2 line-clamp-1">{p.address}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>{p.rooms}室{p.halls}厅</span>
                  <span>·</span>
                  <span>{p.area}㎡</span>
                  <span>·</span>
                  <span>{p.floor}/{p.total_floor}层</span>
                  {p.decoration_level && <><span>·</span><span>{DECORATION_MAP[p.decoration_level]}</span></>}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary-600">{formatPrice(p.price, p.type)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{PROPERTY_TYPE_MAP[p.type]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">房源</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">面积</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">价格</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">业主/经纪人</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {properties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.address}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{PROPERTY_TYPE_MAP[p.type]}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">{p.area}㎡</td>
                  <td className="px-5 py-4 text-sm font-medium text-gray-800">{formatPrice(p.price, p.type)}</td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    <div>{p.owner_name}</div>
                    <div className="text-xs text-gray-400">经纪人：{p.agent_name}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${PROPERTY_STATUS_COLOR[p.status]}`}>
                      {PROPERTY_STATUS_MAP[p.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/properties/${p.id}`)}
                        className="text-primary-600 hover:text-primary-700"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/properties/${p.id}`)}
                        className="text-gray-600 hover:text-gray-800"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:text-red-700"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">第 {page} / {totalPages} 页</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {!loading && properties.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">暂无房源</div>
          <button
            onClick={() => navigate('/properties/new')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            录入第一套房源
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
