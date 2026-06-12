import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  UserCheck,
  Eye,
  Link2,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Bell,
  FileCheck2,
  Search as SearchIcon,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  FileText,
  Activity,
  ShieldAlert,
  ScanLine,
  Clock as ClockIcon,
  CheckCircle2 as CheckIcon,
  XCircle,
  Zap,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type {
  Property as MockProperty,
  PropertyCategory,
  DistrictPrice,
  PricePoint,
  MarketOverview,
  PriceAlert,
  CompetitorItem,
  Report,
  AgentRiskProfile,
} from '@/mock/data';
import {
  getMarketOverview,
  getDistrictPrices,
  getProperties,
  getPriceAlerts,
  getCompetitorMatrix,
  getAgentRisks,
} from '@/services/api';
import DataCard from '@/components/DataCard';
import PropertyCard from '@/components/PropertyCard';
import DistrictHeatmap from '@/components/charts/DistrictHeatmap';
import TransactionScatter from '@/components/charts/TransactionScatter';
import CompetitorMatrix from '@/components/charts/CompetitorMatrix';
import VerificationDetailModal from '@/components/VerificationDetailModal';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const tabSlideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
};

const categories: { key: PropertyCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'secondhand', label: '二手房', icon: <Building2 className="h-4 w-4" /> },
  { key: 'new', label: '新房', icon: <HomeIcon className="h-4 w-4" /> },
  { key: 'rental', label: '租赁', icon: <Search className="h-4 w-4" /> },
  { key: 'overseas', label: '海外', icon: <MapPin className="h-4 w-4" /> },
  { key: 'vacation', label: '旅居', icon: <Clock className="h-4 w-4" /> },
];

type DeviationFilter = 'all' | 'overpriced' | 'underpriced' | 'severe';

const formatPrice = (price: number, unit: string = 'yuan'): string => {
  if (unit === 'yuan/sqm') {
    if (price >= 10000) return `${(price / 10000).toFixed(2)}万/㎡`;
    return `${price.toLocaleString()}元/㎡`;
  }
  if (price >= 100000000) return `${(price / 100000000).toFixed(2)}亿`;
  if (price >= 10000) return `${(price / 10000).toFixed(0)}万`;
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
    const type = i % 10 === 0 ? 'transaction' : i % 5 === 0 ? 'average' : 'listing';
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice),
      type: type as 'listing' | 'transaction' | 'average',
    });
  }
  return history;
};

const getDeviationRowColor = (deviation: number): string => {
  const abs = Math.abs(deviation);
  if (abs >= 20) return 'bg-red-50 hover:bg-red-100';
  if (abs >= 10) return 'bg-orange-50 hover:bg-orange-100';
  if (abs >= 5) return 'bg-yellow-50 hover:bg-yellow-100';
  return '';
};

const getDistrictChangeColor = (change: number): string => {
  const abs = Math.abs(change);
  if (change > 0) {
    if (abs >= 5) return 'text-red-700 bg-red-100';
    if (abs >= 2) return 'text-red-600 bg-red-50';
    return 'text-red-500';
  } else if (change < 0) {
    if (abs >= 5) return 'text-emerald-700 bg-emerald-100';
    if (abs >= 2) return 'text-emerald-600 bg-emerald-50';
    return 'text-emerald-500';
  }
  return 'text-neutral-500';
};

interface CategoryPanelData {
  listAvgPrice: number;
  transactionAvgPrice: number;
  change30d: number;
  changeYoy: number;
  verifiedCount: number;
  verifiedRate: number;
  pendingReview: number;
  sourceCrawlCount: number;
  dedupValidCount: number;
  cleanPassRate: number;
  sources: { name: string; count: number; avgPrice: number }[];
  avgListingDays: number;
  listingDaysDistribution: { range: string; count: number }[];
  deviationAlerts: { title: string; deviation: number; type: 'overpriced' | 'underpriced'; price: number; districtAvg: number }[];
}

const generateCategoryPanelData = (category: PropertyCategory, overview: MarketOverview | null): CategoryPanelData => {
  const baseMultiplier = category === 'rental' ? 0.01 : category === 'overseas' ? 1.5 : category === 'vacation' ? 1.2 : category === 'new' ? 1.3 : 1;
  const baseAvg = overview?.avgPrice || 65000;
  const avg = baseAvg * baseMultiplier;
  const sources = [
    { name: '链家', count: Math.floor(Math.random() * 800) + 400, avgPrice: Math.round(avg * (1 + (Math.random() - 0.5) * 0.08)) },
    { name: '贝壳', count: Math.floor(Math.random() * 700) + 350, avgPrice: Math.round(avg * (1 + (Math.random() - 0.5) * 0.08)) },
    { name: '安居客', count: Math.floor(Math.random() * 600) + 300, avgPrice: Math.round(avg * (1 + (Math.random() - 0.5) * 0.1)) },
    { name: '58同城', count: Math.floor(Math.random() * 500) + 200, avgPrice: Math.round(avg * (1 + (Math.random() - 0.5) * 0.12)) },
  ];
  const listingDaysDistribution = [
    { range: '7天内', count: Math.floor(Math.random() * 200) + 100 },
    { range: '8-30天', count: Math.floor(Math.random() * 400) + 200 },
    { range: '31-90天', count: Math.floor(Math.random() * 300) + 150 },
    { range: '90天以上', count: Math.floor(Math.random() * 150) + 50 },
  ];
  const catLabel = categories.find(c => c.key === category)?.label || '';
  return {
    listAvgPrice: Math.round(avg * 1.03),
    transactionAvgPrice: Math.round(avg * 0.98),
    change30d: parseFloat(((Math.random() - 0.45) * 8).toFixed(2)),
    changeYoy: parseFloat(((Math.random() - 0.4) * 15).toFixed(2)),
    verifiedCount: Math.floor(Math.random() * 2000) + 1000,
    verifiedRate: parseFloat((0.85 + Math.random() * 0.12).toFixed(3)) * 100,
    pendingReview: Math.floor(Math.random() * 200) + 50,
    sourceCrawlCount: Math.floor(Math.random() * 5000) + 3000,
    dedupValidCount: Math.floor(Math.random() * 3500) + 2000,
    cleanPassRate: parseFloat((0.7 + Math.random() * 0.2).toFixed(3)) * 100,
    sources,
    avgListingDays: Math.floor(Math.random() * 45) + 15,
    listingDaysDistribution,
    deviationAlerts: [
      { title: `${catLabel}·朝阳区 优质3居室`, deviation: parseFloat(((Math.random() * 15) + 10).toFixed(1)), type: 'overpriced', price: Math.round(avg * 1.15), districtAvg: Math.round(avg) },
      { title: `${catLabel}·海淀区 学区2居室`, deviation: parseFloat(((Math.random() * 15) + 10).toFixed(1)), type: 'underpriced', price: Math.round(avg * 0.85), districtAvg: Math.round(avg) },
      { title: `${catLabel}·丰台区 南北通透4居`, deviation: parseFloat(((Math.random() * 10) + 8).toFixed(1)), type: 'overpriced', price: Math.round(avg * 1.1), districtAvg: Math.round(avg) },
    ],
  };
};

const generateListingDaysChart = (data: { range: string; count: number }[]): EChartsOption => ({
  backgroundColor: 'transparent',
  grid: { top: 10, right: 10, bottom: 25, left: 40 },
  xAxis: {
    type: 'category',
    data: data.map(d => d.range),
    axisLabel: { fontSize: 11, color: '#6b7280' },
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#6b7280' },
    splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
  },
  series: [{
    type: 'bar',
    data: data.map(d => d.count),
    barWidth: '50%',
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
      color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3D5FA9' }, { offset: 1, color: '#0A2463' }] },
    },
    label: { show: true, position: 'top', fontSize: 11, color: '#374151' },
  }],
});

interface ReportEvent { title: string; status: string; statusType: 'pending' | 'reviewing' | 'resolved'; time: string; }
interface ReviewRecord { id: string; propertyCode: string; reviewType: 'auto' | 'manual'; reviewTime: string; result: 'pass' | 'fail' | 'pending'; operator: string; }
interface PriceDropAlert { id: string; title: string; originalPrice: number; newPrice: number; dropAmount: number; dropPercent: number; subscriberCount: number; sentTime: string; }

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PropertyCategory>('secondhand');
  const [tabDirection, setTabDirection] = useState(0);
  const [activeDeviationFilter, setActiveDeviationFilter] = useState<DeviationFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<MockProperty | null>(null);

  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [districtPrices, setDistrictPrices] = useState<DistrictPrice[]>([]);
  const [properties, setProperties] = useState<MockProperty[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [agentRisks, setAgentRisks] = useState<AgentRiskProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const chartData7d = useMemo(() => [120, 132, 101, 134, 90, 230, 210], []);
  const chartData30d = useMemo(() => [220, 182, 191, 234, 290, 330, 310, 280, 260, 290, 320, 350], []);
  const scatterPriceHistory = useMemo(() => generatePriceHistory(marketOverview?.avgPrice || 65000), [marketOverview?.avgPrice]);
  const categoryPanelData = useMemo(() => generateCategoryPanelData(activeTab, marketOverview), [activeTab, marketOverview]);

  const topRiseDistricts = useMemo(() => [...districtPrices].sort((a, b) => b.change7d - a.change7d).slice(0, 3), [districtPrices]);
  const topDropDistricts = useMemo(() => [...districtPrices].sort((a, b) => a.change7d - b.change7d).slice(0, 3), [districtPrices]);

  const filteredAlerts = useMemo(() => {
    const alerts = priceAlerts.slice(0, 10);
    switch (activeDeviationFilter) {
      case 'overpriced': return alerts.filter(a => a.type === 'overpriced' || a.type === 'sudden_rise');
      case 'underpriced': return alerts.filter(a => a.type === 'underpriced' || a.type === 'sudden_drop');
      case 'severe': return alerts.filter(a => a.deviation >= 15);
      default: return alerts;
    }
  }, [priceAlerts, activeDeviationFilter]);

  const scatterStats = useMemo(() => {
    const txData = scatterPriceHistory.filter(p => p.type === 'transaction');
    const prices = txData.map(p => p.price);
    if (prices.length === 0) return { avg: 0, max: 0, min: 0, count: 0, momChange: 0 };
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const mid = Math.floor(prices.length / 2);
    const firstHalf = prices.slice(0, mid);
    const secondHalf = prices.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const momChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    return { avg, max, min, count: prices.length, momChange };
  }, [scatterPriceHistory]);

  const reportEvents: ReportEvent[] = useMemo(() => [
    { title: '朝阳区某房源虚假图片举报', status: '待处理', statusType: 'pending', time: '10分钟前' },
    { title: '海淀区学区房价格欺诈举报', status: '运营审核中', statusType: 'reviewing', time: '2小时前' },
    { title: '丰台区已售房源重复挂牌', status: '房源已下架', statusType: 'resolved', time: '昨天 18:30' },
  ], []);

  const reviewRecords: ReviewRecord[] = useMemo(() => [
    { id: '1', propertyCode: 'FY20240601001', reviewType: 'auto', reviewTime: '2024-06-12 14:32', result: 'pass', operator: '系统自动' },
    { id: '2', propertyCode: 'FY20240601002', reviewType: 'manual', reviewTime: '2024-06-12 14:15', result: 'pass', operator: '张审核' },
    { id: '3', propertyCode: 'FY20240601003', reviewType: 'auto', reviewTime: '2024-06-12 13:58', result: 'fail', operator: '系统自动' },
    { id: '4', propertyCode: 'FY20240601004', reviewType: 'manual', reviewTime: '2024-06-12 11:20', result: 'pass', operator: '李审核' },
    { id: '5', propertyCode: 'FY20240601005', reviewType: 'auto', reviewTime: '2024-06-12 10:45', result: 'pass', operator: '系统自动' },
  ], []);

  const priceDropAlerts: PriceDropAlert[] = useMemo(() => [
    { id: '1', title: '朝阳区国贸 3室2厅 精装', originalPrice: 8500000, newPrice: 7980000, dropAmount: 52, dropPercent: 6.1, subscriberCount: 128, sentTime: '30分钟前' },
    { id: '2', title: '海淀区中关村 2室1厅 学区房', originalPrice: 6800000, newPrice: 6380000, dropAmount: 42, dropPercent: 6.2, subscriberCount: 256, sentTime: '1小时前' },
    { id: '3', title: '西城区金融街 1室1厅', originalPrice: 5200000, newPrice: 4950000, dropAmount: 25, dropPercent: 4.8, subscriberCount: 89, sentTime: '2小时前' },
    { id: '4', title: '东城区东直门 4室2厅 豪装', originalPrice: 12500000, newPrice: 11800000, dropAmount: 70, dropPercent: 5.6, subscriberCount: 167, sentTime: '3小时前' },
  ], []);

  const competitorSummary = useMemo(() => {
    if (competitors.length === 0) return { count: 0, minPrice: 0, maxPrice: 0, rank: 0 };
    const prices = competitors.map(c => c.unitPrice);
    const sorted = [...prices].sort((a, b) => a - b);
    const base = marketOverview?.avgPrice || 65000;
    const rank = sorted.findIndex(p => p >= base) + 1 || sorted.length;
    return { count: competitors.length, minPrice: Math.min(...prices), maxPrice: Math.max(...prices), rank };
  }, [competitors, marketOverview]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const verifiedProperties = await getProperties({ category: activeTab, pageSize: 4, filters: { isVerified: true } });
        const firstVerified = verifiedProperties.data[0];
        const [overviewRes, districtsRes, alertsRes, competitorRes, risksRes] = await Promise.all([
          getMarketOverview({ category: activeTab }),
          getDistrictPrices({ category: activeTab }),
          getPriceAlerts({}),
          firstVerified ? getCompetitorMatrix({ propertyId: firstVerified.id, radius: 3 }) : Promise.resolve([]),
          getAgentRisks(),
        ]);
        setMarketOverview(overviewRes);
        setDistrictPrices(districtsRes);
        setProperties(verifiedProperties.data);
        setPriceAlerts(alertsRes);
        setCompetitors(competitorRes);
        setAgentRisks(risksRes);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleTabChange = (newTab: PropertyCategory) => {
    const oldIdx = categories.findIndex(c => c.key === activeTab);
    const newIdx = categories.findIndex(c => c.key === newTab);
    setTabDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(newTab);
  };

  const openVerificationModal = (property: MockProperty) => {
    setSelectedProperty(property);
    setModalOpen(true);
  };

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
      <VerificationDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} property={selectedProperty} />

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 py-16 px-4"
      >
        <div className="absolute inset-0 grain-overlay opacity-30" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-accent-verified/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-up/5 blur-3xl" />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-accent-verified" />
              <span>真房源认证 · 价格透明 · 数据可信</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl">房产全周期价格治理平台</h1>
            <p className="mb-6 text-lg leading-relaxed text-white/80 md:text-xl">基于区块链存证的真房源核验系统，聚合全平台挂牌数据，提供专业的价格分析、趋势预测与市场洞察。</p>
            <div className="flex flex-wrap gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary bg-white text-primary-800 hover:bg-neutral-100 text-sm py-2.5 px-5">开始探索</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary border-white text-white hover:bg-white/10 text-sm py-2.5 px-5">了解更多</motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <div className="container py-10 px-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-14">
          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">业务动态快览</h2>
                <p className="text-sm text-neutral-500">平台实时业务状态与处理动态</p>
              </div>
              <div className="text-xs text-neutral-400">数据更新于 {new Date().toLocaleDateString('zh-CN')} {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link to="/report" className="group">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="card h-full flex flex-col p-5 bg-gradient-to-br from-red-50 to-white border border-red-100 hover:border-red-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-lg bg-red-100 flex items-center justify-center">
                      <Flag className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                      {reportEvents.filter(r => r.statusType === 'pending').length} 件待处理
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">虚假房源举报</h3>
                  <p className="text-xs text-neutral-500 mb-3 flex-1">用户举报处理闭环流程</p>
                  <div className="space-y-1.5 text-xs">
                    {reportEvents.slice(0, 2).map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-neutral-600">
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full shrink-0',
                          e.statusType === 'pending' ? 'bg-blue-500' : e.statusType === 'reviewing' ? 'bg-amber-500' : 'bg-emerald-500'
                        )} />
                        <span className="line-clamp-1">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Link>

              <Link to="/admin/dashboard" className="group">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="card h-full flex flex-col p-5 bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:border-amber-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-lg bg-amber-100 flex items-center justify-center">
                      <ShieldAlert className="h-5 w-5 text-amber-600" />
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      ⚠ {agentRisks.filter(a => a.riskLevel !== 'low').length} 条预警
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">经纪人风控</h3>
                  <p className="text-xs text-neutral-500 mb-3 flex-1">集中下架再上架套利识别</p>
                  <div className="space-y-1.5 text-xs">
                    {agentRisks.filter(a => a.riskLevel === 'high').slice(0, 2).map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-neutral-600">
                        <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{a.agentName} · {a.suspiciousActivities.length > 0 ? ['集中下架套利', '价格操纵', '重复挂牌'][a.suspiciousActivities[0].type === 'mass_delisting' ? 0 : a.suspiciousActivities[0].type === 'price_manipulation' ? 1 : 2] : '异常操作'}</span>
                      </div>
                    ))}
                    {agentRisks.filter(a => a.riskLevel === 'high').length === 0 && agentRisks.filter(a => a.riskLevel === 'medium').slice(0, 2).map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-neutral-600">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="line-clamp-1">{a.agentName} · 关注名单</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Link>

              <Link to="/price-analysis" className="group">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="card h-full flex flex-col p-5 bg-gradient-to-br from-primary-50 to-white border border-primary-100 hover:border-primary-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-lg bg-primary-100 flex items-center justify-center">
                      <FileCheck2 className="h-5 w-5 text-primary-600" />
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                      今日复查 {reviewRecords.filter(r => r.reviewType === 'auto').length} 套
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">核验复查记录</h3>
                  <p className="text-xs text-neutral-500 mb-3 flex-1">自动 + 人工双重质量保障</p>
                  <div className="space-y-1.5 text-xs">
                    {reviewRecords.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-neutral-600">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {r.result === 'pass' ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          ) : r.result === 'fail' ? (
                            <XCircle className="h-3 w-3 text-red-500 shrink-0" />
                          ) : (
                            <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                          <span className="line-clamp-1">{r.result === 'pass' ? '核验通过' : r.result === 'fail' ? '核验未通过' : '待核验'}</span>
                        </div>
                        <span className="text-neutral-400 shrink-0">{r.reviewTime.split(' ')[1]}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Link>

              <Link to="/user-center" className="group">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="card h-full flex flex-col p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:border-emerald-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      {priceDropAlerts[0]?.subscriberCount || 128} 人订阅
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">降价订阅提醒</h3>
                  <p className="text-xs text-neutral-500 mb-3 flex-1">房源价格变动实时推送</p>
                  <div className="space-y-1.5 text-xs">
                    {priceDropAlerts.slice(0, 2).map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-neutral-600">
                        <span className="line-clamp-1 flex-1">{a.title}</span>
                        <span className="text-emerald-600 font-medium shrink-0">-{a.dropPercent}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-emerald-100/50 text-[10px] text-neutral-500">
                    今日已推送 {Math.floor(Math.random() * 50) + 20} 条降价提醒
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">市场概览驾驶舱</h2>
                <p className="text-sm text-neutral-500">实时掌握房产市场核心指标与动态</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <DataCard title="今日挂牌量" value={marketOverview?.totalListings?.toLocaleString() || '0'} change={2.3} changeLabel="较昨日" chartData={chartData7d} icon={<Building2 className="h-5 w-5" />} />
              <DataCard title="今日成交量" value={marketOverview?.transactionVolume7d?.toLocaleString() || '0'} change={-1.5} changeLabel="较昨日" chartData={chartData7d.slice().reverse()} icon={<TrendingUp className="h-5 w-5" />} />
              <DataCard title="全市均价" value={formatPrice(marketOverview?.avgPrice || 0, 'yuan/sqm')} change={marketOverview?.priceChange7d || 0} changeLabel="7日涨跌" chartData={chartData30d} icon={<DollarSign className="h-5 w-5" />} />
              <DataCard title="7日涨跌" value={`${marketOverview?.priceChange7d?.toFixed(2) || '0'}%`} change={marketOverview?.priceChange7d || 0} changeLabel="较上周" chartData={chartData7d} icon={(marketOverview?.priceChange7d || 0) >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />} />
              <DataCard title="供需比" value="1.25" change={0.8} changeLabel="较上周" chartData={chartData30d} icon={<Users className="h-5 w-5" />} />
              <DataCard title="库存去化周期" value="45天" change={-2.1} changeLabel="较上周" chartData={chartData30d.slice().reverse()} icon={<Clock className="h-5 w-5" />} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">五大房类独立面板</h2>
              <p className="text-sm text-neutral-500">按房产类型查看细分市场深度数据</p>
            </div>
            <div className="mb-5 flex flex-wrap gap-1.5 border-b border-neutral-200">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleTabChange(cat.key)}
                  className={cn(
                    'group flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-all',
                    activeTab === cat.key
                      ? 'border-primary-800 text-primary-800 bg-primary-50/50'
                      : 'border-transparent text-neutral-500 hover:text-primary-700 hover:bg-neutral-50'
                  )}
                >
                  <span className={cn('transition-colors', activeTab === cat.key ? 'text-primary-800' : 'text-neutral-400 group-hover:text-primary-600')}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative overflow-hidden">
              <AnimatePresence initial={false} custom={tabDirection} mode="wait">
                <motion.div
                  key={activeTab}
                  custom={tabDirection}
                  variants={tabSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary-600" />
                        {categories.find(c => c.key === activeTab)?.label}价格指标
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-neutral-50 p-3">
                          <p className="text-xs text-neutral-500 mb-1">挂牌均价</p>
                          <p className="text-xl font-bold text-neutral-900">{formatPrice(categoryPanelData.listAvgPrice, 'yuan/sqm')}</p>
                        </div>
                        <div className="rounded-lg bg-neutral-50 p-3">
                          <p className="text-xs text-neutral-500 mb-1">成交均价</p>
                          <p className="text-xl font-bold text-neutral-900">{formatPrice(categoryPanelData.transactionAvgPrice, 'yuan/sqm')}</p>
                        </div>
                        <div className="rounded-lg bg-neutral-50 p-3">
                          <p className="text-xs text-neutral-500 mb-1">30日环比</p>
                          <p className={cn('text-xl font-bold flex items-center gap-1', categoryPanelData.change30d >= 0 ? 'text-accent-up' : 'text-accent-down')}>
                            {categoryPanelData.change30d >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {categoryPanelData.change30d >= 0 ? '+' : ''}{categoryPanelData.change30d}%
                          </p>
                        </div>
                        <div className="rounded-lg bg-neutral-50 p-3">
                          <p className="text-xs text-neutral-500 mb-1">同比去年</p>
                          <p className={cn('text-xl font-bold flex items-center gap-1', categoryPanelData.changeYoy >= 0 ? 'text-accent-up' : 'text-accent-down')}>
                            {categoryPanelData.changeYoy >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {categoryPanelData.changeYoy >= 0 ? '+' : ''}{categoryPanelData.changeYoy}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-accent-verified" />
                        真房源核验状态
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
                          <p className="text-xs text-emerald-600 mb-1">已核验数</p>
                          <p className="text-xl font-bold text-emerald-800">{categoryPanelData.verifiedCount.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-500 mt-0.5">套</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                          <p className="text-xs text-blue-600 mb-1">核验通过率</p>
                          <p className="text-xl font-bold text-blue-800">{categoryPanelData.verifiedRate.toFixed(1)}%</p>
                          <div className="mt-1.5 h-1 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${categoryPanelData.verifiedRate}%` }} />
                          </div>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
                          <p className="text-xs text-amber-600 mb-1">待审核数</p>
                          <p className="text-xl font-bold text-amber-800">{categoryPanelData.pendingReview.toLocaleString()}</p>
                          <p className="text-[10px] text-amber-500 mt-0.5">套</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <h4 className="text-xs font-medium text-neutral-600 mb-2.5">跨渠道清洗结果</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500">来源抓取数</span>
                            <span className="font-medium text-neutral-700">{categoryPanelData.sourceCrawlCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500">去重后有效数</span>
                            <span className="font-medium text-neutral-700">{categoryPanelData.dedupValidCount.toLocaleString()}</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-neutral-500">清洗通过率</span>
                              <span className="font-medium text-primary-700">{categoryPanelData.cleanPassRate.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${categoryPanelData.cleanPassRate}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary-600" />
                        跨渠道来源对比
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-neutral-200">
                              <th className="text-left py-2 px-2 text-xs font-medium text-neutral-500">来源渠道</th>
                              <th className="text-right py-2 px-2 text-xs font-medium text-neutral-500">挂牌数</th>
                              <th className="text-right py-2 px-2 text-xs font-medium text-neutral-500">均价</th>
                              <th className="text-right py-2 px-2 text-xs font-medium text-neutral-500">占比</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const total = categoryPanelData.sources.reduce((s, c) => s + c.count, 0);
                              return categoryPanelData.sources.map((src, idx) => {
                                const pct = (src.count / total) * 100;
                                return (
                                  <tr key={src.name} className="border-b border-neutral-50 last:border-0">
                                    <td className="py-2.5 px-2">
                                      <div className="flex items-center gap-2">
                                        <div className={cn('h-2 w-2 rounded-full', idx === 0 ? 'bg-primary-600' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-emerald-500' : 'bg-amber-500')} />
                                        <span className="font-medium text-neutral-700">{src.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-2 text-right font-medium text-neutral-800">{src.count.toLocaleString()}</td>
                                    <td className="py-2.5 px-2 text-right text-neutral-600">{formatPrice(src.avgPrice, 'yuan/sqm')}</td>
                                    <td className="py-2.5 px-2 text-right">
                                      <div className="flex items-center gap-1.5 justify-end">
                                        <div className="w-12 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                          <div className={cn('h-full rounded-full', idx === 0 ? 'bg-primary-600' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs text-neutral-500 w-10 text-right">{pct.toFixed(0)}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-primary-600" />
                          挂牌时效分布
                        </span>
                        <span className="text-xs font-normal text-neutral-500">
                          平均 <span className="font-semibold text-primary-700">{categoryPanelData.avgListingDays}</span> 天
                        </span>
                      </h3>
                      <div className="h-48">
                        <ReactECharts option={generateListingDaysChart(categoryPanelData.listingDaysDistribution)} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
                      </div>
                    </div>
                  </div>
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {categories.find(c => c.key === activeTab)?.label}挂牌价偏离预警 TOP 3
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {categoryPanelData.deviationAlerts.map((alert, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn(
                            'rounded-xl border p-4',
                            alert.type === 'overpriced' ? 'border-red-200 bg-gradient-to-br from-red-50/80 to-white' : 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white'
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              alert.type === 'overpriced' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                            )}>
                              {alert.type === 'overpriced' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {alert.type === 'overpriced' ? '偏高' : '偏低'}
                            </span>
                            <span className={cn('text-lg font-bold', alert.type === 'overpriced' ? 'text-red-600' : 'text-emerald-600')}>
                              +{alert.deviation}%
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-neutral-800 mb-2 line-clamp-1">{alert.title}</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-neutral-500">挂牌价</span><span className="font-medium text-neutral-700">{formatPrice(alert.price, 'yuan/sqm')}</span></div>
                            <div className="flex justify-between"><span className="text-neutral-500">片区均价</span><span className="font-medium text-neutral-600">{formatPrice(alert.districtAvg, 'yuan/sqm')}</span></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">片区7日热力图</h2>
                <p className="text-sm text-neutral-500">各行政区价格变化热度与详细数据</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <BarChart3 className="h-4 w-4" />
                <span>基于平台挂牌数据聚合</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {topRiseDistricts.map((d, idx) => (
                  <motion.div
                    key={`rise-${d.districtCode}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">{idx + 1}</span>
                      <span className="text-xs font-medium text-red-600">涨幅 TOP{idx + 1}</span>
                    </div>
                    <p className="font-bold text-neutral-800 mb-1">{d.districtName}</p>
                    <div className="flex items-baseline gap-1">
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                      <span className="text-lg font-bold text-red-600">+{d.change7d.toFixed(2)}%</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{formatPrice(d.avgPrice, 'yuan/sqm')}</p>
                  </motion.div>
                ))}
                {topDropDistricts.map((d, idx) => (
                  <motion.div
                    key={`drop-${d.districtCode}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (idx + 3) * 0.08 }}
                    className="rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white text-xs font-bold">{idx + 1}</span>
                      <span className="text-xs font-medium text-emerald-600">跌幅 TOP{idx + 1}</span>
                    </div>
                    <p className="font-bold text-neutral-800 mb-1">{d.districtName}</p>
                    <div className="flex items-baseline gap-1">
                      <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                      <span className="text-lg font-bold text-emerald-600">{d.change7d.toFixed(2)}%</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{formatPrice(d.avgPrice, 'yuan/sqm')}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 card p-5">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-4">片区价格热力分布</h3>
                  <DistrictHeatmap data={districtPrices} height={380} />
                </div>
                <div className="lg:col-span-3 card p-0 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-700">片区价格数据明细</h3>
                    <span className="text-xs text-neutral-400">共 {districtPrices.length} 个片区</span>
                  </div>
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 sticky top-0">
                        <tr className="border-b border-neutral-200">
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-neutral-600">片区名称</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-neutral-600">均价</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-neutral-600">7日涨跌%</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-neutral-600">30日涨跌%</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-neutral-600">在架房源</th>
                        </tr>
                      </thead>
                      <tbody>
                        {districtPrices.map((d) => (
                          <tr key={d.districtCode} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                                <span className="font-medium text-neutral-700">{d.districtName}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-neutral-800">{formatPrice(d.avgPrice, 'yuan/sqm')}</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={cn('inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold', getDistrictChangeColor(d.change7d))}>
                                {d.change7d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {d.change7d >= 0 ? '+' : ''}{d.change7d.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className={cn('inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium', getDistrictChangeColor(d.change30d))}>
                                {d.change30d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {d.change30d >= 0 ? '+' : ''}{d.change30d.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-neutral-600">{d.totalListings.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">同户型成交时序散点图</h2>
                <p className="text-sm text-neutral-500">近3个月同户型成交价格分布与趋势</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="card p-4"><p className="text-xs text-neutral-500 mb-1">成交均价</p><p className="text-xl font-bold text-neutral-900">{formatPrice(Math.round(scatterStats.avg), 'yuan/sqm')}</p></div>
              <div className="card p-4"><p className="text-xs text-neutral-500 mb-1">最高单价</p><p className="text-xl font-bold text-accent-up">{formatPrice(scatterStats.max, 'yuan/sqm')}</p></div>
              <div className="card p-4"><p className="text-xs text-neutral-500 mb-1">最低单价</p><p className="text-xl font-bold text-accent-down">{formatPrice(scatterStats.min, 'yuan/sqm')}</p></div>
              <div className="card p-4"><p className="text-xs text-neutral-500 mb-1">成交量</p><p className="text-xl font-bold text-neutral-900">{scatterStats.count}<span className="text-sm font-normal text-neutral-500 ml-1">套</span></p></div>
              <div className="card p-4"><p className="text-xs text-neutral-500 mb-1">与上月环比</p><p className={cn('text-xl font-bold flex items-center gap-1', scatterStats.momChange >= 0 ? 'text-accent-up' : 'text-accent-down')}>{scatterStats.momChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{scatterStats.momChange >= 0 ? '+' : ''}{scatterStats.momChange.toFixed(1)}%</p></div>
            </div>
            <div className="card p-5">
              <TransactionScatter data={scatterPriceHistory} housingType={activeTab} height={380} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">挂牌价偏离预警清单</h2>
              <p className="text-sm text-neutral-500">平台自动识别价格异常房源，辅助风险判断</p>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {([
                { key: 'all' as DeviationFilter, label: '全部', icon: FileText },
                { key: 'overpriced' as DeviationFilter, label: '偏高预警', icon: ArrowUpRight },
                { key: 'underpriced' as DeviationFilter, label: '偏低预警', icon: ArrowDownRight },
                { key: 'severe' as DeviationFilter, label: '严重偏离', icon: AlertTriangle },
              ]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveDeviationFilter(f.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                    activeDeviationFilter === f.key ? 'bg-primary-800 text-white shadow-md' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300 hover:text-primary-700'
                  )}
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              ))}
            </div>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600">房源标题</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600">挂牌价</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600">片区均价</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600">偏离度%</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-600">预警类型</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-600">来源</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-600">核验状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-neutral-400"><AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>暂无符合条件的预警数据</p></td></tr>
                    ) : (
                      filteredAlerts.map((alert) => {
                        const isOver = alert.type === 'overpriced' || alert.type === 'sudden_rise';
                        return (
                          <tr key={alert.id} className={cn('border-b border-neutral-50 last:border-0 transition-colors', getDeviationRowColor(alert.deviation))}>
                            <td className="py-3 px-4"><p className="font-medium text-neutral-800 line-clamp-1 max-w-xs">{alert.propertyTitle}</p></td>
                            <td className="py-3 px-4 text-right font-semibold text-neutral-800">{formatPrice(alert.districtAvgPrice * (1 + alert.deviation / 100 * (isOver ? 1 : -1)), 'yuan/sqm')}</td>
                            <td className="py-3 px-4 text-right text-neutral-600">{formatPrice(alert.districtAvgPrice, 'yuan/sqm')}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={cn('inline-flex items-center gap-0.5 font-bold', isOver ? 'text-red-600' : 'text-emerald-600')}>
                                {isOver ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                {isOver ? '+' : ''}{alert.deviation.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                isOver ? alert.deviation >= 20 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700' : alert.deviation >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              )}>
                                {isOver ? '偏高' : '偏低'}{alert.deviation >= 20 ? '·严重' : alert.deviation >= 10 ? '·中度' : '·轻度'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center"><span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600">{['链家', '贝壳', '安居客', '58同城'][Math.floor(alert.id.charCodeAt(0) % 4)]}</span></td>
                            <td className="py-3 px-4 text-center">
                              {alert.id.charCodeAt(0) % 3 !== 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />已核验</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock className="h-3.5 w-3.5" />待核验</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">精选真房源 + 核验链条可复查</h2>
                <p className="text-sm text-neutral-500">通过区块链全链条核验的优质房源，点击查看核验详情</p>
              </div>
              <Link to="/property-list" className="text-sm text-primary-800 hover:text-primary-700 flex items-center gap-1">查看更多 <ChevronRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
              {properties.map((property) => (
                <div key={property.id} className="flex flex-col">
                  <PropertyCard property={property} />
                  {property.isVerified && (
                    <div className="mt-2 rounded-lg border border-neutral-100 bg-white px-3 py-2.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        {[
                          { type: 'broker' as const, Icon: UserCheck, label: '经纪人' },
                          { type: 'owner' as const, Icon: FileCheck2, label: '业主' },
                          { type: 'vr' as const, Icon: Eye, label: 'VR' },
                          { type: 'chain' as const, Icon: Link2, label: '链上' },
                        ].map((step, idx) => {
                          const node = property.verificationChain?.find(n => n.type === step.type);
                          const isOk = node?.status === 'verified';
                          return (
                            <div key={step.type} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center">
                                <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', isOk ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-300')}>
                                  {isOk ? <CheckIcon className="h-3.5 w-3.5" /> : <step.Icon className="h-3.5 w-3.5" />}
                                </div>
                                <span className={cn('mt-0.5 text-[10px]', isOk ? 'text-emerald-600 font-medium' : 'text-neutral-400')}>{step.label}</span>
                              </div>
                              {idx < 3 && <div className={cn('mx-0.5 h-px flex-1', isOk ? 'bg-emerald-200' : 'bg-neutral-200')} />}
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => openVerificationModal(property)} className="w-full text-center text-xs text-primary-700 hover:text-primary-900 hover:underline py-1 mt-1 border-t border-neutral-100">
                        查看核验详情 →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-primary-50 to-white">
                <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <ScanLine className="h-6 w-6 text-primary-700" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">今日新核验房源</p>
                  <p className="text-2xl font-bold text-neutral-900">{Math.floor(Math.random() * 200) + 150}<span className="text-sm font-normal text-neutral-500 ml-1">套</span></p>
                </div>
              </div>
              <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Link2 className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">累计链上存证数</p>
                  <p className="text-2xl font-bold text-neutral-900">{(Math.floor(Math.random() * 50000) + 100000).toLocaleString()}<span className="text-sm font-normal text-neutral-500 ml-1">条</span></p>
                </div>
              </div>
              <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-amber-50 to-white">
                <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">本月人工抽检通过率</p>
                  <p className="text-2xl font-bold text-neutral-900">99.2<span className="text-sm font-normal text-neutral-500 ml-1">%</span></p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">竞品楼盘报价矩阵</h2>
                <p className="text-sm text-neutral-500">周边竞品楼盘价格对比与排名分析</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="card p-4">
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Building2 className="h-3 w-3" />对比楼盘数</p>
                <p className="text-2xl font-bold text-neutral-900">{competitorSummary.count}<span className="text-sm font-normal text-neutral-500 ml-1">个</span></p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-emerald-500" />最低单价</p>
                <p className="text-2xl font-bold text-emerald-600">{formatPrice(competitorSummary.minPrice, 'yuan/sqm')}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-red-500" />最高单价</p>
                <p className="text-2xl font-bold text-red-600">{formatPrice(competitorSummary.maxPrice, 'yuan/sqm')}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Activity className="h-3 w-3" />本楼盘排名</p>
                <p className="text-2xl font-bold text-primary-700">第{competitorSummary.rank}<span className="text-sm font-normal text-neutral-500 ml-1">/{competitorSummary.count}</span></p>
              </div>
            </div>
            <div className="card p-5">
              <CompetitorMatrix data={competitors} basePrice={marketOverview?.avgPrice} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">业务反馈与风控动态</h2>
              <p className="text-sm text-neutral-500">举报处理·风控监测·核验复查·订阅推送 全链路闭环</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    虚假房源举报闭环动态
                  </h3>
                  <Link to="/report" className="text-xs text-primary-700 hover:underline flex items-center gap-0.5">前往举报中心 <ArrowRight className="h-3 w-3" /></Link>
                </div>
                <div className="space-y-3 mb-5">
                  {reportEvents.map((event, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border',
                        event.statusType === 'pending' ? 'border-blue-200 bg-blue-50/50' :
                        event.statusType === 'reviewing' ? 'border-amber-200 bg-amber-50/50' :
                        'border-emerald-200 bg-emerald-50/50'
                      )}
                    >
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                        event.statusType === 'pending' ? 'bg-blue-100 text-blue-600' :
                        event.statusType === 'reviewing' ? 'bg-amber-100 text-amber-600' :
                        'bg-emerald-100 text-emerald-600'
                      )}>
                        {event.statusType === 'pending' ? <Clock className="h-4 w-4" /> :
                         event.statusType === 'reviewing' ? <SearchIcon className="h-4 w-4" /> :
                         <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 line-clamp-1">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            event.statusType === 'pending' ? 'bg-blue-100 text-blue-700' :
                            event.statusType === 'reviewing' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          )}>
                            {event.statusType === 'pending' ? '⏱' : event.statusType === 'reviewing' ? '🔍' : '✓'} {event.status}
                          </span>
                          <span className="text-xs text-neutral-400">{event.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-50">
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">举报房源</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">类型</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">提交时间</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">状态</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600 w-28">进度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportEvents.map((event, idx) => (
                        <tr key={idx} className="border-b border-neutral-50 last:border-0">
                          <td className="py-2 px-3 font-medium text-neutral-700 line-clamp-1 max-w-[150px]">{event.title}</td>
                          <td className="py-2 px-3 text-neutral-600">{['虚假图片', '价格欺诈', '重复挂牌'][idx]}</td>
                          <td className="py-2 px-3 text-neutral-500">{event.time}</td>
                          <td className="py-2 px-3">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded',
                              event.statusType === 'pending' ? 'bg-blue-50 text-blue-700' :
                              event.statusType === 'reviewing' ? 'bg-amber-50 text-amber-700' :
                              'bg-emerald-50 text-emerald-700'
                            )}>{event.status}</span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                <div className={cn(
                                  'h-full rounded-full',
                                  event.statusType === 'pending' ? 'bg-blue-400 w-1/4' :
                                  event.statusType === 'reviewing' ? 'bg-amber-400 w-2/4' :
                                  'bg-emerald-500 w-full'
                                )} />
                              </div>
                              <span className="text-[10px] text-neutral-500 w-8">
                                {event.statusType === 'pending' ? '25%' : event.statusType === 'reviewing' ? '50%' : '100%'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" />
                    经纪人异常行为监测
                  </h3>
                  <Link to="/admin/dashboard" className="text-xs text-primary-700 hover:underline flex items-center gap-0.5">查看风控详情 <ArrowRight className="h-3 w-3" /></Link>
                </div>
                {agentRisks.filter(a => a.riskLevel === 'high' || a.riskLevel === 'medium').length > 0 && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">
                      <span className="font-semibold">⚠ 检测到集中下架再上架套利行为</span>，涉及 {agentRisks.filter(a => a.riskLevel !== 'low').length} 名经纪人
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  {agentRisks.slice(0, 3).map((agent, idx) => (
                    <motion.div
                      key={agent.agentId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={cn(
                        'p-3 rounded-lg border',
                        agent.riskLevel === 'high' ? 'border-red-200 bg-red-50/30' :
                        agent.riskLevel === 'medium' ? 'border-amber-200 bg-amber-50/30' :
                        'border-neutral-200 bg-neutral-50/50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                            agent.riskLevel === 'high' ? 'bg-red-500' :
                            agent.riskLevel === 'medium' ? 'bg-amber-500' :
                            'bg-emerald-500'
                          )}>
                            {agent.agentName.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-800">{agent.agentName}</p>
                            <p className="text-[10px] text-neutral-500 line-clamp-1">{agent.company}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          agent.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          agent.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        )}>
                          {agent.riskLevel === 'high' ? '高风险' : agent.riskLevel === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-neutral-600">
                          <Activity className="h-3 w-3" />
                          <span>{agent.suspiciousActivities.length > 0 ? ['集中下架套利', '价格操纵', '重复挂牌'][agent.suspiciousActivities[0].type === 'mass_delisting' ? 0 : agent.suspiciousActivities[0].type === 'price_manipulation' ? 1 : 2] : '正常操作'}</span>
                        </div>
                        <span className="text-neutral-400">
                          {new Date(agent.suspiciousActivities[0]?.timestamp || Date.now()).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-primary-500" />
                  房源核验复查动态
                  <span className="ml-auto text-xs font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    今日自动复查250套 · 人工抽检30套 · 合格率99.2%
                  </span>
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-50">
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">房源编号</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">复查类型</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">复查时间</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">复查结果</th>
                        <th className="text-left py-2 px-3 font-medium text-neutral-600">操作人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewRecords.map((r) => (
                        <tr key={r.id} className="border-b border-neutral-50 last:border-0">
                          <td className="py-2 px-3 font-mono text-neutral-700">{r.propertyCode}</td>
                          <td className="py-2 px-3">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[11px]',
                              r.reviewType === 'auto' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                            )}>
                              {r.reviewType === 'auto' ? '自动复查' : '人工抽检'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-neutral-500">{r.reviewTime}</td>
                          <td className="py-2 px-3">
                            {r.result === 'pass' ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600"><CheckCircle2 className="h-3 w-3" />合格</span>
                            ) : r.result === 'fail' ? (
                              <span className="inline-flex items-center gap-0.5 text-red-600"><XCircle className="h-3 w-3" />不合格</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-amber-600"><Clock className="h-3 w-3" />待定</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-neutral-600">{r.operator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-accent-down" />
                    降价订阅提醒结果
                  </h3>
                  <Link to="/user-center" className="text-xs text-primary-700 hover:underline flex items-center gap-0.5">管理我的订阅 <ArrowRight className="h-3 w-3" /></Link>
                </div>
                <div className="space-y-3">
                  {priceDropAlerts.map((alert, idx) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="p-3 rounded-lg border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-neutral-800 line-clamp-1 flex-1 pr-2">{alert.title}</p>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                          <Zap className="h-3 w-3" />
                          -{alert.dropPercent}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="text-neutral-500 line-through">{formatPrice(alert.originalPrice)}</span>
                        <ArrowRight className="h-3 w-3 text-neutral-400" />
                        <span className="font-bold text-emerald-600">{formatPrice(alert.newPrice)}</span>
                        <span className="ml-auto px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-medium">
                          直降{alert.dropAmount}万
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-emerald-100/50 pt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {alert.subscriberCount}人已收到提醒
                        </span>
                        <span>{alert.sentTime}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <h2 className="mb-1.5 text-2xl font-bold text-neutral-900">功能入口卡片</h2>
              <p className="text-sm text-neutral-500">探索更多专业工具与增值服务</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Clock, title: '房价时光机', desc: '回溯历史价格，见证市场变迁',
                  link: '/time-machine', color: 'text-primary-800', bg: 'bg-primary-50', border: 'border-primary-100',
                  badge: '已保存 128 个历史快照', badgeIcon: FileText,
                },
                {
                  icon: Bell, title: '降价订阅提醒', desc: '订阅房源价格变动，第一时间获取通知',
                  link: '/user-center', color: 'text-accent-up', bg: 'bg-accent-up/5', border: 'border-accent-up/10',
                  badge: `${priceDropAlerts[0]?.subscriberCount || 128} 位用户已订阅`, badgeIcon: Users,
                },
                {
                  icon: Flag, title: '虚假房源举报', desc: '共同维护真实可信的交易环境',
                  link: '/report', color: 'text-accent-verified', bg: 'bg-accent-verified/5', border: 'border-accent-verified/10',
                  badge: '本月处理举报 326 件', badgeIcon: CheckCircle2,
                },
                {
                  icon: ShieldCheck, title: '运营管理后台', desc: '经纪人风控·市场健康度仪表盘',
                  link: '/admin/dashboard', color: 'text-accent-down', bg: 'bg-accent-down/5', border: 'border-accent-down/10',
                  badge: `${agentRisks.filter(a => a.riskLevel === 'high').length} 条高风险预警`, badgeIcon: AlertTriangle,
                },
              ].map((entry, idx) => {
                const Icon = entry.icon;
                const BadgeI = entry.badgeIcon;
                return (
                  <motion.div key={entry.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                    <Link
                      to={entry.link}
                      className={cn('group block rounded-xl border bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover', entry.border)}
                    >
                      <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', entry.bg)}>
                        <Icon className={cn('h-6 w-6', entry.color)} />
                      </div>
                      <h3 className={cn('mb-1.5 text-lg font-semibold group-hover:', entry.color)}>{entry.title}</h3>
                      <p className="text-sm text-neutral-500 mb-3">{entry.desc}</p>
                      <div className={cn('inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full', entry.bg, entry.color)}>
                        <BadgeI className="h-3 w-3" />
                        {entry.badge}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
