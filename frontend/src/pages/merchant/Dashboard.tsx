import { useState } from 'react'
import {
  ShoppingBag,
  TrendingUp,
  Wallet,
  ClipboardList,
  Package,
  Send,
  BarChart3,
  CreditCard,
  Bell,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import { useAuthStore } from '../../store/useAuthStore'

const weeklyData = [
  { day: '周一', orders: 42, revenue: 3680 },
  { day: '周二', orders: 38, revenue: 3120 },
  { day: '周三', orders: 55, revenue: 4560 },
  { day: '周四', orders: 47, revenue: 3920 },
  { day: '周五', orders: 63, revenue: 5280 },
  { day: '周六', orders: 71, revenue: 6140 },
  { day: '周日', orders: 58, revenue: 4960 },
]

const pendingReminders = [
  { id: '1', text: '3笔订单待接单', type: 'urgent' as const },
  { id: '2', text: '2笔退款待处理', type: 'warning' as const },
  { id: '3', text: '1条新评价待回复', type: 'info' as const },
]

const quickEntries = [
  { icon: ClipboardList, label: '订单管理', path: '/merchant/orders', color: 'bg-blue-500' },
  { icon: Package, label: '商品管理', path: '/merchant/products', color: 'bg-green-500' },
  { icon: Send, label: '分发设置', path: '/merchant/dispatch', color: 'bg-purple-500' },
  { icon: CreditCard, label: '财务中心', path: '/merchant/finance', color: 'bg-amber-500' },
  { icon: BarChart3, label: '经营统计', path: '/merchant/statistics', color: 'bg-cyan-500' },
]

const reminderStyles = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default function MerchantDashboard() {
  const user = useAuthStore((s) => s.user)
  const [shopOpen] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.nickname || '我的店铺'}工作台
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block w-2 h-2 rounded-full ${shopOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-500">{shopOpen ? '营业中' : '已打烊'}</span>
          </div>
        </div>
        <Bell className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="今日订单"
          value={58}
          icon={<ShoppingBag className="w-5 h-5" />}
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        <StatCard
          title="今日营业额"
          value="¥4,960"
          icon={<Wallet className="w-5 h-5" />}
          trend="up"
          trendValue="+8%"
          color="green"
        />
        <StatCard
          title="客单价"
          value="¥85.5"
          icon={<TrendingUp className="w-5 h-5" />}
          trend="down"
          trendValue="-3%"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {quickEntries.map((entry) => (
          <Card key={entry.path} hover className="flex flex-col items-center gap-2 py-4">
            <div className={`w-11 h-11 rounded-xl ${entry.color} flex items-center justify-center`}>
              <entry.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{entry.label}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">待处理提醒</h3>
          <div className="space-y-2">
            {pendingReminders.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${reminderStyles[r.type]}`}
              >
                <span className="text-sm font-medium">{r.text}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">近7日趋势</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} name="订单数" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
