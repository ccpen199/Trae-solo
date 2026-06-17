import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
  MapPin,
  ChevronRight,
  Bell,
  Search,
  Tag,
  Gift,
  Clock,
  Star,
} from 'lucide-react';
import { ORDER_CATEGORIES } from '../../constants';
import type { OrderCategory } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
};

interface BannerItem {
  id: number;
  title: string;
  desc: string;
  gradient: string;
}

interface CouponItem {
  id: number;
  name: string;
  value: string;
  condition: string;
  color: string;
}

const banners: BannerItem[] = [
  { id: 1, title: '新用户专享', desc: '首单立减10元', gradient: 'from-blue-500 to-indigo-600' },
  { id: 2, title: '限时特惠', desc: '全天跑腿8折起', gradient: 'from-orange-500 to-red-500' },
  { id: 3, title: '邀请有礼', desc: '邀请好友得20元', gradient: 'from-green-500 to-teal-600' },
];

const hotCoupons: CouponItem[] = [
  { id: 1, name: '满30减5', value: '¥5', condition: '满30元可用', color: 'blue' },
  { id: 2, name: '新用户券', value: '¥10', condition: '无门槛', color: 'orange' },
  { id: 3, name: '跑腿专享', value: '8折', condition: '最高减8元', color: 'green' },
];

const hotServices = [
  { id: 1, name: '代取快递', price: '5元起', icon: Package },
  { id: 2, name: '奶茶外卖', price: '3元起', icon: ShoppingBag },
  { id: 3, name: '文件配送', price: '8元起', icon: Send },
  { id: 4, name: '排队代办', price: '15元起', icon: ClipboardList },
];

export default function UserHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentCity] = useState('北京');
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchValue, setSearchValue] = useState('');

  const handleCategoryClick = (category: OrderCategory) => {
    navigate(`/order/create?category=${category}`);
  };

  const handleRecentOrderClick = () => {
    navigate('/orders');
  };

  const handleBannerClick = (index: number) => {
    setActiveBanner(index);
  };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-4 pt-4 pb-16 -mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-white">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{currentCity}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <button className="relative p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
          </button>
        </div>

        <div className="mb-2">
          <h1 className="text-white text-xl font-bold mb-0.5">
            你好，{user?.nickname || '用户'} 👋
          </h1>
          <p className="text-blue-100 text-sm">需要什么服务？闪跑帮您搞定</p>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索服务、订单..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <div className="bg-white rounded-3xl p-5 shadow-xl">
          <div className="grid grid-cols-4 gap-3">
            {ORDER_CATEGORIES.map((cat) => {
              const Icon = iconMap[cat.iconName];
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryClick(cat.key)}
                  className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${cat.color}15` }}
                  >
                    {Icon && <Icon className="w-7 h-7" style={{ color: cat.color }} />}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="relative overflow-hidden rounded-3xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeBanner * 100}%)` }}
          >
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`min-w-full h-32 bg-gradient-to-r ${banner.gradient} p-5 flex flex-col justify-center`}
              >
                <h3 className="text-white text-lg font-bold">{banner.title}</h3>
                <p className="text-white/80 text-sm mt-1">{banner.desc}</p>
                <button className="mt-3 self-start px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium hover:bg-white/30 transition-colors">
                  立即领取
                </button>
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleBannerClick(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeBanner ? 'w-5 bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div
          onClick={handleRecentOrderClick}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">最近订单</p>
              <p className="text-xs text-gray-500 mt-0.5">配送中 · 预计15分钟送达</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-brand-600">
            <span className="text-sm font-medium">查看</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">热门服务</h2>
          <button className="text-sm text-brand-600 flex items-center gap-0.5">
            更多 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {hotServices.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryClick('errand')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{service.name}</p>
                    <p className="text-xs text-brand-600 font-medium mt-0.5">{service.price}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Gift className="w-5 h-5 text-accent-500" />
            优惠券推荐
          </h2>
          <button className="text-sm text-brand-600 flex items-center gap-0.5">
            全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {hotCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex hover:shadow-md transition-shadow"
            >
              <div
                className={`w-24 flex flex-col items-center justify-center py-4 ${
                  coupon.color === 'blue'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : coupon.color === 'orange'
                    ? 'bg-gradient-to-br from-orange-500 to-red-500'
                    : 'bg-gradient-to-br from-green-500 to-teal-600'
                }`}
              >
                <span className="text-white text-2xl font-bold">{coupon.value}</span>
                <Tag className="w-3 h-3 text-white/80 mt-1" />
              </div>
              <div className="flex-1 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{coupon.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{coupon.condition}</p>
                </div>
                <button className="px-3 py-1.5 bg-accent-50 rounded-full text-accent-600 text-xs font-medium hover:bg-accent-100 transition-colors">
                  去使用
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5 mb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Star className="w-5 h-5 text-accent-500" />
            用户好评
          </h2>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
              张
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">张先生</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-accent-500 text-accent-500" />
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-400">2小时前</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            骑手小哥非常专业，15分钟就送到了，包装完好，服务态度超棒！下次还会用闪跑～
          </p>
        </div>
      </div>
    </div>
  );
}
