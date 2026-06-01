import React, { useEffect, useState } from 'react'
import {
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Network,
  Shield,
  DollarSign,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { api } from '@/lib/api'

interface DashboardData {
  stats: {
    total: number
    pending: number
    in_transit: number
    delivered: number
    exception: number
  }
  trendData: Array<{
    date: string
    orders: number
    revenue: number
  }>
  revenue: {
    today: number
    yesterday: number
    growth: number
  }
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.dashboard.getStats()
        if (result.success && result.data) {
          setData(result.data as DashboardData)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      label: '今日订单',
      value: data?.stats.total || 0,
      icon: Package,
      color: 'from-sf-blue to-sf-blue/70',
      bgColor: 'bg-sf-blue/10',
      borderColor: 'border-sf-blue/30',
    },
    {
      label: '运输中',
      value: data?.stats.in_transit || 0,
      icon: Truck,
      color: 'from-sf-yellow to-sf-orange',
      bgColor: 'bg-sf-yellow/10',
      borderColor: 'border-sf-yellow/30',
    },
    {
      label: '已送达',
      value: data?.stats.delivered || 0,
      icon: CheckCircle,
      color: 'from-sf-green to-sf-green/70',
      bgColor: 'bg-sf-green/10',
      borderColor: 'border-sf-green/30',
    },
    {
      label: '异常件',
      value: data?.stats.exception || 0,
      icon: AlertTriangle,
      color: 'from-sf-red to-sf-red/70',
      bgColor: 'bg-sf-red/10',
      borderColor: 'border-sf-red/30',
      pulse: true,
    },
  ]

  const quickActions = [
    { label: '快速下单', icon: Package, path: '/ship', color: 'from-sf-red to-sf-orange' },
    { label: '查件追踪', icon: Truck, path: '/track', color: 'from-sf-blue to-sf-blue/70' },
    { label: '同城急送', icon: Zap, path: '/express', color: 'from-sf-yellow to-sf-orange' },
    { label: '大件物流', icon: Network, path: '/bulk', color: 'from-sf-green to-sf-green/70' },
    { label: '运力孪生', icon: Network, path: '/twin/network', color: 'from-sf-blue to-sf-dark' },
    { label: '安全合规', icon: Shield, path: '/security', color: 'from-sf-dark to-sf-blue' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-sf-dark/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-sf-dark/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">运营概览</h1>
          <p className="text-sf-light/50 text-sm mt-1">实时监控全国物流网络运营状态</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-sf-green/10 border border-sf-green/30 rounded-lg">
            <div className="w-2 h-2 bg-sf-green rounded-full animate-pulse" />
            <span className="text-sf-green text-sm">系统正常</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden glass rounded-xl p-6 border ${card.borderColor} card-hover`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <card.icon size={24} className="text-sf-light" />
                </div>
                {index === 3 && (
                  <div className="flex items-center gap-1 text-sf-red text-sm">
                    <TrendingUp size={14} />
                    <span>+12%</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-display text-sf-light">{card.value?.toLocaleString()}</div>
                <div className="text-sf-light/50 text-sm mt-1">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass rounded-xl p-6 border border-sf-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">订单趋势</h3>
              <p className="text-sf-light/50 text-sm">近7天订单与营收走势</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sf-red rounded-full" />
                <span className="text-sf-light/70">订单量</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sf-blue rounded-full" />
                <span className="text-sf-light/70">营收</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trendData || []}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#457B9D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#457B9D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2D42" />
                <XAxis dataKey="date" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <YAxis stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid #457B9D',
                    borderRadius: '8px',
                    color: '#F1FAEE',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#E63946"
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#457B9D"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-yellow/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sf-yellow/10 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-sf-yellow" />
                </div>
                <div>
                  <div className="text-sf-light/50 text-sm">今日营收</div>
                  <div className="text-2xl font-display text-sf-light">
                    ¥{data?.revenue.today.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sf-green text-sm">
                <TrendingUp size={14} />
                <span>+{data?.revenue.growth}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-sf-light/50">
              <span>昨日: ¥{data?.revenue.yesterday.toLocaleString()}</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <h3 className="text-lg font-display text-sf-light mb-4">快捷入口</h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => (window.location.href = action.path)}
                  className="group flex flex-col items-center gap-2 p-4 bg-sf-dark/50 rounded-xl border border-transparent hover:border-sf-blue/30 transition-all hover:bg-sf-dark"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <action.icon size={18} className="text-white" />
                  </div>
                  <span className="text-xs text-sf-light/70 group-hover:text-sf-light transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
