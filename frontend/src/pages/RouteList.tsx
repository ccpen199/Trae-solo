import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  Target,
  MessageSquareWarning,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'

interface RouteItem {
  id: number
  route_name: string
  status: 'active' | 'inactive' | 'pending_review'
  origin_province: string
  origin_city: string
  dest_province: string
  dest_city: string
  carrier_name: string
  carrier_qualification: string
  delivery_promise: string
  on_time_rate: number
  complaint_rate: number
  price_per_ton: number
}

interface RouteListResponse {
  items: RouteItem[]
  total: number
  page: number
  pageSize: number
}

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: '运营中', className: 'bg-green-100 text-green-700' },
  inactive: { label: '已停运', className: 'bg-gray-100 text-gray-600' },
  pending_review: { label: '待审核', className: 'bg-yellow-100 text-yellow-700' },
}

const parseTransitDays = (promise: string): number => {
  const match = promise.match(/(\d+)/)
  return match ? parseInt(match[1], 10) / 24 : 0
}

export default function RouteList() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 9

  const [originProvince, setOriginProvince] = useState('')
  const [originCity, setOriginCity] = useState('')
  const [destProvince, setDestProvince] = useState('')
  const [destCity, setDestCity] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        if (originProvince) params.set('origin_province', originProvince)
        if (originCity) params.set('origin_city', originCity)
        if (destProvince) params.set('dest_province', destProvince)
        if (destCity) params.set('dest_city', destCity)
        if (status) params.set('status', status)
        if (keyword) params.set('keyword', keyword)
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        const res = await api.get<RouteListResponse>(`/api/route?${params.toString()}`)
        setRoutes(res.items)
        setTotal(res.total)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '获取专线列表失败'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    fetchRoutes()
  }, [page, originProvince, originCity, destProvince, destCity, status, keyword])

  const handleSearch = () => {
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#1B2A4A]">专线资源库</h2>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <input
            type="text"
            placeholder="始发省份"
            value={originProvince}
            onChange={(e) => setOriginProvince(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
          />
          <input
            type="text"
            placeholder="始发城市"
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
          />
          <input
            type="text"
            placeholder="目的省份"
            value={destProvince}
            onChange={(e) => setDestProvince(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
          />
          <input
            type="text"
            placeholder="目的城市"
            value={destCity}
            onChange={(e) => setDestCity(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
          >
            <option value="">全部状态</option>
            <option value="active">运营中</option>
            <option value="inactive">已停运</option>
            <option value="pending_review">待审核</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="关键词搜索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-1 rounded-lg bg-[#E8722A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d0651f]"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E8722A] border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!loading && !error && routes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Filter className="mb-3 h-12 w-12" />
          <p>暂无专线数据</p>
        </div>
      )}

      {!loading && !error && routes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <div
              key={route.id}
              onClick={() => navigate(`/route/${route.id}`)}
              className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#1B2A4A]">{route.route_name}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[route.status]?.className || ''}`}
                >
                  {statusMap[route.status]?.label || route.status}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2 text-sm text-[#1B2A4A]">
                <span className="font-medium">
                  {route.origin_province} {route.origin_city}
                </span>
                <ArrowRight className="h-4 w-4 text-[#E8722A]" />
                <span className="font-medium">
                  {route.dest_province} {route.dest_city}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                <span>{route.carrier_name}</span>
              </div>

              {route.carrier_qualification && route.carrier_qualification.length > 0 && (
                <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-[#E8722A]/10 px-3 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#E8722A]" />
                  <span className="text-xs font-medium text-[#E8722A]">资质:{route.carrier_qualification}</span>
                </div>
              )}

              <div className="mb-3 text-sm text-gray-500">
                <span className="text-xs text-gray-400">时效: </span>
                <span className="font-medium text-[#1B2A4A]">{route.delivery_promise}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 border-t border-gray-100 pt-3">
                <div className="flex flex-col items-center">
                  <Clock className="mb-1 h-4 w-4 text-[#1B2A4A]" />
                  <span className="text-xs text-gray-400">时效</span>
                  <span className="text-sm font-semibold text-[#1B2A4A]">{parseTransitDays(route.delivery_promise)}天</span>
                </div>
                <div className="flex flex-col items-center">
                  <Target className="mb-1 h-4 w-4 text-green-500" />
                  <span className="text-xs text-gray-400">准时率</span>
                  <span className="text-sm font-semibold text-green-600">{route.on_time_rate}%</span>
                </div>
                <div className="flex flex-col items-center">
                  <MessageSquareWarning className="mb-1 h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-400">投诉率</span>
                  <span className="text-sm font-semibold text-yellow-600">{route.complaint_rate}%</span>
                </div>
                <div className="flex flex-col items-center">
                  <DollarSign className="mb-1 h-4 w-4 text-[#E8722A]" />
                  <span className="text-xs text-gray-400">价格</span>
                  <span className="text-sm font-semibold text-[#E8722A]">¥{route.price_per_ton}/吨</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
