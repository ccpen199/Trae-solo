import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Gauge,
  Wallet,
  ClipboardList,
  AlertTriangle,
  Zap,
  Wrench,
  CreditCard,
  MapPin,
  Clock,
  ChevronRight,
  User,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { cn } from '@/lib/utils';

interface DashboardStats {
  total_users: number;
  today_readings: number;
  total_payment: number;
  pending_orders: number;
  active_warnings: number;
  active_meters: number;
  unpaid_bills: number;
  today_orders: number;
  updated_at: string;
}

interface TrendDataPoint {
  date: string;
  count?: number;
  consumption?: number;
  amount?: number;
}

interface TrendData {
  days: number;
  readings: TrendDataPoint[];
  orders: TrendDataPoint[];
  payments: TrendDataPoint[];
}

interface WarningEvent {
  id: string;
  user_id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  trigger_rule: string;
  detected_at: string;
  status: string;
  user_name?: string;
  account_no?: string;
  address?: string;
}

interface OrderStatusStat {
  status: string;
  count: number;
}

const severityColors: Record<string, { bar: string; bg: string; text: string; dot: string }> = {
  critical: {
    bar: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  warning: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  info: {
    bar: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
};

const statusLabels: Record<string, string> = {
  pending: '待派单',
  dispatched: '已派单',
  in_progress: '处理中',
  completed: '已完成',
  closed: '已关闭',
};

const PIE_COLORS = ['#0052CC', '#FF6B35', '#F59E0B', '#10B981', '#6B7280'];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '凌晨好';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 17) return '下午好';
  if (hour < 19) return '傍晚好';
  return '晚上好';
}

function getTodayDateStr(): string {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [warnings, setWarnings] = useState<WarningEvent[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStatusStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, trendsRes, warningsRes, ordersRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/trends'),
          fetch('/api/dashboard/warnings-stream?limit=8'),
          fetch('/api/work-orders/statistics'),
        ]);

        const [statsData, trendsData, warningsData, ordersData] = await Promise.all([
          statsRes.json(),
          trendsRes.json(),
          warningsRes.json(),
          ordersRes.json(),
        ]);

        if (statsData.success) setStats(statsData.data);
        if (trendsData.success) setTrends(trendsData.data);
        if (warningsData.success) setWarnings(warningsData.data);
        if (ordersData.success) setOrderStats(ordersData.data.by_status);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const combinedTrendData = trends
    ? trends.readings.map((item, index) => ({
        date: formatDate(item.date),
        抄表数: item.count || 0,
        工单量: trends.orders[index]?.count || 0,
        缴费额: trends.payments[index]?.amount || 0,
      }))
    : [];

  const quickActions = [
    { icon: Zap, label: '立即抄表', color: 'from-primary-500 to-primary-600', href: '/meter-reading' },
    { icon: Wrench, label: '一键报修', color: 'from-accent-500 to-accent-600', href: '/repair' },
    { icon: CreditCard, label: '在线缴费', color: 'from-emerald-500 to-emerald-600', href: '/payment' },
    { icon: MapPin, label: '网点查询', color: 'from-violet-500 to-violet-600', href: '/gis' },
  ];

  const totalOrders = orderStats.reduce((sum, item) => sum + item.count, 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {getGreeting()}，欢迎回来 👋
              </h1>
              <p className="text-primary-100 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{getTodayDateStr()}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-primary-100">管理员</p>
                <p className="font-medium">燃气管理平台</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="今日抄表数"
              value={stats?.today_readings || 0}
              change={12.5}
              changeLabel="较昨日"
              icon={Gauge}
              variant="primary"
            />
            <StatCard
              title="本月缴费总额"
              value={`¥${stats?.total_payment?.toLocaleString() || 0}`}
              change={8.3}
              changeLabel="较上月"
              icon={Wallet}
              variant="success"
            />
            <StatCard
              title="待处理工单"
              value={stats?.pending_orders || 0}
              change={-5.2}
              changeLabel="较昨日"
              icon={ClipboardList}
              variant="warning"
            />
            <StatCard
              title="活跃预警数"
              value={stats?.active_warnings || 0}
              change={15.8}
              changeLabel="较昨日"
              icon={AlertTriangle}
              variant="accent"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={cn(
              'group relative overflow-hidden rounded-xl p-5 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
              'bg-gradient-to-br',
              action.color
            )}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <action.icon className="w-6 h-6" />
              </div>
              <p className="font-medium">{action.label}</p>
              <div className="flex items-center text-xs text-white/70 mt-1 group-hover:text-white transition-colors">
                <span>立即前往</span>
                <ChevronRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">业务趋势</h2>
              <p className="text-sm text-gray-500 mt-0.5">近30天数据概览</p>
            </div>
          </div>

          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-400">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReadings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052CC" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0052CC" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    interval={Math.floor(combinedTrendData.length / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    yAxisId="left"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    tickLine={false}
                    axisLine={false}
                    yAxisId="right"
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="抄表数"
                    stroke="#0052CC"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorReadings)"
                    yAxisId="left"
                  />
                  <Area
                    type="monotone"
                    dataKey="工单量"
                    stroke="#FF6B35"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                    yAxisId="right"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Real-time Warnings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">实时告警</h2>
              <p className="text-sm text-gray-500 mt-0.5">最新预警事件</p>
            </div>
            <a
              href="/warning"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              查看全部
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-1 h-12 bg-gray-200 rounded" />
                  <div className="flex-1 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {warnings.map((warning) => {
                const colors = severityColors[warning.severity];
                return (
                  <div
                    key={warning.id}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-colors cursor-pointer group'
                    )}
                  >
                    <div className={cn('w-1 rounded-full flex-shrink-0', colors.bar)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {warning.user_name || '未知用户'}
                        </p>
                        <span
                          className={cn(
                            'flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium',
                            colors.bg,
                            colors.text
                          )}
                        >
                          {warning.severity === 'critical'
                            ? '紧急'
                            : warning.severity === 'warning'
                            ? '警告'
                            : '提示'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {warning.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDateTime(warning.detected_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Work Order Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">工单概览</h2>
            <p className="text-sm text-gray-500 mt-0.5">按状态分类统计</p>
          </div>
          <a
            href="/repair"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
          >
            工单列表
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Pie Chart */}
          <div className="w-full md:w-64 h-64 flex-shrink-0">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                  >
                    {orderStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} 单`,
                      statusLabels[name] || name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status List */}
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-16 mb-2" />
                    <div className="h-2 bg-gray-200 rounded w-full" />
                  </div>
                ))
              : orderStats.map((item, index) => (
                  <div
                    key={item.status}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 mb-2">{item.count}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%`,
                          backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      占比{' '}
                      {totalOrders > 0
                        ? ((item.count / totalOrders) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
