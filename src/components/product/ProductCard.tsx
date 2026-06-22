import { Flame, Sparkles, TrendingUp, Layers, ShieldCheck, Eye, Package, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import PriceTag from '@/components/common/PriceTag'
import { ProductCategory } from '@/types'

interface ProductCardProps {
  product: ProductCategory
  onClick?: () => void
  className?: string
}

export default function ProductCard({ product, onClick, className }: ProductCardProps) {
  const hasHotTag = product.tags.includes('热销')
  const hasNewTag = product.tags.includes('新品')

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium',
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
        <img
          src={product.coverImage}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

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

        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Layers className="h-3 w-3" />
            {product.templateCount}+ 模板
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:bg-brand-600"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            立即制作
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-paper-900">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-paper-500">
          {product.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.editableFeatures.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <PriceTag price={product.priceRange.min} size="md" />
            <span className="text-sm text-paper-500">起</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-paper-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>月销 {product.monthlySales.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
