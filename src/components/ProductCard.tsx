import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Clock, Truck, Flower2, MapPin } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../../shared/types';
import { useCartStore } from '@/store/useCartStore';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const { addItem } = useCartStore();

  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  const staggerClass = `animate-stagger-${Math.min((index % 5) + 1, 5)}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block bg-white rounded-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${staggerClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          loading="lazy"
        />
        
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-rose text-white px-2 py-1 text-xs font-medium rounded-btn">
            -{discount}%
          </div>
        )}

        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-3 right-3 bg-warmgold text-white px-2 py-1 text-xs font-medium rounded-btn">
            仅剩{product.stock}件
          </div>
        )}

        <button
          onClick={handleLike}
          className={`absolute top-3 ${discount > 0 ? 'left-14' : 'left-3'} p-2 rounded-full transition-all duration-300 ${liked ? 'bg-rose text-white' : 'bg-white/80 text-gray-600 hover:bg-rose hover:text-white'}`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        </button>

        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <button
            onClick={handleAddToCart}
            className="w-full bg-rose text-white py-2 rounded-btn font-medium flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            加入购物车
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-serif font-semibold text-gray-800 line-clamp-1 text-base">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {product.festival.slice(0, 2).map((f) => (
            <span key={f} className="text-xs px-2 py-0.5 bg-rose-50 text-rose rounded-btn">
              {f}
            </span>
          ))}
          {product.scene.slice(0, 1).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 bg-sprout-50 text-sprout rounded-btn">
              {s}
            </span>
          ))}
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-3 h-10">
          {product.description}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3.5 w-3.5 text-sprout flex-shrink-0" />
            <span>保鲜期 {product.shelfLifeHours}小时</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Truck className="h-3.5 w-3.5 text-rose flex-shrink-0" />
            <span>配送 {product.deliveryRadius}km</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Flower2 className={`h-3.5 w-3.5 flex-shrink-0 ${product.stock > 10 ? 'text-sprout' : product.stock > 3 ? 'text-warmgold' : 'text-rose'}`} />
            <span className={product.stock <= 3 ? 'text-rose font-medium' : ''}>
              库存 {product.stock}件
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-warmgold flex-shrink-0" />
            <span>预计 {Math.ceil(product.deliveryRadius * 3)}分钟达</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose">
              ¥{product.price.toFixed(2)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ¥{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {product.shopName && (
            <span className="text-xs text-gray-500 truncate max-w-[100px]">
              {product.shopName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
