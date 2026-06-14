import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  TrendingUp,
  Calculator,
  FileText,
  GitCompare,
  MapPin,
  Home,
  Building2,
  Key,
  ChevronRight,
  Star,
  Clock,
  Eye,
  Heart,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { propertyApi } from '../utils/api';
import { formatPrice, formatUnitPrice, formatArea, formatRooms, formatRelativeTime, formatChangeRate } from '../utils/format';
import { usePriceTrend } from '../hooks/usePriceTrend';
import { usePropertyStore } from '../store/usePropertyStore';
import type { Property } from '@shared/types';

const categories = [
  { icon: Home, label: '二手房', type: 'secondhand' },
  { icon: Building2, label: '新房', type: 'new' },
  { icon: Key, label: '租房', type: 'rent' },
];

const tools = [
  { icon: Calculator, label: '房贷计算器', path: '/tools/mortgage', color: 'bg-primary-50 text-primary-600' },
  { icon: FileText, label: '税费估算器', path: '/tools/tax', color: 'bg-secondary-50 text-secondary-600' },
  { icon: GitCompare, label: '房源对比', path: '/tools/compare', color: 'bg-success-50 text-success-600' },
  { icon: TrendingUp, label: '房价走势', path: '/properties', color: 'bg-purple-50 text-purple-600' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [hotProperties, setHotProperties] = useState<Property[]>([]);
  const [newProperties, setNewProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, favorites } = usePropertyStore();

  const { data: trendData, loading: trendLoading, latestPrice, priceChange } = usePriceTrend('上海');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hotRes, newRes] = await Promise.all([
          propertyApi.getPropertyRecommendations(),
          propertyApi.getPropertyList({ sortBy: 'time' }),
        ]);
        if (hotRes.success && hotRes.data) {
          setHotProperties(Array.isArray(hotRes.data) ? hotRes.data.slice(0, 4) : (hotRes.data as any).list?.slice(0, 4) || []);
        }
        if (newRes.success && newRes.data) {
          const list = (newRes.data as any).list || newRes.data;
          setNewProperties(Array.isArray(list) ? list.slice(0, 6) : []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/properties?keyword=${encodeURIComponent(searchKeyword)}`);
  };

  const handleCategoryClick = (type: string) => {
    navigate(`/properties?type=${type}`);
  };

  const PropertyCard = ({ property }: { property: Property }) => {
    const isFavorite = favorites.includes(property.id);

    return (
      <div className="card group cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
        <div className="relative">
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(property.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <div className="absolute top-3 left-3 flex gap-1">
            {property.type === 'new' && <span className="badge badge-secondary">新房</span>}
            {property.type === 'rent' && <span className="badge badge-primary">租房</span>}
            {property.verification.antiFraudPassed && (
              <span className="badge badge-success">已核验</span>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate mb-1">{property.title}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{property.district} · {property.address}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <span>{formatRooms(property.rooms, property.halls, property.bathrooms)}</span>
            <span>{formatArea(property.area)}</span>
            <span>{property.orientation}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary-600">{formatPrice(property.price)}</span>
              {property.type !== 'rent' && (
                <span className="text-xs text-gray-400">{formatUnitPrice(property.unitPrice)}</span>
              )}
            </div>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(property.publishTime)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const NewPropertyCard = ({ property }: { property: Property }) => (
    <div
      className="flex gap-4 p-4 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all cursor-pointer"
      onClick={() => navigate(`/property/${property.id}`)}
    >
      <img
        src={property.images[0]}
        alt={property.title}
        className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate mb-1">{property.title}</h4>
        <div className="text-sm text-gray-500 mb-2">
          {formatRooms(property.rooms, property.halls)} · {formatArea(property.area)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">{formatPrice(property.price)}</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {Math.floor(Math.random() * 500) + 100}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTh2MkgyNHYtMmgxMnptMC04djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 animate-fade-down">
              为您找到理想的家
            </h1>
            <p className="text-lg text-primary-100 mb-8 animate-fade-up">
              海量真实房源 · 专业经纪人服务 · 透明交易流程
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8 animate-fade-up">
              <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="flex items-center px-4 text-gray-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索小区、地址、户型..."
                  className="flex-1 py-4 text-gray-900 placeholder-gray-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-8 bg-secondary-500 hover:bg-secondary-600 text-white font-medium transition-colors"
                >
                  搜索
                </button>
              </div>
            </form>

            {/* Category Navigation */}
            <div className="flex justify-center gap-4 animate-fade-up">
              {categories.map((category) => (
                <button
                  key={category.type}
                  onClick={() => handleCategoryClick(category.type)}
                  className="flex flex-col items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <category.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-xl shadow-card p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">12,847</div>
            <div className="text-sm text-gray-500">在售房源</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">3,256</div>
            <div className="text-sm text-gray-500">本月成交</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {latestPrice ? `${(latestPrice / 10000).toFixed(1)}万` : '--'}
            </div>
            <div className="text-sm text-gray-500">均价(元/㎡)</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${priceChange && priceChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {priceChange ? formatChangeRate(priceChange) : '--'}
            </div>
            <div className="text-sm text-gray-500">环比上月</div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Hot Recommendations */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                    <Star className="w-6 h-6 text-secondary-500" />
                    热门推荐
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">精选优质房源，高性价比之选</p>
                </div>
                <Link to="/properties" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="card">
                      <div className="skeleton h-48 w-full" />
                      <div className="p-4 space-y-3">
                        <div className="skeleton h-5 w-3/4" />
                        <div className="skeleton h-4 w-1/2" />
                        <div className="skeleton h-4 w-2/3" />
                        <div className="skeleton h-6 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {hotProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </section>

            {/* Price Trend Chart */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                    价格走势
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">上海市近6个月房价趋势</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost text-sm py-1 px-3 bg-primary-50 text-primary-600">近6月</button>
                  <button className="btn-ghost text-sm py-1 px-3">近1年</button>
                  <button className="btn-ghost text-sm py-1 px-3">近3年</button>
                </div>
              </div>
              <div className="card p-6">
                {trendLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-gray-400">加载中...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number) => [`${(value / 10000).toFixed(2)}万/㎡`, '均价']}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgPrice"
                        stroke="#1E40AF"
                        strokeWidth={2}
                        dot={{ fill: '#1E40AF', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* New Listings */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                    <Clock className="w-6 h-6 text-success-600" />
                    新上房源
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">最新发布的优质房源</p>
                </div>
                <Link to="/properties?sort=time" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-xl">
                      <div className="skeleton w-28 h-20" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-5 w-3/4" />
                        <div className="skeleton h-4 w-1/3" />
                        <div className="skeleton h-5 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {newProperties.map((property) => (
                    <NewPropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Toolbox */}
            <section className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                工具箱
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{tool.label}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick Filters */}
            <section className="card p-6">
              <h3 className="text-lg font-semibold mb-4">热门筛选</h3>
              <div className="flex flex-wrap gap-2">
                {['近地铁', '学区房', '精装修', '满五唯一', '低总价', '小户型', '江景房', '花园洋房'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/properties?keyword=${encodeURIComponent(tag)}`)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-100 hover:text-primary-600 rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            {/* Agent CTA */}
            <section className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
              <h3 className="text-lg font-semibold mb-2">需要专业帮助？</h3>
              <p className="text-sm text-primary-100 mb-4">
                资深经纪人一对一服务，帮您找到最合适的房源
              </p>
              <Link
                to="/agents"
                className="w-full py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                联系经纪人 <ChevronRight className="w-4 h-4" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
