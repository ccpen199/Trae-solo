import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  X,
  MapPin,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties } from '@/mock/data';
import { cn, formatPrice } from '@/utils';

const districts = ['全部区域', '浦东新区', '徐汇区', '静安区', '长宁区', '杨浦区', '闵行区', '黄浦区', '普陀区'];

const priceRanges = [
  { label: '不限', min: 0, max: Infinity },
  { label: '200万以下', min: 0, max: 2000000 },
  { label: '200-500万', min: 2000000, max: 5000000 },
  { label: '500-1000万', min: 5000000, max: 10000000 },
  { label: '1000-2000万', min: 10000000, max: 20000000 },
  { label: '2000万以上', min: 20000000, max: Infinity },
];

const areaRanges = [
  { label: '不限', min: 0, max: Infinity },
  { label: '60㎡以下', min: 0, max: 60 },
  { label: '60-90㎡', min: 60, max: 90 },
  { label: '90-144㎡', min: 90, max: 144 },
  { label: '144-200㎡', min: 144, max: 200 },
  { label: '200㎡以上', min: 200, max: Infinity },
];

const roomOptions = ['不限', '1室', '2室', '3室', '4室及以上'];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'bidding', label: '竞价中' },
  { value: 'deposit', label: '保证金缴纳' },
  { value: 'due-diligence', label: '尽调期' },
  { value: 'notice', label: '公告期' },
  { value: 'sold', label: '已成交' },
];

const sortOptions = [
  { value: 'default', label: '默认排序' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
  { value: 'area-asc', label: '面积从小到大' },
  { value: 'area-desc', label: '面积从大到小' },
  { value: 'time-asc', label: '开拍时间最近' },
  { value: 'hot-desc', label: '热度最高' },
];

export default function PropertyList() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [filters, setFilters] = useState({
    district: '全部区域',
    priceRange: priceRanges[0],
    areaRange: areaRanges[0],
    rooms: '不限',
    status: 'all',
    onlyLowRisk: false,
  });

  const filteredProperties = useMemo(() => {
    let result = [...mockProperties];

    if (filters.district !== '全部区域') {
      result = result.filter((p) => p.district === filters.district);
    }

    result = result.filter(
      (p) => p.startingPrice >= filters.priceRange.min && p.startingPrice < filters.priceRange.max
    );

    result = result.filter(
      (p) => p.area >= filters.areaRange.min && p.area < filters.areaRange.max
    );

    if (filters.rooms !== '不限') {
      if (filters.rooms === '4室及以上') {
        result = result.filter((p) => p.rooms >= 4);
      } else {
        const roomCount = parseInt(filters.rooms);
        result = result.filter((p) => p.rooms === roomCount);
      }
    }

    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.onlyLowRisk) {
      result = result.filter((p) => p.riskLevel === 'low');
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case 'area-asc':
        result.sort((a, b) => a.area - b.area);
        break;
      case 'area-desc':
        result.sort((a, b) => b.area - a.area);
        break;
      case 'time-asc':
        result.sort((a, b) => new Date(a.auctionStartTime).getTime() - new Date(b.auctionStartTime).getTime());
        break;
      case 'hot-desc':
        result.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
        break;
    }

    return result;
  }, [filters, sortBy]);

  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || '默认排序';

  const activeFilterCount = [
    filters.district !== '全部区域',
    filters.priceRange.label !== '不限',
    filters.areaRange.label !== '不限',
    filters.rooms !== '不限',
    filters.status !== 'all',
    filters.onlyLowRisk,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      district: '全部区域',
      priceRange: priceRanges[0],
      areaRange: areaRanges[0],
      rooms: '不限',
      status: 'all',
      onlyLowRisk: false,
    });
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Page Header */}
      <div className="hero-gradient py-12">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
              全部标的
            </h1>
            <p className="text-primary-200">共找到 <span className="text-gold-400 font-medium">{mockProperties.length}</span> 套司法拍卖房产</p>
          </motion.div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-ink-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif font-bold text-lg text-ink-900">筛选条件</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-ink-500 hover:text-primary-600"
                  >
                    清除全部
                  </button>
                )}
              </div>

              {/* District */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-ink-700 mb-3">所在区域</h4>
                <div className="flex flex-wrap gap-2">
                  {districts.map((district) => (
                    <button
                      key={district}
                      onClick={() => setFilters({ ...filters, district })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors',
                        filters.district === district
                          ? 'bg-primary-100 text-primary-600 font-medium'
                          : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                      )}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-ink-700 mb-3">价格区间</h4>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setFilters({ ...filters, priceRange: range })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors',
                        filters.priceRange.label === range.label
                          ? 'bg-primary-100 text-primary-600 font-medium'
                          : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-ink-700 mb-3">建筑面积</h4>
                <div className="flex flex-wrap gap-2">
                  {areaRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => setFilters({ ...filters, areaRange: range })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors',
                        filters.areaRange.label === range.label
                          ? 'bg-primary-100 text-primary-600 font-medium'
                          : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-ink-700 mb-3">户型</h4>
                <div className="flex flex-wrap gap-2">
                  {roomOptions.map((room) => (
                    <button
                      key={room}
                      onClick={() => setFilters({ ...filters, rooms: room })}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors',
                        filters.rooms === room
                          ? 'bg-primary-100 text-primary-600 font-medium'
                          : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                      )}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-ink-700 mb-3">拍卖状态</h4>
                <div className="space-y-2">
                  {statusOptions.map((status) => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={filters.status === status.value}
                        onChange={() => setFilters({ ...filters, status: status.value })}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-ink-600">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Risk Filter */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlyLowRisk}
                    onChange={(e) => setFilters({ ...filters, onlyLowRisk: e.target.checked })}
                    className="w-4 h-4 text-success-600"
                  />
                  <span className="text-sm text-ink-700">仅显示低风险标的</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-ink-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-ink-50 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    筛选
                    {activeFilterCount > 0 && (
                      <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <span className="text-sm text-ink-500">
                    共 <span className="text-ink-900 font-medium">{filteredProperties.length}</span> 套
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-ink-50 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors text-sm"
                    >
                      <SortAsc className="w-4 h-4" />
                      {currentSortLabel}
                      <ChevronDown className={cn('w-4 h-4 transition-transform', showSortDropdown && 'rotate-180')} />
                    </button>

                    {showSortDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg border border-ink-200 shadow-lg py-1 z-20">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                            className={cn(
                              'w-full text-left px-4 py-2 text-sm transition-colors',
                              sortBy === option.value
                                ? 'text-primary-600 bg-primary-50'
                                : 'text-ink-700 hover:bg-ink-50'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* View Mode */}
                  <div className="flex items-center bg-ink-50 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        viewMode === 'grid' ? 'bg-white text-primary-600 shadow-sm' : 'text-ink-500'
                      )}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        viewMode === 'list' ? 'bg-white text-primary-600 shadow-sm' : 'text-ink-500'
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white rounded-xl border border-ink-200 p-5 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-ink-900">筛选条件</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5 text-ink-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-ink-700 mb-2">区域</h4>
                    <div className="flex flex-wrap gap-2">
                      {districts.slice(0, 5).map((district) => (
                        <button
                          key={district}
                          onClick={() => setFilters({ ...filters, district })}
                          className={cn(
                            'px-3 py-1 text-xs rounded',
                            filters.district === district
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-ink-50 text-ink-600'
                          )}
                        >
                          {district}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-ink-700 mb-2">价格</h4>
                    <div className="flex flex-wrap gap-2">
                      {priceRanges.slice(0, 4).map((range) => (
                        <button
                          key={range.label}
                          onClick={() => setFilters({ ...filters, priceRange: range })}
                          className={cn(
                            'px-3 py-1 text-xs rounded',
                            filters.priceRange.label === range.label
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-ink-50 text-ink-600'
                          )}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Property Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <PropertyCard property={property} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-ink-200 overflow-hidden hover:shadow-lg transition-all hover:border-gold-300 flex"
                  >
                    <div className="w-64 md:w-80 flex-shrink-0 relative">
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={cn(
                          'tag',
                          property.status === 'bidding' ? 'tag-danger' : 'tag-info'
                        )}>
                          {property.status === 'bidding' ? '竞价中' :
                           property.status === 'deposit' ? '保证金' :
                           property.status === 'notice' ? '公告期' :
                           property.status === 'sold' ? '已成交' :
                           '尽调期'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-medium text-ink-900 text-lg hover:text-primary-600 transition-colors">
                            {property.title}
                          </h3>
                          <span className="text-2xl font-bold text-primary-600 font-serif whitespace-nowrap">
                            ¥{formatPrice(property.startingPrice)}
                          </span>
                        </div>
                        <p className="text-sm text-ink-500 mb-3">{property.address}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-ink-600">
                          <span>{property.district}</span>
                          <span className="text-ink-300">|</span>
                          <span>{property.rooms}室</span>
                          <span className="text-ink-300">|</span>
                          <span>{property.area}㎡</span>
                          <span className="text-ink-300">|</span>
                          <span>{property.orientation}</span>
                          <span className="text-ink-300">|</span>
                          <span>{property.floor}</span>
                        </div>

                        {property.riskTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {property.riskTags.map((tag) => (
                              <span key={tag} className="tag tag-warning text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-100">
                        <div className="text-sm text-ink-500">
                          评估价：<span className="text-ink-700">¥{formatPrice(property.appraisalPrice)}</span>
                          <span className="ml-2 text-success-600">
                            省{Math.round((1 - property.startingPrice / property.appraisalPrice) * 100)}%
                          </span>
                        </div>
                        <span className="text-xs text-ink-500">{property.court.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredProperties.length === 0 && (
              <div className="bg-white rounded-xl border border-ink-200 py-16 text-center">
                <Search className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-ink-700 mb-2">暂无符合条件的标的</h3>
                <p className="text-sm text-ink-500 mb-6">请尝试调整筛选条件</p>
                <button onClick={clearFilters} className="btn-primary">
                  清除筛选条件
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredProperties.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button className="px-4 py-2 bg-white border border-ink-200 rounded-lg text-ink-500 hover:bg-ink-50 transition-colors text-sm">
                  上一页
                </button>
                {[1, 2, 3, '...', 10].map((page, i) => (
                  <button
                    key={i}
                    className={cn(
                      'w-10 h-10 rounded-lg text-sm transition-colors',
                      page === 1
                        ? 'bg-primary-600 text-white'
                        : page === '...'
                        ? 'text-ink-400'
                        : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'
                    )}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}
                <button className="px-4 py-2 bg-white border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors text-sm">
                  下一页
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
