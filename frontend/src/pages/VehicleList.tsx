import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/utils/api'
import { Search, Plus, Filter } from 'lucide-react'

interface VehicleItem {
  id: number
  plate_number: string
  vehicle_type: string
  load_capacity: number
  volume_capacity: number
  temperature_control: string
  current_province: string
  current_city: string
  status: string
  created_at: string
  available_routes: string
}

interface VehicleResponse {
  items: VehicleItem[]
  total: number
  page: number
  pageSize: number
}

const VEHICLE_TYPE_OPTIONS = [
  { value: '', label: '全部车型' },
  { value: 'flatbed', label: '平板' },
  { value: 'van', label: '厢式' },
  { value: 'refrigerated', label: '冷藏' },
  { value: 'tank', label: '罐式' },
  { value: 'container', label: '集装箱' },
  { value: 'lowbed', label: '低平板' },
]

const VEHICLE_TYPE_MAP: Record<string, string> = {
  flatbed: '平板',
  van: '厢式',
  refrigerated: '冷藏',
  tank: '罐式',
  container: '集装箱',
  lowbed: '低平板',
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

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'available', label: '空闲' },
  { value: 'matched', label: '已匹配' },
  { value: 'transporting', label: '运输中' },
  { value: 'offline', label: '离线' },
]

const STATUS_MAP: Record<string, string> = {
  available: '空闲',
  matched: '已匹配',
  transporting: '运输中',
  offline: '离线',
}

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  matched: 'bg-blue-100 text-blue-700',
  transporting: 'bg-orange-100 text-orange-700',
  offline: 'bg-gray-100 text-gray-500',
}

export default function VehicleList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [data, setData] = useState<VehicleItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [vehicleType, setVehicleType] = useState(searchParams.get('vehicle_type') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [temperatureControl, setTemperatureControl] = useState(searchParams.get('temperature_control') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const pageSize = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (vehicleType) params.set('vehicle_type', vehicleType)
      if (status) params.set('status', status)
      if (location) params.set('location', location)
      if (keyword) params.set('keyword', keyword)
      if (temperatureControl) params.set('temperature_control', temperatureControl)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await api.get<VehicleResponse>(`/api/vehicle?${params.toString()}`)
      setData(res.items || [])
      setTotal(res.total || 0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取车源列表失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [vehicleType, status, location, keyword, temperatureControl, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    const params = new URLSearchParams()
    if (vehicleType) params.set('vehicle_type', vehicleType)
    if (status) params.set('status', status)
    if (location) params.set('location', location)
    if (keyword) params.set('keyword', keyword)
    if (temperatureControl) params.set('temperature_control', temperatureControl)
    params.set('page', '1')
    setSearchParams(params)
    fetchData()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B2A4A]">车源管理</h1>
          <Link
            to="/vehicle/publish"
            className="inline-flex items-center gap-2 bg-[#E8722A] hover:bg-[#d4631e] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            发布车源
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-[#1B2A4A] font-medium">
            <Filter size={18} />
            筛选条件
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
            >
              {VEHICLE_TYPE_OPTIONS.map((o) => (
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
            <input
              type="text"
              placeholder="当前位置省份/城市"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
                      <th className="px-4 py-3 text-left font-medium">车牌号</th>
                      <th className="px-4 py-3 text-left font-medium">车型</th>
                      <th className="px-4 py-3 text-left font-medium">载重(吨)</th>
                      <th className="px-4 py-3 text-left font-medium">容积(m³)</th>
                      <th className="px-4 py-3 text-left font-medium">温控</th>
                      <th className="px-4 py-3 text-left font-medium">当前位置</th>
                      <th className="px-4 py-3 text-left font-medium">可跑线路</th>
                      <th className="px-4 py-3 text-left font-medium">状态</th>
                      <th className="px-4 py-3 text-left font-medium">发布时间</th>
                      <th className="px-4 py-3 text-left font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-16 text-gray-400">暂无车源数据</td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600">{item.id}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#1B2A4A]">{item.plate_number}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{VEHICLE_TYPE_MAP[item.vehicle_type] || item.vehicle_type}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.load_capacity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.volume_capacity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{TEMP_MAP[item.temperature_control] || item.temperature_control}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.current_province}{item.current_city}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.available_routes}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[item.status] || 'bg-gray-100 text-gray-500'}`}>
                              {STATUS_MAP[item.status] || item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.created_at?.slice(0, 10)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/vehicle/${item.id}`}
                                className="text-[#1B2A4A] hover:text-[#E8722A] text-sm font-medium transition-colors"
                              >
                                查看详情
                              </Link>
                              {item.status === 'available' && (
                                <Link
                                  to={`/matching?vehicleId=${item.id}`}
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
