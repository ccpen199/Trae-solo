import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/utils/api'
import { Search, Plus, Filter } from 'lucide-react'

interface CargoItem {
  id: number
  cargo_name: string
  cargo_type: string
  weight: number
  volume: number
  origin_province: string
  origin_city: string
  dest_province: string
  dest_city: string
  budget: number
  status: string
  created_at: string
  temperature_control: string
  loading_method: string
  route_preference: string
}

interface CargoResponse {
  items: CargoItem[]
  total: number
  page: number
  pageSize: number
}

const CARGO_TYPE_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'general', label: '普货' },
  { value: 'cold_chain', label: '冷链' },
  { value: 'hazardous', label: '危险品' },
  { value: 'oversized', label: '大件' },
  { value: 'fresh', label: '生鲜' },
  { value: 'electronics', label: '电子' },
  { value: 'construction', label: '建材' },
  { value: 'textile', label: '纺织' },
  { value: 'machinery', label: '机械' },
  { value: 'pharmaceutical', label: '医药' },
]

const CARGO_TYPE_MAP: Record<string, string> = {
  general: '普货',
  cold_chain: '冷链',
  hazardous: '危险品',
  oversized: '大件',
  fresh: '生鲜',
  electronics: '电子',
  construction: '建材',
  textile: '纺织',
  machinery: '机械',
  pharmaceutical: '医药',
}

const TEMPERATURE_OPTIONS = [
  { value: '', label: '全部温控' },
  { value: 'none', label: '常温' },
  { value: 'cold', label: '冷藏' },
  { value: 'frozen', label: '冷冻' },
  { value: 'heat', label: '恒温' },
]

const TEMP_MAP: Record<string, string> = {
  none: '常温',
  cold: '冷藏',
  frozen: '冷冻',
  heat: '恒温',
}

const LOADING_OPTIONS = [
  { value: '', label: '全部装卸' },
  { value: 'manual', label: '人工' },
  { value: 'mechanical', label: '机械' },
  { value: 'forklift', label: '叉车' },
  { value: 'crane', label: '吊车' },
]

const LOADING_MAP: Record<string, string> = {
  manual: '人工',
  mechanical: '机械',
  forklift: '叉车',
  crane: '吊车',
}

const ROUTE_PREF_OPTIONS = [
  { value: '', label: '全部线路' },
  { value: 'shortest', label: '最短距离' },
  { value: 'fastest', label: '最快时间' },
  { value: 'economic', label: '经济路线' },
]

const ROUTE_PREF_MAP: Record<string, string> = {
  shortest: '最短距离',
  fastest: '最快时间',
  economic: '经济路线',
}

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待匹配' },
  { value: 'matched', label: '已匹配' },
  { value: 'transporting', label: '运输中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const STATUS_MAP: Record<string, string> = {
  pending: '待匹配',
  matched: '已匹配',
  transporting: '运输中',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  matched: 'bg-blue-100 text-blue-700',
  transporting: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function CargoList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [data, setData] = useState<CargoItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [cargoType, setCargoType] = useState(searchParams.get('cargo_type') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [origin, setOrigin] = useState(searchParams.get('origin') || '')
  const [dest, setDest] = useState(searchParams.get('dest') || '')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [temperatureControl, setTemperatureControl] = useState(searchParams.get('temperature_control') || '')
  const [loadingMethod, setLoadingMethod] = useState(searchParams.get('loading_method') || '')
  const [routePreference, setRoutePreference] = useState(searchParams.get('route_preference') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const pageSize = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (cargoType) params.set('cargo_type', cargoType)
      if (status) params.set('status', status)
      if (origin) params.set('origin', origin)
      if (dest) params.set('dest', dest)
      if (keyword) params.set('keyword', keyword)
      if (temperatureControl) params.set('temperature_control', temperatureControl)
      if (loadingMethod) params.set('loading_method', loadingMethod)
      if (routePreference) params.set('route_preference', routePreference)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await api.get<CargoResponse>(`/api/cargo?${params.toString()}`)
      setData(res.items || [])
      setTotal(res.total || 0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取货源列表失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [cargoType, status, origin, dest, keyword, temperatureControl, loadingMethod, routePreference, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    const params = new URLSearchParams()
    if (cargoType) params.set('cargo_type', cargoType)
    if (status) params.set('status', status)
    if (origin) params.set('origin', origin)
    if (dest) params.set('dest', dest)
    if (keyword) params.set('keyword', keyword)
    if (temperatureControl) params.set('temperature_control', temperatureControl)
    if (loadingMethod) params.set('loading_method', loadingMethod)
    if (routePreference) params.set('route_preference', routePreference)
    params.set('page', '1')
    setSearchParams(params)
    fetchData()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B2A4A]">货源管理</h1>
          <Link
            to="/cargo/publish"
            className="inline-flex items-center gap-2 bg-[#E8722A] hover:bg-[#d4631e] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            发布货源
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-[#1B2A4A] font-medium">
            <Filter size={18} />
            筛选条件
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4">
            <select
              value={cargoType}
              onChange={(e) => setCargoType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
            >
              {CARGO_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={temperatureControl}
              onChange={(e) => setTemperatureControl(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
            >
              {TEMPERATURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={loadingMethod}
              onChange={(e) => setLoadingMethod(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
            >
              {LOADING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={routePreference}
              onChange={(e) => setRoutePreference(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
            >
              {ROUTE_PREF_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="起点省份/城市"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
            />
            <input
              type="text"
              placeholder="终点省份/城市"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="关键词搜索"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="bg-[#1B2A4A] hover:bg-[#243660] text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8722A] mr-3" />
              加载中...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 text-red-500">{error}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#1B2A4A] text-white text-sm">
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">货物名称</th>
                      <th className="px-4 py-3 text-left font-medium">类型</th>
                      <th className="px-4 py-3 text-left font-medium">重量(吨)</th>
                      <th className="px-4 py-3 text-left font-medium">体积(m³)</th>
                      <th className="px-4 py-3 text-left font-medium">起点</th>
                      <th className="px-4 py-3 text-left font-medium">终点</th>
                      <th className="px-4 py-3 text-left font-medium">预算(元)</th>
                      <th className="px-4 py-3 text-left font-medium">温控</th>
                      <th className="px-4 py-3 text-left font-medium">装卸</th>
                      <th className="px-4 py-3 text-left font-medium">线路</th>
                      <th className="px-4 py-3 text-left font-medium">状态</th>
                      <th className="px-4 py-3 text-left font-medium">发布时间</th>
                      <th className="px-4 py-3 text-left font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="text-center py-16 text-gray-400">暂无货源数据</td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600">{item.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#1B2A4A]">{item.cargo_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{CARGO_TYPE_MAP[item.cargo_type] || item.cargo_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.weight}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.volume}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.origin_province}{item.origin_city}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.dest_province}{item.dest_city}</td>
                          <td className="px-4 py-3 text-sm text-[#E8722A] font-medium">{item.budget?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{TEMP_MAP[item.temperature_control] || item.temperature_control}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{LOADING_MAP[item.loading_method] || item.loading_method}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{ROUTE_PREF_MAP[item.route_preference] || item.route_preference}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[item.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_MAP[item.status] || item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.created_at?.slice(0, 10)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/cargo/${item.id}`}
                                className="text-[#1B2A4A] hover:text-[#E8722A] text-sm font-medium transition-colors"
                              >
                                查看详情
                              </Link>
                              {item.status === 'pending' && (
                                <Link
                                  to={`/matching?cargoId=${item.id}`}
                                  className="text-[#E8722A] hover:text-[#d4631e] text-sm font-medium transition-colors"
                                >
                                  匹配
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    共 {total} 条记录，第 {page}/{totalPages} 页
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      上一页
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => (
                        <span key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                          <button
                            onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              p === page
                                ? 'bg-[#E8722A] text-white'
                                : 'border border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
