import {
  ShoppingBag,
  Users,
  DollarSign,
  Star,
  TrendingUp,
  ClipboardList,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import StatCard from '@/components/StatCard';
import { useAdminStore } from '@/store/useAdminStore';
import { cn } from '@/lib/utils';

const todayOrders = [
  {
    id: 1001,
    customer: '张女士',
    service: '日常保洁',
    address: '望京SOHO T1 1201',
    time: '09:00',
    amount: 198,
    status: '服务中',
    statusClass: 'badge-blue',
  },
  {
    id: 1002,
    customer: '李先生',
    service: '育婴陪护',
    address: '中关村大街1号',
    time: '08:00',
    amount: 800,
    status: '已派单',
    statusClass: 'badge-orange',
  },
  {
    id: 1003,
    customer: '王女士',
    service: '上门烹饪',
    address: '国贸CBD 3栋',
    time: '17:00',
    amount: 150,
    status: '待派单',
    statusClass: 'badge-gray',
  },
  {
    id: 1004,
    customer: '赵女士',
    service: '深度保洁',
    address: '朝阳公园西门',
    time: '10:00',
    amount: 398,
    status: '已完成',
    statusClass: 'badge-green',
  },
];

export default function AdminDashboard() {
  const stats = useAdminStore((state) => state.stats);

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="数据概览" subtitle="实时监控平台运营核心指标" />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="今日订单"
              value={stats.todayOrders}
              icon={ShoppingBag}
              trend={12.5}
              trendLabel="较昨日"
              colorScheme="teal"
            />
            <StatCard
              title="今日营收"
              value={`¥${(stats.revenueToday / 10000).toFixed(2)}`}
              suffix="万"
              icon={DollarSign}
              trend={8.3}
              trendLabel="较昨日"
              colorScheme="orange"
            />
            <StatCard
              title="活跃阿姨"
              value={stats.activeWorkers}
              icon={Users}
              trend={5.2}
              trendLabel="较上周"
              colorScheme="green"
            />
            <StatCard
              title="平均评分"
              value={stats.avgRating}
              suffix="/5.0"
              icon={Star}
              trend={2.1}
              trendLabel="较上月"
              colorScheme="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-secondary-800">周订单趋势</h3>
                  <p className="text-sm text-secondary-500">最近7天订单与营收变化</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-500">
                  <TrendingUp className="w-4 h-4 text-secondary-500" />
                  <span>环比增长 15.8%</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.weeklyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#1A535C"
                      strokeWidth={3}
                      dot={{ fill: '#1A535C', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="订单数"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FF6B35"
                      strokeWidth={3}
                      dot={{ fill: '#FF6B35', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="营收(元)"
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-secondary-800">订单类型分布</h3>
                <p className="text-sm text-secondary-500">本周各服务类型占比</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.orderTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {stats.orderTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-bold text-secondary-800">今日订单列表</h3>
              </div>
              <button className="text-sm text-secondary-600 hover:text-secondary-800 font-medium">
                查看全部 →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50/50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      订单号
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      客户
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      服务类型
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      服务地址
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      预约时间
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary-50/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-secondary-800">
                        #{order.id}
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary-700">{order.customer}</td>
                      <td className="px-5 py-4 text-sm text-secondary-700">{order.service}</td>
                      <td className="px-5 py-4 text-sm text-secondary-600 max-w-xs truncate">
                        {order.address}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-secondary-600">
                          <Clock className="w-4 h-4" />
                          {order.time}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-secondary-800">
                        ¥{order.amount}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('badge', order.statusClass)}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
