import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Filter,
  Calendar,
  MapPin,
  Building2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type {
  DistrictPrice,
  PriceAlert,
  CompetitorItem,
  MarketOverview,
  PricePoint,
  PropertyCategory,
} from '@/mock/data';
import {
  getDistrictPrices,
  getPriceAlerts,
  getCompetitorMatrix,
  getMarketOverview,
  getProperties,
} from '@/services/api';
import DistrictHeatmap from '@/components/charts/DistrictHeatmap';
import PriceHistoryChart from '@/components/charts/PriceHistoryChart';
import TransactionScatter from '@/components/charts/TransactionScatter';
import CompetitorMatrix from '@/components/charts/CompetitorMatrix';
import PriceAlertBadge from '@/components/PriceAlertBadge';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const sectionVariants = {
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

const timeRanges = [
  { key: '7d', label: '7天', days: 7 },
  { key: '30d', label: '30天', days: 30 },
  { key: '90d', label: '90天', days: 90 },
  { key: '180d', label: '180天', days: 180 },
];

const categories: { key: PropertyCategory; label: string }[] = [
  { key: 'secondhand', label: '二手房' },
  { key: 'new', label: '新房' },
  { key: 'rental', label: '租赁' },
];

const districts = [
  '朝阳区',
  '海淀区',
  '东城区',
  '西城区',
  '丰台区',
  '石景山区',
  '通州区',
  '昌平区',
];

const generatePriceHistory = (basePrice: number, days: number): PricePoint[] => {
  const history: PricePoint[] = [];
  const today = new Date();
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * basePrice * 0.008;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.85);

    const type = i % 10 === 0 ? 'transaction' : 'listing';

    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice),
      type: type as 'listing' | 'transaction' | 'average',
    });
  }

  return history;
};

const formatPrice = (price: number): string => {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(0)}万`;
  }
  return price.toLocaleString();
};

const formatUnitPrice = (price: number): string => {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(2)}万/㎡`;
  }
  return `${price.toLocaleString()}元/㎡`;
};

export default function PriceAnalysis() {
  const [activeTimeRange, setActiveTimeRange] = useState('7d');
  const [activeCategory, setActiveCategory] = useState<PropertyCategory>('secondhand');
  const [selectedDistrict, setSelectedDistrict] = useState('朝阳区');
  const [showHighDeviationOnly, setShowHighDeviationOnly] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);

  const [districtPrices, setDistrictPrices] = useState<DistrictPrice[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [competitorMatrix, setCompetitorMatrix] = useState<CompetitorItem[]>([]);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [scatterData, setScatterData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [districtsRes, alertsRes, overviewRes, propertiesRes] = await Promise.all([
          getDistrictPrices({ category: activeCategory }),
          getPriceAlerts(),
          getMarketOverview({ category: activeCategory }),
          getProperties({ category: activeCategory, pageSize: 1 }),
        ]);

        setDistrictPrices(districtsRes);
        setPriceAlerts(alertsRes);
        setMarketOverview(overviewRes);

        const timeRange = timeRanges.find((t) => t.key === activeTimeRange);
        const days = timeRange?.days || 30;
        setPriceHistory(generatePriceHistory(overviewRes.avgPrice, days));

        const allScatterData: PricePoint[] = [];
        const baseAvg = overviewRes.avgPrice;
        for (let i = 90; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          if (i % 3 === 0) {
            allScatterData.push({
              date: date.toISOString().split('T')[0],
              price: Math.round(baseAvg * (1 + (Math.random() - 0.5) * 0.15)),
              type: 'transaction',
            });
          }
        }
        setScatterData(allScatterData);

        if (propertiesRes.data.length > 0) {
          const matrixRes = await getCompetitorMatrix({
            propertyId: propertiesRes.data[0].id,
            radius: 5,
          });
          setCompetitorMatrix(matrixRes);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTimeRange, activeCategory, selectedDistrict]);

  const topRisingDistricts = useMemo(() => {
    return [...districtPrices]
      .sort((a, b) => b.change7d - a.change7d)
      .slice(0, 3);
  }, [districtPrices]);

  const bottomFallingDistricts = useMemo(() => {
    return [...districtPrices]
      .sort((a, b) => a.change7d - b.change7d)
      .slice(0, 3);
  }, [districtPrices]);

  const filteredAlerts = useMemo(() => {
    let alerts = [...priceAlerts];
    if (showHighDeviationOnly) {
      alerts = alerts.filter((a) => Math.abs(a.deviation) >= 15);
    }
    return alerts.slice(0, 8);
  }, [priceAlerts, showHighDeviationOnly]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary-800 to-primary-700 py-10 px-4"
      >
        <div className="container">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-2 text-4xl font-bold text-white"
              >
                价格分析中心
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-white/70"
              >
                多维度价格分析，洞察市场趋势，发现投资机会
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center gap-4"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white/60" />
                <span className="text-sm text-white/60">时间范围:</span>
                <div className="flex rounded-lg bg-white/10 p-1">
                  {timeRanges.map((range) => (
                    <button
                      key={range.key}
                      onClick={() => setActiveTimeRange(range.key)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                        activeTimeRange === range.key
                          ? 'bg-white text-primary-800'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-white/60" />
                <span className="text-sm text-white/60">类别:</span>
                <div className="flex rounded-lg bg-white/10 p-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                        activeCategory === cat.key
                          ? 'bg-white text-primary-800'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="container py-8 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.section variants={sectionVariants}>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-neutral-900">
                  <BarChart3 className="h-6 w-6 text-primary-800" />
                  片区涨跌热力图
                </h2>
                <p className="text-sm text-neutral-500">各行政区7日价格变化分布</p>
              </div>
            </div>

            <div className="card">
              <DistrictHeatmap data={districtPrices} height={380} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="card">
                <div className="mb-3 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-accent-up" />
                  <h3 className="font-semibold text-neutral-900">涨幅TOP3</h3>
                </div>
                <div className="space-y-3">
                  {topRisingDistricts.map((district, index) => (
                    <motion.div
                      key={district.districtCode}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg bg-accent-up/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-up/20 text-sm font-bold text-accent-up">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {district.districtName}
                          </div>
                          <div className="text-xs text-neutral-500">
                            均价 {formatUnitPrice(district.avgPrice)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-accent-up">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-semibold">+{district.change7d}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="mb-3 flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5 text-accent-down" />
                  <h3 className="font-semibold text-neutral-900">跌幅TOP3</h3>
                </div>
                <div className="space-y-3">
                  {bottomFallingDistricts.map((district, index) => (
                    <motion.div
                      key={district.districtCode}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg bg-accent-down/5 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-down/20 text-sm font-bold text-accent-down">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-neutral-900">
                            {district.districtName}
                          </div>
                          <div className="text-xs text-neutral-500">
                            均价 {formatUnitPrice(district.avgPrice)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-accent-down">
                        <TrendingDown className="h-4 w-4" />
                        <span className="font-semibold">{district.change7d}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={sectionVariants}>
            <div className="mb-4">
              <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-neutral-900">
                <TrendingUp className="h-6 w-6 text-primary-800" />
                价格走势对比
              </h2>
              <p className="text-sm text-neutral-500">市场整体趋势与同户型成交对比</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">整体市场趋势</h3>
                <PriceHistoryChart
                  data={priceHistory}
                  districtAvgPrice={marketOverview?.avgPrice}
                  height={350}
                />
              </div>

              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">同户型成交价分布</h3>
                <TransactionScatter
                  data={scatterData}
                  housingType={activeCategory}
                  height={350}
                />
              </div>
            </div>
          </motion.section>

          <motion.section variants={sectionVariants}>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-neutral-900">
                  <AlertTriangle className="h-6 w-6 text-primary-800" />
                  价格偏离度预警
                </h2>
                <p className="text-sm text-neutral-500">偏离区域均价较多的房源提醒</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={showHighDeviationOnly}
                  onChange={(e) => setShowHighDeviationOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-800 focus:ring-primary-800"
                />
                仅显示 ±15% 以上
              </label>
            </div>

            <div className="card">
              <div className="grid grid-cols-1 gap-3">
                {filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-start justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4 transition-all hover:border-primary-200 hover:bg-white md:flex-row md:items-center"
                  >
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-neutral-400" />
                        <span className="font-medium text-neutral-900">
                          {alert.propertyTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {selectedDistrict}
                        </span>
                        <span>
                          区域均价: {formatUnitPrice(alert.districtAvgPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-neutral-900">
                          ¥{formatPrice(
                            Math.round(
                              alert.districtAvgPrice * (1 + alert.deviation / 100)
                            )
                          )}
                        </div>
                        <div className="text-xs text-neutral-500">挂牌价</div>
                      </div>
                      <PriceAlertBadge
                        deviation={alert.deviation}
                        size="md"
                      />
                    </div>
                  </motion.div>
                ))}

                {filteredAlerts.length === 0 && (
                  <div className="py-8 text-center text-neutral-500">
                    暂无符合条件的价格预警
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section variants={sectionVariants}>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-neutral-900">
                  <BarChart3 className="h-6 w-6 text-primary-800" />
                  竞品报价矩阵
                </h2>
                <p className="text-sm text-neutral-500">周边竞品房源价格对比分析</p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors hover:border-primary-300"
                >
                  <MapPin className="h-4 w-4 text-primary-800" />
                  {selectedDistrict}
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      districtDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {districtDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-neutral-200 bg-white shadow-lg"
                  >
                    {districts.map((district) => (
                      <button
                        key={district}
                        onClick={() => {
                          setSelectedDistrict(district);
                          setDistrictDropdownOpen(false);
                        }}
                        className={cn(
                          'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-primary-50',
                          selectedDistrict === district
                            ? 'bg-primary-50 text-primary-800'
                            : 'text-neutral-700'
                        )}
                      >
                        {district}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="card">
              <CompetitorMatrix
                data={competitorMatrix}
                basePrice={marketOverview?.avgPrice}
              />
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
