import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Shield, Clock, ArrowRight, Store, ClipboardList } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface GroupBuy {
  id: number
  product_id: number
  title: string
  target_count: number
  current_count: number
  discount_price: number
  original_price: number
  start_time: string
  end_time: string
  status: string
  cover_image: string | null
  description: string | null
  product_name: string
  product_cover_image: string | null
  product_original_price: number
  traceability_code?: string | null
}

function formatCountdown(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  if (days > 0) return `${days}天 ${hours}时 ${minutes}分`
  return `${hours}时 ${minutes}分 ${seconds}秒`
}

export default function GroupBuys() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [list, setList] = useState<GroupBuy[]>([])
  const [loading, setLoading] = useState(true)
  const [countdowns, setCountdowns] = useState<Record<number, string>>({})

  useEffect(() => {
    api.get<{ list: GroupBuy[]; total: number }>('/group-buys?status=active')
      .then((data) => {
        setList(data.list)
        const initial: Record<number, string> = {}
        data.list.forEach((item) => {
          if (item.end_time) {
            initial[item.id] = formatCountdown(item.end_time)
          }
        })
        setCountdowns(initial)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (list.length === 0) return
    const timer = setInterval(() => {
      setCountdowns((prev) => {
        const next = { ...prev }
        list.forEach((item) => {
          if (item.end_time) {
            next[item.id] = formatCountdown(item.end_time)
          }
        })
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [list])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">社区团购</h1>
        <p className="text-gray-500 mt-1">广电甄选 品质保证</p>
      </div>

      <div
        onClick={() => navigate('/orders')}
        className="mb-6 flex items-center justify-between bg-white rounded-xl border border-gray-100 px-5 py-4 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">我的团购订单</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-gray-400">暂无团购活动</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {list.map((item) => {
            const progress = item.target_count > 0 ? Math.min((item.current_count / item.target_count) * 100, 100) : 0
            const hasTraceability = !!(item as any).traceability_code
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gradient-to-br from-orange-400 to-orange-200 h-48 flex items-center justify-center relative">
                  <ShoppingBag className="w-16 h-16 text-white/60" />
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    广电担保
                  </div>
                  {hasTraceability && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      溯源
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{item.product_name || item.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">广电甄选商户</p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-bold text-red-500">¥{item.discount_price}</span>
                    <span className="text-sm text-gray-400 line-through">¥{item.original_price}</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>已参团 {item.current_count} 人</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">目标 {item.target_count} 人</div>
                  </div>

                  {item.end_time && countdowns[item.id] && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                      <Clock className="w-3 h-3" />
                      <span>{countdowns[item.id]}</span>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/group-buys/${item.id}`)}
                    className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                  >
                    立即参团
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-10 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Store className="w-10 h-10 text-orange-500" />
          <div>
            <p className="font-semibold text-gray-900">想成为团购商户？</p>
            <p className="text-sm text-gray-500">加入广电甄选平台，触达更多消费者</p>
          </div>
        </div>
        <button
          onClick={() => navigate(isLoggedIn ? '/merchants' : '/login')}
          className="bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          申请入驻
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
