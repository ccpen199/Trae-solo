import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Store, Users, Clock, Send, MapPin,
  TrendingUp, TrendingDown, RefreshCw, ChevronDown,
  CheckCircle, AlertCircle, ShoppingBag, ClipboardCheck,
  Bell
} from 'lucide-react';
import { dashboardStats, adminOrders, auditRecords, adminMerchants } from '@/data';
import { HotCategoriesChart, UpdateTrendChart } from '@/components/dashboard/Charts';
import TownshipHeatMap from '@/components/dashboard/HeatMap';

type TimeRange = '今日' | '本周' | '本月';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  trend?: number;
  suffix?: string;
}

function StatCard({ label, value, icon, colorClass, bgClass, borderClass, trend, suffix }: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`bg-white rounded-xl p-5 border ${borderClass} shadow-sm card-hover`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-rock-500">{label}</p>
          <p className={`text-3xl font-bold mt-2 font-number ${colorClass}`}>
            {typeof value === 'number' ? formatNumber(value) : value}
            {suffix && <span className="text-lg ml-1">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-jade-500" />
                  <span className="text-xs text-jade-600 font-medium">+{trend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-ember-500" />
                  <span className="text-xs text-ember-600 font-medium">{trend}%</span>
                </>
              )}
              <span className="text-xs text-rock-400">较上周</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgClass}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function TownshipBarChart() {
  const sortedTownships = useMemo(() =>
    [...dashboardStats.activeTownships].sort((a, b) => b.activeUsers - a.activeUsers),
    []
  );
  const maxUsers = Math.max(...sortedTownships.map(t => t.activeUsers));

  return (
    <div className="space-y-3">
      {sortedTownships.map((township, idx) => {
        const width = (township.activeUsers / maxUsers) * 100;
        return (
          <div key={township.name} className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              idx < 3 ? 'bg-jade-500 text-white' : 'bg-rock-100 text-rock-600'
            }`}>
              {idx + 1}
            </span>
            <span className="w-20 text-sm text-rock-700 flex-shrink-0 truncate">{township.name}</span>
            <div className="flex-1 h-7 bg-rock-50 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-jade-400 to-jade-600 transition-all duration-500"
                style={{ width: `${width}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-number font-medium text-rock-700">
                {formatNumber(township.activeUsers)}
              </span>
            </div>
            <span className="w-14 text-xs text-rock-500 text-right font-number">
              {township.postCount}帖
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ActivityItem {
  id: string;
  time: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  description: string;
  tag: string;
  tagColor: string;
}

export default function AdminOverview() {
  const [timeRange, setTimeRange] = useState<TimeRange>('今日');
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);

  const pendingAuditCount = useMemo(() =>
    auditRecords.filter(r => r.status === '待审核').length,
    []
  );

  const todayPosts = useMemo(() => {
    const lastDay = dashboardStats.updateFrequency[dashboardStats.updateFrequency.length - 1];
    return lastDay ? lastDay.jobs + lastDay.housing + lastDay.food + lastDay.dating : 0;
  }, []);

  const sortedTownships = useMemo(() =>
    [...dashboardStats.activeTownships].sort((a, b) => b.activeUsers - a.activeUsers),
    []
  );

  const merchantCountByTownship = useMemo(() => {
    const map: Record<string, number> = {};
    adminMerchants.forEach(m => {
      map[m.township] = (map[m.township] || 0) + 1;
    });
    return map;
  }, []);

  const recentActivities = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    auditRecords.slice(0, 4).forEach(record => {
      const isPassed = record.status.includes('通过');
      const isPending = record.status === '待审核';
      activities.push({
        id: `audit-${record.id}`,
        time: record.submittedAt,
        icon: isPending ? <Clock className="w-4 h-4" /> : isPassed ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />,
        iconBg: isPending ? 'bg-amber-50' : isPassed ? 'bg-jade-50' : 'bg-ember-50',
        iconColor: isPending ? 'text-amber-500' : isPassed ? 'text-jade-600' : 'text-ember-500',
        description: `${record.submitter} 提交「${record.title}」`,
        tag: record.status,
        tagColor: isPending ? 'bg-amber-50 text-amber-700 border-amber-200' : isPassed ? 'bg-jade-50 text-jade-700 border-jade-200' : 'bg-ember-50 text-ember-700 border-ember-200'
      });
    });

    adminOrders.slice(0, 2).forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        time: order.createdAt,
        icon: <ClipboardCheck className="w-4 h-4" />,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        description: `${order.publisher.name} 发布「${order.title}」`,
        tag: order.status,
        tagColor: order.status === '已发布' ? 'bg-jade-50 text-jade-700 border-jade-200' : order.status === '待审核' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rock-50 text-rock-600 border-rock-200'
      });
    });

    adminMerchants.slice(0, 2).forEach(merchant => {
      const isVerified = merchant.verified;
      activities.push({
        id: `merchant-${merchant.id}`,
        time: merchant.registerTime,
        icon: <ShoppingBag className="w-4 h-4" />,
        iconBg: isVerified ? 'bg-jade-50' : 'bg-rock-100',
        iconColor: isVerified ? 'text-jade-600' : 'text-rock-500',
        description: `商户「${merchant.name}」${isVerified ? '入驻认证' : '提交申请'}`,
        tag: merchant.qualificationStatus,
        tagColor: merchant.qualificationStatus === '已通过' ? 'bg-jade-50 text-jade-700 border-jade-200' : merchant.qualificationStatus === '待审核' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rock-50 text-rock-600 border-rock-200'
      });
    });

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, []);

  const now = new Date();
  const updateTime = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const timeRanges: TimeRange[] = ['今日', '本周', '本月'];

  return (
    <div className="min-h-screen bg-rock-50 pb-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-rock-900">运营数据看板</h1>
            <p className="text-sm text-rock-500 mt-1 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              数据更新时间：{updateTime}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-rock-200 rounded-lg text-sm text-rock-700 hover:bg-rock-50 transition-colors"
            >
              <span>{timeRange}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showRangeDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showRangeDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-rock-200 rounded-lg shadow-lg py-1 z-20 min-w-[100px]">
                {timeRanges.map(range => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range);
                      setShowRangeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-rock-50 ${
                      timeRange === range ? 'text-jade-600 font-medium bg-jade-50' : 'text-rock-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="信息总量"
            value={dashboardStats.totalPosts}
            icon={<FileText className="w-6 h-6 text-jade-600" />}
            colorClass="text-jade-600"
            bgClass="bg-jade-50"
            borderClass="border-jade-100"
            trend={8}
          />
          <StatCard
            label="入驻商户"
            value={dashboardStats.totalMerchants}
            icon={<Store className="w-6 h-6 text-ember-600" />}
            colorClass="text-ember-600"
            bgClass="bg-ember-50"
            borderClass="border-ember-100"
            trend={5}
          />
          <StatCard
            label="注册用户"
            value={dashboardStats.totalUsers}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            colorClass="text-blue-600"
            bgClass="bg-blue-50"
            borderClass="border-blue-100"
            trend={12}
          />
          <StatCard
            label="待审核数"
            value={pendingAuditCount}
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            colorClass="text-amber-600"
            bgClass="bg-amber-50"
            borderClass="border-amber-100"
            trend={-3}
          />
          <StatCard
            label="今日发布"
            value={todayPosts}
            icon={<Send className="w-6 h-6 text-purple-600" />}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
            borderClass="border-purple-100"
            trend={15}
          />
          <StatCard
            label="乡镇覆盖率"
            value="27/30"
            icon={<MapPin className="w-6 h-6 text-jade-600" />}
            colorClass="text-jade-600"
            bgClass="bg-jade-50"
            borderClass="border-jade-100"
            suffix="(90%)"
          />
        </div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-5 border border-rock-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-rock-900">热门板块 TOP 8</h2>
            <span className="text-xs text-rock-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-jade-500" />
              实时数据
            </span>
          </div>
          <HotCategoriesChart theme="light" />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-5 border border-rock-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg font-semibold text-rock-900">用户活跃乡镇 TOP 10</h2>
            <span className="text-xs text-rock-400">按活跃用户数排序</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <TownshipBarChart />
            </div>
            <div className="bg-rock-50 rounded-xl p-4">
              <TownshipHeatMap theme="light" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-5 border border-rock-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-rock-900">分类信息更新频次</h2>
            <span className="text-xs text-rock-400">近20天趋势</span>
          </div>
          <UpdateTrendChart />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-5 border border-rock-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-rock-900">乡镇信息覆盖与分发</h2>
            <span className="text-xs text-rock-400">共 {sortedTownships.length} 个乡镇</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rock-100">
                  <th className="text-left py-3 px-3 text-xs font-medium text-rock-500">乡镇名称</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-rock-500">活跃用户</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-rock-500">信息发布量</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-rock-500">商户数量</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-rock-500 min-w-[140px]">覆盖率</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-rock-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {sortedTownships.map((township, idx) => {
                  const coverage = Math.min(100, 50 + Math.floor(Math.random() * 50));
                  const merchantCount = merchantCountByTownship[township.name] || Math.floor(Math.random() * 8) + 1;
                  const isGood = coverage >= 70;
                  return (
                    <tr key={township.name} className={`border-b border-rock-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-rock-50/30'}`}>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                            idx < 3 ? 'bg-jade-500 text-white' : 'bg-rock-100 text-rock-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-rock-800">{township.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-number text-sm text-rock-700">
                        {formatNumber(township.activeUsers)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-number text-sm text-rock-700">
                        {formatNumber(township.postCount)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-number text-sm text-rock-700">
                        {merchantCount}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-rock-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-jade-400 to-jade-600 transition-all"
                              style={{ width: `${coverage}%` }}
                            />
                          </div>
                          <span className="text-xs font-number font-medium text-rock-600 w-10 text-right">
                            {coverage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          isGood
                            ? 'bg-jade-50 text-jade-700 border-jade-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isGood ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {isGood ? '覆盖良好' : '待加强'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl p-5 border border-rock-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-rock-900">最近运营动态</h2>
            <span className="text-xs text-rock-400 flex items-center gap-1">
              <Bell className="w-3.5 h-3.5" />
              实时更新
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-[17px] top-2 bottom-2 w-px bg-rock-100" />
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center ${activity.iconBg} ${activity.iconColor} flex-shrink-0`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-rock-700 line-clamp-2">{activity.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${activity.tagColor}`}>
                        {activity.tag}
                      </span>
                    </div>
                    <p className="text-xs text-rock-400 mt-1">{formatDateTime(activity.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
