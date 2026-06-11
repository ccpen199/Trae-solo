'use client';

import { memo } from 'react';
import { ProductCard } from './product-card';
import type { ProductSPU } from '@pet/shared/types';

interface ProductGridProps {
  products: ProductSPU[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

export const ProductGrid = memo(function ProductGrid({
  products,
  loading = false,
  columns = 2,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {Array.from({ length: columns * 2 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-lg border bg-card">
            <div className="aspect-square bg-muted" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
              <div className="h-5 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">暂无商品</p>
        <p className="mt-1 text-sm">去看看其他分类吧</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-3`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});
