'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

interface CartItemData {
  skuId: string;
  name?: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  quantity: number;
  selected: boolean;
  attributes?: Record<string, string>;
  stock?: number;
}

interface CartItemProps {
  item: CartItemData;
  selected?: boolean;
  onToggleSelect?: (skuId: string) => void;
  onQuantityChange?: (skuId: string, quantity: number) => void;
  onRemove?: (skuId: string) => void;
}

export const CartItem = memo(function CartItem({
  item,
  selected = false,
  onToggleSelect,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const price = item.price ?? 0;
  const originalPrice = item.originalPrice ?? 0;
  const stock = item.stock ?? 999;
  const image = item.image || '/placeholder-product.png';
  const name = item.name || '商品';
  const attrs = item.attributes;

  const handleDecrease = useCallback(() => {
    if (item.quantity > 1) {
      onQuantityChange?.(item.skuId, item.quantity - 1);
    }
  }, [item.skuId, item.quantity, onQuantityChange]);

  const handleIncrease = useCallback(() => {
    if (item.quantity < stock) {
      onQuantityChange?.(item.skuId, item.quantity + 1);
    }
  }, [item.skuId, item.quantity, stock, onQuantityChange]);

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <button
        className="mt-6 flex-shrink-0"
        onClick={() => onToggleSelect?.(item.skuId)}
      >
        <div
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
            selected
              ? 'border-pet-orange bg-pet-orange text-white'
              : 'border-border',
          )}
        >
          {selected && (
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
              <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          )}
        </div>
      </button>

      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h4 className="line-clamp-2 text-sm font-medium text-foreground">{name}</h4>
          {attrs && Object.keys(attrs).length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(' / ')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-pet-orange">{formatPrice(price)}</span>
            {originalPrice > price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border">
              <button
                className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                disabled={item.quantity <= 1}
                onClick={handleDecrease}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="flex h-7 w-8 items-center justify-center text-sm">
                {item.quantity}
              </span>
              <button
                className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                disabled={item.quantity >= stock}
                onClick={handleIncrease}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button
              className="p-1 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove?.(item.skuId)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
