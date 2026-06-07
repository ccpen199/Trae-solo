import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import type { DashboardStats, ShopRating, HotProduct, ShopSalesRanking } from '../../shared/types';
import { Store, TrendingUp, Users, Bike, Star, Clock, ThumbsDown, RefreshCw, Award, ShoppingBag, MapPin } from 'lucide-react';

const mockStats: DashboardStats = {
  todayOrders: 328,
  todayGMV: 125680,
  activeShops: 45,
  activeRiders: 82,
  orderGrowth: 12.5,
  gmvGrowth: 8.3,
  shopGrowth: 2.1,
  riderGrowth: 5.0,
};

const mockRatings: ShopRating[] = [
  {
    id: 1,
    name: '繁花似锦花店',
    city: '北京市',
    district: '朝阳区',
    address: '建国路88号',
    lat: 39.9042,
    lng: 116.4074,
    rating: 4.9,
    onTimeRate: 98.5,
    badReviewRate: 0.8,
    repurchaseRate: 45.2,
    deliveryRadius: 10,
    isOnline: true,
    createdAt: '2024-01-01',
    compositeScore: 96.8,
    rank: 1,
  },
  {
    id: 2,
    name: '花语时光',
    city: '北京市',
    district: '海淀区',
    address: '中关村大街1号',
    lat: 39.9847,
    lng: 116.3056,
    rating: 4.8,
    onTimeRate: 96.2,
    badReviewRate: 1.2,
    repurchaseRate: 38.6,
    deliveryRadius: 15,
    isOnline: true,
    createdAt: '2024-01-15',
    compositeScore: 94.2,
    rank: 2,
  },
  {
    id: 3,
    name: '馨香花苑',
    city: '北京市',
    district: '西城区',
    address: '金融街15号',
    lat: 39.9128,
    lng: 116.3545,
    rating: 4.7,
    onTimeRate: 95.8,
    badReviewRate: 1.5,
    repurchaseRate: 42.1,
    deliveryRadius: 20,
    isOnline: true,
    createdAt: '2024-02-01',
    compositeScore: 92.5,
    rank: 3,
  },
  {
    id: 4,
    name: '浪漫花坊',
    city: '北京市',
    district: '东城区',
    address: '王府井大街100号',
    lat: 39.9139,
    lng: 116.4103,
    rating: 4.6,
    onTimeRate: 94.5,
    badReviewRate: 1.8,
    repurchaseRate: 35.8,
    deliveryRadius: 12,
    isOnline: true,
    createdAt: '2024-02-15',
    compositeScore: 90.8,
    rank: 4,
  },
  {
    id: 5,
    name: '四季花艺',
    city: '北京市',
    district: '丰台区',
    address: '丰台路50号',
    lat: 39.8586,
    lng: 116.2869,
    rating: 4.5,
    onTimeRate: 93.2,
    badReviewRate: 2.1,
    repurchaseRate: 32.4,
    deliveryRadius: 15,
    isOnline: false,
    createdAt: '2024-03-01',
    compositeScore: 88.6,
    rank: 5,
  },
];

const mockHotProducts: HotProduct[] = [
  { id: 1, name: '浪漫红玫瑰束 99朵', shopName: '繁花似锦花店', salesCount: 156, salesAmount: 93444, category: 'flower' },
  { id: 2, name: '粉色康乃馨花束', shopName: '繁花似锦花店', salesCount: 142, salesAmount: 38056, category: 'flower' },
  { id: 3, name: '向日葵混搭花束', shopName: '花语时光', salesCount: 128, salesAmount: 25472, category: 'flower' },
  { id: 4, name: '白色恋人玫瑰礼盒', shopName: '花语时光', salesCount: 98, salesAmount: 87024, category: 'flower' },
  { id: 5, name: '永生花音乐盒', shopName: '馨香花苑', salesCount: 86, salesAmount: 30788, category: 'gift' },
  { id: 6, name: '郁金香花篮', shopName: '馨香花苑', salesCount: 75, salesAmount: 24600, category: 'flower' },
  { id: 7, name: '蓝色妖姬花束', shopName: '繁花似锦花店', salesCount: 68, salesAmount: 31824, category: 'flower' },
  { id: 8, name: '婚礼手捧花', shopName: '花语时光', salesCount: 52, salesAmount: 35776, category: 'flower' },
  { id: 9, name: '玫瑰香皂花礼盒', shopName: '浪漫花坊', salesCount: 45, salesAmount: 13455, category: 'gift' },
  { id: 10, name: '母亲节专属花束', shopName: '四季花艺', salesCount: 38, salesAmount: 12920, category: 'flower' },
];

const mockSalesRanking: ShopSalesRanking[] = [
  { id: 1, name: '繁花似锦花店', salesAmount: 156800, orderCount: 328, city: '北京市', district: '朝阳区' },
  { id: 2, name: '花语时光', salesAmount: 128500, orderCount: 256, city: '北京市', district: '海淀区' },
  { id: 3, name: '馨香花苑', salesAmount: 98600, orderCount: 198, city: '北京市', district: '西城区' },
  { id: 4, name: '浪漫花坊', salesAmount: 75200, orderCount: 156, city: '北京市', district: '东城区' },
  { id: 5, name: '四季花艺', salesAmount: 52300, orderCount: 112, city: '北京市', district: '丰台区' },
  { id: 6, name: '花时间', salesAmount: 45800, orderCount: 95, city: '北京市', district: '通州区' },
  { id: 7, name: '花之语', salesAmount: 38600, orderCount: 78, city: '北京市', district: '顺义区' },
  { id: 8, name: '蝶恋花', salesAmount: 32100, orderCount: 65, city: '北京市', district: '昌平区' },
  { id: 9, name: '花仙子', salesAmount: 28500, orderCount: 58, city: '北京市', district: '大兴区' },
  { id: 10, name: '花艺坊', salesAmount: 22800, orderCount: 46, city: '北京市', district: '房山区' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [ratings, setRatings] = useState<ShopRating[]>(mockRatings);
  const [hotProducts, setHotProducts] = useState<HotProduct[]>(mockHotProducts);
  const [salesRanking, setSalesRanking] = useState<ShopSalesRanking[]>(mockSalesRanking);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ratings' | 'products' | 'shops'>('ratings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, ratingsRes, productsRes, rankingRes] = await Promise.all([
        api.admin.getDashboard().catch(() => null),
        api.admin.getRatings().catch(() => null),
        api.admin.getHotProducts({ pageSize: 10 }).catch(() => null),
        api.admin.getSalesRanking({ pageSize: 10 }).catch(() => null),
      ]);
      
      if (statsRes) setStats(statsRes);
      if (ratingsRes && ratingsRes.length > 0) setRatings(ratingsRes);
      if (productsRes) setHotProducts(productsRes.items);
      if (rankingRes) setSalesRanking(rankingRes.items);
    } catch (error) {
      console.log('Using mock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <div className="w-8 h-8 bg-warmgold text-white rounded-full flex items-center justify-center font-bold">1</div>;
    if (rank === 2) return <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">2</div>;
    if (rank === 3) return <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">3</div>;
    return <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-medium">{rank}</div>;
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-sprout' : 'text-rose';
  };

  const maxSalesAmount = Math.max(...salesRanking.map(s => s.salesAmount));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-800">运营后台</h1>
              <p className="text-sm text-gray-500 mt-1">数据看板 · 花店评级 · 热销榜单</p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-rose text-white rounded-btn hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in-up">
          <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日订单量</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.todayOrders}</p>
                <p className={`text-sm mt-1 ${getGrowthColor(stats.orderGrowth)}`}>
                  {stats.orderGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.orderGrowth)}% 较昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-rose/10 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-rose" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日GMV</p>
                <p className="text-2xl font-bold text-rose mt-2">¥{stats.todayGMV.toLocaleString()}</p>
                <p className={`text-sm mt-1 ${getGrowthColor(stats.gmvGrowth)}`}>
                  {stats.gmvGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.gmvGrowth)}% 较昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-sprout/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-sprout" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活跃花店</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.activeShops}</p>
                <p className={`text-sm mt-1 ${getGrowthColor(stats.shopGrowth)}`}>
                  {stats.shopGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.shopGrowth)}% 较昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-warmgold/10 rounded-full flex items-center justify-center">
                <Store className="h-6 w-6 text-warmgold" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">活跃骑手</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stats.activeRiders}</p>
                <p className={`text-sm mt-1 ${getGrowthColor(stats.riderGrowth)}`}>
                  {stats.riderGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.riderGrowth)}% 较昨日
                </p>
              </div>
              <div className="w-12 h-12 bg-sprout/10 rounded-full flex items-center justify-center">
                <Bike className="h-6 w-6 text-sprout" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card p-5 shadow-sm border border-gray-100 mb-6 animate-stagger-1">
          <div className="flex gap-2 mb-4">
            {[
              { key: 'ratings' as const, label: '花店评级', icon: Star },
              { key: 'products' as const, label: '热销商品 TOP10', icon: ShoppingBag },
              { key: 'shops' as const, label: '热销花店 TOP10', icon: Store },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-btn transition-colors ${
                  activeTab === tab.key
                    ? 'bg-rose text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'ratings' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">排名</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">花店名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">区域</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">综合评分</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">准时率</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">差评率</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">复购率</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.map((shop) => (
                      <tr key={shop.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">{getRankBadge(shop.rank)}</td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-800">{shop.name}</div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            <Star className="h-3 w-3 inline text-warmgold mr-1" />
                            {shop.rating.toFixed(1)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-rose" />
                            {shop.city} {shop.district}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-lg font-bold ${
                            shop.compositeScore >= 95 ? 'text-sprout' :
                            shop.compositeScore >= 90 ? 'text-warmgold' : 'text-gray-600'
                          }`}>
                            {shop.compositeScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-sprout rounded-full" style={{ width: `${shop.onTimeRate}%` }} />
                            </div>
                            <span className="text-sm text-sprout font-medium">{shop.onTimeRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose rounded-full" style={{ width: `${shop.badReviewRate * 10}%` }} />
                            </div>
                            <span className="text-sm text-rose font-medium">{shop.badReviewRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-warmgold rounded-full" style={{ width: `${shop.repurchaseRate}%` }} />
                            </div>
                            <span className="text-sm text-warmgold font-medium">{shop.repurchaseRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                            shop.isOnline ? 'bg-sprout/10 text-sprout' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${shop.isOnline ? 'bg-sprout animate-pulse' : 'bg-gray-400'}`} />
                            {shop.isOnline ? '营业中' : '休息中'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sprout" />
                  <span>准时率：目标 ≥ 95%</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-rose" />
                  <span>差评率：目标 ≤ 2%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-warmgold" />
                  <span>复购率：目标 ≥ 40%</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">排名</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">商品名称</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">所属花店</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">销量</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">销售额</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">销售趋势</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotProducts.map((product, index) => (
                      <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          {index < 3 ? (
                            <Award className={`h-6 w-6 ${
                              index === 0 ? 'text-warmgold' : index === 1 ? 'text-gray-400' : 'text-amber-600'
                            }`} />
                          ) : (
                            <span className="w-6 h-6 inline-flex items-center justify-center text-gray-500 font-medium">{index + 1}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-800">{product.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-500">{product.shopName}</td>
                        <td className="py-4 px-4 text-center text-gray-800">{product.salesCount} 件</td>
                        <td className="py-4 px-4 text-center text-rose font-semibold">¥{product.salesAmount.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="w-32 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-rose to-rose-400 rounded-full" 
                              style={{ width: `${(product.salesAmount / hotProducts[0].salesAmount) * 100}%` }} 
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shops' && (
            <div className="space-y-4">
              {salesRanking.map((shop, index) => (
                <div 
                  key={shop.id} 
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-card hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {index < 3 ? (
                      <Award className={`h-8 w-8 ${
                        index === 0 ? 'text-warmgold' : index === 1 ? 'text-gray-400' : 'text-amber-600'
                      }`} />
                    ) : (
                      <span className="w-8 h-8 inline-flex items-center justify-center text-gray-500 font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{shop.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {shop.city} {shop.district} · {shop.orderCount} 单
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-rose">¥{shop.salesAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                        <div 
                          className="h-full bg-gradient-to-r from-rose via-rose-400 to-sprout rounded-full transition-all duration-500" 
                          style={{ width: `${(shop.salesAmount / maxSalesAmount) * 100}%` }} 
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">¥0</span>
                        <span className="text-xs text-gray-400">¥{maxSalesAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
