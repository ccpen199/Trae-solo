import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  Activity,
  Coins,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Award,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  MessageSquare,
  Crown,
  Star,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useAdminStore } from '@/stores/useAdminStore';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import { mockBaoliaos } from '@/data/mockBaoliaos';
import { mockUsers } from '@/data/mockUsers';
import { mockActivities } from '@/data/mockActivities';
import { mockCircles } from '@/data/mockCircles';
import { huizhouDistricts } from '@/utils/location';
import { cn } from '@/lib/utils';

const timeRangeOptions = [
  { value: '7', label: '近7天' },
  { value: '30', label: '近30天' },
  { value: '90', label: '近90天' },
];

const categoryColors: Record<string, string> = {
  traffic: '#3b82f6',
  environment: '#22c55e',
  facility: '#f59e0b',
  livelihood: '#8b5cf6',
  emergency: '#ef4444',
  other: '#6b7280',
};

const categoryNames: Record<string, string> = {
  traffic: '交通出行',
  environment: '环境保护',
  facility: '市政设施',
  livelihood: '民生服务',
  emergency: '突发事件',
  other: '其他建议',
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, change, icon: Icon, color, subtitle }: StatCardProps) {
  const isPositive = change && change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50 hover:border-neutral-600 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-neutral-400 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-neutral-500 text-sm">较上月</span>
            </div>
          )}
          {subtitle && (
            <p className="text-neutral-500 text-xs mt-2">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            color
          )}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-neutral-800/50 rounded-2xl p-6 border border-neutral-700/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-neutral-700 rounded w-24" />
          <div className="h-8 bg-neutral-700 rounded w-32 mt-3" />
          <div className="h-4 bg-neutral-700 rounded w-20 mt-3" />
        </div>
        <div className="w-14 h-14 rounded-xl bg-neutral-700" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-neutral-800/50 rounded-2xl p-6 border border-neutral-700/50 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-neutral-700 rounded w-32" />
        <div className="h-8 bg-neutral-700 rounded w-24" />
      </div>
      <div className="h-72 bg-neutral-700/50 rounded-xl" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-neutral-800/30 rounded-xl animate-pulse">
          <div className="w-10 h-10 rounded-full bg-neutral-700" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-neutral-700 rounded w-1/2" />
          </div>
          <div className="w-12 h-4 bg-neutral-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Stats() {
  const { fetchDailyStats, dailyStats, fetchHeatmapData, heatmapData } = useAdminStore();
  const { fetchBaoliaos, baoliaos } = useBaoliaoStore();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'circles' | 'baoliaos'>('users');
  const [sortField, setSortField] = useState<'views' | 'likes' | 'comments'>('views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDailyStats(parseInt(timeRange)),
        fetchHeatmapData(),
        fetchBaoliaos(),
      ]);
      setTimeout(() => setLoading(false), 500);
    };

    loadData();
  }, [fetchDailyStats, fetchHeatmapData, fetchBaoliaos, timeRange]);

  const userGrowthOption = useMemo(() => {
    if (dailyStats.length === 0) return {};

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
      },
      legend: {
        data: ['新增用户', '活跃用户'],
        textStyle: { color: '#999' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dailyStats.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#999', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999', fontSize: 11 },
      },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: dailyStats.map((d) => d.userCount),
          lineStyle: { color: '#0ea5e9', width: 3 },
          itemStyle: { color: '#0ea5e9' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(14, 165, 233, 0.4)' },
                { offset: 1, color: 'rgba(14, 165, 233, 0)' },
              ],
            },
          },
          animationDuration: 2000,
        },
        {
          name: '活跃用户',
          type: 'line',
          smooth: true,
          data: dailyStats.map((d) => Math.floor(d.userCount * 2.5)),
          lineStyle: { color: '#22c55e', width: 3 },
          itemStyle: { color: '#22c55e' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
                { offset: 1, color: 'rgba(34, 197, 94, 0)' },
              ],
            },
          },
          animationDuration: 2000,
          animationDelay: 300,
        },
      ],
    };
  }, [dailyStats]);

  const baoliaoTrendOption = useMemo(() => {
    if (dailyStats.length === 0) return {};

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dailyStats.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#999', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999', fontSize: 11 },
      },
      series: [
        {
          name: '爆料数',
          type: 'bar',
          data: dailyStats.map((d) => d.baoliaoCount),
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#8b5cf6' },
                { offset: 1, color: '#6366f1' },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '50%',
          animationDuration: 2000,
          animationDelay: (idx: number) => idx * 50,
        },
      ],
    };
  }, [dailyStats]);

  const sentimentTrendOption = useMemo(() => {
    if (dailyStats.length === 0) return {};

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
      },
      legend: {
        data: ['正面', '中性', '负面'],
        textStyle: { color: '#999' },
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dailyStats.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#999', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        max: 1,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999', fontSize: 11, formatter: '{value}%' },
      },
      series: [
        {
          name: '正面',
          type: 'line',
          stack: 'Total',
          areaStyle: { color: 'rgba(34, 197, 94, 0.5)' },
          lineStyle: { color: '#22c55e', width: 0 },
          showSymbol: false,
          data: dailyStats.map((d) => d.positiveRate),
          animationDuration: 2000,
        },
        {
          name: '中性',
          type: 'line',
          stack: 'Total',
          areaStyle: { color: 'rgba(234, 179, 8, 0.5)' },
          lineStyle: { color: '#eab308', width: 0 },
          showSymbol: false,
          data: dailyStats.map((d) => 0.4 + Math.random() * 0.2),
          animationDuration: 2000,
        },
        {
          name: '负面',
          type: 'line',
          stack: 'Total',
          areaStyle: { color: 'rgba(239, 68, 68, 0.5)' },
          lineStyle: { color: '#ef4444', width: 0 },
          showSymbol: false,
          data: dailyStats.map((d) => 1 - d.positiveRate - 0.4),
          animationDuration: 2000,
        },
      ],
    };
  }, [dailyStats]);

  const categoryPieOption = useMemo(() => {
    const stats = mockBaoliaos.reduce((acc, b) => {
      acc[b.category] = (acc[b.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#999', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
      },
      series: [
        {
          name: '爆料分类',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#1f1f1f',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          },
          labelLine: { show: false },
          data: Object.entries(stats).map(([key, value]) => ({
            value,
            name: categoryNames[key] || key,
            itemStyle: { color: categoryColors[key] },
          })),
          animationDuration: 2000,
        },
      ],
    };
  }, []);

  const regionDistributionOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#999', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
      },
      series: [
        {
          name: '用户分布',
          type: 'pie',
          radius: ['30%', '60%'],
          center: ['35%', '50%'],
          itemStyle: {
            borderRadius: 4,
            borderColor: '#1f1f1f',
            borderWidth: 2,
          },
          label: { show: false },
          data: huizhouDistricts.map((d) => ({
            value: Math.floor(Math.random() * 2000) + 500,
            name: d.name,
          })),
          animationDuration: 2000,
        },
      ],
    };
  }, []);

  const activityParticipationOption = useMemo(() => {
    const categories = ['摄影', '亲子', '美食', '户外', '运动', '文化'];
    const data = categories.map(() => Math.floor(Math.random() * 500) + 100);

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderColor: '#444',
        textStyle: { color: '#fff' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#555' } },
        axisLabel: { color: '#999', fontSize: 11, rotate: 0 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#333' } },
        axisLabel: { color: '#999', fontSize: 11 },
      },
      series: [
        {
          name: '参与人次',
          type: 'bar',
          data,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#f59e0b' },
                { offset: 1, color: '#ef4444' },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
          barWidth: '50%',
          animationDuration: 2000,
          animationDelay: (idx: number) => idx * 80,
        },
      ],
    };
  }, []);

  const topUsers = useMemo(() => {
    return mockUsers
      .map((user) => ({
        ...user,
        baoliaoCount: mockBaoliaos.filter((b) => b.userId === user.id).length,
        activityCount: Math.floor(Math.random() * 10),
        score: Math.floor(Math.random() * 1000),
      }))
      .sort((a, b) => b.baoliaoCount + b.activityCount - a.baoliaoCount - a.activityCount)
      .slice(0, 10);
  }, []);

  const topCircles = useMemo(() => {
    return [...mockCircles]
      .sort((a, b) => b.postCount + b.memberCount - a.postCount - a.memberCount)
      .slice(0, 10);
  }, []);

  const topBaoliaos = useMemo(() => {
    const sorted = [...mockBaoliaos].sort((a, b) => {
      if (sortField === 'views') return b.views - a.views;
      if (sortField === 'likes') return b.likes - a.likes;
      return b.comments - a.comments;
    });
    return sortOrder === 'desc' ? sorted.slice(0, 10) : sorted.slice(-10).reverse();
  }, [sortField, sortOrder]);

  const handleSort = (field: 'views' | 'likes' | 'comments') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'views' | 'likes' | 'comments' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'desc' ? (
      <ChevronDown className="w-4 h-4 inline" />
    ) : (
      <ChevronUp className="w-4 h-4 inline" />
    );
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchDailyStats(parseInt(timeRange)),
      fetchHeatmapData(),
    ]);
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-[1800px] mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">数据统计</h1>
              <p className="text-neutral-400 mt-1">多维度数据分析，助力运营决策</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <Select
                  options={timeRangeOptions}
                  value={timeRange}
                  onChange={setTimeRange}
                  size="md"
                  className="w-32 bg-neutral-700/50 border-neutral-600"
                />
              </div>
              <Button variant="outline" size="md" onClick={handleRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
                刷新
              </Button>
              <Button variant="secondary" size="md" onClick={() => setShowExportModal(true)} leftIcon={<Download className="w-4 h-4" />}>
                导出报表
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  title="总用户数"
                  value="12,856"
                  change={12.5}
                  icon={Users}
                  color="bg-gradient-to-br from-sky-500 to-sky-600"
                  subtitle="今日活跃: 1,234 | 本月新增: 456"
                />
                <StatCard
                  title="总爆料数"
                  value="3,428"
                  change={8.3}
                  icon={FileText}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  subtitle="今日发布: 28 | 审核通过率: 92.5%"
                />
                <StatCard
                  title="总活动数"
                  value="156"
                  change={15.2}
                  icon={Activity}
                  color="bg-gradient-to-br from-amber-500 to-amber-600"
                  subtitle="进行中: 23 | 参与人次: 8,567"
                />
                <StatCard
                  title="总积分发放"
                  value="256,890"
                  change={-2.4}
                  icon={Coins}
                  color="bg-gradient-to-br from-violet-500 to-violet-600"
                  subtitle="已消耗: 123,456 | 公益捐赠: 45,678"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {loading ? (
              <>
                <SkeletonChart />
                <SkeletonChart />
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-400" />
                    用户增长趋势
                  </h3>
                  <ReactECharts
                    option={userGrowthOption}
                    style={{ height: '280px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-400" />
                    爆料发布趋势
                  </h3>
                  <ReactECharts
                    option={baoliaoTrendOption}
                    style={{ height: '280px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>
              </>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50 mb-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              情感倾向趋势
            </h3>
            {loading ? (
              <div className="h-64 bg-neutral-700/50 rounded-xl animate-pulse" />
            ) : (
              <ReactECharts
                option={sentimentTrendOption}
                style={{ height: '280px' }}
                opts={{ renderer: 'canvas' }}
              />
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonChart key={i} />)
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">爆料分类占比</h3>
                  <ReactECharts
                    option={categoryPieOption}
                    style={{ height: '280px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">用户区域分布</h3>
                  <ReactECharts
                    option={regionDistributionOption}
                    style={{ height: '280px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">活动分类参与度</h3>
                  <ReactECharts
                    option={activityParticipationOption}
                    style={{ height: '280px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>
              </>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                排行榜
              </h3>
              <div className="flex bg-neutral-700/50 rounded-lg p-1">
                {[
                  { key: 'users', label: '活跃用户', icon: Users },
                  { key: 'circles', label: '热门圈子', icon: Star },
                  { key: 'baoliaos', label: '热门爆料', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as typeof activeTab)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                        activeTab === tab.key
                          ? 'bg-westlake-500 text-white'
                          : 'text-neutral-400 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === 'users' && (
              <div>
                {loading ? (
                  <SkeletonList />
                ) : (
                  <div className="space-y-2">
                    {topUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-neutral-800/30 rounded-xl hover:bg-neutral-700/30 transition-colors"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-neutral-300 to-neutral-400 text-neutral-800' :
                            index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
                            'bg-neutral-700 text-neutral-300'
                          )}
                        >
                          {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-westlake-400 to-westlake-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {user.nickname.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{user.nickname}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {user.baoliaoCount} 条爆料
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {user.activityCount} 次活动
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3" /> {user.score} 积分
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{user.level}级</p>
                          <p className="text-xs text-neutral-500">{user.points} 积分</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'circles' && (
              <div>
                {loading ? (
                  <SkeletonList />
                ) : (
                  <div className="space-y-2">
                    {topCircles.map((circle, index) => (
                      <motion.div
                        key={circle.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-neutral-800/30 rounded-xl hover:bg-neutral-700/30 transition-colors"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-neutral-300 to-neutral-400 text-neutral-800' :
                            index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
                            'bg-neutral-700 text-neutral-300'
                          )}
                        >
                          {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={circle.coverImage} alt={circle.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">{circle.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {circle.memberCount} 成员
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {circle.postCount} 帖子
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {circle.activityCount} 活动
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-neutral-700/50 text-xs text-neutral-400">
                          {circle.categoryName}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'baoliaos' && (
              <div>
                <div className="flex items-center gap-4 mb-4 px-4">
                  <span className="text-neutral-400 text-sm">排序:</span>
                  {[
                    { key: 'views', label: '浏览量', icon: Eye },
                    { key: 'likes', label: '点赞数', icon: Heart },
                    { key: 'comments', label: '评论数', icon: MessageSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleSort(item.key as 'views' | 'likes' | 'comments')}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors',
                          sortField === item.key
                            ? 'bg-westlake-500/20 text-westlake-400'
                            : 'text-neutral-400 hover:text-white'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                        <SortIcon field={item.key as 'views' | 'likes' | 'comments'} />
                      </button>
                    );
                  })}
                </div>
                {loading ? (
                  <SkeletonList />
                ) : (
                  <div className="space-y-2">
                    {topBaoliaos.map((baoliao, index) => (
                      <motion.div
                        key={baoliao.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + index * 0.05 }}
                        className="flex items-center gap-4 p-4 bg-neutral-800/30 rounded-xl hover:bg-neutral-700/30 transition-colors cursor-pointer"
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-neutral-300 to-neutral-400 text-neutral-800' :
                            index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
                            'bg-neutral-700 text-neutral-300'
                          )}
                        >
                          {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium line-clamp-1">{baoliao.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {baoliao.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {baoliao.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {baoliao.comments}
                            </span>
                            <span className="px-2 py-0.5 rounded-full" style={{
                              backgroundColor: `${categoryColors[baoliao.category]}20`,
                              color: categoryColors[baoliao.category],
                            }}>
                              {baoliao.categoryName}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-neutral-500">{baoliao.user.nickname}</p>
                          <p className="text-neutral-600 mt-1">
                            {new Date(baoliao.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出数据报表"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-neutral-400">选择需要导出的数据类型和格式：</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-neutral-600 text-westlake-500" defaultChecked />
              <span className="text-white">用户数据统计</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-neutral-600 text-westlake-500" defaultChecked />
              <span className="text-white">爆料数据统计</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-neutral-600 text-westlake-500" defaultChecked />
              <span className="text-white">活动数据统计</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-neutral-700/30 rounded-lg cursor-pointer hover:bg-neutral-700/50 transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded border-neutral-600 text-westlake-500" />
              <span className="text-white">排行榜数据</span>
            </label>
          </div>
          <div className="mt-4">
            <label className="text-neutral-400 text-sm font-medium mb-2 block">导出格式</label>
            <div className="flex gap-3">
              <button className="flex-1 py-2 px-4 rounded-lg bg-westlake-500/20 border border-westlake-500/30 text-westlake-400 font-medium">
                Excel (.xlsx)
              </button>
              <button className="flex-1 py-2 px-4 rounded-lg bg-neutral-700/50 border border-neutral-600 text-neutral-400 font-medium hover:bg-neutral-700 transition-colors">
                CSV (.csv)
              </button>
              <button className="flex-1 py-2 px-4 rounded-lg bg-neutral-700/50 border border-neutral-600 text-neutral-400 font-medium hover:bg-neutral-700 transition-colors">
                PDF (.pdf)
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowExportModal(false)}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowExportModal(false);
              alert('报表已开始导出，请稍后查看下载文件。');
            }}
          >
            确认导出
          </Button>
        </div>
      </Modal>
    </div>
  );
}
