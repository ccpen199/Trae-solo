import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
  Ruler,
  Palette,
  Wallet,
  Building,
  X,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import CaseCard from '@/components/CaseCard';
import { mockCases } from '@/mock/data';
import type { Case } from '@shared/types';

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆', '苏州', '天津'];

const houseTypes = [
  { label: '一居', value: '一室' },
  { label: '两居', value: '两室' },
  { label: '三居', value: '三室' },
  { label: '四居及以上', value: '四室' },
  { label: '复式/LOFT', value: 'LOFT' },
  { label: '别墅', value: '别墅' },
];

const styles = [
  '现代简约', '北欧风格', '新中式', '日式', '美式', '法式',
  '轻奢风格', '工业风', '极简主义', 'ins风', '欧式古典', '地中海',
];

const roomOptions = [1, 2, 3, 4, 5];

const sortOptions = [
  { value: 'newest', label: '最新发布' },
  { value: 'views', label: '热度最高' },
  { value: 'score', label: '评分最高' },
  { value: 'similarity', label: '相似度' },
];

const chineseNumMap: Record<string, number> = {
  '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

function extractRoomCount(houseType?: string, layout?: string): number | null {
  const text = (houseType || layout || '') as string;
  if (!text) return null;

  const digitMatch = text.match(/(\d+)\s*[室居室房]/);
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 10) return num;
  }

  const chineseMatch = text.match(/([一两二三四五六七八九十])\s*[室居室房]/);
  if (chineseMatch) {
    return chineseNumMap[chineseMatch[1]] || null;
  }

  return null;
}

interface Filters {
  cities: string[];
  houseTypes: string[];
  styles: string[];
  rooms: number[];
  minArea: number;
  maxArea: number;
  minBudget: number;
  maxBudget: number;
}

const defaultFilters: Filters = {
  cities: [],
  houseTypes: [],
  styles: [],
  rooms: [],
  minArea: 0,
  maxArea: 300,
  minBudget: 0,
  maxBudget: 1000000,
};

export default function CaseList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCity = searchParams.get('city');
  const urlKeyword = searchParams.get('keyword');

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    cities: urlCity ? [urlCity] : [],
  });
  const [searchKeyword, setSearchKeyword] = useState(urlKeyword || '');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    setSearchKeyword(urlKeyword || '');
    setCurrentPage(1);
  }, [urlKeyword]);

  const toggleArrayItem = <T extends string | number>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const filteredCases = useMemo(() => {
    let result: Case[] = [...mockCases];

    if (filters.cities.length > 0) {
      result = result.filter((c) => filters.cities.includes(c.city));
    }

    if (filters.houseTypes.length > 0) {
      result = result.filter((c) =>
        filters.houseTypes.some((ht) => {
          const cHouseType = c.houseType || '';
          const cLayout = c.layout || '';
          if (ht === 'LOFT' || ht === '别墅') {
            return cHouseType.includes(ht) || cLayout.includes(ht);
          }
          const roomCountFromHt = extractRoomCount(ht);
          const roomCountFromCase = extractRoomCount(cHouseType, cLayout) || c.rooms || c.bedrooms || 0;
          if (roomCountFromHt) {
            if (ht === '四室') {
              return roomCountFromCase >= 4;
            }
            return roomCountFromCase === roomCountFromHt;
          }
          return cHouseType.includes(ht) || cLayout.includes(ht);
        })
      );
    }

    if (filters.styles.length > 0) {
      result = result.filter((c) => filters.styles.includes(c.style));
    }

    if (filters.rooms.length > 0) {
      result = result.filter((c) => {
        const roomCount = extractRoomCount(c.houseType, c.layout) || c.rooms || c.bedrooms || 0;
        if (filters.rooms.includes(5)) {
          return roomCount >= 5;
        }
        return filters.rooms.includes(roomCount);
      });
    }

    result = result.filter((c) => c.area >= filters.minArea && c.area <= filters.maxArea);
    result = result.filter((c) => c.budget >= filters.minBudget && c.budget <= filters.maxBudget);

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(kw) ||
          c.city.toLowerCase().includes(kw) ||
          c.style.toLowerCase().includes(kw) ||
          (c.district || '').toLowerCase().includes(kw) ||
          (c.tags || []).some((t) => t.toLowerCase().includes(kw))
      );
    }

    switch (sortBy) {
      case 'views':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'score':
        result.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        break;
      case 'similarity':
        result.sort((a, b) => (b.qualityScore || 0) + (b.views || 0) / 1000 - ((a.qualityScore || 0) + (a.views || 0) / 1000));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [filters, searchKeyword, sortBy]);

  const totalPages = Math.ceil(filteredCases.length / pageSize);
  const paginatedCases = filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount =
    filters.cities.length +
    filters.houseTypes.length +
    filters.styles.length +
    filters.rooms.length +
    (filters.minArea > 0 || filters.maxArea < 300 ? 1 : 0) +
    (filters.minBudget > 0 || filters.maxBudget < 1000000 ? 1 : 0);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const formatBudget = (budget: number) => {
    if (budget >= 10000) {
      return `${(budget / 10000).toFixed(0)}万`;
    }
    return `${budget}元`;
  };

  const FilterSection = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div className="pb-5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
      </div>
      {children}
    </div>
  );

  const ChipButton = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
        active
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary hover:text-primary dark:hover:border-primary-400 dark:hover:text-primary-400'
      }`}
    >
      {children}
    </button>
  );

  const FilterPanel = () => (
    <div className="space-y-5">
      <FilterSection title="城市" icon={MapPin}>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <ChipButton
              key={city}
              active={filters.cities.includes(city)}
              onClick={() => {
                setFilters((f) => ({ ...f, cities: toggleArrayItem(f.cities, city) }));
                setCurrentPage(1);
              }}
            >
              {city}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="户型" icon={Home}>
        <div className="flex flex-wrap gap-2">
          {houseTypes.map((ht) => (
            <ChipButton
              key={ht.value}
              active={filters.houseTypes.includes(ht.value)}
              onClick={() => {
                setFilters((f) => ({ ...f, houseTypes: toggleArrayItem(f.houseTypes, ht.value) }));
                setCurrentPage(1);
              }}
            >
              {ht.label}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="居室数" icon={Building}>
        <div className="flex flex-wrap gap-2">
          {roomOptions.map((room) => (
            <ChipButton
              key={room}
              active={filters.rooms.includes(room)}
              onClick={() => {
                setFilters((f) => ({ ...f, rooms: toggleArrayItem(f.rooms, room) }));
                setCurrentPage(1);
              }}
            >
              {room}室
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="面积区间" icon={Ruler}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={300}
              value={filters.minArea}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), filters.maxArea);
                setFilters((f) => ({ ...f, minArea: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={300}
              value={filters.maxArea}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), filters.minArea);
                setFilters((f) => ({ ...f, maxArea: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium">
              {filters.minArea}㎡
            </span>
            <span className="text-gray-400">—</span>
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium">
              {filters.maxArea}㎡
            </span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="风格" icon={Palette}>
        <div className="flex flex-wrap gap-2">
          {styles.map((style) => (
            <ChipButton
              key={style}
              active={filters.styles.includes(style)}
              onClick={() => {
                setFilters((f) => ({ ...f, styles: toggleArrayItem(f.styles, style) }));
                setCurrentPage(1);
              }}
            >
              {style}
            </ChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="预算区间" icon={Wallet}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.minBudget / 10000}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value) * 10000, filters.maxBudget);
                setFilters((f) => ({ ...f, minBudget: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={filters.maxBudget / 10000}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value) * 10000, filters.minBudget);
                setFilters((f) => ({ ...f, maxBudget: val }));
                setCurrentPage(1);
              }}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium text-accent">
              {formatBudget(filters.minBudget)}
            </span>
            <span className="text-gray-400">—</span>
            <span className="px-3 py-1 bg-gray-50 dark:bg-slate-700 rounded-lg font-medium text-accent">
              {formatBudget(filters.maxBudget)}
            </span>
          </div>
        </div>
      </FilterSection>

      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full py-2.5 text-sm text-gray-500 hover:text-primary border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary transition-colors duration-200 flex items-center justify-center gap-1"
        >
          <X className="w-4 h-4" />
          清除全部筛选 ({activeFilterCount})
        </button>
      )}
    </div>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 4) {
          pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-10">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          typeof page === 'string' ? (
            <span key={`dots-${idx}`} className="px-2 text-gray-400">
              {page}
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`min-w-[40px] h-10 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="p-2 sm:px-3 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索城市、小区、风格、户型..."
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              />
            </div>
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl relative"
            >
              <Filter className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-gray-900 dark:text-white">筛选条件</span>
                </div>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    共找到
                  </span>
                  <span className="font-bold text-lg text-primary">
                    {filteredCases.length}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    个案例
                  </span>
                </div>

                <div className="w-full text-sm text-gray-500 dark:text-gray-400">
                  {searchKeyword ? (
                    <span>
                      搜索结果 / 查询结果：关键词“{searchKeyword}”，筛选后匹配 {filteredCases.length} 个真实装修案例
                    </span>
                  ) : activeFilterCount > 0 ? (
                    <span>
                      筛选结果 / 查询结果：当前筛选条件匹配 {filteredCases.length} 个真实装修案例
                    </span>
                  ) : (
                    <span>请输入搜索关键词或使用筛选条件查看查询结果</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary transition-colors duration-200"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      {sortOptions.find((o) => o.value === sortBy)?.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sortDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20 animate-fade-in">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setSortDropdownOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                              sortBy === option.value
                                ? 'text-primary bg-primary-50 dark:bg-primary-900/20 font-medium'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="inline-flex items-center bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {paginatedCases.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {paginatedCases.map((caseItem) => (
                    viewMode === 'grid' ? (
                      <CaseCard key={caseItem.id} caseData={caseItem} />
                    ) : (
                      <div
                        key={caseItem.id}
                        className="card flex flex-col sm:flex-row overflow-hidden cursor-pointer group"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            navigate(`/cases/${caseItem.id}`);
                          }
                        }}
                      >
                        <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                          <img
                            src={caseItem.coverImage}
                            alt={caseItem.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 p-5">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
                            {caseItem.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                            {caseItem.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mb-4">
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-primary" />
                              {caseItem.city} · {caseItem.district}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <Home className="w-4 h-4 text-primary" />
                              {caseItem.houseType}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <Ruler className="w-4 h-4 text-primary" />
                              {caseItem.area}㎡
                            </span>
                            <span className="text-accent font-semibold flex items-center gap-1">
                              <Wallet className="w-4 h-4" />
                              {formatBudget(caseItem.budget)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                            <span className="px-3 py-1 text-xs font-medium text-primary bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                              {caseItem.style}
                            </span>
                            <div className="flex items-center gap-2">
                              <img
                                src={caseItem.designerAvatar}
                                alt={caseItem.designerName}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {caseItem.designerName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/cases/${caseItem.id}`);
                              }}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-600"
                            >
                              查看详情
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>

                <Pagination />
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 py-20 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">暂无符合条件的案例</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">试试调整筛选条件或清除筛选</p>
                <button
                  onClick={resetFilters}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  清除所有筛选
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-800 shadow-2xl animate-slide-in-right overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <span className="font-semibold text-gray-900 dark:text-white">筛选条件</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium text-white bg-primary rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel />
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:border-primary hover:text-primary transition-colors"
              >
                重置
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
