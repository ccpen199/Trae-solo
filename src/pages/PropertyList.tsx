import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  Filter,
  Search,
  ChevronDown,
  ArrowUpDown,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { propertyApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  address: string;
  district: string;
  area: string;
  price: number;
  priceRange: string;
  totalPriceRange: string;
  propertyType: string;
  buildingType: string;
  status: string;
  tags: string[];
  greenRate: number;
  plotRatio: number;
  monthlySales: number;
}

interface FilterOptions {
  districts: string[];
  propertyTypes: string[];
  buildingTypes: string[];
  statuses: string[];
  decorations: string[];
  priceRanges: { label: string; min: number; max: number }[];
  bedroomOptions: { label: string; value: string }[];
}

export default function PropertyList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState({
    district: searchParams.get('district') || 'all',
    priceMin: '',
    priceMax: '',
    bedrooms: 'all',
    propertyType: 'all',
    status: 'all',
    keyword: '',
    sortBy: 'default',
    sortOrder: 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const res = await propertyApi.getFilterOptions();
      if (res.success) {
        setFilterOptions(res.data);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [filters, pagination.page]);

  const fetchProperties = async () => {
    setLoading(true);
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };

    if (filters.district && filters.district !== 'all') {
      params.district = filters.district;
    }
    if (filters.priceMin) {
      params.priceMin = filters.priceMin;
    }
    if (filters.priceMax) {
      params.priceMax = filters.priceMax;
    }
    if (filters.bedrooms && filters.bedrooms !== 'all') {
      params.bedrooms = filters.bedrooms;
    }
    if (filters.propertyType && filters.propertyType !== 'all') {
      params.propertyType = filters.propertyType;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.keyword) {
      params.keyword = filters.keyword;
    }

    const res = await propertyApi.getList(params);
    if (res.success) {
      setProperties(res.data.list);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total,
        totalPages: res.data.totalPages,
      }));
    }
    setLoading(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProperties();
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">楼盘字典库</h1>
          <p className="text-sm text-gray-500 mt-1">
            共找到 <span className="text-blue-600 font-medium">{pagination.total}</span> 个楼盘
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50',
              )}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50',
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索楼盘名称、地址、开发商..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">默认排序</option>
            <option value="price">价格排序</option>
            <option value="sales">销量排序</option>
            <option value="greenRate">绿化率排序</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && filterOptions && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-sm text-gray-500 w-16 flex-shrink-0 pt-1">区域：</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.districts.map((district) => (
                <button
                  key={district}
                  onClick={() => handleFilterChange('district', district)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.district === district
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {district === 'all' ? '全部' : district}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-sm text-gray-500 w-16 flex-shrink-0 pt-1">价格：</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.priceRanges?.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleFilterChange('priceMin', range.min.toString());
                    handleFilterChange('priceMax', range.max.toString());
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.priceMin === range.min.toString() &&
                    filters.priceMax === range.max.toString()
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {range.label}
                </button>
              ))}
              <button
                onClick={() => {
                  handleFilterChange('priceMin', '');
                  handleFilterChange('priceMax', '');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  !filters.priceMin && !filters.priceMax
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                不限
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-sm text-gray-500 w-16 flex-shrink-0 pt-1">户型：</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.bedroomOptions?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('bedrooms', option.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.bedrooms === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-sm text-gray-500 w-16 flex-shrink-0 pt-1">类型：</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.propertyTypes?.map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('propertyType', type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.propertyType === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {type === 'all' ? '全部' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-sm text-gray-500 w-16 flex-shrink-0 pt-1">状态：</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.statuses?.map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange('status', status)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    filters.status === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {status === 'all' ? '全部' : status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Property List */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <p className="text-gray-500">暂无符合条件的楼盘</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="h-44 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-medium text-blue-600">
                    {property.status}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                  <h3 className="text-white font-bold text-lg">{property.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{property.district} · {property.area}</span>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {property.price.toLocaleString()}
                      <span className="text-sm font-normal text-gray-400"> 元/㎡</span>
                    </p>
                    <p className="text-xs text-gray-500">{property.totalPriceRange}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {property.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>绿化率 {property.greenRate}%</span>
                  <span>月销 {property.monthlySales} 套</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex"
            >
              <div className="w-48 h-36 bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 relative">
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur rounded text-xs font-medium text-blue-600">
                  {property.status}
                </span>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{property.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MapPin className="w-4 h-4" />
                    {property.district} · {property.area} · {property.address}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {property.tags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-500">
                      {property.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-400"> 元/㎡</span>
                    <span className="text-xs text-gray-400 ml-2">{property.totalPriceRange}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    容积率 {property.plotRatio} · 绿化率 {property.greenRate}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum: number;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={cn(
                  'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                  pagination.page === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
                )}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
