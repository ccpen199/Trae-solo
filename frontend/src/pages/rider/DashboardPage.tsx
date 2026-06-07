import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, MapPin, Wallet, Package, TrendingUp, Star, Zap } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { useAuthStore } from '../../store/auth'
import { orders, riders } from '../../api'

export default function DashboardPage() {
  const { rider, updateRider } = useAuthStore()
  const navigate = useNavigate()
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res: any = await orders.listOrders({ limit: 5 })
      setRecentOrders(Array.isArray(res) ? res : res?.list || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const toggleOnline = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await riders.updateLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, is_online: 1 })
        })
      }
      setOnline(!online)
      updateRider({ status: online ? 'offline' : 'online' } as any)
    } catch {
      setOnline(!online)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome + Online Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">
            你好，{rider?.name || '骑手'}
          </h1>
          <p className="text-gray-500 mt-1">欢迎回来，祝您配送顺利！</p>
        </div>
        <button
          onClick={toggleOnline}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all shadow-md ${
            online
              ? 'bg-success text-white hover:bg-success/90'
              : 'bg-secondary text-white hover:bg-secondary/90'
          }`}
        >
          <Zap size={20} />
          {online ? '在线接单中' : '点击上线'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package size={24} />} label="今日完单" value="0" accentColor="border-primary" />
        <StatCard icon={<TrendingUp size={24} />} label="今日收入" value="¥0.00" accentColor="border-success" />
        <StatCard icon={<Star size={24} />} label="信用分" value={rider?.credit_score || 100} accentColor="border-accent" />
        <StatCard icon={<Wallet size={24} />} label="当前余额" value={`¥${rider?.balance?.toFixed(2) || '0.00'}`} accentColor="border-secondary" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/rider/orders')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100"
        >
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <ClipboardList size={24} />
          </div>
          <div className="text-left">
            <p className="font-medium text-secondary">接单大厅</p>
            <p className="text-sm text-gray-500">查看可接订单</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/rider/orders/nearby')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100"
        >
          <div className="p-3 bg-accent/10 rounded-lg text-accent">
            <MapPin size={24} />
          </div>
          <div className="text-left">
            <p className="font-medium text-secondary">附近订单</p>
            <p className="text-sm text-gray-500">发现身边好单</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/rider/wallet')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100"
        >
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <Wallet size={24} />
          </div>
          <div className="text-left">
            <p className="font-medium text-secondary">我要提现</p>
            <p className="text-sm text-gray-500">管理收入余额</p>
          </div>
        </button>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-secondary">最近订单</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无订单记录</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order: any) => (
              <div
                key={order.id}
                onClick={() => navigate(`/rider/orders/${order.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-secondary">{order.order_no}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.pickup_address} → {order.delivery_address}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">¥{order.total_price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
