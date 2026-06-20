import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid3X3, List, MapPin, Star, TrendingUp, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SearchForm from '../components/search/SearchForm';
import HotelCard from '../components/hotel/HotelCard';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useSearchStore, selectSearchResults, selectSearchLoading, selectSearchParams, selectComparisonResults } from '../store/searchStore';
import { cn, formatCurrency } from '../components/lib/utils';
import { HotelSearchResult, Currency } from '@shared/types';

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchResults = useSearchStore(selectSearchResults);
  const isLoading = useSearchStore(selectSearchLoading);
  const searchParams = useSearchStore(selectSearchParams);
  const comparisonResults = useSearchStore(selectComparisonResults);
  const search = useSearchStore((state) => state.search);
  const compare = useSearchStore((state) => state.compare);
  const setSearchParams = useSearchStore((state) => state.setSearchParams);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const locationState = location.state as any;

  useEffect(() => {
    if (locationState?.destination) {
      setSearchParams({ destination: locationState.destination });
    }
    if (!searchResults || searchResults.data.length === 0) {
      performSearch();
    }
  }, []);

  const performSearch = async () => {
    try {
      await search();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSort = async (sort: string) => {
    setSortBy(sort);
    setSearchParams({ sortBy: sort });
    await search({ sortBy: sort });
  };

  const handleCompare = async () => {
    setShowComparison(true);
    try {
      await compare();
    } catch (error) {
      console.error('Comparison failed:', error);
    }
  };

  const toggleStarFilter = (star: number) => {
    setSelectedStars(prev =>
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const toggleFacilityFilter = (facility: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
    );
  };

  const applyFilters = async () => {
    const params: any = {};
    if (priceRange[0] > 0) params.minPrice = priceRange[0];
    if (priceRange[1] < 10000) params.maxPrice = priceRange[1];
    if (selectedStars.length > 0) params.starRating = selectedStars;
    if (selectedFacilities.length > 0) params.facilities = selectedFacilities;
    
    setSearchParams(params);
    await search(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedStars([]);
    setSelectedFacilities([]);
    setSearchParams({
      minPrice: undefined,
      maxPrice: undefined,
      starRating: undefined,
      facilities: undefined,
    });
    performSearch();
  };

  const sortOptions = [
    { value: 'recommended', label: '综合推荐', icon: Sparkles },
    { value: 'price_low', label: '价格从低到高', icon: TrendingUp },
    { value: 'price_high', label: '价格从高到低', icon: TrendingUp },
    { value: 'rating', label: '评分最高', icon: Star },
    { value: 'distance', label: '距离最近', icon: MapPin },
  ];

  const facilityOptions = [
    'Free WiFi', 'Breakfast Included', 'Swimming Pool', 'Fitness Center',
    'Spa', 'Restaurant', 'Parking', 'Airport Shuttle', 'Pet Friendly',
  ];

  const hasActiveFilters = selectedStars.length > 0 || selectedFacilities.length > 0 || 
    priceRange[0] > 0 || priceRange[1] < 10000;

  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />
      
      <main className="flex-1">
        <div className="bg-white border-b border-cloud-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <SearchForm variant="compact" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-graphite-900">
                {searchParams.destination || '全部酒店'}
                <span className="text-lg font-normal text-graphite-500 ml-2">
                  {searchResults && `(${searchResults.total.toLocaleString()} 家酒店)`}
                </span>
              </h1>
              {searchParams.checkIn && searchParams.checkOut && (
                <p className="text-graphite-500 mt-1">
                  {searchParams.checkIn} - {searchParams.checkOut} · {searchParams.adults}位成人
                  {searchParams.children > 0 && `, ${searchParams.children}位儿童`} · {searchParams.rooms}间房
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showComparison ? 'primary' : 'outline'}
                size="sm"
                onClick={handleCompare}
                leftIcon={<TrendingUp className="w-4 h-4" />}
                isLoading={isLoading && showComparison}
              >
                智能比价
              </Button>
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
              >
                筛选
                {hasActiveFilters && (
                  <Badge variant="accent" size="sm" className="ml-1">
                    {selectedStars.length + selectedFacilities.length + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)}
                  </Badge>
                )}
              </Button>
              <div className="hidden md:flex items-center gap-1 bg-white rounded-lg border border-cloud-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-deep-blue text-white' : 'text-graphite-500 hover:bg-cloud-100'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-deep-blue text-white' : 'text-graphite-500 hover:bg-cloud-100'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSort(option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5',
                  sortBy === option.value
                    ? 'bg-deep-blue text-white'
                    : 'bg-white text-graphite-600 hover:bg-cloud-100 border border-cloud-200'
                )}
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
          </div>

          {showFilters && (
            <div className="bg-white rounded-2xl shadow-elevated p-6 mb-6 border border-cloud-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-graphite-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  筛选条件
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-graphite-500"
                >
                  清除全部
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-graphite-900 mb-4">价格范围 (CNY)</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="input-field w-full"
                        placeholder="最低"
                      />
                      <span className="text-graphite-400">-</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="input-field w-full"
                        placeholder="最高"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-graphite-500">
                      <span>¥0</span>
                      <span>¥10,000+</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-graphite-900 mb-4">酒店星级</h3>
                  <div className="flex flex-wrap gap-2">
                    {[3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => toggleStarFilter(star)}
                        className={cn(
                          'px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5',
                          selectedStars.includes(star)
                            ? 'bg-gold-foil/10 border-gold-foil text-gold-foil'
                            : 'border-cloud-200 text-graphite-600 hover:border-cloud-300'
                        )}
                      >
                        {[...Array(star)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-graphite-900 mb-4">酒店设施</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {facilityOptions.map((facility) => (
                      <label
                        key={facility}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFacilities.includes(facility)}
                          onChange={() => toggleFacilityFilter(facility)}
                          className="w-4 h-4 rounded border-cloud-300 text-deep-blue focus:ring-deep-blue"
                        />
                        <span className="text-sm text-graphite-700">{facility}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-cloud-200">
                <Button variant="ghost" onClick={() => setShowFilters(false)}>
                  取消
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                  应用筛选
                </Button>
              </div>
            </div>
          )}

          {showComparison && comparisonResults && (
            <div className="bg-gradient-to-r from-deep-blue/5 to-coral-orange/5 rounded-2xl p-6 mb-6 border border-deep-blue/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-display font-bold text-graphite-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-deep-blue" />
                    智能比价结果
                  </h3>
                  <p className="text-graphite-600 mt-1">
                    已为您对比 {comparisonResults.summary?.channelsCompared || 5} 个渠道，
                    综合评分 = 价格35% + 评分25% + 取消灵活度20% + 位置权重20%
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComparison(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {comparisonResults.channelSummary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(comparisonResults.channelSummary).map(([channel, data]: [string, any]) => (
                    <div key={channel} className="bg-white rounded-xl p-4 text-center">
                      <p className="text-sm text-graphite-500 capitalize mb-1">{channel}</p>
                      <p className="text-lg font-bold text-deep-blue">
                        {data.averagePrice && formatCurrency(data.averagePrice.amount, data.averagePrice.currency)}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {data.priceSaving && `最高省${data.priceSaving}%`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : searchResults && searchResults.data.length > 0 ? (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {searchResults.data.map((hotel: HotelSearchResult, index: number) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  featured={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-cloud-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-12 h-12 text-graphite-400" />
              </div>
              <h3 className="text-xl font-display font-bold text-graphite-900 mb-2">
                未找到符合条件的酒店
              </h3>
              <p className="text-graphite-500 mb-6">
                请尝试调整筛选条件或搜索其他目的地
              </p>
              <Button variant="primary" onClick={clearFilters}>
                清除筛选条件
              </Button>
            </div>
          )}

          {searchResults && searchResults.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <Button
                variant="outline"
                size="sm"
                disabled={searchResults.page <= 1}
                onClick={() => search({ page: searchResults.page - 1 })}
              >
                上一页
              </Button>
              {[...Array(Math.min(5, searchResults.totalPages))].map((_, i) => {
                let pageNum = i + 1;
                if (searchResults.page > 3) {
                  pageNum = searchResults.page - 2 + i;
                }
                if (pageNum > searchResults.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => search({ page: pageNum })}
                    className={cn(
                      'w-10 h-10 rounded-lg font-medium transition-all',
                      pageNum === searchResults.page
                        ? 'bg-deep-blue text-white'
                        : 'bg-white text-graphite-600 hover:bg-cloud-100 border border-cloud-200'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={searchResults.page >= searchResults.totalPages}
                onClick={() => search({ page: searchResults.page + 1 })}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchResultsPage;
