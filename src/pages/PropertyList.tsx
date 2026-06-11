import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  List,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SearchX,
  Home,
  Building2,
  Key,
  Globe,
  Sun,
} from 'lucide-react';
import { getProperties } from '@/services/api';
import type { Property, PropertyCategory } from '@/mock/data';
import FilterPanel, { FilterState, defaultFilters } from '@/components/FilterPanel';
import PropertyCard from '@/components/PropertyCard';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type SortField = 'price' | 'area' | 'publishTime' | 'newest';
type SortOrder = 'asc' | 'desc';

const categoryNames: Record<PropertyCategory, string> = {
  secondhand: '二手房',
  new: '新房',
  rental: '租房',
  overseas: '海外房产',
  vacation: '度假房产',
};

const categoryIcons: Record<PropertyCategory, typeof Home> = {
  secondhand: Home,
  new: Building2,
  rental: Key,
  overseas: Globe,
  vacation: Sun,
};

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'price', label: '价格' },
  { value: 'area', label: '面积' },
  { value: 'publishTime', label: '发布时间' },
  { value: 'newest', label: '最新上架' },
];

const PAGE_SIZE = 12;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-0 animate-pulse">
      <div className="aspect-[4/3] bg-neutral-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-neutral-200 rounded w-3/4" />
        <div className="h-7 bg-neutral-200 rounded w-1/3" />
        <div className="flex gap-4">
          <div className="h-4 bg-neutral-200 rounded w-16" />
          <div className="h-4 bg-neutral-200 rounded w-16" />
          <div className="h-4 bg-neutral-200 rounded w-16" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-2/3" />
        <div className="flex gap-2">
          <div className="h-5 bg-neutral-200 rounded w-12" />
          <div className="h-5 bg-neutral-200 rounded w-12" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-full pt-3" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
        <SearchX className="w-10 h-10 text-neutral-400" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-800 mb-2">暂无符合条件的房源</h3>
      <p className="text-neutral-500 text-center max-w-md">
        尝试调整筛选条件或扩大搜索范围，看看是否有更多合适的房源
      </p>
    </motion.div>
  );
}

export default function PropertyList() {
  const { category = 'secondhand' } = useParams<{ category: PropertyCategory }>();
  const validCategory = useMemo(
    () => (['secondhand', 'new', 'rental', 'overseas', 'vacation'].includes(category) ? category : 'secondhand') as PropertyCategory,
    [category]
  );

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('newest');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await getProperties({
        category: validCategory,
        page,
        pageSize: PAGE_SIZE,
        filters: {
          priceMin: filters.priceRange[0] * 10000,
          priceMax: filters.priceRange[1] * 10000,
          areaMin: filters.areaRange[0],
          areaMax: filters.areaRange[1],
          bedrooms: filters.bedrooms.length > 0 ? filters.bedrooms : undefined,
        },
      });

      let sorted = [...response.data];
      if (sortField === 'price') {
        sorted.sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));
      } else if (sortField === 'area') {
        sorted.sort((a, b) => (sortOrder === 'asc' ? a.area - b.area : b.area - a.area));
      } else if (sortField === 'publishTime' || sortField === 'newest') {
        sorted.sort((a, b) =>
          sortOrder === 'asc'
            ? new Date(a.listingDate).getTime() - new Date(b.listingDate).getTime()
            : new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime()
        );
      }

      setProperties(sorted);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [validCategory, filters, sortField, sortOrder]);

  useEffect(() => {
    fetchProperties();
  }, [validCategory, page, filters, sortField, sortOrder]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const CategoryIcon = categoryIcons[validCategory];

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters(defaultFilters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            page === 1
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-700'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </button>

        {pages.map((p, index) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-neutral-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={cn(
                'min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all',
                page === p
                  ? 'bg-primary-800 text-white'
                  : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            page === totalPages
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-600 hover:bg-primary-50 hover:text-primary-700'
          )}
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <CategoryIcon className="w-6 h-6 text-primary-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 font-serif">
                  {categoryNames[validCategory]}
                </h1>
                <p className="text-sm text-neutral-500">
                  共找到 <span className="font-semibold text-primary-700">{total}</span> 套房源
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  viewMode === 'grid'
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-white text-primary-800 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <List className="w-4 h-4" />
                列表
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-card p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-neutral-500">排序：</span>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      sortField === option.value
                        ? 'bg-primary-100 text-primary-800'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    {option.label}
                    {sortField === option.value && (
                      <ArrowUpDown
                        className={cn(
                          'w-3.5 h-3.5 transition-transform',
                          sortOrder === 'desc' && 'rotate-180'
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'grid gap-6',
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  )}
                >
                  {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </motion.div>
              ) : properties.length === 0 ? (
                <EmptyState key="empty" />
              ) : (
                <motion.div
                  key="content"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className={cn(
                    'grid gap-6',
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  )}
                >
                  {properties.map((property) => (
                    <motion.div key={property.id} variants={item}>
                      <PropertyCard property={property} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
}
