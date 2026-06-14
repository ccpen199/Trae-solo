import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardCheck,
  Truck,
  Wallet,
  ListTodo,
  PackagePlus,
  PackageSearch,
  ShieldCheck,
  QrCode,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { requestRaw } from '@/utils/api'
import StatCard from '@/components/StatCard'
import StatusBadge from '@/components/StatusBadge'

interface OrderItem {
  id: string
  origin: string
  destination: string
  goods_type: string
  total_fee: number
  status: string
  created_at: string
}

interface DashboardStats {
  availableBalance: number
  frozenAmount: number
  totalIncome: number
}

const driverActions = [
  { icon: ClipboardCheck, label: '一键接单', path: '/freight', color: 'bg-amber-500' },
  { icon: ShieldCheck, label: '安全检查', path: '/safety', color: 'bg-mint-500' },
  { icon: QrCode, label: '扫码签到', path: '/orders', color: 'bg-navy-400' },
  { icon: Wallet, label: '结算查询', path: '/settlement', color: 'bg-coral-400' },
]

const shipperActions = [
  { icon: PackagePlus, label: '发布货源', path: '/freight/create', color: 'bg-amber-500' },
  { icon: PackageSearch, label: '查看运单', path: '/orders', color: 'bg-navy-400' },
  { icon: Wallet, label: '结算中心', path: '/settlement', color: 'bg-mint-500' },
  { icon: ShieldCheck, label: '安全台账', path: '/safety', color: 'bg-coral-400' },
]

const orderStatusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: '待出发' },
  pickup: { variant: 'info', label: '已装货' },
  transit: { variant: 'warning', label: '运输中' },
  delivered: { variant: 'success', label: '已送达' },
  completed: { variant: 'success', label: '已结算' },
}

export default function Home() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isDriver = user?.role === 'driver'
  const actions = isDriver ? driverActions : shipperActions

  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [transitCount, setTransitCount] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

    requestRaw<{ success: boolean; list: OrderItem[]; total: number }>('/api/orders?pageSize=5', {
      method: 'GET', headers,
    }).then(res => {
      setRecentOrders(res.list || [])
      setOrderCount(res.total || 0)
    }).catch(() => {})

    requestRaw<{ success: boolean; list: OrderItem[]; total: number }>('/api/orders?status=transit&pageSize=1', {
      method: 'GET', headers,
    }).then(res => {
      setTransitCount(res.total || 0)
    }).catch(() => {})

    if (isDriver) {
      requestRaw<{ success: boolean; data: DashboardStats }>('/api/settlements/summary', {
        method: 'GET', headers,
      }).then(res => {
        setStats(res.data || null)
      }).catch(() => {})
    }
  }, [isDriver])

  const driverStats = [
    { icon: ClipboardCheck, value: orderCount, label: '总运单', variant: 'navy' as const },
    { icon: Truck, value: transitCount, label: '运输中', variant: 'amber' as const },
    { icon: Wallet, value: stats?.availableBalance || 0, label: '可用余额', variant: 'mint' as const, prefix: '¥' },
    { icon: ListTodo, value: stats?.frozenAmount || 0, label: '冻结金额', variant: 'coral' as const, prefix: '¥' },
  ]

  const shipperStats = [
    { icon: PackagePlus, value: orderCount, label: '总运单', variant: 'navy' as const },
    { icon: Truck, value: transitCount, label: '运输中', variant: 'amber' as const },
    { icon: Wallet, value: 0, label: '待支付', variant: 'coral' as const, prefix: '¥' },
    { icon: ListTodo, value: 0, label: '待办', variant: 'mint' as const },
  ]

  const displayStats = isDriver ? driverStats : shipperStats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">
            {isDriver ? '司机工作台' : '货主工作台'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            欢迎回来，{user?.name || '用户'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            variant={stat.variant}
            prefix={stat.prefix}
          />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">快捷操作</h2>
        <div className="grid grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">最近运单</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-sm text-amber-500 font-medium flex items-center gap-1 hover:text-amber-600"
          >
            查看全部
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {recentOrders.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">暂无运单记录</div>
          )}
          {recentOrders.map((order) => {
            const s = orderStatusMap[order.status]
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-navy-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.origin} → {order.destination}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.goods_type} · {order.created_at?.substring(0, 16)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">¥{order.total_fee?.toFixed(2)}</span>
                  {s && <StatusBadge variant={s.variant}>{s.label}</StatusBadge>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
