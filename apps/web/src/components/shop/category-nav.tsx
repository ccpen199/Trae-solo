'use client';

import { memo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PET_TYPE_LABELS, PRODUCT_CATEGORY_TREE } from '@pet/shared/constants';
import type { ProductCategoryNode } from '@pet/shared/types';

interface CategoryNavProps {
  activeId?: string;
  onCategoryChange?: (id: string) => void;
}

export const CategoryNav = memo(function CategoryNav({ activeId, onCategoryChange }: CategoryNavProps) {
  const categories = PRODUCT_CATEGORY_TREE.children || [];

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">商品分类</h3>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {categories.map((cat) => (
          <CategoryItem
            key={cat.id}
            category={cat}
            active={activeId === cat.id}
            onClick={() => onCategoryChange?.(cat.id)}
          />
        ))}
      </div>
    </div>
  );
});

interface CategoryItemProps {
  category: ProductCategoryNode;
  active?: boolean;
  onClick?: () => void;
}

function CategoryItem({ category, active, onClick }: CategoryItemProps) {
  const label = PET_TYPE_LABELS[category.code] || category.name;

  return (
    <Link
      href={`/shop/category/${category.id}`}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors',
        active ? 'bg-pet-cream text-pet-orange' : 'hover:bg-muted',
      )}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          active ? 'bg-pet-orange text-white' : 'bg-muted text-muted-foreground',
        )}
      >
        <span className="text-lg">{getCategoryIcon(category.code)}</span>
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function getCategoryIcon(code: string): string {
  const icons: Record<string, string> = {
    cat_food: '🐱',
    dog_food: '🐶',
    aquarium: '🐠',
    grooming: '🛁',
    medical: '💊',
    toy: '🎾',
  };
  return icons[code] || '🛒';
}
