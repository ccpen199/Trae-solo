import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Package,
  Shield,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Pill,
} from 'lucide-react';
import type { Product } from '@shared/types';
import { cn } from '@/lib/utils';

const mockProduct: Product = {
  id: 'p1',
  merchantId: 'm1',
  name: '皇家幼犬粮 2kg 全价营养配方 支持消化系统健康',
  category: '主粮',
  species: ['dog'],
  ageRange: '幼年',
  healthCondition: [],
  price: 158.0,
  stock: 156,
  isPrescription: false,
  images: [],
  description: '专为幼犬设计的全价营养配方粮，采用高品质动物蛋白，支持消化系统健康和免疫系统发育。含有DHA和EPA，促进大脑和视力发育。',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-white hover:bg-forest-50 transition-colors shadow-card"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="section-title flex-1">商品详情</h1>
        <button
          onClick={() => setLiked(!liked)}
          className="p-2.5 rounded-xl bg-white hover:bg-red-50 transition-colors shadow-card"
        >
          <Heart className={cn('w-5 h-5', liked ? 'text-red-500 fill-red-500' : 'text-gray-500')} />
        </button>
        <button className="p-2.5 rounded-xl bg-white hover:bg-forest-50 transition-colors shadow-card">
          <Share2 className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card !p-0 overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center">
            <Package className="w-24 h-24 text-forest-200" />
          </div>
          <div className="grid grid-cols-4 gap-2 p-4 border-t border-forest-50">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-forest-300 transition-all"
              >
                <Package className="w-8 h-8 text-forest-200" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start gap-3 mb-3">
              {mockProduct.isPrescription && (
                <span className="tag tag-orange flex items-center gap-1">
                  <Pill className="w-3 h-3" />
                  处方药
                </span>
              )}
              <span className="tag tag-green">{mockProduct.category}</span>
              <span className="tag tag-gray">{mockProduct.ageRange}</span>
            </div>
            <h1 className="font-display font-bold text-xl text-gray-900 mb-3">
              {mockProduct.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn('w-4 h-4', i <= 4 ? 'text-warm-400 fill-warm-400' : 'text-gray-200')}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-1">4.8</span>
              </div>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">已售 2.3k+</span>
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">{mockProduct.stock} 件库存</span>
            </div>
            <div className="flex items-baseline gap-2 p-4 rounded-2xl bg-warm-50">
              <span className="text-sm text-warm-500">¥</span>
              <span className="text-3xl font-bold text-warm-500">{mockProduct.price.toFixed(2)}</span>
              <span className="text-sm text-gray-400 line-through ml-2">¥{Math.round(mockProduct.price * 1.3).toFixed(2)}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">服务保障</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-forest-500" />
                正品保障
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-4 h-4 text-forest-500" />
                极速发货
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="w-4 h-4 text-forest-500" />
                7天退换
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">购买数量</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(mockProduct.stock, quantity + 1))}
                  className="w-9 h-9 rounded-xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1">
                <ShoppingCart className="w-5 h-5" />
                加入购物车
              </button>
              <button className="btn-primary flex-1">
                立即购买
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-4">商品详情</h3>
        <p className="text-gray-600 leading-relaxed">{mockProduct.description}</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">适用物种</p>
            <p className="font-semibold text-gray-900">{mockProduct.species.join('、')}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">适用年龄</p>
            <p className="font-semibold text-gray-900">{mockProduct.ageRange}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">商品分类</p>
            <p className="font-semibold text-gray-900">{mockProduct.category}</p>
          </div>
          <div className="p-4 rounded-2xl bg-cream-50">
            <p className="text-xs text-gray-500 mb-1">库存状态</p>
            <p className="font-semibold text-forest-600">现货充足</p>
          </div>
        </div>
      </div>
    </div>
  );
}
