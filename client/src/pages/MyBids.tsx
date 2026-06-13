import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api'
import { Bid } from '../types'
import { Briefcase, Clock, CheckCircle, XCircle, Send } from 'lucide-react'

export default function MyBids() {
  const { isAuthenticated } = useAuthStore()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('ALL')

  const filters = [
    { value: 'ALL', label: '全部' },
    { value: 'PENDING', label: '审核中' },
    { value: 'ACCEPTED', label: '已中标' },
    { value: 'REJECTED', label: '未中标' },
    { value: 'WITHDRAWN', label: '已撤回' },
  ]

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchBids = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/bids/my${activeFilter !== 'ALL' ? `?status=${activeFilter}` : ''}`)
        setBids(data.data || data)
      } finally {
        setLoading(false)
      }
    }
    fetchBids()
  }, [activeFilter, isAuthenticated])

  const statusBadge: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: '审核中', color: 'bg-yellow-50 text-yellow-700', icon: Clock },
    ACCEPTED: { label: '已中标', color: 'bg-green-50 text-green-700', icon: CheckCircle },
    REJECTED: { label: '未中标', color: 'bg-gray-100 text-gray-600', icon: XCircle },
    WITHDRAWN: { label: '已撤回', color: 'bg-red-50 text-red-700', icon: XCircle },
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-4">请先登录</h2>
        <Link to="/login" className="btn-primary">去登录</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的投标</h1>
          <p className="text-gray-500 mt-1">查看所有投标记录和状态</p>
        </div>
        <Link to="/tasks" className="btn-primary">
          浏览更多任务
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="card p-1 mb-6 inline-flex flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === f.value
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 text-xs ${
              activeFilter === f.value ? 'text-white/70' : 'text-gray-400'
            }`}>
              ({bids.filter((b) => f.value === 'ALL' || b.status === f.value).length})
            </span>
          </button>
        ))}
      </div>

      {/* Bid List */}
      {loading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : bids.length === 0 ? (
        <div className="card p-16 text-center">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无投标记录</h3>
          <p className="text-gray-500 mb-6">开始浏览任务并提交您的投标方案</p>
          <Link to="/tasks" className="btn-primary">
            去投标
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => {
            const badge = statusBadge[bid.status] || statusBadge.PENDING
            const Icon = badge.icon
            return (
              <div key={bid.id} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge ${badge.color} flex items-center`}>
                        <Icon className="w-3.5 h-3.5 mr-1" />
                        {badge.label}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600">
                        {bid.task?.category === 'DESIGN' ? '设计' : bid.task?.category === 'DEVELOPMENT' ? '开发' : bid.task?.category}
                      </span>
                    </div>
                    <Link
                      to={`/tasks/${bid.taskId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {bid.task?.title}
                    </Link>
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">{bid.proposal}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {bid.task?.skills?.slice(0, 3).map((s) => (
                        <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col md:text-right justify-between md:justify-start gap-4 md:gap-2 md:min-w-[140px]">
                    <div>
                      <div className="text-2xl font-bold text-amber-600">¥{bid.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">我的报价</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{bid.deliveryDays}天</div>
                      <div className="text-sm text-gray-500">交付周期</div>
                    </div>
                    <div className="text-xs text-gray-400 md:mt-2">
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
