import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import ProductCard from '@/components/ProductCard';
import { api } from '@/utils/api';
import type { Product } from '../../shared/types';
import { Flower2, Truck, Clock, Shield, Search, Store, ArrowRight, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';

const mockProducts: Product[] = [
  {
    id: 1,
    shopId: 1,
    shopName: '繁花似锦花店',
    name: '浪漫红玫瑰束 99朵',
    category: 'flower',
    price: 599,
    originalPrice: 899,
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=400&fit=crop',
    description: '精选厄瓜多尔进口红玫瑰，99朵代表天长地久的爱情，搭配精美包装和贺卡。',
    festival: ['情人节', '纪念日', '生日'],
    scene: ['表白', '求婚', '祝福'],
    shelfLifeHours: 72,
    deliveryRadius: 10,
    stock: 50,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    shopId: 1,
    shopName: '繁花似锦花店',
    name: '粉色康乃馨花束',
    category: 'flower',
    price: 268,
    originalPrice: 368,
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&h=400&fit=crop',
    description: '33朵粉色康乃馨，代表母爱与感恩，是母亲节送妈妈的最佳选择。',
    festival: ['母亲节', '生日', '教师节'],
    scene: ['感谢', '探望', '祝福'],
    shelfLifeHours: 96,
    deliveryRadius: 10,
    stock: 8,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 3,
    shopId: 2,
    shopName: '花语时光',
    name: '向日葵混搭花束',
    category: 'flower',
    price: 199,
    originalPrice: 259,
    image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop',
    description: '阳光般温暖的向日葵，搭配白色洋桔梗和尤加利叶，传递积极向上的力量。',
    festival: ['生日', '纪念日', '教师节'],
    scene: ['祝福', '感谢', '探望'],
    shelfLifeHours: 120,
    deliveryRadius: 15,
    stock: 30,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 4,
    shopId: 2,
    shopName: '花语时光',
    name: '白色恋人玫瑰礼盒',
    category: 'flower',
    price: 888,
    originalPrice: 1288,
    image: 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&h=400&fit=crop',
    description: '52朵进口白玫瑰，高端礼盒包装，象征纯洁无瑕的爱情。',
    festival: ['情人节', '纪念日', '生日'],
    scene: ['求婚', '表白', '纪念日'],
    shelfLifeHours: 72,
    deliveryRadius: 15,
    stock: 15,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 5,
    shopId: 3,
    shopName: '馨香花苑',
    name: '永生花音乐盒',
    category: 'gift',
    price: 358,
    originalPrice: 458,
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=400&fit=crop',
    description: '精选永生玫瑰，搭配精致音乐盒，可保存3-5年，是收藏级别的精美礼物。',
    festival: ['情人节', '纪念日', '生日', '圣诞节'],
    scene: ['表白', '纪念日', '家居装饰'],
    shelfLifeHours: 8760,
    deliveryRadius: 20,
    stock: 25,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 6,
    shopId: 3,
    shopName: '馨香花苑',
    name: '郁金香花篮',
    category: 'flower',
    price: 328,
    originalPrice: 428,
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop',
    description: '荷兰进口混色郁金香20支，精美花篮包装，适合探望长辈和家居装饰。',
    festival: ['春节', '生日', '探望'],
    scene: ['探望', '祝福', '家居装饰'],
    shelfLifeHours: 96,
    deliveryRadius: 20,
    stock: 5,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 7,
    shopId: 1,
    shopName: '繁花似锦花店',
    name: '蓝色妖姬花束',
    category: 'flower',
    price: 468,
    originalPrice: 598,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
    description: '19朵蓝色妖姬，神秘而高贵，是表达独特爱意的最佳选择。',
    festival: ['情人节', '纪念日', '生日'],
    scene: ['表白', '纪念日', '祝福'],
    shelfLifeHours: 72,
    deliveryRadius: 10,
    stock: 20,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 8,
    shopId: 2,
    shopName: '花语时光',
    name: '婚礼手捧花',
    category: 'flower',
    price: 688,
    originalPrice: 888,
    image: 'https://images.unsplash.com/photo-1522684462852-01b24e76b77d?w=400&h=400&fit=crop',
    description: '专为新娘设计的手捧花，精选进口白玫瑰和铃兰，象征纯洁与幸福。',
    festival: ['婚礼'],
    scene: ['婚礼'],
    shelfLifeHours: 24,
    deliveryRadius: 15,
    stock: 3,
    createdAt: '2024-01-15T10:00:00Z',
  },
];

const features = [
  { icon: Truck, title: '2小时极速达', desc: '全城冷链配送' },
  { icon: Clock, title: '预约配送', desc: '精准送达时间' },
  { icon: Shield, title: '品质保障', desc: '不新鲜包退换' },
  { icon: Flower2, title: '新鲜直采', desc: '每日基地直供' },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    festival?: string;
    scene?: string;
    minPrice?: number;
    maxPrice?: number;
  }>({});
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [nearbyShops, setNearbyShops] = useState([
    { name: '繁花似锦花店', distance: 1.2, stockCount: 156, rating: 4.9 },
    { name: '花语时光', distance: 2.5, stockCount: 89, rating: 4.8 },
    { name: '馨香花苑', distance: 3.8, stockCount: 234, rating: 4.7 },
  ]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.products.list(filters);
      if (response && response.items) {
        setProducts(response.items);
        if (response.items.length === 0) {
          generateRecommendations();
        } else {
          setRecommendedProducts([]);
        }
      } else {
        throw new Error('No data');
      }
    } catch (error) {
      console.log('Using mock data:', error);
      let filtered = [...mockProducts];
      
      if (filters.festival) {
        filtered = filtered.filter(p => p.festival.includes(filters.festival!));
      }
      if (filters.scene) {
        filtered = filtered.filter(p => p.scene.includes(filters.scene!));
      }
      if (filters.minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice!);
      }
      
      setProducts(filtered);
      if (filtered.length === 0) {
        generateRecommendations();
      } else {
        setRecommendedProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = () => {
    const recs = [...mockProducts]
      .filter(p => {
        if (filters.festival && !p.festival.includes(filters.festival)) return false;
        if (filters.scene && !p.scene.includes(filters.scene)) return false;
        return true;
      })
      .slice(0, 4);
    setRecommendedProducts(recs);
  };

  const getAlternativePriceRanges = () => {
    const currentMin = filters.minPrice;
    const currentMax = filters.maxPrice;
    const ranges = [
      { label: '100-300', min: 100, max: 300 },
      { label: '300-500', min: 300, max: 500 },
      { label: '500-1000', min: 500, max: 1000 },
    ];
    return ranges.filter(r => 
      !(currentMin === r.min && currentMax === r.max)
    ).slice(0, 2);
  };

  const handleSwitchPriceRange = (min: number, max: number) => {
    setFilters({ ...filters, minPrice: min, maxPrice: max });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-rose via-rose-400 to-warmgold animate-fade-in-up overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 animate-stagger-1">
            用鲜花传递心意
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-lg animate-stagger-2">
            精选全球优质花材，2小时冷链极速配送，让每一束花都保持最佳状态
          </p>
        </div>
        <div className="absolute bottom-0 right-0 w-1/2 h-full opacity-30">
          <img
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=400&fit=crop"
            alt="flowers"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`bg-white rounded-card p-4 shadow-sm border border-gray-100 flex items-center gap-3 animate-stagger-${index + 1}`}
            >
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                <feature.icon className="h-5 w-5 text-rose" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterBar onFilterChange={handleFilterChange} />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6 animate-stagger-1">
            <h2 className="font-serif text-2xl font-bold text-gray-800">
              精选商品
              {loading && <span className="text-sm font-normal text-gray-400 ml-2">加载中...</span>}
            </h2>
            <span className="text-sm text-gray-500">共 {products.length} 件商品</span>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <div className="bg-white rounded-card p-8 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Search className="h-8 w-8 text-rose" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-serif font-semibold text-gray-800 mb-2">
                      当前价格带暂无商品
                    </h3>
                    <p className="text-gray-500 mb-1">
                      你选择的价格区间
                      <span className="text-rose font-medium mx-1">
                        {filters.minPrice !== undefined && filters.maxPrice !== undefined
                          ? `¥${filters.minPrice}-¥${filters.maxPrice}`
                          : filters.maxPrice !== undefined
                            ? `¥${filters.maxPrice}以下`
                            : `¥${filters.minPrice}以上`}
                      </span>
                      暂无匹配商品
                    </p>
                    <p className="text-gray-400 text-sm">
                      别担心，我们为您准备了以下替代方案
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-sprout-50 rounded-card border border-sprout/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="h-5 w-5 text-sprout" />
                      <span className="font-medium text-gray-800">附近花店库存</span>
                    </div>
                    <div className="space-y-2">
                      {nearbyShops.slice(0, 2).map((shop, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">{shop.name}</span>
                            <span className="text-xs text-gray-400">{shop.distance}km</span>
                          </div>
                          <span className="text-sprout font-medium">{shop.stockCount}件在售</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-card border border-rose/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="h-5 w-5 text-rose" />
                      <span className="font-medium text-gray-800">预计送达时间</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">即时配送</span>
                        <span className="text-gray-800 font-medium">45-90分钟</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">今日送达</span>
                        <span className="text-gray-800 font-medium">14:00前下单</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">明日达</span>
                        <span className="text-gray-800 font-medium">上午10点前</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-warmgold-50 rounded-card border border-warmgold/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="h-5 w-5 text-warmgold" />
                      <span className="font-medium text-gray-800">试试这些价格带</span>
                    </div>
                    <div className="space-y-2">
                      {getAlternativePriceRanges().map((range, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSwitchPriceRange(range.min, range.max)}
                          className="w-full text-left flex items-center justify-between text-sm p-2 rounded-btn hover:bg-white transition-colors"
                        >
                          <span className="text-gray-700">¥{range.label}</span>
                          <ChevronRight className="h-4 w-4 text-warmgold" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2 bg-rose text-white rounded-btn hover:bg-rose-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    清除筛选条件
                  </button>
                  <button
                    onClick={() => handleSwitchPriceRange(100, 300)}
                    className="px-5 py-2 border border-gray-200 text-gray-600 rounded-btn hover:bg-gray-50 transition-colors"
                  >
                    切换到 ¥100-300
                  </button>
                </div>
              </div>

              {recommendedProducts.length > 0 && (
                <div>
                  <h3 className="font-serif text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-warmgold" />
                    为您推荐
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {recommendedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p className="mb-2">花时达 - 让每一份心意准时送达</p>
          <p>© 2024 花时达 版权所有</p>
        </div>
      </footer>
    </div>
  );
}