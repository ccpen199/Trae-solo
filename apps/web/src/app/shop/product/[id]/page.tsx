'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useProduct } from '@/hooks/use-shop';
import { SkuSelector } from '@/components/shop/sku-selector';
import { cn, formatPrice, formatCount } from '@/lib/utils';
import type { ProductSKU, ProductReview } from '@pet/shared/types';

const MOCK_REVIEWS: ProductReview[] = [];

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(params.id);
  const [selectedSku, setSelectedSku] = useState<ProductSKU | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'detail' | 'reviews'>('detail');

  const [emblaRef] = useEmblaCarousel({ loop: true });

  const currentPrice = selectedSku?.price ?? product?.skus?.[0]?.price ?? 0;
  const currentOriginalPrice = selectedSku?.originalPrice ?? product?.skus?.[0]?.originalPrice ?? 0;
  const currentStock = selectedSku?.stock ?? product?.skus?.[0]?.stock ?? 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="aspect-square w-full rounded-lg bg-muted" />
          <div className="h-6 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="h-8 w-1/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">商品不存在或已下架</p>
        <Link href="/shop" className="mt-4 text-pet-orange hover:text-pet-coral">
          返回商城
        </Link>
      </div>
    );
  }

  const images = [product.mainImage, ...product.images];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/shop" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          返回商城
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div ref={emblaRef} className="overflow-hidden rounded-lg">
            <div className="flex">
              {images.map((img, i) => (
                <div key={i} className="min-w-0 flex-[0_0_100%]">
                  <div className="relative aspect-square">
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={i === 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border">
                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
            {product.subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{product.subtitle}</p>
            )}
          </div>

          <div className="rounded-lg bg-pet-cream/50 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-pet-orange">
                {formatPrice(currentPrice)}
              </span>
              {currentOriginalPrice > currentPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(currentOriginalPrice)}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>销量 {formatCount(product.salesCount)}</span>
              <span>评价 {formatCount(product.reviewCount)}</span>
              <div className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-pet-gold text-pet-gold" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {product.attributes?.length > 0 && (
            <SkuSelector
              attributes={product.attributes}
              skus={product.skus}
              onSkuChange={setSelectedSku}
            />
          )}

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">数量</span>
            <div className="flex items-center rounded-md border">
              <button
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex h-8 w-10 items-center justify-center text-sm">
                {quantity}
              </span>
              <button
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                disabled={quantity >= currentStock}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground">库存 {currentStock}件</span>
          </div>

          <div className="flex gap-3">
            <button
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-pet-orange text-pet-orange transition-colors hover:bg-pet-cream"
              onClick={() => {}}
            >
              <ShoppingCart className="h-5 w-5" />
              加入购物车
            </button>
            <button
              className="flex h-12 flex-1 items-center justify-center rounded-lg bg-pet-orange text-white transition-colors hover:bg-pet-coral"
              onClick={() => {}}
            >
              立即购买
            </button>
          </div>

          <div className="flex justify-center gap-8">
            <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Heart className="h-5 w-5" />
              <span className="text-xs">收藏</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
              <Share2 className="h-5 w-5" />
              <span className="text-xs">分享</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex border-b">
          <button
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'detail'
                ? 'border-pet-orange text-pet-orange'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab('detail')}
          >
            商品详情
          </button>
          <button
            className={cn(
              'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'reviews'
                ? 'border-pet-orange text-pet-orange'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setActiveTab('reviews')}
          >
            商品评价 ({product.reviewCount})
          </button>
        </div>

        {activeTab === 'detail' ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <div className="space-y-4">
            {MOCK_REVIEWS.length > 0 ? (
              MOCK_REVIEWS.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-pet-gold text-pet-gold" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {review.createdAt.toString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{review.content}</p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无评价</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
