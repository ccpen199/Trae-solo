import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
  ChevronDown,
  Bell,
  Search,
  Tag,
  Gift,
  Clock,
  Star,
  MapPinned,
} from 'lucide-react';
import { ORDER_CATEGORIES, CITIES, CITY_TIER_PRICING, CITY_TIER_MAP } from '../../constants';
import type { OrderCategory } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

const iconMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  ShoppingBag,
  Send,
  Package,
  ClipboardList,
};

const CATEGORY_MULTIPLIER: Record<OrderCategory, number> = {
  buy: 1.2,
  send: 1.0,
  fetch: 0.8,
  errand: 1.5,
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
  { id: 1, name: '代取快递', category: 'fetch' as OrderCategory, icon: Package },
  { id: 2, name: '奶茶外卖', category: 'buy' as OrderCategory, icon: ShoppingBag },
  { id: 3, name: '文件配送', category: 'send' as OrderCategory, icon: Send },
  { id: 4, name: '排队代办', category: 'errand' as OrderCategory, icon: ClipboardList },
];

export default function UserHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentCity, setCurrentCity] = useState('北京');
  const [activeBanner, setActiveBanner] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const cityTier = useMemo(() => CITY_TIER_MAP[currentCity] || 'tier2', [currentCity]);
  const cityPricing = useMemo(() => CITY_TIER_PRICING[cityTier], [cityTier]);

  const getCategoryPrice = (catKey: OrderCategory) => {
    return Math.ceil(cityPricing.baseFee * CATEGORY_MULTIPLIER[catKey]);
  };

  const handleCategoryClick = (category: OrderCategory) => {
    navigate(`/order/create?category=${category}&city=${encodeURIComponent(currentCity)}`);
  };

  const handleRecentOrderClick = () => {
    navigate('/orders');
  };

  const handleBannerClick = (index: number) => {
    setActiveBanner(index);
  };

  const handleSelectCity = (cityName: string) => {
    setCurrentCity(cityName);
    setCityDropdownOpen(false);
  };

  const filteredCities = citySearch
    ? CITIES.filter((c) => c.name.includes(citySearch) || c.province.includes(citySearch))
    : CITIES;

  const groupedCities = filteredCities.reduce<Record<string, typeof CITIES>>((acc, c) => {
    if (!acc[c.province]) acc[c.province] = [];
    acc[c.province].push(c);
    return acc;
  }, {});

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'tier1':
        return 'bg-red-50 text-red-600';
      case 'new_tier1':
        return 'bg-orange-50 text-orange-600';
      case 'tier2':
        return 'bg-blue-50 text-blue-600';
      case 'tier3':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-4 pt-4 pb-16 -mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <button
              onClick={() => {
                setCityDropdownOpen(!cityDropdownOpen);
                setCitySearch('');
              }}
              className="flex items-center gap-1 text-white"
            >
              <MapPinned className="w-4 h-4" />
              <span className="text-sm font-medium">{currentCity}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {cityDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      placeholder="搜索城市..."
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
                  {Object.entries(groupedCities).map(([province, citiesInProvince]) => (
                    <div key={province}>
                      <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 sticky top-0">
                        {province}
                      </div>
                      {citiesInProvince.map((c) => {
                        const cTier = CITY_TIER_MAP[c.name];
                        const cTierLabel = cTier ? CITY_TIER_PRICING[cTier].label : '';
                        return (
                          <button
                            key={c.code}
                            onClick={() => handleSelectCity(c.name)}
                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                              currentCity === c.name
                                ? 'bg-brand-50 text-brand-600 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{c.name}</span>
                            {cTierLabel && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${getTierBadgeStyle(cTier)}`}
                              >
                                {cTierLabel}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              const price = getCategoryPrice(cat.key);
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
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {price}元起
                  </span>
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
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">热门服务</h2>
          <button className="text-sm text-brand-600 flex items-center gap-0.5">
            更多 <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {hotServices.map((service) => {
            const Icon = service.icon;
            const price = getCategoryPrice(service.category);
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryClick(service.category)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{service.name}</p>
                    <p className="text-xs text-brand-600 font-medium mt-0.5">{price}元起</p>
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
            全部 <ChevronDown className="w-4 h-4 -rotate-90" />
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
