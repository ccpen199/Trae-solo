import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Eye,
  Map,
  BarChart3,
  UserCog,
  Activity,
  Zap,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/stores/useAdminStore';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { mockBaoliaos } from '@/data/mockBaoliaos';
import { mockActivities } from '@/data/mockActivities';
import { cn } from '@/lib/utils';
import type { Baoliao } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon, color }: StatCardProps) {
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
                {Math.abs(change)}%
              </span>
              <span className="text-neutral-500 text-sm">{changeLabel || '较昨日'}</span>
            </div>
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
      <div className="h-6 bg-neutral-700 rounded w-32 mb-4" />
      <div className="h-64 bg-neutral-700/50 rounded-xl" />
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-neutral-800/30 rounded-xl animate-pulse">
          <div className="w-10 h-10 rounded-full bg-neutral-700" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-neutral-700 rounded w-1/2" />
          </div>
          <div className="w-16 h-6 bg-neutral-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { fetchDailyStats, dailyStats } = useAdminStore();
  const { fetchPendingBaoliaos, pendingBaoliaos } = useBaoliaoStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBaoliaos: 0,
    activeUsers: 0,
    weekActiveUsers: 0,
    pendingCount: 0,
    newUsers: 0,
    ongoingActivities: 0,
    bookings: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDailyStats(30),
        fetchPendingBaoliaos(),
      ]);

      const today = new Date().toDateString();
      const todayBaoliaos = mockBaoliaos.filter(
        (b) => new Date(b.createdAt).toDateString() === today
      ).length;
      const yesterdayBaoliaos = mockBaoliaos.filter((b) => {
        const date = new Date(b.createdAt);
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return date.toDateString() === y.toDateString();
      }).length;

      setStats({
        todayBaoliaos,
        activeUsers: 128,
        weekActiveUsers: 856,
        pendingCount: pendingBaoliaos.length,
        newUsers: 12,
        ongoingActivities: mockActivities.filter((a) => a.status === 'ongoing').length,
        bookings: 36,
      });

      setTimeout(() => setLoading(false), 500);
    };

    loadData();
  }, [fetchDailyStats, fetchPendingBaoliaos, pendingBaoliaos.length]);

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    count: Math.floor(Math.random() * 15) + 2,
  }));

  const trendChartOption = {
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
      boundaryGap: false,
      data: hourlyData.map((d) => d.hour),
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
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: hourlyData.map((d) => d.count),
        lineStyle: { color: '#0ea5e9', width: 3 },
        itemStyle: { color: '#0ea5e9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(14, 165, 233, 0.4)' },
              { offset: 1, color: 'rgba(14, 165, 233, 0)' },
            ],
          },
        },
        animationDuration: 2000,
        animationEasing: 'cubicOut',
      },
    ],
  };

  const categoryStats = mockBaoliaos.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartOption = {
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
        radius: ['45%', '70%'],
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
        data: Object.entries(categoryStats).map(([key, value]) => ({
          value,
          name: categoryNames[key] || key,
          itemStyle: { color: categoryColors[key] },
        })),
        animationDuration: 2000,
        animationEasing: 'cubicOut',
      },
    ],
  };

  const hotEvents: Array<{
    id: string;
    title: string;
    heat: number;
    trend: 'up' | 'down' | 'stable';
    category: string;
  }> = [
    { id: '1', title: '双月湾旅游旺季交通拥堵问题', heat: 9856, trend: 'up', category: 'traffic' },
    { id: '2', title: '罗浮山景区垃圾分类设施不完善', heat: 7623, trend: 'up', category: 'environment' },
    { id: '3', title: '南昆山道路山体滑坡风险预警', heat: 6789, trend: 'down', category: 'emergency' },
    { id: '4', title: 'TCL产业园周边空气污染问题', heat: 5432, trend: 'up', category: 'environment' },
    { id: '5', title: '水东街改造完成夜景超美', heat: 4567, trend: 'stable', category: 'livelihood' },
  ];

  const quickActions = [
    { label: '爆料审核', icon: FileText, path: '/admin/review', color: 'bg-sky-500' },
    { label: '舆情热力图', icon: Map, path: '/admin/heatmap', color: 'bg-emerald-500' },
    { label: '数据统计', icon: BarChart3, path: '/admin/statistics', color: 'bg-amber-500' },
    { label: '用户管理', icon: UserCog, path: '/admin/users', color: 'bg-rose-500' },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-[1600px] mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">数据看板</h1>
            <p className="text-neutral-400 mt-1">欢迎回来，实时掌握平台运营动态</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  title="今日爆料数"
                  value={stats.todayBaoliaos}
                  change={12.5}
                  icon={FileText}
                  color="bg-gradient-to-br from-sky-500 to-sky-600"
                />
                <StatCard
                  title="活跃用户数"
                  value={`${stats.activeUsers}/${stats.weekActiveUsers}`}
                  changeLabel="今日/本周"
                  icon={Users}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                  title="待审核爆料"
                  value={stats.pendingCount}
                  change={-8.3}
                  icon={Clock}
                  color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
                <StatCard
                  title="新增用户数"
                  value={stats.newUsers}
                  change={25}
                  icon={UserCog}
                  color="bg-gradient-to-br from-violet-500 to-violet-600"
                />
                <StatCard
                  title="活动进行中"
                  value={stats.ongoingActivities}
                  icon={Activity}
                  color="bg-gradient-to-br from-rose-500 to-rose-600"
                />
                <StatCard
                  title="政务预约数"
                  value={stats.bookings}
                  change={5.2}
                  icon={Calendar}
                  color="bg-gradient-to-br from-cyan-500 to-cyan-600"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              {loading ? (
                <SkeletonChart />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      今日数据趋势
                    </h3>
                    <span className="text-sm text-neutral-400">24小时内爆料发布趋势</span>
                  </div>
                  <ReactECharts
                    option={trendChartOption}
                    style={{ height: '320px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>
              )}
            </div>

            <div>
              {loading ? (
                <SkeletonChart />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">爆料分类统计</h3>
                  <ReactECharts
                    option={pieChartOption}
                    style={{ height: '320px' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </motion.div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    热点事件预警
                  </h3>
                  <button
                    onClick={() => navigate('/admin/review')}
                    className="text-sm text-westlake-400 hover:text-westlake-300 flex items-center gap-1 transition-colors"
                  >
                    查看全部 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {loading ? (
                  <SkeletonList />
                ) : (
                  <div className="space-y-3">
                    {hotEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-neutral-800/30 rounded-xl hover:bg-neutral-700/30 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/admin/review`)}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                            index === 0
                              ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                              : index === 1
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                              : index === 2
                              ? 'bg-gradient-to-br from-sky-500 to-sky-600 text-white'
                              : 'bg-neutral-700 text-neutral-300'
                          )}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate group-hover:text-westlake-400 transition-colors">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${categoryColors[event.category]}20`,
                                color: categoryColors[event.category],
                              }}
                            >
                              {categoryNames[event.category]}
                            </span>
                            <span className="text-neutral-500 text-sm flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {event.heat.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.trend === 'up' && (
                            <span className="text-rose-400 flex items-center gap-1 text-sm">
                              <TrendingUp className="w-4 h-4" /> 上升
                            </span>
                          )}
                          {event.trend === 'down' && (
                            <span className="text-emerald-400 flex items-center gap-1 text-sm">
                              <TrendingDown className="w-4 h-4" /> 下降
                            </span>
                          )}
                          {event.trend === 'stable' && (
                            <span className="text-neutral-400 flex items-center gap-1 text-sm">
                              <Minus className="w-4 h-4" /> 平稳
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-6">快捷操作</h3>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.path}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        onClick={() => navigate(action.path)}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl bg-neutral-700/30 hover:bg-neutral-700/50 transition-all duration-200 group"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform',
                            action.color
                          )}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-white font-medium">{action.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-700/50">
                  <h4 className="text-sm font-medium text-neutral-400 mb-4">审核状态概览</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-neutral-300 text-sm">已通过</span>
                      </div>
                      <span className="text-white font-medium">
                        {mockBaoliaos.filter((b) => b.status === 'approved').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-neutral-300 text-sm">待审核</span>
                      </div>
                      <span className="text-white font-medium">
                        {mockBaoliaos.filter((b) => b.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-neutral-300 text-sm">已拒绝</span>
                      </div>
                      <span className="text-white font-medium">
                        {mockBaoliaos.filter((b) => b.status === 'rejected').length}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function Minus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
