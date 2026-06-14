import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Grid3X3,
  Map,
  Heart,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Building2,
  Home,
  Key,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { propertyApi } from '../utils/api';
import { formatPrice, formatUnitPrice, formatArea, formatRooms, formatRelativeTime } from '../utils/format';
import { usePropertyStore } from '../store/usePropertyStore';
import type { Property, SearchFilters } from '@shared/types';

const ITEMS_PER_PAGE = 12;

const priceRanges = [
  { label: '不限', min: undefined, max: undefined },
  { label: '100万以下', min: 0, max: 1000000 },
  { label: '100-200万', min: 1000000, max: 2000000 },
  { label: '200-300万', min: 2000000, max: 3000000 },
  { label: '300-500万', min: 3000000, max: 5000000 },
  { label: '500-800万', min: 5000000, max: 8000000 },
  { label: '800万以上', min: 8000000, max: undefined },
];

const areaRanges = [
  { label: '不限', min: undefined, max: undefined },
  { label: '50㎡以下', min: 0, max: 50 },
  { label: '50-70㎡', min: 50, max: 70 },
  { label: '70-90㎡', min: 70, max: 90 },
  { label: '90-120㎡', min: 90, max: 120 },
  { label: '120-144㎡', min: 120, max: 144 },
  { label: '144㎡以上', min: 144, max: undefined },
];

const roomOptions = [
  { label: '不限', value: undefined },
  { label: '一室', value: 1 },
  { label: '两室', value: 2 },
  { label: '三室', value: 3 },
  { label: '四室', value: 4 },
  { label: '五室及以上', value: 5 },
];

const orientationOptions = ['不限', '南', '北', '东', '西', '南北通透'];
const decorationOptions = ['不限', '毛坯', '简装', '精装', '豪装'];
const districtOptions = ['不限', '浦东新区', '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '宝山区', '闵行区'];

const sortOptions = [
  { label: '综合排序', value: 'weight' },
  { label: '价格从低到高', value: 'price' },
  { label: '价格从高到低', value: 'price-desc' },
  { label: '面积从大到小', value: 'area' },
  { label: '最新发布', value: 'time' },
];

export default function PropertyList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '');

  const { filters, setFilters, resetFilters, toggleFavorite, favorites, mapState, setMapState } = usePropertyStore();

  useEffect(() => {
    const typeParam = searchParams.get('type') as SearchFilters['type'];
    const keywordParam = searchParams.get('keyword');
    const sortParam = searchParams.get('sort') as SearchFilters['sortBy'];

    if (typeParam) {
      setFilters({ type: typeParam });
    }
    if (sortParam) {
      setFilters({ sortBy: sortParam });
    }
    if (keywordParam) {
      setSearchKeyword(keywordParam);
    }
  }, [searchParams, setFilters]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        let response;
        if (searchKeyword.trim()) {
          response = await propertyApi.searchByKeyword(searchKeyword, filters);
        } else {
          response = await propertyApi.getPropertyList(filters);
        }
        if (response.success && response.data) {
          const list = (response.data as any).list || response.data;
          const propertyList = Array.isArray(list) ? list : [];
          setProperties(propertyList);
          usePropertyStore.getState().setProperties(propertyList);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [filters, searchKeyword]);

  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return properties.slice(start, start + ITEMS_PER_PAGE);
  }, [properties, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchKeyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      setSearchParams({ keyword: searchKeyword });
    } else {
      setSearchParams({});
    }
  };

  const handleTypeChange = (type: SearchFilters['type']) => {
    setFilters({ type });
    setSearchParams({ type: type || '' });
  };

  const handlePriceRangeChange = (range: typeof priceRanges[0]) => {
    setFilters({ priceMin: range.min, priceMax: range.max });
  };

  const handleAreaRangeChange = (range: typeof areaRanges[0]) => {
    setFilters({ areaMin: range.min, areaMax: range.max });
  };

  const handleRoomsChange = (rooms: number | undefined) => {
    setFilters({ rooms: rooms ? [rooms] : undefined });
  };

  const handleOrientationChange = (orientation: string) => {
    setFilters({ orientation: orientation === '不限' ? undefined : [orientation] });
  };

  const handleDecorationChange = (decoration: string) => {
    setFilters({ decoration: decoration === '不限' ? undefined : [decoration] });
  };

  const handleDistrictChange = (district: string) => {
    setFilters({ district: district === '不限' ? undefined : [district] });
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    setFilters({ sortBy });
  };

  const handleToggleFilter = (key: keyof SearchFilters, value: boolean) => {
    setFilters({ [key]: value });
  };

  const toggleView = () => {
    setMapState({ isMapView: !mapState.isMapView });
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const isFavorite = favorites.includes(property.id);

    return (
      <div className="card group cursor-pointer flex flex-col md:flex-row" onClick={() => navigate(`/property/${property.id}`)}>
        <div className="relative md:w-64 flex-shrink-0">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-48 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(property.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <div className="absolute top-3 left-3 flex gap-1">
            {property.type === 'new' && <span className="badge badge-secondary">新房</span>}
            {property.type === 'rent' && <span className="badge badge-primary">租房</span>}
            {property.verification.antiFraudPassed && (
              <span className="badge badge-success">已核验</span>
            )}
            {property.vrUrl && <span className="badge badge-primary">VR看房</span>}
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{property.title}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{property.district} · {property.address}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-sm text-gray-600">{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
            <span className="text-sm text-gray-600">{formatArea(property.area)}</span>
            <span className="text-sm text-gray-600">{property.orientation}</span>
            <span className="text-sm text-gray-600">{property.floor}</span>
            <span className="text-sm text-gray-600">{property.decoration}</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {property.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-gray">{tag}</span>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary-600">{formatPrice(property.price)}</span>
              {property.type !== 'rent' && (
                <span className="text-xs text-gray-400">{formatUnitPrice(property.unitPrice)}</span>
              )}
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(property.publishTime)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 pb-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      {children}
    </div>
  );

  const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-primary-50 text-primary-600 font-medium'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索小区、地址、户型..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-outline flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              筛选
            </button>
            <button type="submit" className="btn-primary">搜索</button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-5 sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  筛选条件
                </h3>
                <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-primary-600">
                  重置
                </button>
              </div>

              <div className="space-y-4">
                <FilterSection title="房源类型">
                  <div className="flex flex-wrap gap-2">
                    <FilterButton active={!filters.type} onClick={() => handleTypeChange(undefined)}>
                      全部
                    </FilterButton>
                    <FilterButton active={filters.type === 'secondhand'} onClick={() => handleTypeChange('secondhand')}>
                      <Home className="w-3 h-3 inline mr-1" />二手房
                    </FilterButton>
                    <FilterButton active={filters.type === 'new'} onClick={() => handleTypeChange('new')}>
                      <Building2 className="w-3 h-3 inline mr-1" />新房
                    </FilterButton>
                    <FilterButton active={filters.type === 'rent'} onClick={() => handleTypeChange('rent')}>
                      <Key className="w-3 h-3 inline mr-1" />租房
                    </FilterButton>
                  </div>
                </FilterSection>

                <FilterSection title="价格区间">
                  <div className="grid grid-cols-2 gap-2">
                    {priceRanges.map((range) => (
                      <FilterButton
                        key={range.label}
                        active={filters.priceMin === range.min && filters.priceMax === range.max}
                        onClick={() => handlePriceRangeChange(range)}
                      >
                        {range.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="面积区间">
                  <div className="grid grid-cols-2 gap-2">
                    {areaRanges.map((range) => (
                      <FilterButton
                        key={range.label}
                        active={filters.areaMin === range.min && filters.areaMax === range.max}
                        onClick={() => handleAreaRangeChange(range)}
                      >
                        {range.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="户型">
                  <div className="flex flex-wrap gap-2">
                    {roomOptions.map((option) => (
                      <FilterButton
                        key={option.label}
                        active={filters.rooms?.includes(option.value as number) || (option.value === undefined && !filters.rooms)}
                        onClick={() => handleRoomsChange(option.value)}
                      >
                        {option.label}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="朝向">
                  <div className="flex flex-wrap gap-2">
                    {orientationOptions.map((option) => (
                      <FilterButton
                        key={option}
                        active={filters.orientation?.includes(option) || (option === '不限' && !filters.orientation)}
                        onClick={() => handleOrientationChange(option)}
                      >
                        {option}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="装修">
                  <div className="flex flex-wrap gap-2">
                    {decorationOptions.map((option) => (
                      <FilterButton
                        key={option}
                        active={filters.decoration?.includes(option) || (option === '不限' && !filters.decoration)}
                        onClick={() => handleDecorationChange(option)}
                      >
                        {option}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="区域">
                  <div className="flex flex-wrap gap-2">
                    {districtOptions.map((option) => (
                      <FilterButton
                        key={option}
                        active={filters.district?.includes(option) || (option === '不限' && !filters.district)}
                        onClick={() => handleDistrictChange(option)}
                      >
                        {option}
                      </FilterButton>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="特色筛选">
                  <div className="space-y-2">
                    {[
                      { key: 'nearMetro', label: '近地铁', icon: '🚇' },
                      { key: 'schoolDistrict', label: '学区房', icon: '🎓' },
                      { key: 'hasVR', label: '有VR', icon: '🎥' },
                      { key: 'verifiedOnly', label: '已核验', icon: '✓' },
                    ].map(({ key, label, icon }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            filters[key as keyof SearchFilters]
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300'
                          }`}
                          onClick={() => handleToggleFilter(key as keyof SearchFilters, !filters[key as keyof SearchFilters])}
                        >
                          {filters[key as keyof SearchFilters] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700">
                          {icon} {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-card p-4 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    共找到 <span className="font-semibold text-primary-600">{properties.length}</span> 套房源
                  </span>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                      value={filters.sortBy || 'weight'}
                      onChange={(e) => handleSortChange(e.target.value as SearchFilters['sortBy'])}
                      className="border-none bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={toggleView}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      !mapState.isMapView ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 inline mr-1" />
                    列表
                  </button>
                  <button
                    onClick={toggleView}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      mapState.isMapView ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    <Map className="w-4 h-4 inline mr-1" />
                    地图
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {(filters.type || filters.priceMin || filters.priceMax || filters.rooms?.length || filters.district?.length) && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">已选：</span>
                  {filters.type && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded text-sm">
                      {filters.type === 'secondhand' ? '二手房' : filters.type === 'new' ? '新房' : '租房'}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ type: undefined })} />
                    </span>
                  )}
                  {filters.rooms?.map((room) => (
                    <span key={room} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded text-sm">
                      {room}室
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          const newRooms = filters.rooms?.filter((r) => r !== room);
                          setFilters({ rooms: newRooms?.length ? newRooms : undefined });
                        }}
                      />
                    </span>
                  ))}
                  {filters.district?.map((district) => (
                    <span key={district} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded text-sm">
                      {district}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => {
                          const newDistricts = filters.district?.filter((d) => d !== district);
                          setFilters({ district: newDistricts?.length ? newDistricts : undefined });
                        }}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Property List */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card flex flex-col md:flex-row">
                    <div className="skeleton w-full md:w-64 h-48 md:h-auto" />
                    <div className="p-4 flex-1 space-y-3">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-4 w-2/3" />
                      <div className="skeleton h-6 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedProperties.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无符合条件的房源</h3>
                <p className="text-gray-500 mb-4">试试调整筛选条件，或清除筛选后重新搜索</p>
                <button onClick={resetFilters} className="btn-primary">清除筛选</button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
