import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  DollarSign,
  Users,
  Truck,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  Gavel,
  Bell,
  FileText,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  AreaChart,
  Area,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import {
  getDispatchStats,
  getRecentActivities,
  type DispatchStats,
  type ActivityItem,
} from '../../services/dispatch.api'

const PIE_COLORS = ['#06B6D4', '#F97316', '#8B5CF6']

interface KPICardProps {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  color: string
  miniData: number[]
  format?: (v: number) => string
}

function AnimatedNumber({ value, format }: { value: number; format?: (v: number) => string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const stepValue = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(stepValue * step, value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="font-mono font-bold">
      {format ? format(Math.round(display)) : Math.round(display).toLocaleString()}
    </span>
  )
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`mini-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#mini-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function KPICard({ title, value, change, icon, color, miniData, format }: KPICardProps) {
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 overflow-hidden group"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }}
      />
      <div className="relative flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <div className="text-3xl text-white">
            <AnimatedNumber value={value} format={format} />
          </div>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="relative flex items-center justify-between">
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isPositive ? '+' : ''}
          {change}%
          <span className="text-slate-500 text-xs ml-1">同比</span>
        </div>
        <MiniSparkline data={miniData} color={color} />
      </div>
    </motion.div>
  )
}

const mockStats: DispatchStats = {
  todayOrders: 2847,
  todayOrdersChange: 12.5,
  todayRevenue: 892450,
  todayRevenueChange: 8.3,
  onlineWorkers: 1256,
  onlineWorkersChange: 5.2,
  onlineDrivers: 634,
  onlineDriversChange: -2.1,
  pendingDisputes: 47,
  pendingDisputesChange: -15.3,
  avgResponseTime: 3.8,
  avgResponseTimeChange: 12.7,
  orderTrend: [
    { date: '06-09', orders: 2200, revenue: 680000 },
    { date: '06-10', orders: 2450, revenue: 750000 },
    { date: '06-11', orders: 2380, revenue: 720000 },
    { date: '06-12', orders: 2600, revenue: 810000 },
    { date: '06-13', orders: 2520, revenue: 780000 },
    { date: '06-14', orders: 2750, revenue: 860000 },
    { date: '06-15', orders: 2847, revenue: 892450 },
  ],
  orderTypeDistribution: [
    { type: 'labor', name: '用工服务', value: 1245 },
    { type: 'vehicle', name: '找车服务', value: 986 },
    { type: 'moving', name: '搬家服务', value: 616 },
  ],
  supplyDemandRatio: [
    { region: '朝阳区', supply: 320, demand: 280, ratio: 1.14 },
    { region: '海淀区', supply: 280, demand: 310, ratio: 0.9 },
    { region: '东城区', supply: 180, demand: 150, ratio: 1.2 },
    { region: '西城区', supply: 160, demand: 175, ratio: 0.91 },
    { region: '丰台区', supply: 220, demand: 200, ratio: 1.1 },
    { region: '通州区', supply: 150, demand: 190, ratio: 0.79 },
  ],
}

const mockActivities: ActivityItem[] = [
  { id: '1', type: 'new_order', title: '新订单 #DD20260615001', description: '朝阳区-搬家服务 350元', timestamp: '2分钟前' },
  { id: '2', type: 'new_dispute', title: '新纠纷 #JF20260615008', description: '雇主投诉工人迟到1小时', timestamp: '5分钟前' },
  { id: '3', type: 'alert', title: '运力预警', description: '通州区供需比低于0.8，建议调度', timestamp: '8分钟前' },
  { id: '4', type: 'new_order', title: '新订单 #DD20260615002', description: '海淀区-找车服务 580元', timestamp: '12分钟前' },
  { id: '5', type: 'alert', title: '价格异常', description: '东城区用工均价上涨18%', timestamp: '15分钟前' },
  { id: '6', type: 'new_dispute', title: '新纠纷 #JF20260615009', description: '货物损坏索赔2000元', timestamp: '18分钟前' },
]

function generateMiniData(base: number, volatility: number, count = 7): number[] {
  const data: number[] = []
  for (let i = 0; i < count; i++) {
    data.push(base * (0.8 + Math.random() * volatility * 0.4))
  }
  return data
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dispatch-stats'],
    queryFn: getDispatchStats,
    initialData: mockStats,
  })

  const { data: activities } = useQuery({
    queryKey: ['dispatch-activities'],
    queryFn: () => getRecentActivities({ limit: 10 }),
    initialData: mockActivities,
  })

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'new_order':
        return <Package className="w-4 h-4" />
      case 'new_dispute':
        return <Gavel className="w-4 h-4" />
      case 'alert':
        return <Bell className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'new_order':
        return 'bg-cyan-500/20 text-cyan-400'
      case 'new_dispute':
        return 'bg-orange-500/20 text-orange-400'
      case 'alert':
        return 'bg-red-500/20 text-red-400'
    }
  }

  return (
    <div className="p-6 min-w-[1440px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">调度数据看板</h1>
        <p className="text-slate-400 mt-1">实时监控平台运营数据</p>
      </motion.div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <KPICard
          title="今日订单量"
          value={stats.todayOrders}
          change={stats.todayOrdersChange}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="#06B6D4"
          miniData={generateMiniData(stats.todayOrders, 0.3)}
        />
        <KPICard
          title="今日交易额(元)"
          value={stats.todayRevenue}
          change={stats.todayRevenueChange}
          icon={<DollarSign className="w-6 h-6" />}
          color="#22C55E"
          miniData={generateMiniData(stats.todayRevenue, 0.3)}
          format={(v) => `¥${v.toLocaleString()}`}
        />
        <KPICard
          title="在线工人数"
          value={stats.onlineWorkers}
          change={stats.onlineWorkersChange}
          icon={<Users className="w-6 h-6" />}
          color="#8B5CF6"
          miniData={generateMiniData(stats.onlineWorkers, 0.15)}
        />
        <KPICard
          title="在线司机数"
          value={stats.onlineDrivers}
          change={stats.onlineDriversChange}
          icon={<Truck className="w-6 h-6" />}
          color="#F97316"
          miniData={generateMiniData(stats.onlineDrivers, 0.15)}
        />
        <KPICard
          title="纠纷工单数"
          value={stats.pendingDisputes}
          change={stats.pendingDisputesChange}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="#EF4444"
          miniData={generateMiniData(stats.pendingDisputes, 0.4)}
        />
        <KPICard
          title="平均响应时间(分钟)"
          value={stats.avgResponseTime}
          change={stats.avgResponseTimeChange}
          icon={<Clock className="w-6 h-6" />}
          color="#EC4899"
          miniData={generateMiniData(stats.avgResponseTime, 0.2)}
        />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-3 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            订单类型分布
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.orderTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.orderTypeDistribution.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {stats.orderTypeDistribution.map((item, index) => (
              <div key={item.type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index] }}
                  />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400">
                  {item.value} 单 ({((item.value / stats.todayOrders) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            近7天订单趋势
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.orderTrend}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis
                  yAxisId="left"
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'orders' ? value.toLocaleString() : `¥${value.toLocaleString()}`,
                    name === 'orders' ? '订单量' : '交易额',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'orders' ? '订单量' : '交易额')}
                  wrapperStyle={{ color: '#94A3B8' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  fill="url(#ordersGradient)"
                  stroke="#06B6D4"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={3}
                  dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#F97316' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-3 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            各区域运力供需比
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.supplyDemandRatio} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={12} domain={[0, 'auto']} />
                <YAxis type="category" dataKey="region" stroke="#64748B" fontSize={12} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      supply: '运力供给',
                      demand: '市场需求',
                    }
                    return [value, labels[name] || name]
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      supply: '运力供给',
                      demand: '市场需求',
                    }
                    return labels[value] || value
                  }}
                  wrapperStyle={{ color: '#94A3B8' }}
                />
                <Bar dataKey="supply" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                <Bar dataKey="demand" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          实时动态
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/30 cursor-pointer transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(
                  activity.type
                )}`}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0">{activity.timestamp}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
