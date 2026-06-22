import { Flame, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import PriceTag from '@/components/common/PriceTag'
import { ProductCategory } from '@/types'

interface ProductCardProps {
  product: ProductCategory
  imageUrl?: string
  onClick?: () => void
  className?: string
}

export default function ProductCard({ product, imageUrl, onClick, className }: ProductCardProps) {
  const hasHotTag = product.tags.includes('热销')
  const hasNewTag = product.tags.includes('新品')

  return (
    <div
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium',
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            {product.icon}
          </div>
        )}

        <div className="absolute left-3 top-3 flex gap-2">
          {hasHotTag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-medium text-white shadow-glow">
              <Flame className="h-3 w-3" />
              热销
            </span>
          )}
          {hasNewTag && (
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-500 px-2.5 py-1 text-xs font-medium text-white">
              <Sparkles className="h-3 w-3" />
              新品
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-paper-900">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-paper-500">
          {product.description}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <PriceTag price={product.priceRange.min} size="md" />
          <div className="flex items-center gap-1 text-xs text-paper-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>月销 {product.monthlySales.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
