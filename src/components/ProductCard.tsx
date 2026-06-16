import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Package, Pill } from 'lucide-react';
import type { Product } from '@shared/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/shop/${product.id}`)}
      className="card cursor-pointer group overflow-hidden p-0"
    >
      <div className="aspect-square bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center relative">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-16 h-16 text-forest-300" />
        )}
        {product.isPrescription && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-warm-100 text-warm-500 text-xs font-medium">
            <Pill className="w-3 h-3" />
            处方药
          </div>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-red-100 text-red-500 text-xs font-medium">
            仅剩{product.stock}件
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-forest-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  'w-3 h-3',
                  i <= 4 ? 'text-warm-400 fill-warm-400' : 'text-gray-200'
                )}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">({Math.floor(Math.random() * 500 + 50)})</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs text-gray-400">¥</span>
            <span className="text-xl font-bold text-warm-500">{product.price.toFixed(2)}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-2.5 rounded-xl bg-forest-500 text-white hover:bg-forest-600 transition-colors shadow-soft"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
