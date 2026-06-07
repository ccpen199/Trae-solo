import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Building2, ArrowRight, Filter, Grid, List } from 'lucide-react';
import { serviceApi } from '../api';
import { ServiceItem } from '../types';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await serviceApi.getCategories();
        if (res.success) {
          setCategories(res.data || []);
        }
      } catch (e) {
        console.error('Load categories error:', e);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const res = await serviceApi.search({
          keyword,
          category: selectedCategory,
          page,
          pageSize,
        });
        if (res.success) {
          setServices(res.data || []);
          setTotal(res.total || 0);
        }
      } catch (e) {
        console.error('Load services error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, [keyword, selectedCategory, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索服务事项名称、编码..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            搜索
          </button>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </form>
        <div className="mt-4 grid grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-3 rounded-lg border border-gray-200 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="font-medium text-gray-900">个人中心/我的</div>
            <div className="text-xs text-gray-500 mt-1">工作台、亮证和办件进度</div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="px-4 py-3 rounded-lg border border-gray-200 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="font-medium text-gray-900">提交办件</div>
            <div className="text-xs text-gray-500 mt-1">查看已提交事项和审批流</div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/monitor')}
            className="px-4 py-3 rounded-lg border border-gray-200 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="font-medium text-gray-900">后台管理</div>
            <div className="text-xs text-gray-500 mt-1">效能监测和事项运营</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('');
              setKeyword('');
              setPage(1);
            }}
            className="px-4 py-3 rounded-lg border border-gray-200 text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div className="font-medium text-gray-900">搜索/筛选</div>
            <div className="text-xs text-gray-500 mt-1">分类筛选服务事项</div>
          </button>
        </div>
      </div>

      <div className="flex items-start space-x-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center text-sm font-medium text-gray-900 mb-3">
              <Filter className="w-4 h-4 mr-2" />
              分类筛选
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                全部事项
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              共找到 <span className="text-primary-600 font-medium">{total}</span> 个服务事项
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => navigate(`/services/${service.id}`)}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md border border-transparent hover:border-primary-200 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded">
                      {service.category}
                    </span>
                    <span className="text-xs text-gray-400">{service.code}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {service.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Building2 className="w-3 h-3 mr-1" />
                      {service.department}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {service.handlingTimeLimit || service.handlingLimit}工作日
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-success">
                      {service.handlingFee === '0' ? '免费办理' : service.handlingFee}
                    </span>
                    <span className="text-sm text-primary-600 flex items-center">
                      立即办理 <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => navigate(`/services/${service.id}`)}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-900 mr-3">{service.name}</h4>
                        <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{service.description}</p>
                      <div className="flex items-center space-x-6 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {service.department}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {service.handlingTimeLimit || service.handlingLimit}个工作日
                        </div>
                        <div>{service.handlingFee === '0' ? '免费办理' : service.handlingFee}</div>
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
                      立即办理
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && services.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">未找到相关服务事项</p>
            </div>
          )}

          {total > pageSize && (
            <div className="flex items-center justify-center mt-6 space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                上一页
              </button>
              <span className="text-sm text-gray-600">
                第 {page} / {Math.ceil(total / pageSize)} 页
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
