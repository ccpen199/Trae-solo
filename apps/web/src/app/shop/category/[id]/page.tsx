'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Filter, ArrowUpDown } from 'lucide-react';
import { useProducts, useCategoryChildren } from '@/hooks/use-shop';
import { ProductGrid } from '@/components/shop/product-grid';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { label: '综合排序', value: 'default' },
  { label: '销量优先', value: 'sales' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' },
  { label: '最新上架', value: 'newest' },
];

export default function CategoryPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;

  const [sortBy, setSortBy] = useState('default');
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);

  const { data: subCategories } = useCategoryChildren(categoryId);
  const [activeSubId, setActiveSubId] = useState<string>();

  const queryParams: Record<string, unknown> = {
    categoryId: activeSubId || categoryId,
    page,
    pageSize: 20,
  };

  if (sortBy === 'sales') queryParams.sortBy = 'salesCount';
  if (sortBy === 'price_asc') { queryParams.sortBy = 'price'; queryParams.sortOrder = 'asc'; }
  if (sortBy === 'price_desc') { queryParams.sortBy = 'price'; queryParams.sortOrder = 'desc'; }
  if (sortBy === 'newest') queryParams.sortBy = 'createdAt';

  const { data: productsData, isLoading } = useProducts(queryParams);

  const handleSubCategoryChange = useCallback((id: string) => {
    setActiveSubId(id === activeSubId ? undefined : id);
    setPage(1);
  }, [activeSubId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {subCategories && subCategories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className={cn(
              'rounded-full px-4 py-1.5 text-sm transition-colors',
              !activeSubId
                ? 'bg-pet-orange text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
            onClick={() => handleSubCategoryChange('')}
          >
            全部
          </button>
          {subCategories.map((cat) => (
            <button
              key={cat.id}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm transition-colors',
                activeSubId === cat.id
                  ? 'bg-pet-orange text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
              onClick={() => handleSubCategoryChange(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-4 py-2">
        <div className="flex items-center gap-3 overflow-x-auto">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={cn(
                'whitespace-nowrap text-sm transition-colors',
                sortBy === option.value
                  ? 'font-medium text-pet-orange'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => { setSortBy(option.value); setPage(1); }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          className={cn(
            'flex items-center gap-1 text-sm transition-colors',
            showFilter ? 'text-pet-orange' : 'text-muted-foreground',
          )}
          onClick={() => setShowFilter(!showFilter)}
        >
          <Filter className="h-4 w-4" />
          筛选
        </button>
      </div>

      {showFilter && (
        <div className="mb-4 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">更多筛选条件开发中...</p>
        </div>
      )}

      <ProductGrid
        products={productsData?.items ?? []}
        loading={isLoading}
        columns={3}
      />

      {productsData && productsData.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            {page} / {productsData.totalPages}
          </span>
          <button
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
            disabled={page >= productsData.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
