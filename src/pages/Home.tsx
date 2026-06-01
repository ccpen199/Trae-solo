import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Home as HomeIcon, Building2, TrendingUp, Users, MapPin, Star, ArrowRight,
  Map, Eye, Shield, Train, GraduationCap, ChevronRight, AlertTriangle, BadgeCheck,
  Store, Key, BarChart3, Activity
} from 'lucide-react';
import { api } from '@/lib/api';

const BUSINESS_LINES = [
  {
    key: 'new_house',
    label: '新房',
    icon: HomeIcon,
    color: 'from-green-500 to-green-600',
    bgLight: 'bg-green-50',
    textColor: 'text-green-600',
    desc: '精选新盘，品质保证，品牌开发商直供',
    link: '/properties?type=new_house',
  },
  {
    key: 'second_hand',
    label: '二手房',
    icon: Building2,
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    desc: '真实房源，核验把关，安心置业首选',
    link: '/properties?type=second_hand',
  },
  {
    key: 'rental',
    label: '租赁',
    icon: Key,
    color: 'from-purple-500 to-purple-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    desc: '海量租房，拎包入住，品质租住体验',
    link: '/properties?type=rental',
  },
  {
    key: 'commercial',
    label: '商业地产',
    icon: Store,
    color: 'from-orange-500 to-orange-600',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    desc: '写字楼商铺，投资首选，商机无限',
    link: '/properties?type=commercial',
  },
];

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    new_house: '新房', second_hand: '二手房', rental: '租赁', commercial: '商业地产',
  };
  return labels[type] || type;
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    new_house: 'bg-green-100 text-green-800',
    second_hand: 'bg-blue-100 text-blue-800',
    rental: 'bg-purple-100 text-purple-800',
    commercial: 'bg-orange-100 text-orange-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

const getVerifyStatusTag = (status: string) => {
  switch (status) {
    case 'approved': return { label: '已核验', cls: 'bg-green-100 text-green-700' };
    case 'pending': return { label: '待核验', cls: 'bg-yellow-100 text-yellow-700' };
    case 'rejected': return { label: '虚假预警', cls: 'bg-red-100 text-red-700' };
    default: return { label: '未知', cls: 'bg-gray-100 text-gray-700' };
  }
};

const getPublishTypeLabel = (type: string) => {
  switch (type) {
    case 'owner': return '房东委托';
    case 'agent': return '中介代管';
    default: return type;
  }
};

const PriceLineChart: React.FC<{ data: { avg_price: number; community: string; price_trend: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const prices = data.map(d => d.avg_price);
  const minP = Math.min(...prices) * 0.95;
  const maxP = Math.max(...prices) * 1.05;
  const range = maxP - minP || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartW,
    y: padding.top + chartH - ((d.avg_price - minP) / range) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartH * ratio;
        const price = maxP - (maxP - minP) * ratio;
        return (
          <g key={ratio}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-500">
              {Math.round(price / 1000)}k
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
          <text x={p.x} y={height - 8} textAnchor="middle" className="text-[9px] fill-gray-600" transform={`rotate(-25, ${p.x}, ${height - 8})`}>
            {p.community}
          </text>
        </g>
      ))}
    </svg>
  );
};

const HeatBarChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 50, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scores = data.map(d => d.heat_score);
  const maxScore = Math.max(...scores) * 1.1 || 100;
  const barWidth = Math.min(40, chartW / data.length - 8);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = padding.top + chartH * ratio;
        const score = maxScore - maxScore * ratio;
        return (
          <g key={ratio}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-500">
              {Math.round(score)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = (d.heat_score / maxScore) * chartH;
        const x = padding.left + (i / data.length) * chartW + (chartW / data.length - barWidth) / 2;
        const y = padding.top + chartH - barH;
        const momChange = d.mom?.avg_price_change;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <rect x={x} y={y} width={barWidth} height={barH} rx="4" fill={`url(#barGrad${i})`} />
            <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="text-[9px] fill-gray-700 font-medium">
              {Math.round(d.heat_score)}
            </text>
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="text-[8px] fill-gray-500" transform={`rotate(-30, ${x + barWidth / 2}, ${height - 8})`}>
              {d.region_name}
            </text>
            {momChange !== null && momChange !== undefined && (
              <text x={x + barWidth / 2} y={y - 14} textAnchor="middle" className={`text-[8px] ${momChange >= 0 ? 'fill-red-500' : 'fill-green-500'}`}>
                {momChange >= 0 ? '+' : ''}{momChange}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

const Home: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [hotProperties, setHotProperties] = useState<any[]>([]);
  const [hotAgents, setHotAgents] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [businessStats, setBusinessStats] = useState<Record<string, { count: number; avgPrice: number }>>({});
  const [communityStats, setCommunityStats] = useState<any[]>([]);
  const [vrCount, setVrCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [propertiesRes, agentsRes, heatmapRes] = await Promise.all([
      api.properties.list({ pageSize: 6 }),
      api.agents.list({ pageSize: 4 }),
      api.tools.getHeatmap({ city: '北京' }),
    ]);

    if (propertiesRes.success && propertiesRes.data) {
      const list = (propertiesRes.data as any).list;
      setHotProperties(list);

      const stats: Record<string, { count: number; totalPrice: number }> = {};
      list.forEach((p: any) => {
        if (!stats[p.type]) stats[p.type] = { count: 0, totalPrice: 0 };
        stats[p.type].count++;
        stats[p.type].totalPrice += p.price;
      });
      const businessStatsResult: Record<string, { count: number; avgPrice: number }> = {};
      Object.keys(stats).forEach(key => {
        businessStatsResult[key] = {
          count: stats[key].count,
          avgPrice: Math.round(stats[key].totalPrice / stats[key].count),
        };
      });
      setBusinessStats(businessStatsResult);

      const vrProperties = list.filter((p: any) => p.vr_url);
      setVrCount(vrProperties.length);
    }
    if (agentsRes.success && agentsRes.data) {
      setHotAgents((agentsRes.data as any).list);
    }
    if (heatmapRes.success && heatmapRes.data) {
      setHeatmapData(heatmapRes.data as any);
    }

    const communityRes = await api.tools.getHeatmap({ city: '北京' });
    if (communityRes.success && communityRes.data) {
      setCommunityStats((communityRes.data as any[]).slice(0, 6));
    }
  };

  const handleSearch = () => {
    const params: Record<string, any> = {};
    if (propertyType !== 'all') params.type = propertyType;
    if (searchKeyword) params.keyword = searchKeyword;
    navigate(`/properties?${new URLSearchParams(params).toString()}`);
  };

  const getPropertyImgUrl = (type: string) => {
    const prompts: Record<string, string> = {
      new_house: 'modern new apartment building under construction, bright facade, real estate',
      second_hand: 'cozy residential apartment building exterior, mature community, real estate',
      rental: 'stylish rental apartment interior, furnished living room, real estate',
      commercial: 'modern office building glass facade, CBD business district, real estate',
    };
    const prompt = prompts[type] || 'modern apartment building exterior, real estate property';
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;
  };

  return (
    <div className="space-y-12">
      {/* Hero Area */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20city%20skyline%20with%20apartment%20buildings%20at%20sunset%2C%20real%20estate%20banner&image_size=landscape_16_9"
            alt="城市背景"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 px-8 py-16 text-white">
          <h1 className="text-4xl font-bold mb-4">找到您的理想家园</h1>
          <p className="text-xl mb-8 text-blue-100">专业级房地产全周期服务平台，覆盖新房、二手房、租赁、商业地产</p>

          <div className="bg-white rounded-xl p-4 shadow-xl max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'all', label: '全部' },
                { value: 'new_house', label: '新房' },
                { value: 'second_hand', label: '二手房' },
                { value: 'rental', label: '租赁' },
                { value: 'commercial', label: '商业地产' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPropertyType(item.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    propertyType === item.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="搜索小区、地址、地铁线..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                搜索房源
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <Link
                to="/map-search"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Map size={16} />
                地图找房
              </Link>
              <Link
                to="/properties"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                <Eye size={16} />
                VR看房
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Four Business Line Entry Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">四大业务线</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BUSINESS_LINES.map((line) => {
            const stats = businessStats[line.key];
            return (
              <Link
                key={line.key}
                to={line.link}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group border border-gray-100"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${line.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <line.icon className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{line.label}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{line.desc}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    房源 <span className="font-semibold text-gray-900">{stats?.count || 0}</span> 套
                  </span>
                  <span className="text-gray-600">
                    均价 <span className="font-semibold text-gray-900">{stats?.avgPrice ? `${stats.avgPrice}万` : '--'}</span>
                  </span>
                </div>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  查看更多 <ChevronRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Price Model Area */}
      {communityStats.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">热门小区房价走势</h2>
            </div>
            <Link to="/properties" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              查看全部 <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
          <div className="mb-4">
            <PriceLineChart data={communityStats.map(s => ({
              avg_price: s.avg_price,
              community: s.region_name,
              price_trend: s.mom?.avg_price_change || 0,
            }))} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {communityStats.map((stat, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-800 truncate">{stat.region_name}</div>
                <div className="text-lg font-bold text-gray-900">{Math.round(stat.avg_price / 1000)}k</div>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <TrendingUp size={12} className={stat.mom?.avg_price_change >= 0 ? 'text-red-500' : 'text-green-500'} />
                  <span className={stat.mom?.avg_price_change >= 0 ? 'text-red-500' : 'text-green-500'}>
                    {stat.mom?.avg_price_change >= 0 ? '+' : ''}{stat.mom?.avg_price_change || 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VR Sales Office Entry */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-8">
          <div className="text-white">
            <div className="flex items-center gap-3 mb-3">
              <Eye size={32} />
              <h2 className="text-2xl font-bold">VR售楼处</h2>
            </div>
            <p className="text-purple-200 mb-2">足不出户，沉浸式看房体验</p>
            <p className="text-purple-300 text-sm mb-4">
              当前支持VR看房房源 <span className="text-white font-bold text-lg">{vrCount}</span> 套
            </p>
            <Link
              to="/map-search"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              <Map size={18} />
              进入VR看房
            </Link>
          </div>
          <div className="hidden md:block">
            <img
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=virtual%20reality%20headset%20viewing%20modern%20apartment%20interior%2C%20futuristic%20technology&image_size=square_hd"
              alt="VR看房"
              className="w-48 h-48 object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Hot Properties Enhanced */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">热门房源</h2>
          <Link to="/properties" className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
            查看更多 <ArrowRight size={18} className="ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotProperties.map((property) => {
            const verifyTag = getVerifyStatusTag(property.verify_status);
            const pubLabel = getPublishTypeLabel(property.publish_type);
            return (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={getPropertyImgUrl(property.type)}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${getTypeColor(property.type)}`}>
                    {getTypeLabel(property.type)}
                  </span>
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${verifyTag.cls}`}>
                      {verifyTag.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                      {pubLabel}
                    </span>
                  </div>
                  {property.vr_url && (
                    <span className="absolute bottom-3 right-3 px-2 py-1 bg-purple-600 text-white rounded text-xs font-medium flex items-center gap-1">
                      <Eye size={12} /> VR
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin size={14} className="mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">{property.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {property.metro_station && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                        <Train size={10} /> {property.metro_station}
                      </span>
                    )}
                    {property.school_district && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">
                        <GraduationCap size={10} /> {property.school_district}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span>{property.bedrooms}室{property.bathrooms}卫</span>
                    <span>{property.area}㎡</span>
                    <span>{property.orientation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-red-600">
                      ¥{property.price}
                      <span className="text-sm font-normal text-gray-500">
                        {property.type === 'rental' ? '/月' : '万'}
                      </span>
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(property.price * 10000 / property.area)}元/㎡
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Agent + Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Heatmap */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              <h2 className="text-xl font-bold text-gray-900">区域热度</h2>
            </div>
          </div>
          {heatmapData.length > 0 ? (
            <>
              <HeatBarChart data={heatmapData.slice(0, 6)} />
              <div className="mt-4 space-y-2">
                {heatmapData.slice(0, 5).map((region, index) => (
                  <div key={index} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-800">{region.region_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{Math.round(region.avg_price / 1000)}k/㎡</span>
                      <span className={`text-xs font-medium ${region.mom?.avg_price_change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {region.mom?.avg_price_change >= 0 ? '+' : ''}{region.mom?.avg_price_change || 0}%
                      </span>
                      <span className="text-gray-500">热度 {Math.round(region.heat_score)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">暂无热度数据</div>
          )}
        </div>

        {/* Enhanced Agents */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">明星经纪人</h2>
            <Link to="/agents" className="text-blue-600 hover:text-blue-700 text-sm">
              查看全部
            </Link>
          </div>
          <div className="space-y-4">
            {hotAgents.slice(0, 4).map((agent) => (
              <Link
                key={agent.id}
                to={`/agents/${agent.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{agent.real_name}</div>
                  <div className="text-sm text-gray-500">{agent.agency_name}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center text-yellow-500">
                    <Star size={14} fill="currentColor" />
                    <span className="ml-1 text-sm font-medium">{agent.average_rating}</span>
                  </div>
                  <div className="text-xs text-gray-500">成交 {agent.total_deals} 套</div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1">
                    <Shield size={12} className="text-green-500" />
                    <span className="text-xs text-gray-600">信用 {agent.credit_score}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} className="text-blue-500" />
                    <span className="text-xs text-gray-600">转化 {agent.conversion_rate}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BadgeCheck size={12} className="text-purple-500" />
                    <span className="text-xs text-gray-600">评价 {agent.review_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
