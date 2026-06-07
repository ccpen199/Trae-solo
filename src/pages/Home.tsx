import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  TrendingUp,
  Shield,
  Award,
  Eye,
  ChevronRight,
  MapPin,
  Home as HomeIcon,
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  Settings,
  DollarSign,
  FileCheck,
  ArrowRight,
  Database,
} from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';
import api, { ApiResponse, Property, DashboardStats } from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

const mockProperties: Property[] = [
  {
    id: 1,
    projectName: '金域华府',
    city: '上海',
    district: '浦东新区',
    address: '张江高科技园区博云路2号',
    status: 'available',
    price: 6800000,
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    floor: '中',
    orientation: '南',
    decoration: '精装修',
    discount: 95,
    promotion: '限时优惠，认购立减10万',
    vrShowroomUrl: 'vr1',
    vrSalesOfficeUrl: 'vr2',
    vrPanoramaUrl: 'vr3',
    vrStreetViewUrl: 'vr4',
    erpSource: '万科ERP',
    erpSyncStatus: 'synced',
    erpLastSyncAt: '2026-06-07 10:30:00',
    erpSyncCount: 156,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: 2,
    projectName: '滨江壹号',
    city: '上海',
    district: '徐汇区',
    address: '滨江大道88号',
    status: 'available',
    price: 12500000,
    area: 180,
    bedrooms: 4,
    bathrooms: 3,
    floor: '高',
    orientation: '南北通',
    decoration: '豪华装修',
    discount: 100,
    promotion: '送价值50万智能家居',
    vrShowroomUrl: 'vr1',
    vrSalesOfficeUrl: '',
    vrPanoramaUrl: 'vr3',
    vrStreetViewUrl: '',
    erpSource: '恒大销控系统',
    erpSyncStatus: 'synced',
    erpLastSyncAt: '2026-06-07 10:28:00',
    erpSyncCount: 203,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
  },
  {
    id: 3,
    projectName: '阳光花园',
    city: '北京',
    district: '朝阳区',
    address: '建国路99号',
    status: 'locked',
    price: 5200000,
    area: 95,
    bedrooms: 2,
    bathrooms: 2,
    floor: '低',
    orientation: '东南',
    decoration: '简装修',
    discount: 98,
    promotion: '',
    vrShowroomUrl: '',
    vrSalesOfficeUrl: '',
    vrPanoramaUrl: '',
    vrStreetViewUrl: '',
    erpSource: '碧桂园营销云',
    erpSyncStatus: 'synced',
    erpLastSyncAt: '2026-06-07 10:25:00',
    erpSyncCount: 89,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-15',
  },
  {
    id: 4,
    projectName: '翠湖天地',
    city: '上海',
    district: '黄浦区',
    address: '淮海中路333号',
    status: 'available',
    price: 9800000,
    area: 150,
    bedrooms: 3,
    bathrooms: 2,
    floor: '中',
    orientation: '南',
    decoration: '精装修',
    discount: 92,
    promotion: '新春特惠，折上折',
    vrShowroomUrl: 'vr1',
    vrSalesOfficeUrl: 'vr2',
    vrPanoramaUrl: 'vr3',
    vrStreetViewUrl: 'vr4',
    erpSource: '融创ERP',
    erpSyncStatus: 'synced',
    erpLastSyncAt: '2026-06-07 10:20:00',
    erpSyncCount: 278,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
  },
  {
    id: 5,
    projectName: '万科翡翠',
    city: '深圳',
    district: '南山区',
    address: '科技园南路16号',
    status: 'sold',
    price: 8600000,
    area: 110,
    bedrooms: 3,
    bathrooms: 2,
    floor: '高',
    orientation: '南',
    decoration: '精装修',
    discount: 100,
    promotion: '',
    vrShowroomUrl: 'vr1',
    vrSalesOfficeUrl: '',
    vrPanoramaUrl: 'vr3',
    vrStreetViewUrl: '',
    erpSource: '保利销控平台',
    erpSyncStatus: 'pending',
    erpLastSyncAt: '2026-06-06 18:00:00',
    erpSyncCount: 45,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-10',
  },
  {
    id: 6,
    projectName: '保利中央公园',
    city: '广州',
    district: '天河区',
    address: '珠江新城花城大道',
    status: 'available',
    price: 7200000,
    area: 130,
    bedrooms: 3,
    bathrooms: 2,
    floor: '中',
    orientation: '南北通',
    decoration: '精装修',
    discount: 95,
    promotion: '老带新享额外优惠',
    vrShowroomUrl: 'vr1',
    vrSalesOfficeUrl: 'vr2',
    vrPanoramaUrl: 'vr3',
    vrStreetViewUrl: 'vr4',
    erpSource: '万科ERP',
    erpSyncStatus: 'synced',
    erpLastSyncAt: '2026-06-07 10:30:00',
    erpSyncCount: 156,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-08',
  },
];

export default function Home() {
  const { isAdmin } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const propertyResponse = await api.get<ApiResponse<Property[]>>('/properties');

        const propertyResult = propertyResponse?.code !== undefined ? propertyResponse : propertyResponse?.data;
        const propertyPayload = propertyResult?.data;
        const propertyList = Array.isArray(propertyPayload) ? propertyPayload : propertyPayload?.list || [];
        if (propertyResult?.code === 200 && propertyList.length > 0) {
          setProperties(propertyList.slice(0, 6));
        } else {
          setProperties(mockProperties);
        }

        if (isAdmin) {
          const statsResponse = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats').catch(() => null);
          const statsResult = statsResponse?.code !== undefined ? statsResponse : statsResponse?.data;
          if (statsResult?.code === 200) {
            setDashboardStats(statsResult.data);
          }
        }
      } catch (err) {
        setProperties(mockProperties);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      window.location.href = `/properties?city=${encodeURIComponent(searchCity)}`;
    } else {
      window.location.href = '/properties';
    }
  };

  const features = [
    { icon: Shield, title: '资金监管', desc: '第三方资金监管，安全有保障', link: '/purchase' },
    { icon: Award, title: '真实房源', desc: '100%房源核验，拒绝虚假', link: '/admin/tickets' },
    { icon: TrendingUp, title: '专业服务', desc: '一对一顾问，全程陪同', link: '/im' },
    { icon: Eye, title: 'VR看房', desc: '沉浸式体验，足不出户选好房', link: '/properties' },
  ];

  const heroOps = [
    { label: '销售数据看板', value: dashboardStats?.totalSales || 58, icon: BarChart3, link: '/admin/dashboard' },
    { label: 'ERP同步批次', value: properties.reduce((sum, item) => sum + (item.erpSyncCount || 0), 0) || 930, icon: Database, link: '/admin/properties' },
    { label: '待复核工单', value: dashboardStats?.pendingTickets || 3, icon: AlertTriangle, link: '/admin/tickets' },
  ];

  const workflowSteps = [
    { label: '限购核验', link: '/purchase', icon: Shield },
    { label: '电子认购', link: '/purchase', icon: FileCheck },
    { label: '线上签约', link: '/purchase', icon: FileCheck },
    { label: '资金监管', link: '/purchase', icon: DollarSign },
  ];

  const cities = ['上海', '北京', '广州', '深圳', '杭州', '南京'];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <section className="gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 border-2 border-gold-400 rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border-2 border-gold-400 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-10 items-center">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              寻找您的
              <span className="text-gradient">理想家园</span>
            </h1>
            <p className="text-lg text-primary-100 mb-10 max-w-xl">
              金域房产连接购房者、置业顾问和开发商后台，从ERP销控、VR看房到电子认购、线上签约和资金监管，全流程可追踪。
            </p>

            <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex gap-2 max-w-2xl">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-200" />
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-xl bg-white/95 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-400 appearance-none"
                >
                  <option value="">所有城市</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-secondary h-14 px-8 flex items-center gap-2">
                <Search className="w-5 h-5" />
                搜索房源
              </button>
            </form>

            <div className="flex flex-wrap gap-3 mt-6">
              <span className="text-primary-200 text-sm">热门搜索：</span>
              {['三居室', '地铁房', '学区房', '精装修', '江景房'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white/10 text-white/90 rounded-full text-sm cursor-pointer hover:bg-white/20 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-primary-200">开发商直连工作台</p>
                <h2 className="text-2xl font-bold text-white mt-1">销控与成交闭环</h2>
              </div>
              <Link to="/admin/dashboard" className="px-3 py-2 rounded-lg bg-gold-500 text-primary-950 text-sm font-semibold hover:bg-gold-400 transition-colors">
                进入后台
              </Link>
            </div>

            <div className="space-y-3 mb-5">
              {heroOps.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.link}
                    className="flex items-center justify-between rounded-xl bg-white/10 p-4 hover:bg-white/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gold-300" />
                      </div>
                      <span className="text-white font-medium">{item.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{item.value}</span>
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl bg-primary-950/35 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">购房可追踪流程</span>
                <Link to="/purchase" className="text-sm text-gold-300 hover:text-gold-200 flex items-center gap-1">
                  查看流程
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {workflowSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link key={step.label} to={step.link} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-primary-50 hover:bg-white/15">
                      <Icon className="w-4 h-4 text-gold-300" />
                      {step.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="text-center group cursor-pointer hover:scale-105 transition-transform"
                >
                  <div className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">精选房源</h2>
              <p className="text-gray-500">为您精心挑选的优质房产</p>
            </div>
            <Link to="/properties" className="btn-outline flex items-center gap-2">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded w-12" />
                      <div className="h-4 bg-gray-200 rounded w-12" />
                      <div className="h-4 bg-gray-200 rounded w-12" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">开发商直连工作台</h2>
              <p className="text-gray-500">实时销控数据，高效管理楼盘销售</p>
            </div>
            <Link to="/admin/dashboard" className="btn-outline flex items-center gap-2">
              进入工作台
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">转化率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats?.funnelData?.length ? ((dashboardStats.funnelData[dashboardStats.funnelData.length - 1]?.value || 0) / (dashboardStats.funnelData[0]?.value || 1) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上周提升 2.3%
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">客源渠道</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats?.channelData?.length || 5}个
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                线上占比 65%，线下占比 35%
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">成交周期</p>
                  <p className="text-2xl font-bold text-gray-900">18.5天</p>
                </div>
              </div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 rotate-180" />
                较上周缩短 1.2天
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">待复核工单</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats?.pendingTickets || 3}
                  </p>
                </div>
              </div>
              <div className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                2个高风险需优先处理
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/dashboard" className="card p-5 hover:shadow-lg transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">销售数据看板</h4>
                  <p className="text-xs text-gray-500">查看销售趋势分析</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/properties" className="card p-5 hover:shadow-lg transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">楼盘信息配置</h4>
                  <p className="text-xs text-gray-500">管理房源销控状态</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/commission" className="card p-5 hover:shadow-lg transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">分佣规则配置</h4>
                  <p className="text-xs text-gray-500">设置经纪人佣金比例</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/tickets" className="card p-5 hover:shadow-lg transition-shadow group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">虚假房源复核</h4>
                  <p className="text-xs text-gray-500">AI识别+人工审核</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gradient-primary rounded-3xl p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />

            <div className="relative max-w-3xl">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
                开启您的购房之旅
              </h2>
              <p className="text-primary-100 mb-8 text-lg">
                从限购核验到贷款放款，全流程线上办理，专业顾问全程陪同。
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Link to="/purchase" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors group">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-white text-sm">限购核验</h4>
                  <p className="text-xs text-primary-200">资格前置审核</p>
                </Link>
                <Link to="/properties" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors group">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <HomeIcon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-white text-sm">电子认购</h4>
                  <p className="text-xs text-primary-200">在线锁定房源</p>
                </Link>
                <Link to="/purchase" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors group">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-white text-sm">线上签约</h4>
                  <p className="text-xs text-primary-200">CA认证+区块链</p>
                </Link>
                <Link to="/purchase" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors group">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-white text-sm">资金监管</h4>
                  <p className="text-xs text-primary-200">第三方账户监管</p>
                </Link>
                <Link to="/purchase" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors group">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-medium text-white text-sm">贷款预审</h4>
                  <p className="text-xs text-primary-200">银行快速审批</p>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to="/purchase" className="btn-secondary px-8 py-3 text-lg flex items-center gap-2">
                  开始购房流程
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/im" className="px-8 py-3 border-2 border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors font-medium flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  在线咨询顾问
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-primary-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 gradient-gold rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-serif text-2xl font-bold">金域房产</span>
              </div>
              <p className="text-primary-300 mb-4 max-w-md">
                专业房地产交易平台，为您提供安全、高效、透明的房产交易服务。
              </p>
              <p className="text-primary-400 text-sm">
                服务热线：400-888-8888
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">快速链接</h4>
              <ul className="space-y-2 text-primary-300">
                <li><Link to="/properties" className="hover:text-gold-400 transition-colors">房源列表</Link></li>
                <li><Link to="/purchase" className="hover:text-gold-400 transition-colors">购房流程</Link></li>
                <li><Link to="/im" className="hover:text-gold-400 transition-colors">在线咨询</Link></li>
                <li><Link to="/login" className="hover:text-gold-400 transition-colors">用户登录</Link></li>
                <li><Link to="/register" className="hover:text-gold-400 transition-colors">免费注册</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">管理后台</h4>
              <ul className="space-y-2 text-primary-300">
                <li><Link to="/admin/dashboard" className="hover:text-gold-400 transition-colors">销售数据看板</Link></li>
                <li><Link to="/admin/properties" className="hover:text-gold-400 transition-colors">楼盘信息配置</Link></li>
                <li><Link to="/admin/commission" className="hover:text-gold-400 transition-colors">分佣规则配置</Link></li>
                <li><Link to="/admin/tickets" className="hover:text-gold-400 transition-colors">虚假房源复核</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">关于我们</h4>
              <ul className="space-y-2 text-primary-300">
                <li><a href="#" className="hover:text-gold-400 transition-colors">公司介绍</a></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">服务条款</a></li>
                <li><a href="#" className="hover:text-gold-400 transition-colors">隐私政策</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-primary-800 text-center text-primary-400 text-sm">
            © 2024 金域房产. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
