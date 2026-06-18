import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, MapPin, Truck, Users } from 'lucide-react';

const conditions = [
  { label: '全部', value: 'all' },
  { label: '全新', value: 'new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '良好', value: 'good' },
  { label: '一般', value: 'fair' },
];

const categories = ['全部', '数码', '家具', '服饰', '图书', '母婴', '其他'];

export default function SecondhandPage() {
  const [activeCondition, setActiveCondition] = useState('all');
  const [activeCategory, setActiveCategory] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<'all' | 'delivery' | 'meetup'>('all');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat, idx) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(idx)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === idx
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {conditions.map((cond) => (
            <button
              key={cond.value}
              onClick={() => setActiveCondition(cond.value)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                activeCondition === cond.value
                  ? 'border-primary-300 bg-primary-50 text-primary-600'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setDeliveryMode(deliveryMode === 'all' ? 'delivery' : 'all')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
              deliveryMode === 'delivery'
                ? 'border-primary-300 bg-primary-50 text-primary-600'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Truck className="w-3 h-3" />
            快递
          </button>
          <button
            onClick={() => setDeliveryMode(deliveryMode === 'all' ? 'meetup' : 'all')}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
              deliveryMode === 'meetup'
                ? 'border-primary-300 bg-primary-50 text-primary-600'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Users className="w-3 h-3" />
            面交
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Link
            key={i}
            to={`/secondhand/${i}`}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-gray-100 relative">
              <span className="absolute top-2 left-2 badge-green text-[10px]">
                {i % 2 === 0 ? '几乎全新' : '良好'}
              </span>
              <button className="absolute top-2 right-2 p-1 bg-white/80 rounded-full">
                <Heart className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                二手商品标题 - 九成新闲置物品
              </h4>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-base font-bold text-red-500">¥{(50 + i * 30)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> 幸福花园
                </span>
                <span>{3 + i}人收藏</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/secondhand/create"
        className="fixed bottom-6 right-6 w-14 h-14 bg-community-orange rounded-full shadow-lg flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
