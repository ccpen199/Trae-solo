import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  TrendingUp,
  Award,
  ChevronRight,
  Map,
  UserCog,
  Gift,
  BarChart3,
  Home as HomeIcon,
} from 'lucide-react';
import { propertyApi, operationApi } from '@/lib/api';

interface PropertySummary {
  totalProperties: number;
  onSaleProperties: number;
  avgPrice: number;
  districtCount: number;
  districtStats: Array<{
    district: string;
    count: number;
    avgPrice: number;
    avgSalesRate: number;
  }>;
}

interface MarketOverview {
  summary: {
    totalProperties: number;
    onSaleProperties: number;
    avgPrice: number;
    avgGovPrice: number;
    avgSecondhandPrice: number;
    totalMonthlySales: number;
  };
  marketTrend: Array<{
    month: string;
    avgPrice: number;
    salesVolume: number;
  }>;
  districtStats: any[];
}

export default function Home() {
  const [summary, setSummary] = useState<PropertySummary | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [summaryRes, marketRes, propsRes] = await Promise.all([
        propertyApi.getStats(),
        operationApi.getMarketOverview(),
        propertyApi.getList({ pageSize: 6, sortBy: 'sales', sortOrder: 'desc' }),
      ]);

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
      if (marketRes.success) {
        setMarketOverview(marketRes.data);
      }
      if (propsRes.success) {
        setFeaturedProperties(propsRes.data.list);
      }
    };

    fetchData();
  }, []);

  const quickActions = [
    {
      icon: Map,
      title: '地图找房',
      desc: '直观查看房源分布',
      path: '/map',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: UserCog,
      title: '购房管家',
      desc: 'AI智能匹配推荐',
      path: '/butler',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Gift,
      title: '购房补贴',
      desc: '红包优惠领取',
      path: '/subsidy',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: BarChart3,
      title: '运营分析',
      desc: '数据洞察市场',
      path: '/analytics',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            沈阳区域性房产交易智能决策平台
          </h1>
          <p className="text-blue-100 text-lg mb-6">
            聚焦沈阳本地市场，提供楼盘字典、地图找房、AI购房管家、补贴优惠等一站式智能房产服务
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              浏览楼盘
            </Link>
            <Link
              to="/butler"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
            >
              <UserCog className="w-5 h-5" />
              智能匹配
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">楼盘总数</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary?.totalProperties || '--'}
          </p>
          <p className="text-xs text-gray-400 mt-1">覆盖沈阳各大区域</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">在售均价</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary?.avgPrice ? `${summary.avgPrice.toLocaleString()}` : '--'}
            <span className="text-sm font-normal text-gray-500"> 元/㎡</span>
          </p>
          <p className="text-xs text-green-500 mt-1">较上月 ↑ 2.3%</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-500 text-sm">覆盖区域</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary?.districtCount || '--'}
            <span className="text-sm font-normal text-gray-500"> 个区域</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">和平、沈河、皇姑等</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-500 text-sm">月均成交</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {marketOverview?.summary.totalMonthlySales || '--'}
            <span className="text-sm font-normal text-gray-500"> 套</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">市场活跃度高</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">快速入口</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Featured Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">热门楼盘</h2>
          <Link
            to="/properties"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            查看更多
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProperties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="h-44 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur rounded text-xs font-medium text-blue-600">
                    {property.status}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                  <h3 className="text-white font-bold text-lg">{property.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4" />
                  {property.district} · {property.area}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {property.price.toLocaleString()}
                      <span className="text-sm font-normal text-gray-400"> 元/㎡</span>
                    </p>
                    <p className="text-xs text-gray-500">{property.totalPriceRange}</p>
                  </div>
                  <div className="flex gap-1">
                    {property.tags.slice(0, 2).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Districts */}
      {summary?.districtStats && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">区域房价</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {summary.districtStats.map((district) => (
              <Link
                key={district.district}
                to={`/properties?district=${district.district}`}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors text-center"
              >
                <h3 className="font-medium text-gray-900 mb-2">{district.district}</h3>
                <p className="text-lg font-bold text-blue-600">
                  {district.avgPrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{district.count} 个楼盘</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
