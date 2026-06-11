'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useAvailableCoupons } from '@/hooks/use-shop';
import { useCart } from '@/lib/hooks';
import { CartItem } from '@/components/shop/cart-item';
import { cn, formatPrice } from '@/lib/utils';
import type { UserCoupon } from '@pet/shared/types';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    toggleSelect,
    toggleSelectAll,
    selectedItems,
    totalPrice,
    allSelected,
    clearCart,
  } = useCartStore();

  const { data: serverCart, isLoading } = useCart();
  const { data: coupons } = useAvailableCoupons();

  const cartItems = serverCart?.items || items;

  const isAllSelected = allSelected;
  const selectedCount = selectedItems.length;

  const totalAmount = totalPrice;

  const availableCoupons = useMemo(() => {
    if (!coupons) return [];
    return coupons.filter((c) => c.status === 'unused');
  }, [coupons]);

  const handleToggleSelectAll = useCallback(() => {
    toggleSelectAll();
  }, [toggleSelectAll]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold text-foreground">购物车</h1>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 rounded-lg border bg-card p-3">
              <div className="h-5 w-5 rounded-full bg-muted" />
              <div className="h-20 w-20 rounded-md bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">购物车 ({cartItems.length})</h1>
        {cartItems.length > 0 && (
          <button className="text-sm text-muted-foreground hover:text-destructive">
            清空购物车
          </button>
        )}
      </div>

      {!cartItems.length ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <ShoppingBag className="mb-3 h-16 w-16" />
          <p className="text-lg">购物车是空的</p>
          <p className="mt-1 text-sm">快去挑选心仪的商品吧</p>
          <Link
            href="/shop"
            className="mt-4 rounded-lg bg-pet-orange px-6 py-2 text-sm text-white hover:bg-pet-coral"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <CartItem
                key={item.skuId}
                item={item}
                selected={item.selected}
                onToggleSelect={toggleSelect}
                onQuantityChange={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {availableCoupons.length > 0 && (
            <div className="mt-6 rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-medium text-foreground">可用优惠券</h3>
              <div className="space-y-2">
                {availableCoupons.slice(0, 3).map((coupon) => (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="text-sm text-foreground">优惠券 {coupon.code}</span>
                    <button className="text-xs text-pet-orange hover:text-pet-coral">使用</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2"
                  onClick={handleToggleSelectAll}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                      isAllSelected
                        ? 'border-pet-orange bg-pet-orange text-white'
                        : 'border-border',
                    )}
                  >
                    {isAllSelected && (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">全选</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">合计：</span>
                  <span className="text-lg font-bold text-pet-orange">{formatPrice(totalAmount)}</span>
                </div>
                <Link
                  href={selectedCount > 0 ? '/order/checkout' : '#'}
                  className={cn(
                    'rounded-lg px-6 py-2.5 text-sm font-medium transition-colors',
                    selectedCount > 0
                      ? 'bg-pet-orange text-white hover:bg-pet-coral'
                      : 'cursor-not-allowed bg-muted text-muted-foreground',
                  )}
                >
                  结算{selectedCount > 0 ? ` (${selectedCount})` : ''}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
