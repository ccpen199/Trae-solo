import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Building2, ShoppingBag } from 'lucide-react';

type SortOption = 'default' | 'sales' | 'price_asc';
type DeliveryFilter = 'all' | 'self_operated' | 'property_pickup';

const categories = [
  '全部', '生鲜水果', '日用百货', '零食饮料', '家居清洁', '母婴用品', '其他',
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [sort, setSort] = useState<SortOption>('default');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('all');

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-40 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
          {categories.map((cat, idx) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(idx)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                activeCategory === idx
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {([
                { key: 'default', label: '综合排序' },
                { key: 'sales', label: '销量优先' },
                { key: 'price_asc', label: '价格最低' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSort(opt.key)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    sort === opt.key
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {([
                { key: 'all', label: '全部', icon: ShoppingBag },
                { key: 'self_operated', label: '自营配送', icon: Truck },
                { key: 'property_pickup', label: '物业代收', icon: Building2 },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDeliveryFilter(opt.key)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                    deliveryFilter === opt.key
                      ? 'border-primary-300 bg-primary-50 text-primary-600'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <opt.icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Link
                key={i}
                to={`/products/${i}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100" />
                <div className="p-3">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                    商品名称示例 - 新鲜水果拼盘组合装
                  </h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-bold text-red-500">
                      ¥{(19.9 + i * 5).toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ¥{(49 + i * 5).toFixed(0)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-gray-400">已售 {100 + i * 20}</span>
                    {i % 2 === 0 ? (
                      <span className="badge-blue text-[10px]">自营配送</span>
                    ) : (
                      <span className="badge-purple text-[10px]">物业代收</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
