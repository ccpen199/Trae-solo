'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { FlashSaleItem } from '@pet/shared/types';

interface FlashSaleCardProps {
  item: FlashSaleItem;
  isActive?: boolean;
  onPurchase?: (item: FlashSaleItem) => void;
}

export const FlashSaleCard = memo(function FlashSaleCard({
  item,
  isActive = false,
  onPurchase,
}: FlashSaleCardProps) {
  const progress = item.saleStock > 0
    ? Math.round((item.soldCount / item.saleStock) * 100)
    : 100;
  const isSoldOut = item.saleStock <= 0 || item.soldCount >= item.saleStock;

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src="/placeholder-product.png"
          alt="秒杀商品"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
        <div className="absolute left-0 top-0 flex items-center gap-1 bg-pet-orange px-2 py-1 text-xs font-bold text-white">
          <Zap className="h-3 w-3" />
          秒杀
        </div>
      </div>
      <div className="p-3">
        <h4 className="line-clamp-1 text-sm font-medium text-foreground">
          限时秒杀商品
        </h4>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-pet-orange">
            {formatPrice(item.salePrice)}
          </span>
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(item.originalPrice)}
          </span>
        </div>
        <div className="mt-2">
          <div className="relative h-4 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'absolute left-0 top-0 h-full rounded-full transition-all',
                progress >= 90 ? 'bg-destructive' : 'bg-pet-orange',
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
              {progress >= 90 ? '即将售罄' : `已抢${progress}%`}
            </span>
          </div>
        </div>
        <button
          disabled={!isActive || isSoldOut}
          className={cn(
            'mt-2 w-full rounded-md py-2 text-sm font-medium transition-colors',
            isActive && !isSoldOut
              ? 'bg-pet-orange text-white hover:bg-pet-coral'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
          onClick={() => onPurchase?.(item)}
        >
          {isSoldOut ? '已抢光' : isActive ? '立即抢购' : '未开始'}
        </button>
      </div>
    </div>
  );
});
