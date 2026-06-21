import {
  DollarSign,
  Users,
  Monitor,
  TrendingUp,
  ShoppingCart,
  Percent,
  LayoutGrid,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import {
  dashboardData,
  revenueTrend,
  deviceUsageTrend,
  bookingOrders,
  members,
  alerts,
} from '@/data/mockData';

const revenueDistribution = [
  { name: '电竞馆', value: 65, color: '#3B82F6' },
  { name: '电竞酒店', value: 25, color: '#8B5CF6' },
  { name: '商城消费', value: 10, color: '#10B981' },
];

const memberLevelDistribution = [
  { name: '青铜', value: 1200, color: '#CD7F32' },
  { name: '白银', value: 800, color: '#C0C0C0' },
  { name: '黄金', value: 400, color: '#FFD700' },
  { name: '铂金', value: 150, color: '#E5E4E2' },
  { name: '钻石', value: 50, color: '#B9F2FF' },
];

const recentOrders = bookingOrders.slice(0, 6);
const topMembers = [...members].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
const activeAlerts = alerts.filter(a => a.status !== 'resolved').slice(0, 5);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">经营数据看板</h1>
          <p className="text-dark-400 mt-1">实时掌握门店经营状况</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="h-9 px-3 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500">
            <option>今日</option>
            <option>本周</option>
            <option>本月</option>
            <option>本年</option>
          </select>
          <button className="h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors">
            导出报表
          </button>
        </div>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日营收"
          value={dashboardData.todayRevenue}
          icon={DollarSign}
          trend={12.5}
          color="green"
          prefix="¥"
        />
        <StatCard
          title="今日订单"
          value={dashboardData.todayOrders}
          icon={ShoppingCart}
          trend={8.3}
          color="blue"
          suffix="单"
        />
        <StatCard
          title="设备使用率"
          value={dashboardData.deviceUsageRate}
          icon={Monitor}
          trend={5.2}
          color="purple"
          suffix="%"
        />
        <StatCard
          title="客单价"
          value={dashboardData.avgOrderValue}
          icon={TrendingUp}
          trend={-2.1}
          color="orange"
          prefix="¥"
        />
      </div>

      {/* 第二行数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="坪效"
          value={dashboardData.spaceEfficiency}
          icon={LayoutGrid}
          trend={6.8}
          color="blue"
          prefix="¥"
          suffix="/㎡"
        />
        <StatCard
          title="复购率"
          value={dashboardData.repurchaseRate}
          icon={Percent}
          trend={3.5}
          color="green"
          suffix="%"
        />
        <StatCard
          title="活跃会员"
          value={dashboardData.activeMembers}
          icon={Users}
          trend={15.2}
          color="purple"
          suffix="人"
        />
        <StatCard
          title="新增会员"
          value={dashboardData.newMembers}
          icon={Activity}
          trend={-5.3}
          color="orange"
          suffix="人"
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 营收趋势 */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">营收趋势</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-cyber-500"></span>
                营收
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-neon-purple"></span>
                订单
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  name="营收"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 营收构成 */}
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <h3 className="text-lg font-semibold text-white mb-4">营收构成</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: number) => [`${value}%`, '占比']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {revenueDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-dark-300">{item.name}</span>
                </span>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 第二排图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 设备使用率趋势 */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <h3 className="text-lg font-semibold text-white mb-4">24小时设备使用率</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceUsageTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="usage" name="使用率%" radius={[4, 4, 0, 0]}>
                  {deviceUsageTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.usage > 70 ? '#10B981' : entry.usage > 40 ? '#3B82F6' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 会员等级分布 */}
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <h3 className="text-lg font-semibold text-white mb-4">会员等级分布</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberLevelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {memberLevelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {memberLevelDistribution.slice(0, 3).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-dark-300">{item.name}</span>
                </span>
                <span className="text-white font-medium">{item.value}人</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部数据列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近订单 */}
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">最近订单</h3>
            <a href="#" className="text-sm text-cyber-400 hover:text-cyber-300">
              查看全部
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50 hover:bg-dark-700/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">{order.seatNumber}</p>
                  <p className="text-xs text-dark-400">{order.userName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neon-green">¥{order.totalAmount}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'in_progress'
                        ? 'bg-neon-green/20 text-neon-green'
                        : order.status === 'completed'
                        ? 'bg-dark-600 text-dark-300'
                        : 'bg-cyber-500/20 text-cyber-400'
                    }`}
                  >
                    {order.status === 'in_progress'
                      ? '进行中'
                      : order.status === 'completed'
                      ? '已完成'
                      : '已确认'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 消费排行 */}
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">消费排行</h3>
            <a href="#" className="text-sm text-cyber-400 hover:text-cyber-300">
              查看全部
            </a>
          </div>
          <div className="space-y-3">
            {topMembers.map((member, index) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-dark-900/50 hover:bg-dark-700/50 transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-yellow-500 text-black'
                      : index === 1
                      ? 'bg-gray-300 text-black'
                      : index === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-dark-700 text-dark-400'
                  }`}
                >
                  {index + 1}
                </span>
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.name}</p>
                  <p className="text-xs text-dark-400">{member.levelName}</p>
                </div>
                <span className="text-sm font-medium text-neon-green">
                  ¥{member.totalSpent.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 设备预警 */}
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">设备预警</h3>
            <span className="text-xs bg-neon-red/20 text-neon-red px-2 py-1 rounded-full">
              {activeAlerts.length} 条待处理
            </span>
          </div>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-dark-900/50 border-l-2 border-neon-red"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{alert.deviceName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.level === 'critical'
                        ? 'bg-neon-red/20 text-neon-red'
                        : alert.level === 'high'
                        ? 'bg-neon-orange/20 text-neon-orange'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {alert.level === 'critical' ? '严重' : alert.level === 'high' ? '高' : '中'}
                  </span>
                </div>
                <p className="text-xs text-dark-400">{alert.message}</p>
                <p className="text-xs text-dark-500 mt-1">{alert.storeName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
