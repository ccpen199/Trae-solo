import { Link } from 'react-router-dom'
import { Wrench, Users, BarChart3, Package, MessageSquareWarning, Stethoscope, CalendarClock, Recycle, TrendingUp, Clock } from 'lucide-react'

const quickStats = [
  { label: '今日订单', value: '156', icon: Wrench, color: 'text-accent', bg: 'bg-accent/10' },
  { label: '在线技师', value: '89', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'SLA达标率', value: '96.8%', icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: '待处理投诉', value: '12', icon: MessageSquareWarning, color: 'text-alert', bg: 'bg-alert/10' },
]

const quickActions = [
  { label: '智能诊断', icon: Stethoscope, path: '/diagnosis', color: 'bg-accent' },
  { label: '预约调度', icon: CalendarClock, path: '/booking', color: 'bg-blue-500' },
  { label: '回收估价', icon: Recycle, path: '/recycle', color: 'bg-purple-500' },
  { label: '技师管理', icon: Users, path: '/admin/technicians', color: 'bg-orange-500' },
  { label: 'SLA看板', icon: BarChart3, path: '/admin/sla', color: 'bg-pink-500' },
  { label: '配件库存', icon: Package, path: '/admin/inventory', color: 'bg-indigo-500' },
  { label: '投诉处理', icon: MessageSquareWarning, path: '/admin/complaints', color: 'bg-red-500' },
]

const recentOrders = [
  { id: 'ORD-001', device: 'iPhone 15 Pro', status: '维修中', time: '10分钟前' },
  { id: 'ORD-002', device: 'MacBook Air', status: '已接单', time: '25分钟前' },
  { id: 'ORD-003', device: 'iPad Pro', status: '待验收', time: '1小时前' },
  { id: 'ORD-004', device: '华为 Mate 60', status: '已完工', time: '2小时前' },
]

export default function AdminHome() {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl font-bold text-white">控制台</h1>
          <p className="mt-1 text-gray-400">智能终端上门快修服务平台</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="gradient-card rounded-lg p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <div className={`rounded-lg ${stat.bg} p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`font-title text-3xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="font-title text-lg font-semibold text-white">快速入口</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-surface p-4 transition-all hover:border-accent/50 hover:bg-surface-light/5"
              >
                <div className={`rounded-lg ${action.color} p-2 text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-title text-lg font-semibold text-white">最新订单</h3>
          <div className="mt-4 space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="flex items-center justify-between rounded-lg bg-surface p-3 transition-all hover:bg-surface-light/5"
              >
                <div>
                  <p className="font-mono text-xs text-accent">{order.id}</p>
                  <p className="text-sm text-gray-300">{order.device}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{order.status}</p>
                  <p className="text-xs text-gray-600">{order.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
