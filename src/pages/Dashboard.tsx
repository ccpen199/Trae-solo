import { useState, useEffect } from 'react';
import {
  Package,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  FileText,
  Bell,
  Send,
  UserCheck,
  Search,
  BarChart3,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Tag } from '@/components/common/Tag';
import { Loading } from '@/components/common/Loading';
import { get } from '@/utils/request';

interface OverviewData {
  totalWaybills: number;
  syncedWaybills: number;
  pendingSyncWaybills: number;
  pendingExceptions: number;
  reviewingExceptions: number;
  totalActiveUsers: number;
  todayWaybills: number;
  pendingOrders: number;
  syncRate: number;
}

interface ShipmentTrendData {
  days: number;
  trend: Array<{ date: string; count: number }>;
}

const quickEntries = [
  { icon: Send, label: '快速收寄', color: 'bg-primary/10 text-primary' },
  { icon: UserCheck, label: '实名认证', color: 'bg-blue-100 text-blue-600' },
  { icon: AlertTriangle, label: '异常处理', color: 'bg-orange-100 text-orange-600' },
  { icon: Search, label: '运单查询', color: 'bg-purple-100 text-purple-600' },
  { icon: BarChart3, label: '数据统计', color: 'bg-cyan-100 text-cyan-600' },
  { icon: ClipboardList, label: '监管指令', color: 'bg-amber-100 text-amber-600' },
];

const mockTodos = [
  {
    id: '1',
    type: 'exception',
    title: '待复核异常件',
    desc: '运单号 SF1234567890 身份信息存疑',
    time: '10分钟前',
    priority: 'high' as const,
  },
  {
    id: '2',
    type: 'exception',
    title: '待复核异常件',
    desc: '运单号 YT0987654321 违禁品疑似',
    time: '30分钟前',
    priority: 'medium' as const,
  },
  {
    id: '3',
    type: 'order',
    title: '待执行监管指令',
    desc: '关于开展网点实名检查的通知',
    time: '2小时前',
    priority: 'high' as const,
  },
  {
    id: '4',
    type: 'order',
    title: '待执行监管指令',
    desc: '月度数据报送要求',
    time: '1天前',
    priority: 'low' as const,
  },
];

const mockNotices = [
  {
    id: '1',
    title: '关于2024年第三季度实名率通报',
    time: '2024-06-18 15:30',
    type: 'notice',
  },
  {
    id: '2',
    title: '系统维护通知：6月20日凌晨2点-4点',
    time: '2024-06-17 09:00',
    type: 'maintenance',
  },
  {
    id: '3',
    title: '关于加强违禁品排查的紧急通知',
    time: '2024-06-15 14:20',
    type: 'urgent',
  },
  {
    id: '4',
    title: '新版收寄操作手册已发布',
    time: '2024-06-12 10:00',
    type: 'notice',
  },
];

export default function Dashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trendData, setTrendData] = useState<ShipmentTrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, trendRes] = await Promise.all([
          get<OverviewData>('/statistics/overview'),
          get<ShipmentTrendData>('/statistics/shipment-trend'),
        ]);
        setOverview(overviewRes);
        setTrendData(trendRes);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setOverview({
          totalWaybills: 0,
          syncedWaybills: 0,
          pendingSyncWaybills: 0,
          pendingExceptions: 0,
          reviewingExceptions: 0,
          totalActiveUsers: 0,
          todayWaybills: 0,
          pendingOrders: 0,
          syncRate: 0,
        });
        setTrendData({ days: 7, trend: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" />
      </div>
    );
  }

  const chartData = trendData?.trend.map((item) => ({
    ...item,
    date: item.date.slice(5),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日收寄量"
          value={overview?.todayWaybills ?? 0}
          icon={Package}
          trend={12.5}
          trendLabel="较昨日"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="实名认证率"
          value={`${overview?.syncRate ?? 0}%`}
          icon={ShieldCheck}
          trend={2.3}
          trendLabel="较上周"
          iconBg="bg-green-100"
        />
        <StatCard
          title="异常件数量"
          value={(overview?.pendingExceptions ?? 0) + (overview?.reviewingExceptions ?? 0)}
          icon={AlertTriangle}
          trend={-5.2}
          trendLabel="较昨日"
          iconBg="bg-orange-100"
        />
        <StatCard
          title="待同步运单数"
          value={overview?.pendingSyncWaybills ?? 0}
          icon={RefreshCw}
          iconBg="bg-blue-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">待办列表</h3>
            </div>
            <Button variant="ghost" size="sm" rightIcon={ChevronRight}>
              全部
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockTodos.map((todo) => (
              <div key={todo.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{todo.title}</span>
                      <Tag
                        color={
                          todo.priority === 'high'
                            ? 'danger'
                            : todo.priority === 'medium'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {todo.priority === 'high' ? '紧急' : todo.priority === 'medium' ? '一般' : '低'}
                      </Tag>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{todo.desc}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {todo.time}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">最近通知公告</h3>
            </div>
            <Button variant="ghost" size="sm" rightIcon={ChevronRight}>
              全部
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockNotices.map((notice) => (
              <div key={notice.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notice.type === 'urgent' ? (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      ) : notice.type === 'maintenance' ? (
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {notice.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 ml-6">{notice.time}</p>
                  </div>
                  {notice.type === 'urgent' && (
                    <Tag color="danger">紧急</Tag>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">快捷入口</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {quickEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <div
                  key={entry.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${entry.color} group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{entry.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">近7天收寄趋势</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="h-72">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#006F3C"
                    strokeWidth={3}
                    dot={{ fill: '#006F3C', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#006F3C' }}
                    name="收寄量"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
