import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
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
  Home,
  Clock,
  Percent,
  PieChart,
  GitCompare,
  CheckCircle2,
  XCircle,
  Info,
  ShieldAlert,
  ChevronUp,
  ChevronsUpDown,
} from 'lucide-react';
import type {
  DistrictPrice,
  PriceAlert,
  CompetitorItem,
  MarketOverview,
  PricePoint,
  PropertyCategory,
  TransactionRecord,
  PriceBracketVolume,
  HousingTypeDistribution,
  TransactionStats,
  PriceForecastData,
  DistrictComparisonItem,
  CompetitorAnalysis,
} from '@/mock/data';
import {
  getDistrictPrices,
  getPriceAlerts,
  getCompetitorMatrix,
  getMarketOverview,
  getProperties,
  getTransactionRecords,
  getPriceBracketVolumes,
  getHousingTypeDistribution,
  getTransactionStats,
  getPriceForecast,
  getDistrictComparison,
  getCompetitorAnalysis,
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

  const [transactionRecords, setTransactionRecords] = useState<TransactionRecord[]>([]);
  const [priceBracketVolumes, setPriceBracketVolumes] = useState<PriceBracketVolume[]>([]);
  const [housingTypeDistribution, setHousingTypeDistribution] = useState<HousingTypeDistribution[]>([]);
  const [transactionStats, setTransactionStats] = useState<TransactionStats | null>(null);
  const [priceForecast, setPriceForecast] = useState<PriceForecastData | null>(null);
  const [districtComparison, setDistrictComparison] = useState<DistrictComparisonItem[]>([]);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);

  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['朝阳区', '海淀区']);
  const [districtCompareOpen, setDistrictCompareOpen] = useState(false);
  const [selectedRadarItems, setSelectedRadarItems] = useState<string[]>([]);
  const [transactionSortField, setTransactionSortField] = useState<keyof TransactionRecord>('date');
  const [transactionSortDirection, setTransactionSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          districtsRes,
          alertsRes,
          overviewRes,
          propertiesRes,
          recordsRes,
          bracketsRes,
          housingRes,
          statsRes,
          forecastRes,
          analysisRes,
        ] = await Promise.all([
          getDistrictPrices({ category: activeCategory }),
          getPriceAlerts(),
          getMarketOverview({ category: activeCategory }),
          getProperties({ category: activeCategory, pageSize: 1 }),
          getTransactionRecords({ category: activeCategory, district: selectedDistrict }),
          getPriceBracketVolumes({ category: activeCategory }),
          getHousingTypeDistribution({ category: activeCategory }),
          getTransactionStats({ category: activeCategory }),
          getPriceForecast({ category: activeCategory }),
          getCompetitorAnalysis(),
        ]);

        setDistrictPrices(districtsRes);
        setPriceAlerts(alertsRes);
        setMarketOverview(overviewRes);
        setTransactionRecords(recordsRes);
        setPriceBracketVolumes(bracketsRes);
        setHousingTypeDistribution(housingRes);
        setTransactionStats(statsRes);
        setPriceForecast(forecastRes);
        setCompetitorAnalysis(analysisRes);

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
          if (matrixRes.length > 0) {
            setSelectedRadarItems(matrixRes.slice(0, 3).map((m) => m.id));
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTimeRange, activeCategory, selectedDistrict]);

  useEffect(() => {
    const fetchDistrictComparison = async () => {
      if (selectedDistricts.length >= 2) {
        try {
          const res = await getDistrictComparison({
            districts: selectedDistricts,
            category: activeCategory,
          });
          setDistrictComparison(res);
        } catch (error) {
          console.error('Failed to fetch district comparison:', error);
        }
      }
    };
    fetchDistrictComparison();
  }, [selectedDistricts, activeCategory]);

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

  const sortedTransactionRecords = useMemo(() => {
    const records = [...transactionRecords];
    records.sort((a, b) => {
      const aVal = a[transactionSortField];
      const bVal = b[transactionSortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return transactionSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return transactionSortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return records;
  }, [transactionRecords, transactionSortField, transactionSortDirection]);

  const handleTransactionSort = (field: keyof TransactionRecord) => {
    if (transactionSortField === field) {
      setTransactionSortDirection(transactionSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTransactionSortField(field);
      setTransactionSortDirection('desc');
    }
  };

  const radarCompetitors = useMemo(() => {
    return competitorMatrix.filter((c) => selectedRadarItems.includes(c.id));
  }, [competitorMatrix, selectedRadarItems]);

  const toggleRadarItem = (id: string) => {
    setSelectedRadarItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleDistrict = (district: string) => {
    setSelectedDistricts((prev) => {
      if (prev.includes(district)) {
        if (prev.length <= 2) return prev;
        return prev.filter((d) => d !== district);
      }
      if (prev.length >= 4) return prev;
      return [...prev, district];
    });
  };

  const RADAR_COLORS = ['#0A2463', '#2A9D8F', '#D4AF37', '#E63946', '#7C3AED'];

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
                      type="button"
                      key={range.key}
                      aria-label={`${range.label}价格周期`}
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
                <span className="sr-only">
                  价格周期筛选支持 7天 30天 90天 180天
                </span>
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

            {transactionStats && (
              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-neutral-900">成交统计概览</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <BarChart3 className="h-4 w-4 text-primary-600" />
                      成交总量
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {transactionStats.totalTransactions}
                      <span className="ml-1 text-sm font-normal text-neutral-500">套</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <TrendingUp className="h-4 w-4 text-primary-600" />
                      成交均价
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {formatPrice(transactionStats.avgPrice)}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Home className="h-4 w-4 text-primary-600" />
                      中位数价
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {formatPrice(transactionStats.medianPrice)}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      {transactionStats.priceChange >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-accent-up" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-accent-down" />
                      )}
                      价格变动
                    </div>
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        transactionStats.priceChange >= 0
                          ? 'text-accent-up'
                          : 'text-accent-down'
                      )}
                    >
                      {transactionStats.priceChange >= 0 ? '+' : ''}
                      {transactionStats.priceChange}%
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Home className="h-4 w-4 text-primary-600" />
                      平均面积
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {transactionStats.avgArea}
                      <span className="ml-1 text-sm font-normal text-neutral-500">㎡</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Clock className="h-4 w-4 text-primary-600" />
                      成交周期中位数
                    </div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {transactionStats.medianCycleDays}
                      <span className="ml-1 text-sm font-normal text-neutral-500">天</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    className="card flex min-w-[160px] flex-col gap-1 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Percent className="h-4 w-4 text-primary-600" />
                      议价空间
                    </div>
                    <div className="text-2xl font-bold text-accent-up">
                      {transactionStats.negotiationSpace}%
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">分价带成交量</h3>
                <ReactECharts
                  option={{
                    backgroundColor: 'transparent',
                    tooltip: {
                      trigger: 'axis',
                      formatter: (params: unknown) => {
                        const p = params as Array<{ name: string; value: number; marker: string }>;
                        if (!p || p.length === 0) return '';
                        const item = p[0];
                        return `
                          <div style="padding: 4px;">
                            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                            <div>成交量: <span style="font-weight: 600;">${item.value} 套</span></div>
                          </div>
                        `;
                      },
                    },
                    grid: {
                      left: '3%',
                      right: '4%',
                      bottom: '3%',
                      top: 20,
                      containLabel: true,
                    },
                    xAxis: {
                      type: 'category',
                      data: priceBracketVolumes.map((b) => b.range),
                      axisLabel: {
                        color: '#6b7280',
                        fontSize: 11,
                        rotate: 0,
                      },
                      axisLine: {
                        lineStyle: { color: '#e5e7eb' },
                      },
                    },
                    yAxis: {
                      type: 'value',
                      name: '成交量(套)',
                      nameTextStyle: {
                        color: '#6b7280',
                        fontSize: 12,
                      },
                      axisLabel: {
                        color: '#6b7280',
                      },
                      splitLine: {
                        lineStyle: {
                          color: '#e5e7eb',
                          type: 'dashed',
                        },
                      },
                    },
                    series: [
                      {
                        type: 'bar',
                        data: priceBracketVolumes.map((b, index) => ({
                          value: b.count,
                          itemStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [
                                { offset: 0, color: '#0A2463' },
                                { offset: 1, color: '#3E92CC' },
                              ],
                            },
                            borderRadius: [4, 4, 0, 0],
                          },
                        })),
                        barWidth: '50%',
                        label: {
                          show: true,
                          position: 'top',
                          formatter: '{c}套',
                          fontSize: 11,
                          color: '#374151',
                        },
                        animationDuration: 1200,
                        animationEasing: 'cubicOut',
                      },
                    ],
                  } as EChartsOption}
                  style={{ height: 280, width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>

              <div className="card">
                <h3 className="mb-4 font-semibold text-neutral-900">户型结构分布</h3>
                <ReactECharts
                  option={{
                    backgroundColor: 'transparent',
                    tooltip: {
                      trigger: 'item',
                      formatter: (params: unknown) => {
                        const p = params as { name: string; value: number; percent: number; marker: string };
                        return `
                          <div style="padding: 4px;">
                            <div>${p.marker} ${p.name}</div>
                            <div style="margin-top: 4px;">成交量: <span style="font-weight: 600;">${p.value} 套</span></div>
                            <div>占比: <span style="font-weight: 600;">${p.percent}%</span></div>
                          </div>
                        `;
                      },
                    },
                    legend: {
                      orient: 'vertical',
                      right: 10,
                      top: 'center',
                      textStyle: {
                        color: '#374151',
                        fontSize: 12,
                      },
                      itemWidth: 12,
                      itemHeight: 12,
                    },
                    series: [
                      {
                        type: 'pie',
                        radius: ['45%', '70%'],
                        center: ['35%', '50%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                          borderRadius: 4,
                          borderColor: '#fff',
                          borderWidth: 2,
                        },
                        label: {
                          show: false,
                        },
                        emphasis: {
                          label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                          },
                        },
                        labelLine: {
                          show: false,
                        },
                        data: housingTypeDistribution.map((h, index) => ({
                          name: h.type,
                          value: h.count,
                          itemStyle: {
                            color: ['#0A2463', '#2A9D8F', '#D4AF37', '#E63946', '#7C3AED'][index],
                          },
                        })),
                        animationDuration: 1200,
                        animationEasing: 'cubicOut',
                      },
                    ],
                  } as EChartsOption}
                  style={{ height: 280, width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            </div>

            <div className="mt-6 card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">成交明细列表</h3>
                <span className="text-sm text-neutral-500">
                  共 {sortedTransactionRecords.length} 条记录
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th
                        className="cursor-pointer px-4 py-3 text-left font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          成交日期
                          {transactionSortField === 'date' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('communityName')}
                      >
                        <div className="flex items-center gap-1">
                          小区名称
                          {transactionSortField === 'communityName' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-left font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('bedrooms')}
                      >
                        <div className="flex items-center gap-1">
                          户型
                          {transactionSortField === 'bedrooms' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-right font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('area')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          面积(㎡)
                          {transactionSortField === 'area' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-right font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('totalPrice')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          成交总价
                          {transactionSortField === 'totalPrice' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-right font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('unitPrice')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          单价
                          {transactionSortField === 'unitPrice' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-right font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('listingPriceDiffPercent')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          与挂牌价差
                          {transactionSortField === 'listingPriceDiffPercent' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer px-4 py-3 text-right font-semibold text-neutral-700"
                        onClick={() => handleTransactionSort('transactionCycle')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          成交周期(天)
                          {transactionSortField === 'transactionCycle' ? (
                            transactionSortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-neutral-300" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactionRecords.slice(0, 10).map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3 text-neutral-700">{record.date}</td>
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {record.communityName}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {record.bedrooms}室
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {record.area}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                          {formatPrice(record.totalPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {formatUnitPrice(record.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-accent-up">
                            {record.listingPriceDiffPercent}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {record.transactionCycle}天
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
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

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-neutral-900">多维对比雷达图</h3>
                  <span className="text-xs text-neutral-500">最多选择5个楼盘</span>
                </div>
                <ReactECharts
                  option={{
                    backgroundColor: 'transparent',
                    tooltip: {
                      trigger: 'item',
                    },
                    legend: {
                      show: false,
                    },
                    radar: {
                      indicator: [
                        { name: '价格', max: 100 },
                        { name: '交通', max: 100 },
                        { name: '配套', max: 100 },
                        { name: '环境', max: 100 },
                        { name: '学区', max: 100 },
                        { name: '增值潜力', max: 100 },
                      ],
                      center: ['50%', '50%'],
                      radius: '65%',
                      axisName: {
                        color: '#4b5563',
                        fontSize: 12,
                      },
                      splitArea: {
                        areaStyle: {
                          color: ['rgba(10, 36, 99, 0.02)', 'rgba(10, 36, 99, 0.05)'],
                        },
                      },
                      axisLine: {
                        lineStyle: {
                          color: '#e5e7eb',
                        },
                      },
                      splitLine: {
                        lineStyle: {
                          color: '#e5e7eb',
                        },
                      },
                    },
                    series: [
                      {
                        type: 'radar',
                        data: radarCompetitors.slice(0, 5).map((c, index) => ({
                          name: c.title,
                          value: c.radarScores
                            ? [
                                c.radarScores.price,
                                c.radarScores.traffic,
                                c.radarScores.facilities,
                                c.radarScores.environment,
                                c.radarScores.school,
                                c.radarScores.potential,
                              ]
                            : [50, 50, 50, 50, 50, 50],
                          lineStyle: {
                            color: RADAR_COLORS[index],
                            width: 2,
                          },
                          areaStyle: {
                            color: `${RADAR_COLORS[index]}20`,
                          },
                          itemStyle: {
                            color: RADAR_COLORS[index],
                          },
                        })),
                        animationDuration: 1200,
                        animationEasing: 'cubicOut',
                      },
                    ],
                  } as EChartsOption}
                  style={{ height: 300, width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {competitorMatrix.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => toggleRadarItem(item.id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all',
                        selectedRadarItems.includes(item.id)
                          ? 'bg-primary-800 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      )}
                    >
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          selectedRadarItems.includes(item.id)
                            ? 'bg-white'
                            : ''
                        )}
                        style={{
                          backgroundColor: !selectedRadarItems.includes(item.id)
                            ? RADAR_COLORS[index % RADAR_COLORS.length]
                            : undefined,
                        }}
                      />
                      {item.title.length > 8
                        ? item.title.slice(0, 8) + '...'
                        : item.title}
                    </button>
                  ))}
                </div>
              </div>

              {competitorAnalysis && (
                <div className="card">
                  <h3 className="mb-4 font-semibold text-neutral-900">本盘对比分析</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">
                          核心优势 ({competitorAnalysis.advantages.length}项)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {competitorAnalysis.advantages.map((adv, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-200 text-xs font-bold text-green-700">
                                {index + 1}
                              </span>
                              <span>{adv}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-red-700">
                          注意事项 ({competitorAnalysis.disadvantages.length}项)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {competitorAnalysis.disadvantages.map((dis, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
                          >
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-700">
                                {index + 1}
                              </span>
                              <span>{dis}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 card">
              <h3 className="mb-4 font-semibold text-neutral-900">楼盘详细指标对比</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                        楼盘名称
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        均价
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        总价区间
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        物业费
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        绿化率
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        容积率
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-neutral-700">
                        装修情况
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-neutral-700">
                        开盘时间
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        在售房源
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-neutral-700">
                        距离(km)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorMatrix.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3 font-medium text-neutral-900">
                          {item.title}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {formatUnitPrice(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {formatPrice(Math.round(item.price * 0.8))} -{' '}
                          {formatPrice(Math.round(item.price * 1.2))}
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {item.propertyFee?.toFixed(2)} 元/㎡·月
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          {item.greenRate?.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {item.plotRatio?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center text-neutral-700">
                          <span className="rounded bg-neutral-100 px-2 py-1 text-xs">
                            {item.decoration}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-neutral-500">
                          {item.openingDate}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-primary-800">
                          {item.availableCount} 套
                        </td>
                        <td className="px-4 py-3 text-right text-neutral-700">
                          {item.distance.toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>

          <motion.section variants={sectionVariants}>
            <div className="mb-4">
              <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-neutral-900">
                <TrendingUp className="h-6 w-6 text-primary-800" />
                价格走势预测
              </h2>
              <p className="text-sm text-neutral-500">基于历史数据的未来6个月价格趋势预测</p>
            </div>

            {priceForecast && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 card">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900">价格趋势预测图</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">预测置信度:</span>
                      <div className="flex h-2 w-24 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="bg-primary-700 transition-all"
                          style={{ width: `${priceForecast.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-primary-700">
                        {(priceForecast.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <ReactECharts
                    option={{
                      backgroundColor: 'transparent',
                      tooltip: {
                        trigger: 'axis',
                        formatter: (params: unknown) => {
                          const p = params as Array<{
                            seriesName: string;
                            dataIndex: number;
                            value: [string, number];
                            marker: string;
                          }>;
                          if (!p || p.length === 0) return '';
                          const point = p[0];
                          const date = point.value[0];
                          const price = point.value[1];
                          const isForecast =
                            point.seriesName === '预测价格';
                          return `
                            <div style="padding: 4px;">
                              <div style="font-weight: 600; margin-bottom: 4px;">${date}</div>
                              <div>${point.marker} ${point.seriesName}: <span style="font-weight: 600;">¥${price.toLocaleString()}</span></div>
                              ${isForecast ? '<div style="color: #6b7280; font-size: 11px; margin-top: 4px;">* 预测数据仅供参考</div>' : ''}
                            </div>
                          `;
                        },
                      },
                      legend: {
                        data: ['历史价格', '预测价格'],
                        top: 0,
                        textStyle: {
                          color: '#4b5563',
                          fontSize: 12,
                        },
                      },
                      grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        top: 40,
                        containLabel: true,
                      },
                      xAxis: {
                        type: 'time',
                        axisLabel: {
                          color: '#6b7280',
                          fontSize: 11,
                        },
                        axisLine: {
                          lineStyle: { color: '#e5e7eb' },
                        },
                        splitLine: {
                          lineStyle: {
                            color: '#e5e7eb',
                            type: 'dashed',
                          },
                        },
                      },
                      yAxis: {
                        type: 'value',
                        name: '价格 (元/㎡)',
                        nameTextStyle: {
                          color: '#6b7280',
                          fontSize: 12,
                        },
                        axisLabel: {
                          color: '#6b7280',
                          formatter: (value: number) => {
                            if (value >= 10000) {
                              return `${(value / 10000).toFixed(0)}万`;
                            }
                            return `${value}`;
                          },
                        },
                        splitLine: {
                          lineStyle: {
                            color: '#e5e7eb',
                            type: 'dashed',
                          },
                        },
                      },
                      series: [
                        {
                          name: '历史价格',
                          type: 'line',
                          data: priceForecast.history.map((h) => [
                            h.date,
                            h.price,
                          ]),
                          smooth: true,
                          symbol: 'none',
                          lineStyle: {
                            color: '#0A2463',
                            width: 2.5,
                          },
                          areaStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [
                                { offset: 0, color: 'rgba(10, 36, 99, 0.2)' },
                                { offset: 1, color: 'rgba(10, 36, 99, 0)' },
                              ],
                            },
                          },
                        },
                        {
                          name: '预测价格',
                          type: 'line',
                          data: priceForecast.forecast.map((f) => [
                            f.date,
                            f.price,
                          ]),
                          smooth: true,
                          symbol: 'none',
                          lineStyle: {
                            color: '#D4AF37',
                            width: 2,
                            type: 'dashed',
                          },
                          areaStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 0,
                              y2: 1,
                              colorStops: [
                                { offset: 0, color: 'rgba(212, 175, 55, 0.15)' },
                                { offset: 1, color: 'rgba(212, 175, 55, 0)' },
                              ],
                            },
                          },
                        },
                        {
                          name: '预测上限',
                          type: 'line',
                          data: priceForecast.forecast.map((f) => [
                            f.date,
                            f.upperBound || f.price,
                          ]),
                          smooth: true,
                          symbol: 'none',
                          lineStyle: {
                            color: 'rgba(212, 175, 55, 0.4)',
                            width: 1,
                            type: 'dotted',
                          },
                        },
                        {
                          name: '预测下限',
                          type: 'line',
                          data: priceForecast.forecast.map((f) => [
                            f.date,
                            f.lowerBound || f.price,
                          ]),
                          smooth: true,
                          symbol: 'none',
                          lineStyle: {
                            color: 'rgba(212, 175, 55, 0.4)',
                            width: 1,
                            type: 'dotted',
                          },
                        },
                      ],
                    } as EChartsOption}
                    style={{ height: 350, width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </div>

                <div className="card">
                  <h3 className="mb-4 font-semibold text-neutral-900">关键影响因素</h3>
                  <div className="space-y-4">
                    {priceForecast.factors.map((factor, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-neutral-800">
                            {factor.name}
                          </span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              factor.impact === 'positive'
                                ? 'bg-green-100 text-green-700'
                                : factor.impact === 'negative'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-neutral-200 text-neutral-600'
                            )}
                          >
                            {factor.impact === 'positive'
                              ? '利好'
                              : factor.impact === 'negative'
                              ? '利空'
                              : '中性'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {factor.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Info className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        风险提示
                      </span>
                    </div>
                    <p className="text-xs text-amber-700">
                      {priceForecast.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.section>

          <motion.section variants={sectionVariants}>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-2xl font-bold text-neutral-900">
                  <GitCompare className="h-6 w-6 text-primary-800" />
                  片区对比
                </h2>
                <p className="text-sm text-neutral-500">
                  多片区核心指标横向对比分析
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setDistrictCompareOpen(!districtCompareOpen)}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 transition-colors hover:border-primary-300"
                >
                  <MapPin className="h-4 w-4 text-primary-800" />
                  已选 {selectedDistricts.length} 个片区
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      districtCompareOpen && 'rotate-180'
                    )}
                  />
                </button>

                {districtCompareOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 z-10 mt-1 w-52 rounded-lg border border-neutral-200 bg-white shadow-lg"
                  >
                    <div className="border-b border-neutral-100 p-2 text-xs text-neutral-500">
                      选择2-4个片区进行对比
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {districts.map((district) => (
                        <button
                          key={district}
                          onClick={() => toggleDistrict(district)}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50',
                            selectedDistricts.includes(district)
                              ? 'bg-primary-50 text-primary-800'
                              : 'text-neutral-700'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border',
                              selectedDistricts.includes(district)
                                ? 'border-primary-600 bg-primary-600'
                                : 'border-neutral-300'
                            )}
                          >
                            {selectedDistricts.includes(district) && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </span>
                          {district}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {districtComparison.length >= 2 && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="mb-4 font-semibold text-neutral-900">
                    核心指标对比
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50">
                          <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                            指标
                          </th>
                          {districtComparison.map((d) => (
                            <th
                              key={d.districtName}
                              className="px-4 py-3 text-center font-semibold text-neutral-700"
                            >
                              {d.districtName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-neutral-100">
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            均价
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center font-semibold text-primary-800"
                            >
                              {formatUnitPrice(d.avgPrice)}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            7日涨跌幅
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center"
                            >
                              <span
                                className={cn(
                                  'font-medium',
                                  d.priceChange7d >= 0
                                    ? 'text-accent-up'
                                    : 'text-accent-down'
                                )}
                              >
                                {d.priceChange7d >= 0 ? '+' : ''}
                                {d.priceChange7d}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-neutral-100">
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            30日涨跌幅
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center"
                            >
                              <span
                                className={cn(
                                  'font-medium',
                                  d.priceChange30d >= 0
                                    ? 'text-accent-up'
                                    : 'text-accent-down'
                                )}
                              >
                                {d.priceChange30d >= 0 ? '+' : ''}
                                {d.priceChange30d}%
                              </span>
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            在租房源数
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center text-neutral-700"
                            >
                              {d.totalListings} 套
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-neutral-100">
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            7日成交量
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center text-neutral-700"
                            >
                              {d.transactionVolume7d} 套
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-neutral-100 bg-neutral-50/50">
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            平均面积
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center text-neutral-700"
                            >
                              {d.avgArea} ㎡
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-medium text-neutral-800">
                            供需比
                          </td>
                          {districtComparison.map((d) => (
                            <td
                              key={d.districtName}
                              className="px-4 py-3 text-center text-neutral-700"
                            >
                              {d.supplyDemandRatio.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="card">
                    <h3 className="mb-4 font-semibold text-neutral-900">
                      均价对比
                    </h3>
                    <ReactECharts
                      option={{
                        backgroundColor: 'transparent',
                        tooltip: {
                          trigger: 'axis',
                          formatter: (params: unknown) => {
                            const p = params as Array<{
                              name: string;
                              value: number;
                              marker: string;
                            }>;
                            if (!p || p.length === 0) return '';
                            const item = p[0];
                            return `
                              <div style="padding: 4px;">
                                <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                                <div>${item.marker} 均价: <span style="font-weight: 600;">¥${item.value.toLocaleString()}/㎡</span></div>
                              </div>
                            `;
                          },
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '3%',
                          top: 20,
                          containLabel: true,
                        },
                        xAxis: {
                          type: 'category',
                          data: districtComparison.map((d) => d.districtName),
                          axisLabel: {
                            color: '#6b7280',
                            fontSize: 11,
                          },
                          axisLine: {
                            lineStyle: { color: '#e5e7eb' },
                          },
                        },
                        yAxis: {
                          type: 'value',
                          name: '均价(元/㎡)',
                          nameTextStyle: {
                            color: '#6b7280',
                            fontSize: 12,
                          },
                          axisLabel: {
                            color: '#6b7280',
                            formatter: (value: number) => {
                              if (value >= 10000) {
                                return `${(value / 10000).toFixed(0)}万`;
                              }
                              return `${value}`;
                            },
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#e5e7eb',
                              type: 'dashed',
                            },
                          },
                        },
                        series: [
                          {
                            type: 'bar',
                            data: districtComparison.map((d, index) => ({
                              value: d.avgPrice,
                              itemStyle: {
                                color: {
                                  type: 'linear',
                                  x: 0,
                                  y: 0,
                                  x2: 0,
                                  y2: 1,
                                  colorStops: [
                                    { offset: 0, color: ['#0A2463', '#2A9D8F', '#D4AF37', '#E63946', '#7C3AED'][index % 5] },
                                    { offset: 1, color: `${['#0A2463', '#2A9D8F', '#D4AF37', '#E63946', '#7C3AED'][index % 5]}90` },
                                  ],
                                },
                                borderRadius: [4, 4, 0, 0],
                              },
                            })),
                            barWidth: '40%',
                            label: {
                              show: true,
                              position: 'top',
                              formatter: (params: unknown) => {
                                const p = params as { value: number };
                                if (p.value >= 10000) {
                                  return `${(p.value / 10000).toFixed(1)}万`;
                                }
                                return `${p.value}`;
                              },
                              fontSize: 11,
                              color: '#374151',
                            },
                            animationDuration: 1200,
                            animationEasing: 'cubicOut',
                          },
                        ],
                      } as EChartsOption}
                      style={{ height: 280, width: '100%' }}
                      opts={{ renderer: 'canvas' }}
                    />
                  </div>

                  <div className="card">
                    <h3 className="mb-4 font-semibold text-neutral-900">
                      7日涨跌幅对比
                    </h3>
                    <ReactECharts
                      option={{
                        backgroundColor: 'transparent',
                        tooltip: {
                          trigger: 'axis',
                          formatter: (params: unknown) => {
                            const p = params as Array<{
                              name: string;
                              value: number;
                              marker: string;
                            }>;
                            if (!p || p.length === 0) return '';
                            const item = p[0];
                            const isPositive = item.value >= 0;
                            return `
                              <div style="padding: 4px;">
                                <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                                <div>${item.marker} 7日涨跌: <span style="font-weight: 600; color: ${isPositive ? '#10b981' : '#ef4444'};">${isPositive ? '+' : ''}${item.value}%</span></div>
                              </div>
                            `;
                          },
                        },
                        grid: {
                          left: '3%',
                          right: '4%',
                          bottom: '3%',
                          top: 20,
                          containLabel: true,
                        },
                        xAxis: {
                          type: 'category',
                          data: districtComparison.map((d) => d.districtName),
                          axisLabel: {
                            color: '#6b7280',
                            fontSize: 11,
                          },
                          axisLine: {
                            lineStyle: { color: '#e5e7eb' },
                          },
                        },
                        yAxis: {
                          type: 'value',
                          name: '涨跌幅(%)',
                          nameTextStyle: {
                            color: '#6b7280',
                            fontSize: 12,
                          },
                          axisLabel: {
                            color: '#6b7280',
                            formatter: '{value}%',
                          },
                          splitLine: {
                            lineStyle: {
                              color: '#e5e7eb',
                              type: 'dashed',
                            },
                          },
                        },
                        series: [
                          {
                            type: 'bar',
                            data: districtComparison.map((d) => ({
                              value: d.priceChange7d,
                              itemStyle: {
                                color: d.priceChange7d >= 0 ? '#10b981' : '#ef4444',
                                borderRadius: [4, 4, 0, 0],
                              },
                            })),
                            barWidth: '40%',
                            label: {
                              show: true,
                              position: 'top',
                              formatter: '{c}%',
                              fontSize: 11,
                              color: '#374151',
                            },
                            animationDuration: 1200,
                            animationEasing: 'cubicOut',
                          },
                        ],
                      } as EChartsOption}
                      style={{ height: 280, width: '100%' }}
                      opts={{ renderer: 'canvas' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
