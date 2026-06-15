import { useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, Star, TrendingUp, Clock, Eye } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
          {trend && (
            <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: { date: string; amount: number }[] }) {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-semibold text-zinc-900">收入趋势</h3>
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
          {data.map((item, index) => {
            const height = (item.amount / maxAmount) * 100;
            return (
              <div key={index} className="group relative flex flex-1 flex-col items-center">
                <div className="absolute -top-8 hidden rounded bg-zinc-800 px-2 py-1 text-xs text-white group-hover:block">
                  ¥{item.amount.toLocaleString()}
                </div>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 hover:from-primary-600 hover:to-primary-500"
                  style={{ height: `${height}%` }}
                />
                <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2">
                  <div 
                    className="h-2 w-2 rounded-full bg-accent-400"
                    style={{ marginTop: `${-height}%` }}
                  />
                </div>
                <span className="mt-2 text-xs text-zinc-500">{item.date}</span>
              </div>
            );
          })}
        </div>
        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
            points={data.map((item, index) => {
              const x = ((index + 0.5) / data.length) * 100;
              const y = 100 - ((item.amount / maxAmount) * 80 + 10);
              return `${x}%,${y}%`;
            }).join(' ')}
          />
        </svg>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { dashboardStats, dashboardLoading, fetchDashboardStats } = useWorkspaceStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (dashboardLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  if (!dashboardStats) {
    return <Empty />;
  }

  const { totalRevenue, orderCount, studentCount, averageRating, revenueTrend, recentOrders, topCourses } = dashboardStats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="总收入"
          value={`¥${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="较上月 +12.5%"
          color="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          title="订单数"
          value={orderCount}
          icon={ShoppingBag}
          trend="较上月 +8.3%"
          color="bg-gradient-to-br from-accent-500 to-accent-600"
        />
        <StatCard
          title="学生数"
          value={studentCount}
          icon={Users}
          trend="较上月 +15.2%"
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="平均评分"
          value={averageRating.toFixed(1)}
          icon={Star}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={revenueTrend} />

        <div className="card p-5">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900">最近订单</h3>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <Empty />
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-100 to-accent-100" />
                    <div>
                      <p className="font-medium text-zinc-900">{order.title}</p>
                      <p className="text-xs text-zinc-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">¥{order.price}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">热门课程表现</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-3 text-left text-sm font-medium text-zinc-500">课程名称</th>
                <th className="py-3 text-center text-sm font-medium text-zinc-500">学生数</th>
                <th className="py-3 text-center text-sm font-medium text-zinc-500">评分</th>
                <th className="py-3 text-center text-sm font-medium text-zinc-500">收入</th>
                <th className="py-3 text-right text-sm font-medium text-zinc-500">状态</th>
              </tr>
            </thead>
            <tbody>
              {topCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8">
                    <Empty />
                  </td>
                </tr>
              ) : (
                topCourses.map((course) => (
                  <tr key={course.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded-lg bg-gradient-to-r from-primary-100 to-accent-100">
                          {course.coverImage && (
                            <img src={course.coverImage} alt={course.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900">{course.title}</p>
                          <p className="text-xs text-zinc-500">{course.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center text-zinc-900">{course.studentCount}</td>
                    <td className="py-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        {course.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 text-center font-medium text-primary-600">
                      ¥{(course.price * course.studentCount).toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <StatusBadge status={course.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
