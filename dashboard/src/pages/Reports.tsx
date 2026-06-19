import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  Store,
  MapPin,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
  CalendarRange,
  TrendingDown,
} from 'lucide-react';
import { useVerificationStore } from '../stores/verificationStore';
import { StatCard } from '../components/common/StatCard';
import { LineChart } from '../components/common/LineChart';
import { BarChart } from '../components/common/BarChart';
import { PieChart } from '../components/common/PieChart';
import { PageLoading } from '../components/common/Loading';

type MetricType = 'coupons' | 'verification' | 'merchants' | 'subsidy';
type DimensionType = 'activity' | 'merchant' | 'district' | 'time';
type TimeGranularity = 'day' | 'week' | 'month';
type SortOrder = 'asc' | 'desc';

interface ActivityReportItem {
  id: string;
  name: string;
  type: string;
  issuedCount: number;
  usedCount: number;
  usageRate: number;
  subsidyAmount: number;
  trendData: { date: string; count: number; amount: number }[];
}

interface MerchantReportItem {
  id: string;
  name: string;
  district: string;
  verificationCount: number;
  verificationAmount: number;
  subsidyAmount: number;
  avgOrderValue: number;
}

interface DistrictReportItem {
  name: string;
  merchantCount: number;
  verificationCount: number;
  verificationAmount: number;
  usageRate: number;
}

interface TimeTrendData {
  date: string;
  verificationCount: number;
  verificationAmount: number;
  subsidyAmount: number;
  avgOrderValue: number;
}

const activityMockData: ActivityReportItem[] = [
  {
    id: '1',
    name: '新春惠民消费券',
    type: '满减券',
    issuedCount: 50000,
    usedCount: 38560,
    usageRate: 77.12,
    subsidyAmount: 1928000,
    trendData: Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 500 + 1000),
      amount: Math.floor(Math.random() * 20000 + 50000),
    })),
  },
  {
    id: '2',
    name: '餐饮美食节',
    type: '折扣券',
    issuedCount: 30000,
    usedCount: 25890,
    usageRate: 86.3,
    subsidyAmount: 776700,
    trendData: Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 400 + 800),
      amount: Math.floor(Math.random() * 15000 + 30000),
    })),
  },
  {
    id: '3',
    name: '零售百货促消费',
    type: '满减券',
    issuedCount: 40000,
    usedCount: 28450,
    usageRate: 71.13,
    subsidyAmount: 1422500,
    trendData: Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 350 + 700),
      amount: Math.floor(Math.random() * 18000 + 40000),
    })),
  },
  {
    id: '4',
    name: '生活服务优惠',
    type: '立减券',
    issuedCount: 20000,
    usedCount: 15680,
    usageRate: 78.4,
    subsidyAmount: 313600,
    trendData: Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 300 + 500),
      amount: Math.floor(Math.random() * 10000 + 20000),
    })),
  },
  {
    id: '5',
    name: '休闲娱乐特惠',
    type: '折扣券',
    issuedCount: 15000,
    usedCount: 9870,
    usageRate: 65.8,
    subsidyAmount: 296100,
    trendData: Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 250 + 300),
      amount: Math.floor(Math.random() * 8000 + 15000),
    })),
  },
  {
    id: '6',
    name: '端午节日专享',
    type: '满减券',
    issuedCount: 25000,
    usedCount: 21340,
    usageRate: 85.36,
    subsidyAmount: 1067000,
    trendData: Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 450 + 900),
      amount: Math.floor(Math.random() * 16000 + 35000),
    })),
  },
];

const merchantMockData: MerchantReportItem[] = [
  { id: 'm1', name: '沈阳大悦城购物中心', district: '大东区', verificationCount: 8956, verificationAmount: 268680, subsidyAmount: 53736, avgOrderValue: 29.99 },
  { id: 'm2', name: '万象城购物中心', district: '和平区', verificationCount: 7823, verificationAmount: 273805, subsidyAmount: 54761, avgOrderValue: 35.0 },
  { id: 'm3', name: '恒隆广场', district: '沈河区', verificationCount: 6540, verificationAmount: 228900, subsidyAmount: 45780, avgOrderValue: 35.0 },
  { id: 'm4', name: '铁西万达广场', district: '铁西区', verificationCount: 5890, verificationAmount: 176700, subsidyAmount: 35340, avgOrderValue: 30.0 },
  { id: 'm5', name: '皇姑万象汇', district: '皇姑区', verificationCount: 5230, verificationAmount: 156900, subsidyAmount: 31380, avgOrderValue: 30.0 },
  { id: 'm6', name: '全运路万达广场', district: '浑南区', verificationCount: 4560, verificationAmount: 136800, subsidyAmount: 27360, avgOrderValue: 30.0 },
  { id: 'm7', name: '于洪新玛特', district: '于洪区', verificationCount: 3890, verificationAmount: 116700, subsidyAmount: 23340, avgOrderValue: 30.0 },
  { id: 'm8', name: '沈北华强城', district: '沈北新区', verificationCount: 3120, verificationAmount: 93600, subsidyAmount: 18720, avgOrderValue: 30.0 },
  { id: 'm9', name: '中兴商业大厦', district: '和平区', verificationCount: 4780, verificationAmount: 167300, subsidyAmount: 33460, avgOrderValue: 35.0 },
  { id: 'm10', name: '沈阳商业城', district: '沈河区', verificationCount: 3560, verificationAmount: 106800, subsidyAmount: 21360, avgOrderValue: 30.0 },
];

const districtMockData: DistrictReportItem[] = [
  { name: '沈河区', merchantCount: 156, verificationCount: 28560, verificationAmount: 856800, usageRate: 72.5 },
  { name: '和平区', merchantCount: 142, verificationCount: 25890, verificationAmount: 776700, usageRate: 70.3 },
  { name: '大东区', merchantCount: 128, verificationCount: 21450, verificationAmount: 643500, usageRate: 68.7 },
  { name: '皇姑区', merchantCount: 98, verificationCount: 18230, verificationAmount: 546900, usageRate: 65.2 },
  { name: '铁西区', merchantCount: 115, verificationCount: 19870, verificationAmount: 596100, usageRate: 67.8 },
  { name: '浑南区', merchantCount: 87, verificationCount: 15420, verificationAmount: 462600, usageRate: 63.5 },
  { name: '于洪区', merchantCount: 76, verificationCount: 12350, verificationAmount: 370500, usageRate: 61.2 },
  { name: '沈北新区', merchantCount: 65, verificationCount: 9870, verificationAmount: 296100, usageRate: 58.9 },
];

const generateTimeTrendData = (granularity: TimeGranularity): TimeTrendData[] => {
  if (granularity === 'day') {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, '0')}`,
      verificationCount: Math.floor(Math.random() * 1000 + 3500),
      verificationAmount: Math.floor(Math.random() * 50000 + 100000),
      subsidyAmount: Math.floor(Math.random() * 10000 + 20000),
      avgOrderValue: Math.floor(Math.random() * 10 + 25),
    }));
  }
  if (granularity === 'week') {
    return Array.from({ length: 12 }, (_, i) => ({
      date: `第${i + 1}周`,
      verificationCount: Math.floor(Math.random() * 5000 + 20000),
      verificationAmount: Math.floor(Math.random() * 200000 + 600000),
      subsidyAmount: Math.floor(Math.random() * 50000 + 120000),
      avgOrderValue: Math.floor(Math.random() * 10 + 25),
    }));
  }
  return Array.from({ length: 6 }, (_, i) => ({
    date: `${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
    verificationCount: Math.floor(Math.random() * 20000 + 80000),
    verificationAmount: Math.floor(Math.random() * 800000 + 2500000),
    subsidyAmount: Math.floor(Math.random() * 200000 + 500000),
    avgOrderValue: Math.floor(Math.random() * 10 + 25),
  }));
};

export default function Reports() {
  const { stats, trendData, isLoading, fetchStats, fetchTrendData } =
    useVerificationStore();
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [activeDimension, setActiveDimension] = useState<DimensionType>('activity');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [activitySortKey, setActivitySortKey] = useState<keyof ActivityReportItem>('usedCount');
  const [activitySortOrder, setActivitySortOrder] = useState<SortOrder>('desc');
  const [merchantSortKey, setMerchantSortKey] = useState<keyof MerchantReportItem>('verificationCount');
  const [merchantSortOrder, setMerchantSortOrder] = useState<SortOrder>('desc');
  const [merchantDistrictFilter, setMerchantDistrictFilter] = useState<string>('all');
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('day');
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantReportItem | null>(null);

  useEffect(() => {
    fetchStats();
    fetchTrendData(Number(dateRange));
  }, [fetchStats, fetchTrendData, dateRange]);

  const categoryData = [
    { name: '餐饮美食', value: 35 },
    { name: '零售百货', value: 28 },
    { name: '生活服务', value: 18 },
    { name: '休闲娱乐', value: 12 },
    { name: '其他', value: 7 },
  ];

  const districtBarData = districtMockData.map((d) => ({
    name: d.name,
    value: d.verificationAmount,
  }));

  const terminalData = [
    { name: 'POS机', value: 55 },
    { name: '小程序', value: 35 },
    { name: '城市码', value: 10 },
  ];

  const timeTrendData = useMemo(() => generateTimeTrendData(timeGranularity), [timeGranularity]);

  const lineChartData = useMemo(() => 
    timeTrendData.map((d) => ({
      date: d.date,
      count: d.verificationCount,
      amount: d.verificationAmount,
    })),
    [timeTrendData]
  );

  const sortedActivities = useMemo(() => {
    const sorted = [...activityMockData];
    sorted.sort((a, b) => {
      const aVal = a[activitySortKey];
      const bVal = b[activitySortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return activitySortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return sorted;
  }, [activitySortKey, activitySortOrder]);

  const filteredAndSortedMerchants = useMemo(() => {
    let filtered = [...merchantMockData];
    if (merchantDistrictFilter !== 'all') {
      filtered = filtered.filter((m) => m.district === merchantDistrictFilter);
    }
    filtered.sort((a, b) => {
      const aVal = a[merchantSortKey];
      const bVal = b[merchantSortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return merchantSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
    return filtered;
  }, [merchantSortKey, merchantSortOrder, merchantDistrictFilter]);

  const districts = useMemo(() => 
    [...new Set(merchantMockData.map((m) => m.district))],
    []
  );

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('报表导出成功！');
    }, 1500);
  };

  const handleMetricClick = (metric: MetricType) => {
    setSelectedMetric(selectedMetric === metric ? null : metric);
  };

  const handleActivitySort = (key: keyof ActivityReportItem) => {
    if (activitySortKey === key) {
      setActivitySortOrder(activitySortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setActivitySortKey(key);
      setActivitySortOrder('desc');
    }
  };

  const handleMerchantSort = (key: keyof MerchantReportItem) => {
    if (merchantSortKey === key) {
      setMerchantSortOrder(merchantSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setMerchantSortKey(key);
      setMerchantSortOrder('desc');
    }
  };

  const toggleActivityExpand = (id: string) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatMoney = (num: number): string => {
    return '¥' + num.toLocaleString();
  };

  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
    <span className="inline-block ml-1">
      {active ? (
        order === 'asc' ? (
          <ChevronUp className="w-3 h-3 inline" />
        ) : (
          <ChevronDown className="w-3 h-3 inline" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 inline opacity-50" />
      )}
    </span>
  );

  if (isLoading && !stats) {
    return <PageLoading />;
  }

  const metricCards = [
    {
      key: 'coupons' as MetricType,
      title: '累计发券',
      value: stats?.totalCoupons || 0,
      icon: <BarChart3 className="w-5 h-5" />,
      trend: 12.5,
      trendLabel: '较上月',
      color: 'blue' as const,
    },
    {
      key: 'verification' as MetricType,
      title: '累计核销',
      value: stats?.usedCoupons || 0,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: 8.3,
      trendLabel: '较上月',
      color: 'green' as const,
    },
    {
      key: 'merchants' as MetricType,
      title: '活跃商户',
      value: stats?.activeMerchants || 0,
      icon: <Store className="w-5 h-5" />,
      trend: 5.2,
      trendLabel: '较上月',
      color: 'orange' as const,
    },
    {
      key: 'subsidy' as MetricType,
      title: '累计补贴',
      value: stats?.totalSubsidy || 0,
      prefix: '¥',
      icon: <BarChart3 className="w-5 h-5" />,
      trend: -2.1,
      trendLabel: '较上月',
      color: 'red' as const,
    },
  ];

  const dimensions: { key: DimensionType; label: string; icon: React.ReactNode }[] = [
    { key: 'activity', label: '活动维度', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'merchant', label: '商户维度', icon: <Store className="w-4 h-4" /> },
    { key: 'district', label: '区域维度', icon: <MapPin className="w-4 h-4" /> },
    { key: 'time', label: '时间维度', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">数据报表</h1>
          <p className="text-gray-500 mt-1">多维度数据分析和报表导出</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">近7天</option>
            <option value="14">近14天</option>
            <option value="30">近30天</option>
            <option value="90">近90天</option>
          </select>
          <button
            className="btn-outline flex items-center gap-2"
            onClick={() => fetchTrendData(Number(dateRange))}
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出报表
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.key}
            onClick={() => handleMetricClick(card.key)}
            className={`cursor-pointer transition-all duration-300 ${
              selectedMetric === card.key
                ? 'ring-2 ring-primary-500 ring-offset-2 scale-[1.02]'
                : 'hover:scale-[1.01]'
            }`}
          >
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              trend={card.trend}
              trendLabel={card.trendLabel}
              prefix={card.prefix}
              color={card.color}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <span>多维度分析</span>
            {selectedMetric && (
              <span className="text-sm text-primary-600 font-normal">
                当前下钻：{metricCards.find((m) => m.key === selectedMetric)?.title}
              </span>
            )}
          </div>
        </div>
        <div className="border-b border-gray-100">
          <div className="flex gap-1 px-6">
            {dimensions.map((dim) => (
              <button
                key={dim.key}
                onClick={() => setActiveDimension(dim.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                  activeDimension === dim.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {dim.icon}
                {dim.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          <div className="transition-opacity duration-300">
            {activeDimension === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">活动核销排行榜</h3>
                  <span className="text-sm text-gray-500">共 {sortedActivities.length} 个活动</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">活动名称</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                        <th 
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                          onClick={() => handleActivitySort('issuedCount')}
                        >
                          发券量
                          <SortIcon active={activitySortKey === 'issuedCount'} order={activitySortOrder} />
                        </th>
                        <th 
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                          onClick={() => handleActivitySort('usedCount')}
                        >
                          核销量
                          <SortIcon active={activitySortKey === 'usedCount'} order={activitySortOrder} />
                        </th>
                        <th 
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                          onClick={() => handleActivitySort('usageRate')}
                        >
                          核销率
                          <SortIcon active={activitySortKey === 'usageRate'} order={activitySortOrder} />
                        </th>
                        <th 
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                          onClick={() => handleActivitySort('subsidyAmount')}
                        >
                          补贴金额
                          <SortIcon active={activitySortKey === 'subsidyAmount'} order={activitySortOrder} />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedActivities.map((activity) => (
                        <>
                          <tr 
                            key={activity.id} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => toggleActivityExpand(activity.id)}
                          >
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {expandedActivity === activity.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{activity.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                                {activity.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-800">{formatNumber(activity.issuedCount)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium">{formatNumber(activity.usedCount)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className={`font-medium ${activity.usageRate >= 70 ? 'text-success-600' : activity.usageRate >= 50 ? 'text-warning-600' : 'text-danger-600'}`}>
                                {activity.usageRate.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium">{formatMoney(activity.subsidyAmount)}</td>
                          </tr>
                          {expandedActivity === activity.id && (
                            <tr key={`${activity.id}-expanded`} className="bg-gray-50">
                              <td colSpan={7} className="px-4 py-4">
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3">核销趋势</h4>
                                  <LineChart data={activity.trendData} height={200} />
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeDimension === 'merchant' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">商户核销排行</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <select
                        value={merchantDistrictFilter}
                        onChange={(e) => setMerchantDistrictFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">全部区域</option>
                        {districts.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-sm text-gray-500">共 {filteredAndSortedMerchants.length} 家商户</span>
                  </div>
                </div>

                {selectedMerchant ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{selectedMerchant.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{selectedMerchant.district}</p>
                      </div>
                      <button
                        onClick={() => setSelectedMerchant(null)}
                        className="btn-outline text-sm"
                      >
                        返回列表
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <p className="text-sm text-gray-500">核销笔数</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{formatNumber(selectedMerchant.verificationCount)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <p className="text-sm text-gray-500">核销金额</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{formatMoney(selectedMerchant.verificationAmount)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <p className="text-sm text-gray-500">补贴金额</p>
                        <p className="text-xl font-bold text-primary-600 mt-1">{formatMoney(selectedMerchant.subsidyAmount)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <p className="text-sm text-gray-500">客单价</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{formatMoney(selectedMerchant.avgOrderValue)}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">核销趋势</h5>
                      <LineChart data={trendData} height={250} />
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                            onClick={() => handleMerchantSort('name')}
                          >
                            商户名称
                            <SortIcon active={merchantSortKey === 'name'} order={merchantSortOrder} />
                          </th>
                          <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                            onClick={() => handleMerchantSort('district')}
                          >
                            所属区域
                            <SortIcon active={merchantSortKey === 'district'} order={merchantSortOrder} />
                          </th>
                          <th 
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                            onClick={() => handleMerchantSort('verificationCount')}
                          >
                            核销笔数
                            <SortIcon active={merchantSortKey === 'verificationCount'} order={merchantSortOrder} />
                          </th>
                          <th 
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                            onClick={() => handleMerchantSort('verificationAmount')}
                          >
                            核销金额
                            <SortIcon active={merchantSortKey === 'verificationAmount'} order={merchantSortOrder} />
                          </th>
                          <th 
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                            onClick={() => handleMerchantSort('subsidyAmount')}
                          >
                            补贴金额
                            <SortIcon active={merchantSortKey === 'subsidyAmount'} order={merchantSortOrder} />
                          </th>
                          <th 
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                            onClick={() => handleMerchantSort('avgOrderValue')}
                          >
                            客单价
                            <SortIcon active={merchantSortKey === 'avgOrderValue'} order={merchantSortOrder} />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAndSortedMerchants.map((merchant, index) => (
                          <tr 
                            key={merchant.id} 
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedMerchant(merchant)}
                          >
                            <td className="px-4 py-3 text-sm text-gray-500">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                index < 3 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{merchant.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{merchant.district}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium">{formatNumber(merchant.verificationCount)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-800">{formatMoney(merchant.verificationAmount)}</td>
                            <td className="px-4 py-3 text-sm text-right text-primary-600 font-medium">{formatMoney(merchant.subsidyAmount)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-800">{formatMoney(merchant.avgOrderValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeDimension === 'district' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">各行政区核销对比</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">核销金额对比</h4>
                    <BarChart data={districtBarData} height={300} color="#1E40AF" horizontal />
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">区域分布示意图</h4>
                    <div className="relative h-[300px] bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-64 h-64">
                          {districtMockData.slice(0, 6).map((district, index) => {
                            const angle = (index / 6) * 2 * Math.PI - Math.PI / 2;
                            const radius = 90;
                            const x = 128 + radius * Math.cos(angle);
                            const y = 128 + radius * Math.sin(angle);
                            const size = 40 + (district.verificationAmount / 1000000) * 30;
                            return (
                              <div
                                key={district.name}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer"
                                style={{
                                  left: `${x}px`,
                                  top: `${y}px`,
                                  width: `${size}px`,
                                  height: `${size}px`,
                                }}
                                title={`${district.name}: ${formatMoney(district.verificationAmount)}`}
                              >
                                <div className="text-center">
                                  <p className="text-xs font-medium text-gray-700 leading-tight">{district.name}</p>
                                  <p className="text-[10px] text-primary-600 font-medium">
                                    {(district.verificationAmount / 10000).toFixed(0)}万
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                        示意图（按核销金额比例展示）
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">区域名称</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">商户数</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">核销笔数</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">核销金额</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">核销率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {districtMockData.map((district) => (
                        <tr key={district.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary-500" />
                              {district.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-800">{formatNumber(district.merchantCount)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium">{formatNumber(district.verificationCount)}</td>
                          <td className="px-4 py-3 text-sm text-right text-primary-600 font-medium">{formatMoney(district.verificationAmount)}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className={`font-medium ${district.usageRate >= 70 ? 'text-success-600' : district.usageRate >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                              {district.usageRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeDimension === 'time' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">时间趋势分析</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      {(['day', 'week', 'month'] as TimeGranularity[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setTimeGranularity(g)}
                          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                            timeGranularity === g
                              ? 'bg-white text-primary-600 shadow-sm font-medium'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          {g === 'day' ? '日' : g === 'week' ? '周' : '月'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarRange className="w-4 h-4" />
                      <span>共 {timeTrendData.length} 个{timeGranularity === 'day' ? '天' : timeGranularity === 'week' ? '周' : '月'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">核销笔数</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {formatNumber(timeTrendData.reduce((sum, d) => sum + d.verificationCount, 0))}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-success-500" />
                      <span className="text-xs text-success-600 font-medium">+12.5% 同比</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">核销金额</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {formatMoney(timeTrendData.reduce((sum, d) => sum + d.verificationAmount, 0))}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-success-500" />
                      <span className="text-xs text-success-600 font-medium">+8.3% 同比</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">补贴金额</p>
                    <p className="text-xl font-bold text-primary-600 mt-1">
                      {formatMoney(timeTrendData.reduce((sum, d) => sum + d.subsidyAmount, 0))}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingDown className="w-3 h-3 text-danger-500" />
                      <span className="text-xs text-danger-600 font-medium">-2.1% 同比</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500">客单价</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {formatMoney(Math.round(
                        timeTrendData.reduce((sum, d) => sum + d.avgOrderValue, 0) / timeTrendData.length
                      ))}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-success-500" />
                      <span className="text-xs text-success-600 font-medium">+3.2% 同比</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-700">核销趋势</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-success-500"></span>
                        <span>环比 +5.2%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-primary-500"></span>
                        <span>同比 +12.5%</span>
                      </div>
                    </div>
                  </div>
                  <LineChart data={lineChartData} height={300} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">补贴金额趋势</h4>
                    <BarChart
                      data={timeTrendData.map((d) => ({ name: d.date, value: d.subsidyAmount }))}
                      height={250}
                      color="#10B981"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">客单价趋势</h4>
                    <BarChart
                      data={timeTrendData.map((d) => ({ name: d.date, value: d.avgOrderValue }))}
                      height={250}
                      color="#F97316"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">行业分类分布</div>
          <div className="card-body">
            <PieChart data={categoryData} height={300} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">核销渠道分布</div>
          <div className="card-body">
            <PieChart
              data={terminalData}
              height={300}
              colors={['#1E40AF', '#F97316', '#10B981']}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">核心指标汇总</div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">指标</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">今日</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">本周</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">本月</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">累计</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">环比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: '核销笔数', today: 1256, week: 8956, month: 35680, total: 125680, trend: 12.5 },
                  { name: '核销金额(元)', today: 28560, week: 198560, month: 856000, total: 3256800, trend: 8.3 },
                  { name: '优惠金额(元)', today: 5720, week: 39850, month: 175200, total: 652400, trend: -2.1 },
                  { name: '客单价(元)', today: 22.74, week: 22.17, month: 23.98, total: 25.91, trend: 3.2 },
                  { name: '活跃用户', today: 1156, week: 6890, month: 25680, total: 89560, trend: 6.7 },
                  { name: '核销率', today: '68.2%', week: '65.8%', month: '63.5%', total: '65.1%', trend: 2.1 },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">{row.today}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">{row.week}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-800">{row.month}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">{row.total}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={`font-medium ${
                          (row.trend as number) >= 0 ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        {(row.trend as number) >= 0 ? '+' : ''}
                        {row.trend}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
