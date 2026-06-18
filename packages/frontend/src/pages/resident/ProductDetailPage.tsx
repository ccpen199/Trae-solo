import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Building2,
  MapPin,
  ShoppingCart,
  Package,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-4">
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        返回商品列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-16 h-16 rounded-lg bg-gray-100 border-2 transition-colors ${
                  currentImage === i ? 'border-primary-500' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              商品名称 - 新鲜水果拼盘组合装
            </h1>
            <p className="mt-1 text-sm text-gray-500">副标题描述信息</p>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-500">¥39.9</span>
              <span className="text-sm text-gray-400 line-through">¥69.9</span>
              <span className="badge-red">特惠</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">已售 256 件</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">配送方式</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  deliveryType === 'delivery'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Truck className="w-4 h-4" />
                自营配送
              </button>
              <button
                onClick={() => setDeliveryType('pickup')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  deliveryType === 'pickup'
                    ? 'border-primary-500 bg-primary-50 text-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                物业代收
              </button>
            </div>
          </div>

          {deliveryType === 'pickup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">自提点</label>
              <select className="input-field">
                <option>1号楼大堂自提柜</option>
                <option>2号楼物业前台</option>
                <option>社区服务中心</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
              <span className="text-xs text-gray-400">库存充足</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              加入购物车
            </button>
            <button className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              立即购买
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">商品详情</h3>
        <div className="text-sm text-gray-600 leading-relaxed">
          商品详细描述内容，包含产品说明、规格参数、使用方法等信息。
          这里展示商品的详细图文介绍。
        </div>
      </div>
    </div>
  );
}
