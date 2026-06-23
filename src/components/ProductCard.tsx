import { ShoppingCart, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import StatusBadge from './StatusBadge'

interface ProductCardProps {
  product: any
  onAddToCart: (productId: number) => void
  adding: boolean
  index: number
}

export default function ProductCard({ product, onAddToCart, adding, index }: ProductCardProps) {
  return (
    <Link
      to={`/shop/${product.id}`}
      className={cn(
        'group bg-white rounded-2xl overflow-hidden shadow-sm opacity-0 animate-slideUp card-hover',
        `stagger-${Math.min(index + 1, 6)}`
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images?.[0] || `https://picsum.photos/seed/product${product.id}/300/300`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge
            status="success"
            label={
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                合规
              </span>
            }
          />
        </div>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">暂时缺货</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-text-primary line-clamp-2 h-12 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">¥{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-text-secondary line-through">¥{product.originalPrice}</span>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-2">库存: {product.stock}件</p>
        <p className="text-xs text-emerald-600 mt-1 truncate">{product.approvalNumber}</p>
        <button
          onClick={(e) => {
            e.preventDefault()
            onAddToCart(product.id)
          }}
          disabled={product.stock === 0 || adding}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          {adding ? '加入中...' : '加入购物车'}
        </button>
      </div>
    </Link>
  )
}
