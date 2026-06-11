'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import { useFlashSales } from '@/hooks/use-shop';
import { FlashSaleCard } from '@/components/shop/flash-sale-card';
import { formatCountdown } from '@/lib/utils';
import api, { ENDPOINTS } from '@/lib/api';
import type { FlashSale, FlashSaleItem } from '@pet/shared/types';

export default function FlashSalePage() {
  const { data: flashSaleData, isLoading } = useFlashSales({ status: 'active' });
  const [activeSale, setActiveSale] = useState<FlashSale | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const sales = flashSaleData?.items ?? [];
  const currentSale = activeSale || sales[0];

  useEffect(() => {
    if (!currentSale) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const end = new Date(currentSale.endTime).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(diff);
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [currentSale]);

  const countdown = formatCountdown(remainingSeconds);

  const handlePurchase = useCallback(async (item: FlashSaleItem) => {
    try {
      await api.post(ENDPOINTS.flashSale.purchase(), {
        flashSaleId: currentSale?.id,
        skuId: item.skuId,
        quantity: 1,
      });
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  }, [currentSale]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/shop" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          返回商城
        </Link>
      </div>

      <div className="mb-6 rounded-xl bg-gradient-to-r from-pet-orange to-pet-coral p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 animate-flash-sale-pulse" />
            <div>
              <h1 className="text-2xl font-bold">限时秒杀</h1>
              <p className="mt-1 text-sm opacity-90">
                {currentSale?.title || '超值优惠，手慢无'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm opacity-90">距结束</span>
            <div className="flex items-center gap-1">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-lg font-bold">
                {countdown.hours}
              </span>
              <span className="text-lg font-bold">:</span>
              <span className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-lg font-bold">
                {countdown.minutes}
              </span>
              <span className="text-lg font-bold">:</span>
              <span className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-lg font-bold">
                {countdown.seconds}
              </span>
            </div>
          </div>
        </div>
      </div>

      {sales.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {sales.map((sale) => (
            <button
              key={sale.id}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                currentSale?.id === sale.id
                  ? 'bg-pet-orange text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveSale(sale)}
            >
              {sale.title}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-lg border bg-card">
              <div className="aspect-square bg-muted" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-5 w-1/2 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-9 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {currentSale?.items?.map((item) => (
            <FlashSaleCard
              key={item.id}
              item={item}
              isActive={remainingSeconds > 0}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      )}

      {!isLoading && (!currentSale?.items?.length) && (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Zap className="mb-2 h-12 w-12" />
          <p className="text-lg">暂无秒杀活动</p>
          <p className="mt-1 text-sm">请稍后再来看看</p>
        </div>
      )}
    </div>
  );
}
