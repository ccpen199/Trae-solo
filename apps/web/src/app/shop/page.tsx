'use client';

import { useState } from 'react';
import { Zap, Ticket, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useProducts, useFlashSales } from '@/hooks/use-shop';
import { CategoryNav } from '@/components/shop/category-nav';
import { ProductGrid } from '@/components/shop/product-grid';
import { CouponCard } from '@/components/shop/coupon-card';
import { FlashSaleCard } from '@/components/shop/flash-sale-card';
import { cn } from '@/lib/utils';
import type { CouponTemplate } from '@pet/shared/types';

const MOCK_COUPONS: CouponTemplate[] = [
  {
    id: '1', name: '新人专享券', type: 'fixed', value: 20, minAmount: 100,
    scope: 'all', durationType: 'days', durationDays: 7,
    totalQuantity: 1000, receivedCount: 560, usedCount: 120, perUserLimit: 1, status: 'active',
  },
  {
    id: '2', name: '猫粮满减券', type: 'percentage', value: 0.85, minAmount: 200,
    scope: 'category', scopeIds: ['cat_food'], durationType: 'fixed',
    validFrom: new Date('2024-01-01'), validTo: new Date('2024-12-31'),
    totalQuantity: 500, receivedCount: 300, usedCount: 80, perUserLimit: 3, status: 'active',
  },
  {
    id: '3', name: '全场免邮券', type: 'shipping', value: 0, minAmount: 0,
    scope: 'all', durationType: 'days', durationDays: 3,
    totalQuantity: 2000, receivedCount: 1800, usedCount: 500, perUserLimit: 1, status: 'active',
  },
];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string>();
  const { data: productsData, isLoading: productsLoading } = useProducts(
    activeCategory ? { categoryId: activeCategory } : undefined,
  );
  const { data: flashSaleData } = useFlashSales({ status: 'active' });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <CategoryNav activeId={activeCategory} onCategoryChange={setActiveCategory} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-pet-orange" />
            <h2 className="text-lg font-bold text-foreground">限时秒杀</h2>
          </div>
          <Link
            href="/shop/flash-sale"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-pet-orange"
          >
            更多 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {flashSaleData?.items?.slice(0, 4).map((sale) =>
            sale.items?.slice(0, 1).map((item) => (
              <FlashSaleCard key={item.id} item={item} isActive />
            )),
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-pet-orange" />
          <h2 className="text-lg font-bold text-foreground">领券中心</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_COUPONS.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} onReceive={(id) => console.log('receive', id)} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">推荐商品</h2>
        </div>
        <ProductGrid
          products={productsData?.items ?? []}
          loading={productsLoading}
          columns={4}
        />
      </section>
    </div>
  );
}
