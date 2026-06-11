'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { cn, formatPrice, formatCount } from '@/lib/utils';
import type { ProductSPU } from '@pet/shared/types';

interface ProductCardProps {
  product: ProductSPU;
  className?: string;
}

export const ProductCard = memo(function ProductCard({ product, className }: ProductCardProps) {
  const minPrice = product.skus?.length
    ? Math.min(...product.skus.map((s) => s.price))
    : 0;
  const maxOriginalPrice = product.skus?.length
    ? Math.max(...product.skus.map((s) => s.originalPrice))
    : 0;

  return (
    <Link href={`/shop/product/${product.id}`} className={cn('group', className)}>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.skus?.some((s) => s.originalPrice > s.price) && (
            <span className="absolute left-2 top-2 rounded-md bg-pet-orange px-1.5 py-0.5 text-xs font-medium text-white">
              折扣
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-foreground">
            {product.name}
          </h3>
          {product.subtitle && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {product.subtitle}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1">
            {product.rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-pet-gold text-pet-gold" />
                <span className="text-xs text-muted-foreground">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {formatCount(product.salesCount)}已售
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-pet-orange">
                {formatPrice(minPrice)}
              </span>
              {maxOriginalPrice > minPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(maxOriginalPrice)}
                </span>
              )}
            </div>
            <button
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-pet-orange hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
});
