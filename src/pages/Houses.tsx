import { useState, useEffect } from 'react'
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import HouseCard, { type House } from '@/components/HouseCard'
import { cn } from '@/lib/utils'

interface Filters {
  keyword: string
  status: string
  unitType: string
  minPrice: string
  maxPrice: string
  houseType: string
}

export default function Houses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [houses, setHouses] = useState<House[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    status: '',
    unitType: '',
    minPrice: '',
    maxPrice: '',
    houseType: '',
  })

  useEffect(() => {
    loadHouses()
  }, [page, filters])

  async function loadHouses() {
    try {
      setLoading(true)
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.status) params.status = filters.status
      if (filters.unitType) params.unit_type = filters.unitType
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice
      if (filters.houseType) params.houseType = filters.houseType

      const result = await api.get<House[]>('/houses', params)

      if (result.success && result.data) {
        const processedHouses = Array.isArray(result.data)
          ? result.data.map((h: any) => ({
              id: h.id,
              title: h.title,
              address: h.address,
              price: h.price,
              unitType: h.unit_type,
              houseType: h.house_type,
              area: h.area,
              agentId: h.agent_id,
              agentName: h.agent_name,
              status: h.status,
              certStatus: h.cert_status,
              certNo: h.cert_no,
              images: JSON.parse(h.images || '[]'),
              description: h.description,
              community: h.community,
              builtYear: h.built_year,
              lng: h.lng,
              lat: h.lat,
              floorInfo: h.floor_info,
              orientation: h.orientation,
              decoration: h.decoration,
              createdAt: h.created_at,
            }))
          : []

        setHouses(processedHouses)
        setTotal(result.total || 0)
      } else {
        console.error('加载房源列表失败:', result.error)
      }
    } catch (err) {
      console.error('加载房源列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters({
      keyword: '',
      status: '',
      unitType: '',
      minPrice: '',
      maxPrice: '',
      houseType: '',
    })
    setPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'available', label: '可售/可租' },
    { value: 'reserved', label: '预订' },
    { value: 'sold', label: '已售' },
    { value: 'rented', label: '已租' },
  ]

  const unitTypeOptions = [
    { value: '', label: '全部类型' },
    { value: 'sell', label: '出售' },
    { value: 'rent', label: '出租' },
  ]

  const houseTypeOptions = [
    { value: '', label: '全部户型' },
    { value: '一室一厅', label: '一室一厅' },
    { value: '两室一厅', label: '两室一厅' },
    { value: '两室两厅', label: '两室两厅' },
    { value: '三室一厅', label: '三室一厅' },
    { value: '三室两厅', label: '三室两厅' },
    { value: '四室两厅', label: '四室两厅' },
  ]

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'keyword' && value !== ''
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">房源管理</h1>
          <p className="text-gray-500 mt-1">共 {total} 套房源</p>
        </div>
        <button
          onClick={() => navigate('/houses/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新增房源
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索房源标题、地址..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <Filter className="w-5 h-5" />
            筛选
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-50'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">房源状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">交易类型</label>
              <select
                value={filters.unitType}
                onChange={(e) => handleFilterChange('unitType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {unitTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">户型</label>
              <select
                value={filters.houseType}
                onChange={(e) => handleFilterChange('houseType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {houseTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低价格</label>
              <input
                type="number"
                placeholder="元"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最高价格</label>
              <input
                type="number"
                placeholder="元"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-gray-500">已选条件:</span>
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
                状态: {statusOptions.find((o) => o.value === filters.status)?.label}
                <button onClick={() => handleFilterChange('status', '')}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {filters.unitType && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
                类型: {unitTypeOptions.find((o) => o.value === filters.unitType)?.label}
                <button onClick={() => handleFilterChange('unitType', '')}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {filters.houseType && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
                户型: {filters.houseType}
                <button onClick={() => handleFilterChange('houseType', '')}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
                价格: {filters.minPrice || '0'} - {filters.maxPrice || '不限'}
                <button
                  onClick={() => {
                    handleFilterChange('minPrice', '')
                    handleFilterChange('maxPrice', '')
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            )}
            <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-gray-700 ml-2">
              重置
            </button>
          </div>
        )}
      </div>

      {houses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无房源</h3>
          <p className="text-gray-500 mb-4">没有找到符合条件的房源</p>
          <button
            onClick={() => navigate('/houses/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新增房源
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((house) => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {houses.map((house) => (
                <HouseCard key={house.id} house={house} viewMode="list" />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-sm text-gray-500">
              共 {total} 条，第 {page} / {totalPages || 1} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5) {
                    if (page > 3) {
                      pageNum = page - 2 + i
                    }
                    if (page > totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    }
                  }
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-lg font-medium transition-colors',
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
