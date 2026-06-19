import { useState, useEffect, useCallback } from 'react'
import { Filter, Grid3X3, List, Map, X, MapPin, Clock, Tag, SearchX } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import PostCard from '@/components/PostCard'
import { EmptyState, ErrorState, SkeletonCard } from '@/components/StateFeedback'
import { api } from '@/utils/api'
import { CATEGORIES } from '@/types'
import type { Post, GeoRegion } from '@/types'

const TIME_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'today', label: '今天' },
  { value: '3d', label: '3天内' },
  { value: '7d', label: '7天内' },
  { value: '30d', label: '30天内' },
]

const SORT_OPTIONS = [
  { value: 'latest', label: '最新' },
  { value: 'hot', label: '最热' },
  { value: 'price', label: '价格' },
]

const MAP_DOTS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 90 + 5,
  y: Math.random() * 85 + 5,
  color: CATEGORIES[i % 12].color,
}))

export default function PostList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [provinces, setProvinces] = useState<GeoRegion[]>([])
  const [cities, setCities] = useState<GeoRegion[]>([])
  const [districts, setDistricts] = useState<GeoRegion[]>([])
  const limit = 12

  const category = searchParams.get('category') || ''
  const province = searchParams.get('province') || ''
  const city = searchParams.get('city') || ''
  const district = searchParams.get('district') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const timeRange = searchParams.get('timeRange') || ''
  const merchantOnly = searchParams.get('merchantOnly') === '1'

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
    setPage(1)
  }, [setSearchParams])

  useEffect(() => { api.geo.regions().then(setProvinces).catch(() => {}) }, [])
  useEffect(() => {
    const p = provinces.find((r) => r.name === province)
    if (p) api.geo.regions(p.code).then(setCities).catch(() => {})
    else setCities([])
  }, [province, provinces])
  useEffect(() => {
    const c = cities.find((r) => r.name === city)
    if (c) api.geo.regions(c.code).then(setDistricts).catch(() => {})
    else setDistricts([])
  }, [city, cities])

  const loadData = useCallback(() => {
    setLoading(true)
    setError(false)
    api.posts.list({
      category: category || undefined,
      province: province || undefined,
      city: city || undefined,
      district: district || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      timeRange: timeRange || undefined,
      merchantOnly: merchantOnly ? '1' : undefined,
      sort,
      page,
      limit,
    }).then((data) => {
      setPosts(data.posts)
      setTotal(data.total)
    }).catch(() => setError(true)).finally(() => setLoading(false))
  }, [category, province, city, district, minPrice, maxPrice, timeRange, merchantOnly, sort, page, limit])

  useEffect(() => { loadData() }, [loadData])

  const resetFilters = () => {
    setSearchParams({})
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  const Select = ({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { name: string }[] }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-300">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
    </select>
  )

  const sidebarContent = (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">分类筛选</h3>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setParam('category', category === c.key ? '' : c.key)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${category === c.key ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">地区筛选</h3>
        <div className="space-y-2">
          <Select value={province} onChange={(v) => { setParam('province', v); setParam('city', ''); setParam('district', '') }} placeholder="省份" options={provinces} />
          <Select value={city} onChange={(v) => { setParam('city', v); setParam('district', '') }} placeholder="城市" options={cities} />
          <Select value={district} onChange={(v) => setParam('district', v)} placeholder="区县" options={districts} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">价格范围</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="最低" value={minPrice} onChange={(e) => setParam('minPrice', e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-300" />
          <span className="text-slate-400">-</span>
          <input type="number" placeholder="最高" value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-300" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">发布时间</h3>
        <select value={timeRange} onChange={(e) => setParam('timeRange', e.target.value)} className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-300">
          {TIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="merchantOnly" checked={merchantOnly} onChange={(e) => setParam('merchantOnly', e.target.checked ? '1' : '')}
          className="w-4 h-4 rounded border-slate-300 text-navy-800 focus:ring-navy-300" />
        <label htmlFor="merchantOnly" className="text-sm text-slate-600">仅商家</label>
      </div>

      <button onClick={resetFilters} className="w-full text-sm text-slate-500 hover:text-red-500 py-2 border border-slate-200 rounded-lg hover:border-red-200 transition-colors">
        重置筛选
      </button>
    </div>
  )

  const retryLoad = () => loadData()

  return (
    <div className="flex gap-6 max-w-7xl mx-auto px-4 py-6">
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 card p-5">{sidebarContent}</div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-slate-700">筛选</span>
              <button onClick={() => setDrawerOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm text-slate-500">共 <b className="text-slate-800">{total}</b> 条结果</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              {([['grid', Grid3X3], ['list', List], ['map', Map]] as const).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-2 ${viewMode === mode ? 'bg-navy-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-300">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {error ? (
          <ErrorState onRetry={retryLoad} />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<SearchX className="w-16 h-16 text-slate-300 mb-2" />}
            title="未找到相关信息"
            description="当前筛选条件下没有匹配的内容，试试调整筛选条件或查看其他分类"
            action={
              <div className="flex gap-2">
                <button onClick={resetFilters} className="btn-outline text-sm">清除筛选</button>
                <Link to="/publish" className="btn-accent text-sm">发布新信息</Link>
              </div>
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {posts.map((p) => {
              const cat = CATEGORIES.find((c) => c.key === p.category)
              const img = p.images?.find((i) => i.isPrimary) || p.images?.[0]
              return (
                <div key={p.id} className="card flex items-center gap-4 p-3 cursor-pointer">
                  {img ? <img src={img.url} alt="" className="w-20 h-16 rounded-lg object-cover shrink-0" />
                    : <div className="w-20 h-16 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color}20` }}>
                        <span className="text-sm font-bold" style={{ color: cat?.color }}>{cat?.label?.[0]}</span>
                      </div>}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800 truncate">{p.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="text-accent-600 font-bold text-sm">{p.price !== undefined ? `¥${p.price.toLocaleString()}` : '面议'}</span>
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.district}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{timeAgoStr(p.createdAt)}</span>
                    </div>
                  </div>
                  <Tag className="w-4 h-4 text-slate-300 shrink-0" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="relative bg-slate-100 rounded-xl h-96 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 50 Q25 30 50 50 T100 50" fill="none" stroke="#94a3b8" strokeWidth="0.3" />
                <path d="M0 70 Q25 50 50 70 T100 70" fill="none" stroke="#94a3b8" strokeWidth="0.3" />
              </svg>
            </div>
            {MAP_DOTS.map((dot, i) => {
              const post = posts[i % posts.length]
              return (
                <div key={dot.id} className="absolute group" style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
                  <div className="w-3 h-3 rounded-full shadow-lg cursor-pointer transition-transform group-hover:scale-150" style={{ backgroundColor: dot.color }} />
                  {post && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-navy-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {post.title}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-8">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-lg ${p === page ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {p}
              </button>
            ))}
            {totalPages > 7 && <span className="text-slate-400 px-1">...</span>}
            {totalPages > 7 && (
              <button onClick={() => setPage(totalPages)} className={`w-8 h-8 text-sm rounded-lg ${totalPages === page ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {totalPages}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function timeAgoStr(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}天前`
  return `${Math.floor(d / 30)}个月前`
}
