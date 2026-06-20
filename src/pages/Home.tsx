import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  FileCheck,
  Gavel,
  Users,
  Building2,
  Percent,
  ChevronRight,
  ArrowRight,
  Clock,
  Eye,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties, mockMarketData, mockMarketTrend } from '@/mock/data';
import type { MarketTrendPoint } from '@/types';
import { formatPrice, cn } from '@/utils';

const platformStats = (() => {
  const active = mockProperties.filter((p) => p.status !== 'sold' && p.status !== 'ended').length;
  const sold = mockProperties.filter((p) => p.status === 'sold');
  const soldCount = sold.length;
  const totalAmount = sold.reduce((s, p) => s + p.startingPrice, 0);
  const avgDiscount = mockProperties.length > 0
    ? Math.round(mockProperties.reduce((s, p) => s + (1 - p.startingPrice / p.appraisalPrice), 0) / mockProperties.length * 100)
    : 0;
  return [
    { label: '在拍标的', value: active, display: active.toLocaleString(), change: '+3', trend: 'up' as const, icon: Gavel },
    { label: '今日成交', value: soldCount, display: soldCount.toString(), change: '+1', trend: 'up' as const, icon: TrendingUp },
    { label: '累计成交额', value: totalAmount, display: totalAmount >= 100000000 ? (totalAmount / 100000000).toFixed(1) + '亿' : (totalAmount / 10000).toFixed(0) + '万', change: '+5.2%', trend: 'up' as const, icon: Building2 },
    { label: '平均折扣', value: avgDiscount, display: avgDiscount + '折', change: '-3%', trend: 'down' as const, icon: Percent },
  ];
})();

const riskTypes = [
  {
    key: 'mortgage',
    title: '抵押异常',
    icon: Shield,
    description: '多轮抵押、高额抵押等风险情形',
    color: 'danger',
  },
  {
    key: 'household',
    title: '户口未迁',
    icon: Users,
    description: '原房主户口未迁出，影响落户',
    color: 'warning',
  },
  {
    key: 'lease',
    title: '租赁存续',
    icon: FileCheck,
    description: '长期租约，"买卖不破租赁"',
    color: 'danger',
  },
  {
    key: 'seizure',
    title: '多轮查封',
    icon: AlertTriangle,
    description: '多家法院轮候查封，过户周期长',
    color: 'danger',
  },
];

const districts = ['全部', '浦东新区', '徐汇区', '静安区', '长宁区', '杨浦区', '闵行区', '黄浦区', '虹口区'];

const generateDistrictTrend = (basePrice: number, baseCount: number) => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const priceVariations = [0.92, 0.94, 0.96, 0.98, 1.0, 1.03];
  const countVariations = [0.7, 0.85, 1.0, 1.1, 1.2, 1.3];
  return months.map((month, i) => ({
    month,
    avgPrice: Math.round(basePrice * priceVariations[i]),
    transactionCount: Math.round(baseCount * countVariations[i]),
  }));
};

const districtTrends: Record<string, MarketTrendPoint[]> = {
  '全部': mockMarketTrend,
  '浦东新区': generateDistrictTrend(78500, 128),
  '徐汇区': generateDistrictTrend(95200, 86),
  '静安区': generateDistrictTrend(82300, 65),
  '长宁区': generateDistrictTrend(88600, 72),
  '杨浦区': generateDistrictTrend(65400, 94),
  '闵行区': generateDistrictTrend(58200, 156),
  '黄浦区': generateDistrictTrend(102000, 58),
  '虹口区': generateDistrictTrend(62000, 76),
};

const getDistrictMetrics = (district: string) => {
  if (district === '全部') {
    return [
      { label: '平均溢价率', value: '17.5%', change: '+2.3%', trend: 'up' as const, color: 'success' as const },
      { label: '整体流拍率', value: '19.8%', change: '-3.1%', trend: 'down' as const, color: 'success' as const },
      { label: '近半年成交量', value: '821套', change: '+156套', trend: 'up' as const, color: 'success' as const },
      { label: '参拍人数/标的', value: '12人', change: '+3人', trend: 'up' as const, color: 'warning' as const },
    ];
  }
  const data = mockMarketData.find(d => d.district === district);
  if (!data) {
    return [
      { label: '平均溢价率', value: '15.0%', change: '+1.5%', trend: 'up' as const, color: 'success' as const },
      { label: '整体流拍率', value: '20.0%', change: '-2.0%', trend: 'down' as const, color: 'success' as const },
      { label: '近半年成交量', value: '60套', change: '+10套', trend: 'up' as const, color: 'success' as const },
      { label: '参拍人数/标的', value: '10人', change: '+2人', trend: 'up' as const, color: 'warning' as const },
    ];
  }
  const priceChange = data.avgPriceChange;
  return [
    { label: '平均溢价率', value: data.premiumRate + '%', change: (priceChange > 0 ? '+' : '') + (priceChange * 0.8).toFixed(1) + '%', trend: priceChange >= 0 ? 'up' as const : 'down' as const, color: 'success' as const },
    { label: '整体流拍率', value: data.unsoldRate + '%', change: (priceChange > 0 ? '-' : '+') + Math.abs(priceChange * 0.5).toFixed(1) + '%', trend: priceChange >= 0 ? 'down' as const : 'up' as const, color: 'success' as const },
    { label: '近半年成交量', value: data.transactionCount + '套', change: '+' + Math.round(data.transactionCount * 0.15) + '套', trend: 'up' as const, color: 'success' as const },
    { label: '参拍人数/标的', value: Math.round(data.transactionCount / 10) + '人', change: '+2人', trend: 'up' as const, color: 'warning' as const },
  ];
};

export default function Home() {
  const [activeDistrict, setActiveDistrict] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [marketDistrict, setMarketDistrict] = useState('全部');

  const featuredProperties = mockProperties.slice(0, 4);
  const hotProperties = mockProperties.filter((p) => p.status === 'bidding').slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gold-400 filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-primary-400 filter blur-3xl"></div>
        </div>

        <div className="container relative py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-gold-500/20 text-gold-300 text-sm font-medium rounded-full mb-6 border border-gold-500/30">
              <Zap className="w-4 h-4 inline mr-1" />
              司法拍卖 · 透明交易 · 专业保障
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
              专业司法拍卖
              <br />
              <span className="text-gradient-gold">房产服务平台</span>
            </h1>
            <p className="text-lg text-primary-200 mb-10 max-w-2xl mx-auto">
              全流程服务覆盖房源尽调、资质审核、竞价交易、过户协助，让您放心参与每一次竞拍
            </p>

            {/* Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-xl p-2 shadow-2xl max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-ink-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="搜索小区、地址、法院..."
                    className="flex-1 py-3 bg-transparent text-ink-800 placeholder:text-ink-400 focus:outline-none"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <button className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                  搜索
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2 px-4 pb-3 pt-2 border-t border-ink-100">
                <span className="text-xs text-ink-400">热门区域:</span>
                {districts.slice(1, 6).map((district) => (
                  <button
                    key={district}
                    onClick={() => setActiveDistrict(district)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full transition-colors',
                      activeDistrict === district
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                    )}
                  >
                    {district}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L60 72C120 64 240 48 360 42.7C480 37 600 43 720 48C840 53 960 59 1080 56C1200 53 1320 43 1380 37.3L1440 32V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="#F7F9FC" />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-ink-50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {platformStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="stat-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium flex items-center gap-0.5',
                        stat.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                      )}
                    >
                      {stat.trend === 'up' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-ink-900 font-serif mb-1">
                    {stat.display}
                  </div>
                  <div className="text-sm text-ink-500">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">精选标的</h2>
              <p className="section-subtitle mb-0">专业尽调，优质房源，物超所值</p>
            </div>
            <Link
              to="/list"
              className="hidden md:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PropertyCard property={property} variant="featured" />
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/list" className="btn-secondary">
              查看全部标的
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Market Dashboard */}
      <section className="py-16 bg-ink-50">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="section-title">市场行情看板</h2>
            <p className="section-subtitle mb-0">近半年司法拍卖房产数据洞察 · 数据来源：法院司法拍卖系统</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {districts.map((district) => (
              <button
                key={district}
                onClick={() => setMarketDistrict(district)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  marketDistrict === district
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                    : 'bg-white text-ink-600 border border-ink-200 hover:border-primary-300 hover:text-primary-600'
                )}
              >
                {district}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-ink-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink-900">{marketDistrict === '全部' ? '全市' : marketDistrict}成交均价与成交量走势</h3>
                  <p className="text-sm text-ink-500">近6个月{marketDistrict === '全部' ? '全市' : marketDistrict}成交均价及成交量变化</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-700 inline-block"></span>均价</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gold-400 inline-block"></span>成交量</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={districtTrends[marketDistrict] || mockMarketTrend}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A2463" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0A2463" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12 }} />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                      tickFormatter={(value) => (value / 10000).toFixed(0) + '万'}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#E0A458', fontSize: 12 }}
                      tickFormatter={(value) => value + '套'}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'avgPrice' ? formatPrice(value) + '元/㎡' : value + '套',
                        name === 'avgPrice' ? '成交均价' : '成交量'
                      ]}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="avgPrice" stroke="#0A2463" strokeWidth={2} fill="url(#colorPrice)" />
                    <Bar yAxisId="right" dataKey="transactionCount" fill="#E0A458" opacity={0.6} barSize={20} radius={[4, 4, 0, 0]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-ink-200 shadow-sm">
              <div className="mb-6">
                <h3 className="font-serif font-bold text-lg text-ink-900">区域成交排行</h3>
                <p className="text-sm text-ink-500">近6个月各区域成交均价及成交量</p>
              </div>
              <div className="space-y-3">
                {mockMarketData.slice(0, 6).map((item, idx) => (
                  <div key={item.district} className="flex items-center gap-3">
                    <span className={cn(
                      'w-5 h-5 rounded text-xs font-bold flex items-center justify-center',
                      idx < 3 ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-500'
                    )}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink-800 truncate">{item.district}</span>
                        <span className="text-sm font-bold text-primary-700">{(item.avgPrice / 10000).toFixed(1)}万/㎡</span>
                      </div>
                      <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full"
                          style={{ width: `${(item.avgPrice / 100000) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-ink-400">
                        <span>成交 {item.transactionCount} 套</span>
                        <span>流拍率 {item.unsoldRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {getDistrictMetrics(marketDistrict).map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-lg p-5 border border-ink-200"
              >
                <div className="text-sm text-ink-500 mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-ink-900 font-serif">{metric.value}</span>
                  <span
                    className={cn(
                      'text-xs font-medium flex items-center gap-0.5',
                      metric.trend === 'up' && metric.color === 'success' && 'text-success-600',
                      metric.trend === 'down' && metric.color === 'success' && 'text-success-600',
                      metric.trend === 'up' && metric.color === 'warning' && 'text-gold-600'
                    )}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {metric.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Alert Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-danger-50 text-danger-600 text-sm font-medium rounded-full mb-4">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              风险提示引擎
            </span>
            <h2 className="section-title">专业风险识别</h2>
            <p className="section-subtitle mb-0 max-w-2xl mx-auto">
              智能识别各类法拍风险，专业团队深度尽调，让您全面了解标的状况
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {riskTypes.map((risk, index) => {
              const Icon = risk.icon;
              return (
                <motion.div
                  key={risk.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn(
                    'bg-white rounded-xl p-6 border-2 transition-all hover:shadow-lg',
                    risk.color === 'danger'
                      ? 'border-danger-100 hover:border-danger-200'
                      : 'border-gold-100 hover:border-gold-200'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                      risk.color === 'danger' ? 'bg-danger-50' : 'bg-gold-50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-6 h-6',
                        risk.color === 'danger' ? 'text-danger-600' : 'text-gold-600'
                      )}
                    />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-ink-900 mb-2">{risk.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{risk.description}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 bg-gradient-to-r from-primary-800 to-primary-900 rounded-xl p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-400 filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
            <div className="relative">
              <h3 className="text-2xl font-serif font-bold mb-3">专业尽调服务</h3>
              <p className="text-primary-200 mb-6 max-w-xl mx-auto">
                由资深律师团队和房产专家提供深度尽调服务，全面排查产权、抵押、租赁、欠费等各类风险
              </p>
              <Link to="/due-diligence" className="btn-gold">
                了解尽调服务
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Bidding */}
      <section className="py-16 bg-ink-50">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="inline-block px-3 py-1 bg-danger-100 text-danger-600 text-xs font-medium rounded-full mb-3">
                <Clock className="w-3 h-3 inline mr-1 risk-pulse" />
                正在进行
              </span>
              <h2 className="section-title">热门竞价</h2>
              <p className="section-subtitle mb-0">关注人数多、竞争激烈的优质标的</p>
            </div>
            <Link
              to="/list?status=bidding"
              className="hidden md:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              全部竞价中
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hotProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card-premium overflow-hidden"
              >
                <Link to={`/detail/${property.id}`} className="block">
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="text-xs text-white/80">当前价</span>
                        <div className="text-2xl font-bold text-white font-serif">
                          ¥{formatPrice(property.startingPrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-white/80 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          {property.viewerCount}人关注
                        </div>
                        <div className="text-gold-400 font-medium text-sm">
                          {property.bidCount}人报名
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium text-ink-900 mb-1 hover:text-primary-600 transition-colors">
                      {property.title}
                    </h3>
                    <p className="text-sm text-ink-500">{property.address}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-ink-500">
                        评估价 <span className="text-ink-700">¥{formatPrice(property.appraisalPrice)}</span>
                      </span>
                      <span className="text-xs text-success-600 font-medium">
                        省{Math.round((1 - property.startingPrice / property.appraisalPrice) * 100)}%
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Flow */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="section-title">全流程服务</h2>
            <p className="section-subtitle mb-0">从选房到过户，一站式专业服务保障</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-gold-300 to-primary-200"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { step: '01', title: '智能选房', desc: '多维筛选精准匹配' },
                { step: '02', title: '专业尽调', desc: '风险排查产权清晰' },
                { step: '03', title: '资质审核', desc: '资金征信全面核验' },
                { step: '04', title: '竞价交易', desc: '透明公正全程监管' },
                { step: '05', title: '过户交付', desc: '专业团队协助办理' },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-serif font-bold text-xl relative z-10 shadow-lg shadow-primary-500/30">
                    {item.step}
                  </div>
                  <h3 className="font-serif font-bold text-ink-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-ink-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 hero-gradient">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            开启您的法拍置业之旅
          </h2>
          <p className="text-primary-200 mb-8 max-w-xl mx-auto">
            立即注册，获取专属投资顾问服务，抢先掌握优质标的信息
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/list" className="btn-gold w-full sm:w-auto">
              浏览全部标的
            </Link>
            <Link to="/due-diligence" className="px-6 py-2.5 border-2 border-white/30 text-white font-medium rounded-md hover:bg-white/10 transition-colors w-full sm:w-auto">
              预约专属顾问
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
