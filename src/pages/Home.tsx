import { Link } from 'react-router-dom'
import { Search, Package, Calculator, MapPin, Ticket, BarChart3, AlertTriangle, BookOpen } from 'lucide-react'
import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

const quickEntries = [
  { icon: Search, label: '查件', path: '/track', color: 'bg-blue-500' },
  { icon: Package, label: '下单', path: '/order', color: 'bg-accent' },
  { icon: Calculator, label: '试算', path: '/estimate', color: 'bg-green-500' },
  { icon: MapPin, label: '范围', path: '/coverage', color: 'bg-purple-500' },
]

const adminEntries = [
  { icon: AlertTriangle, label: '异常预警', path: '/admin/alerts', color: 'bg-red-500', desc: '24h滞留件监控' },
  { icon: BarChart3, label: '用户画像', path: '/admin/profiling', color: 'bg-amber-500', desc: '频次/区域/品类分析' },
  { icon: BookOpen, label: '知识库工单', path: '/admin/knowledge', color: 'bg-sky-500', desc: '客服智能答疑' },
  { icon: MapPin, label: '网点围栏', path: '/admin/networks', color: 'bg-teal-500', desc: '地理围栏管理' },
]

const statusMap: Record<string, { label: string; cls: string }> = {
  in_transit: { label: '运输中', cls: 'badge-info' },
  delivered: { label: '已签收', cls: 'badge-success' },
  exception: { label: '异常', cls: 'badge-danger' },
  picked_up: { label: '已揽收', cls: 'badge-warning' },
}

export default function Home() {
  const { orders, fetchOrders } = useAppStore()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="space-y-6 pb-4">
      <div className="gradient-navy rounded-2xl p-6 text-white relative overflow-hidden">
        <svg className="absolute top-0 right-0 w-40 h-40 opacity-20" viewBox="0 0 200 200">
          <path
            d="M20,100 Q60,20 100,100 T180,100"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray="8 4"
            className="animate-route-dash"
          />
          <circle cx="20" cy="100" r="6" fill="white" />
          <circle cx="100" cy="100" r="6" fill="white" />
          <circle cx="180" cy="100" r="6" fill="white" />
        </svg>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-wide mb-1 animate-slide-up">速运达</h1>
          <p className="text-white/70 text-sm animate-slide-up stagger-1">快递物流全生命周期服务中台</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {quickEntries.map((entry, i) => (
          <Link
            key={entry.path}
            to={entry.path}
            className={`card card-hover p-4 flex flex-col items-center gap-2 animate-slide-up stagger-${i + 1}`}
          >
            <div className={`w-12 h-12 ${entry.color} rounded-xl flex items-center justify-center`}>
              <entry.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-text">{entry.label}</span>
          </Link>
        ))}
      </div>

      {orders.length > 0 && (
        <div>
          <h2 className="section-title">最近追踪</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {orders.map((order) => {
              const st = statusMap[order.status] || { label: order.status, cls: 'badge-info' }
              return (
                <Link
                  to={`/track?q=${order.waybillNo}`}
                  key={order.id}
                  className="card p-4 min-w-[200px] flex-shrink-0 hover:shadow-md transition-shadow"
                >
                  <p className="text-sm font-bold text-navy">{order.waybillNo}</p>
                  <span className={`${st.cls} mt-1`}>{st.label}</span>
                  <p className="text-xs text-text-light mt-2">{order.createdAt}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="gradient-accent rounded-2xl p-5 text-white flex items-center gap-4 animate-slide-up stagger-5">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Ticket className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">新人专享 ¥10优惠券</p>
          <p className="text-white/70 text-xs mt-0.5">首单立减，限时领取</p>
        </div>
        <Link to="/profile" className="bg-white text-accent font-bold text-sm px-4 py-2 rounded-lg hover:bg-white/90 transition-colors">
          领取
        </Link>
      </div>

      <div className="animate-slide-up stagger-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">运营管理中心</h2>
          <Link to="/admin/alerts" className="text-xs text-accent hover:underline">查看全部 →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {adminEntries.map((entry, i) => (
            <Link
              key={entry.path}
              to={entry.path}
              className="card card-hover p-3 flex items-start gap-3"
            >
              <div className={`w-10 h-10 ${entry.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <entry.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{entry.label}</p>
                <p className="text-[11px] text-text-light mt-0.5">{entry.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
