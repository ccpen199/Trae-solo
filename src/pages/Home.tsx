import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  MapPin,
  DollarSign,
  Users,
  Clock,
  BarChart3,
  Home as HomeIcon,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { Property as MockProperty, PropertyCategory, DistrictPrice, PricePoint, MarketOverview } from '@/mock/data';
import { getMarketOverview, getDistrictPrices, getProperties } from '@/services/api';
import DataCard from '@/components/DataCard';
import PropertyCard from '@/components/PropertyCard';
import DistrictHeatmap from '@/components/charts/DistrictHeatmap';
import PriceHistoryChart from '@/components/charts/PriceHistoryChart';
import CategoryAggregationPanel from '@/components/CategoryAggregationPanel';
import MiniVerificationChain from '@/components/MiniVerificationChain';
import BusinessEntryGrid from '@/components/BusinessEntryGrid';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const categories: { key: PropertyCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'secondhand', label: '二手房', icon: <Building2 className="h-4 w-4" /> },
  { key: 'new', label: '新房', icon: <HomeIcon className="h-4 w-4" /> },
  { key: 'rental', label: '租赁', icon: <Search className="h-4 w-4" /> },
  { key: 'overseas', label: '海外', icon: <MapPin className="h-4 w-4" /> },
  { key: 'vacation', label: '旅居', icon: <Clock className="h-4 w-4" /> },
];

const formatPrice = (price: number, unit: string = 'yuan'): string => {
  if (unit === 'yuan/sqm') {
    if (price >= 10000) {
      return `${(price / 10000).toFixed(2)}万/㎡`;
    }
    return `${price.toLocaleString()}元/㎡`;
  }
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)}亿`;
  }
  if (price >= 10000) {
    return `${(price / 10000).toFixed(0)}万`;
  }
  return price.toLocaleString();
};

const generatePriceHistory = (basePrice: number): PricePoint[] => {
  const history: PricePoint[] = [];
  const today = new Date();
  let currentPrice = basePrice;

  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * basePrice * 0.01;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.85);

    const type = i % 14 === 0 ? 'transaction' : 'listing';

    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice),
      type: type as 'listing' | 'transaction' | 'average',
    });
  }

  return history;
};



export default function Home() {
  const [activeCategory, setActiveCategory] = useState<PropertyCategory>('secondhand');
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [districtPrices, setDistrictPrices] = useState<DistrictPrice[]>([]);
  const [properties, setProperties] = useState<MockProperty[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, districtsRes, propertiesRes] = await Promise.all([
          getMarketOverview({ category: activeCategory }),
          getDistrictPrices({ category: activeCategory }),
          getProperties({ category: activeCategory, pageSize: 4, filters: { isVerified: true } }),
        ]);

        setMarketOverview(overviewRes);
        setDistrictPrices(districtsRes);
        setProperties(propertiesRes.data);
        setPriceHistory(generatePriceHistory(overviewRes.avgPrice));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCategory]);

  const chartData7d = [120, 132, 101, 134, 90, 230, 210];
  const chartData30d = [220, 182, 191, 234, 290, 330, 310, 280, 260, 290, 320, 350];

  if (loading && !marketOverview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-800"
          />
          <p className="text-neutral-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 py-20 px-4"
      >
        <div className="absolute inset-0 grain-overlay opacity-30" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-accent-verified/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-up/5 blur-3xl" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-accent-verified" />
              <span>真房源认证 · 价格透明 · 数据可信</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
              房产全周期价格治理平台
            </h1>
            
            <p className="mb-8 text-xl leading-relaxed text-white/80 md:text-2xl">
              基于区块链存证的真房源核验系统，聚合全平台挂牌数据，
              提供专业的价格分析、趋势预测与市场洞察，
              让房产交易更加透明、可信、高效。
            </p>
            
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary bg-white text-primary-800 hover:bg-neutral-100"
              >
                开始探索
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary border-white text-white hover:bg-white/10"
              >
                了解更多
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <div className="container py-12 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          <motion.div variants={itemVariants}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-neutral-900">市场概览</h2>
                <p className="text-neutral-500">实时掌握房产市场动态与核心指标</p>
              </div>
              <div className="text-sm text-neutral-400">
                数据更新于 {new Date().toLocaleDateString('zh-CN')}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <DataCard
                title="今日挂牌量"
                value={marketOverview?.totalListings?.toLocaleString() || '0'}
                change={2.3}
                changeLabel="较昨日"
                chartData={chartData7d}
                icon={<Building2 className="h-5 w-5" />}
              />
              <DataCard
                title="今日成交量"
                value={marketOverview?.transactionVolume7d?.toLocaleString() || '0'}
                change={-1.5}
                changeLabel="较昨日"
                chartData={chartData7d.slice().reverse()}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <DataCard
                title="全市均价"
                value={formatPrice(marketOverview?.avgPrice || 0, 'yuan/sqm')}
                change={marketOverview?.priceChange7d || 0}
                changeLabel="7日涨跌"
                chartData={chartData30d}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <DataCard
                title="7日涨跌"
                value={`${marketOverview?.priceChange7d?.toFixed(2) || '0'}%`}
                change={marketOverview?.priceChange7d || 0}
                changeLabel="较上周"
                chartData={chartData7d}
                icon={
                  (marketOverview?.priceChange7d || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )
                }
              />
              <DataCard
                title="供需比"
                value="1.25"
                change={0.8}
                changeLabel="较上周"
                chartData={chartData30d}
                icon={<Users className="h-5 w-5" />}
              />
              <DataCard
                title="库存去化周期"
                value="45天"
                change={-2.1}
                changeLabel="较上周"
                chartData={chartData30d.slice().reverse()}
                icon={<Clock className="h-5 w-5" />}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold text-neutral-900">分类市场</h2>
              <p className="text-neutral-500">按房产类型查看细分市场数据</p>
            </div>

            <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`group flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                    activeCategory === cat.key
                      ? 'border-primary-800 text-primary-800'
                      : 'border-transparent text-neutral-500 hover:text-primary-700'
                  }`}
                >
                  <span
                    className={`transition-colors ${
                      activeCategory === cat.key ? 'text-primary-800' : 'text-neutral-400 group-hover:text-primary-600'
                    }`}
                  >
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="card">
                <p className="mb-2 text-sm text-neutral-500">挂牌总量</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {marketOverview?.totalListings?.toLocaleString() || '0'}
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  套{categories.find(c => c.key === activeCategory)?.label}
                </p>
              </div>
              <div className="card">
                <p className="mb-2 text-sm text-neutral-500">成交均价</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {formatPrice(marketOverview?.avgPrice || 0, 'yuan/sqm')}
                </p>
                <p className={`mt-2 flex items-center gap-1 text-sm ${
                  (marketOverview?.priceChange7d || 0) >= 0 ? 'text-accent-up' : 'text-accent-down'
                }`}>
                  {(marketOverview?.priceChange7d || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {(marketOverview?.priceChange7d || 0) >= 0 ? '+' : ''}
                  {marketOverview?.priceChange7d?.toFixed(2) || '0'}% 较7日
                </p>
              </div>
              <div className="card">
                <p className="mb-2 text-sm text-neutral-500">30日涨跌</p>
                <p className={`text-3xl font-bold ${
                  (marketOverview?.priceChange30d || 0) >= 0 ? 'text-accent-up' : 'text-accent-down'
                }`}>
                  {(marketOverview?.priceChange30d || 0) >= 0 ? '+' : ''}
                  {marketOverview?.priceChange30d?.toFixed(2) || '0'}%
                </p>
                <p className="mt-2 text-sm text-neutral-400">近一个月趋势</p>
              </div>
              <div className="card">
                <p className="mb-2 text-sm text-neutral-500">热门区域</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {marketOverview?.hotDistricts?.[0]?.name || '-'}
                </p>
                <p className="mt-2 text-sm text-neutral-400">
                  {formatPrice(marketOverview?.hotDistricts?.[0]?.avgPrice || 0, 'yuan/sqm')}
                </p>
              </div>
            </div>

            <CategoryAggregationPanel activeCategory={activeCategory} />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-neutral-900">区域热度分布</h2>
                <p className="text-neutral-500">各行政区7日价格变化热力图</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <BarChart3 className="h-4 w-4" />
                <span>数据来源：平台挂牌数据</span>
              </div>
            </div>
            
            <div className="card">
              <DistrictHeatmap
                data={districtPrices}
                height={400}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-neutral-900">精选真房源</h2>
                <p className="text-neutral-500">经过区块链核验的优质房源</p>
              </div>
              <button className="text-sm text-primary-800 hover:text-primary-700">
                查看更多 →
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {properties.map((property) => (
                <div key={property.id} className="flex flex-col">
                  <PropertyCard property={property} />
                  {property.isVerified && (
                    <div className="mt-2 rounded-lg border border-neutral-100 bg-white px-3 py-2 shadow-sm">
                      <MiniVerificationChain />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold text-neutral-900">业务承接入口</h2>
              <p className="text-neutral-500">探索更多专业工具与增值服务</p>
            </div>
            <BusinessEntryGrid />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-8">
              <h2 className="mb-2 text-3xl font-bold text-neutral-900">市场趋势</h2>
              <p className="text-neutral-500">近90天挂牌价与成交价走势</p>
            </div>
            
            <div className="card">
              <PriceHistoryChart
                data={priceHistory}
                districtAvgPrice={marketOverview?.avgPrice}
                height={400}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
