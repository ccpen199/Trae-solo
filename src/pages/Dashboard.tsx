import { useState } from 'react';
import {
  DollarSign,
  Users,
  Monitor,
  TrendingUp,
  ShoppingCart,
  Percent,
  LayoutGrid,
  Activity,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Clock as ClockIcon,
  FileBarChart,
  Building2,
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
  storeComparisons,
  timeSegmentData,
  biReports,
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
const activeAlerts = alerts.filter((a) => a.status !== 'resolved').slice(0, 5);

const tabs = [
  { id: 'overview', label: '总览', icon: PieChartIcon },
  { id: 'stores', label: '门店对比', icon: Building2 },
  { id: 'time', label: '时段分析', icon: ClockIcon },
  { id: 'reports', label: 'BI报表', icon: FileBarChart },
];

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

const categoryLabels: Record<string, string> = {
  revenue: '营收分析',
  operations: '运营分析',
  members: '会员分析',
  devices: '设备分析',
  inventory: '库存分析',
};

const periodLabels: Record<string, string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
  quarterly: '季报',
  yearly: '年报',
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const storeChartData = storeComparisons.map((store) => ({
    name: store.storeName.split('·')[1] || store.storeName,
    营收: Math.round(store.revenue / 1000),
    订单: store.orders,
    设备使用率: store.deviceUsageRate,
    坪效: store.spaceEfficiency,
  }));

  const weekdayData = timeSegmentData.filter((d) => d.period === '工作日');
  const weekendData = timeSegmentData.filter((d) => d.period === '周末');
  const timeSegments = [...new Set(timeSegmentData.map((d) => d.segment))];
  const timeCompareData = timeSegments.map((segment) => {
    const weekday = weekdayData.find((d) => d.segment === segment);
    const weekend = weekendData.find((d) => d.segment === segment);
    return {
      时段: segment,
      工作日: weekday?.revenue || 0,
      周末: weekend?.revenue || 0,
    };
  });

  return (
    <div className="space-y-6">
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

      <div className="flex gap-1 p-1 bg-dark-800/50 border border-cyber-800/50 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyber-600 to-neon-purple text-white shadow-lg shadow-cyber-500/25'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
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
        </>
      )}

      {activeTab === 'stores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {storeComparisons.map((store) => (
              <div
                key={store.storeId}
                className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50 hover:border-cyber-600/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{store.storeName}</h3>
                    <p className="text-sm text-dark-400">{store.storeType}</p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      store.alertCount > 10
                        ? 'bg-neon-red/20 text-neon-red'
                        : store.alertCount > 5
                        ? 'bg-neon-orange/20 text-neon-orange'
                        : 'bg-neon-green/20 text-neon-green'
                    }`}
                  >
                    {store.alertCount > 0 ? `${store.alertCount} 条告警` : '运行正常'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-dark-400 mb-1">营收</p>
                    <p className="text-xl font-bold text-neon-green">¥{store.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">订单数</p>
                    <p className="text-xl font-bold text-cyber-400">{store.orders} 单</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">设备使用率</p>
                    <p className="text-xl font-bold text-neon-purple">{store.deviceUsageRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-1">坪效</p>
                    <p className="text-xl font-bold text-yellow-400">¥{store.spaceEfficiency}/㎡</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">营收对比 (千元)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [`${value}K`, '营收']}
                    />
                    <Bar dataKey="营收" fill="#3B82F6" radius={[0, 4, 4, 0]} name="营收(千元)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">订单对比</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Bar dataKey="订单" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="订单数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">设备使用率对比</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [`${value}%`, '使用率']}
                    />
                    <Bar dataKey="设备使用率" fill="#10B981" radius={[4, 4, 0, 0]} name="使用率%">
                      {storeChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.设备使用率 > 70 ? '#10B981' : entry.设备使用率 > 40 ? '#3B82F6' : '#64748b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">坪效对比 (¥/㎡)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      formatter={(value: number) => [`¥${value}/㎡`, '坪效']}
                    />
                    <Bar dataKey="坪效" fill="#F59E0B" radius={[4, 4, 0, 0]} name="坪效(¥/㎡)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'time' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-cyber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">工作日营收</h3>
                  <p className="text-xs text-dark-400">周一至周五时段分布</p>
                </div>
              </div>
              <div className="space-y-3">
                {weekdayData.map((item) => (
                  <div key={item.segment} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-300">{item.segment}</span>
                      <span className="text-white font-medium">¥{item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 rounded-full transition-all"
                        style={{ width: `${(item.revenue / 12500) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">周末营收</h3>
                  <p className="text-xs text-dark-400">周六周日时段分布</p>
                </div>
              </div>
              <div className="space-y-3">
                {weekendData.map((item) => (
                  <div key={item.segment} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-300">{item.segment}</span>
                      <span className="text-white font-medium">¥{item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full transition-all"
                        style={{ width: `${(item.revenue / 22800) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">工作日 vs 周末 营收对比</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyber-500"></span>
                  <span className="text-dark-300">工作日</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-neon-purple"></span>
                  <span className="text-dark-300">周末</span>
                </span>
              </div>
            </div>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="时段" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" height={60} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(1)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                  />
                  <Legend
                    wrapperStyle={{ color: '#94a3b8' }}
                    formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                  />
                  <Bar dataKey="工作日" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="周末" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">工作日 各时段订单 & 使用率</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="segment" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8' }}
                      formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="订单数" dot={{ fill: '#10B981' }} />
                    <Line type="monotone" dataKey="deviceUsage" stroke="#F59E0B" strokeWidth={2} name="设备使用率%" dot={{ fill: '#F59E0B' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4">周末 各时段订单 & 使用率</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="segment" stroke="#64748b" fontSize={10} angle={-20} textAnchor="end" height={60} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8' }}
                      formatter={(value) => <span className="text-dark-300 text-sm">{value}</span>}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#EF4444" strokeWidth={2} name="订单数" dot={{ fill: '#EF4444' }} />
                    <Line type="monotone" dataKey="deviceUsage" stroke="#EC4899" strokeWidth={2} name="设备使用率%" dot={{ fill: '#EC4899' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">报表总数</p>
                  <p className="text-2xl font-bold text-white">{biReports.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyber-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyber-400" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">已生成</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {biReports.filter((r) => r.status === 'ready').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-neon-green" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">生成中</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {biReports.filter((r) => r.status === 'generating').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-400 mb-1">生成失败</p>
                  <p className="text-2xl font-bold text-neon-red">
                    {biReports.filter((r) => r.status === 'failed').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-neon-red/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-neon-red" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">BI 可追踪报表列表</h3>
              <button className="h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                新建报表
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      报表名称
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      周期
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      生成时间
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      生成人
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      大小
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-dark-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {biReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              report.category === 'revenue'
                                ? 'bg-cyber-500/20'
                                : report.category === 'operations'
                                ? 'bg-neon-purple/20'
                                : report.category === 'members'
                                ? 'bg-neon-green/20'
                                : 'bg-yellow-500/20'
                            }`}
                          >
                            <FileText
                              className={`w-4 h-4 ${
                                report.category === 'revenue'
                                  ? 'text-cyber-400'
                                  : report.category === 'operations'
                                  ? 'text-neon-purple'
                                  : report.category === 'members'
                                  ? 'text-neon-green'
                                  : 'text-yellow-400'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{report.name}</p>
                            <p className="text-xs text-dark-500">
                              {report.startDate} ~ {report.endDate}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">{categoryLabels[report.category]}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-dark-700 text-dark-300">
                          {periodLabels[report.period]}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">{formatDate(report.generatedAt)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">{report.generatedBy}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300">
                          {report.fileSize ? formatFileSize(report.fileSize) : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            report.status === 'ready'
                              ? 'bg-neon-green/20 text-neon-green'
                              : report.status === 'generating'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : report.status === 'failed'
                              ? 'bg-neon-red/20 text-neon-red'
                              : 'bg-dark-600 text-dark-300'
                          }`}
                        >
                          {report.status === 'ready' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : report.status === 'generating' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : report.status === 'failed' ? (
                            <XCircle className="w-3 h-3" />
                          ) : null}
                          {report.status === 'ready'
                            ? '已生成'
                            : report.status === 'generating'
                            ? '生成中'
                            : report.status === 'failed'
                            ? '失败'
                            : '已过期'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          disabled={report.status !== 'ready'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            report.status === 'ready'
                              ? 'bg-cyber-600 hover:bg-cyber-500 text-white'
                              : 'bg-dark-700 text-dark-500 cursor-not-allowed'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                          下载
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {biReports
              .filter((r) => r.status === 'ready' && r.summary.length > 0)
              .slice(0, 2)
              .map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      <p className="text-xs text-dark-400">生成于 {formatDate(report.generatedAt)}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-dark-700 text-dark-300">
                      {periodLabels[report.period]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {report.summary.map((item) => (
                      <div
                        key={item.key}
                        className="p-3 rounded-lg bg-dark-900/50 border border-dark-700/50"
                      >
                        <p className="text-xs text-dark-400 mb-1">{item.label}</p>
                        <div className="flex items-end justify-between">
                          <p className="text-xl font-bold text-white">
                            {typeof item.value === 'number'
                              ? item.value.toLocaleString()
                              : item.value}
                            <span className="text-sm font-normal text-dark-400 ml-1">
                              {item.unit}
                            </span>
                          </p>
                          {item.trend !== undefined && (
                            <span
                              className={`text-xs font-medium flex items-center gap-0.5 ${
                                item.trend >= 0 ? 'text-neon-green' : 'text-neon-red'
                              }`}
                            >
                              <TrendingUp
                                className={`w-3 h-3 ${item.trend < 0 ? 'rotate-180' : ''}`}
                              />
                              {item.trend >= 0 ? '+' : ''}
                              {item.trend}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
