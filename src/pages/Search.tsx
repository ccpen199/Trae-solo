import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, Filter, Home, Video, Palette, FileText, MapPin, ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { stableImageUrl } from '@/lib/media'

const typeTabs = [
  { value: 'all', label: '全部', icon: SearchIcon, countKey: 'total' as const },
  { value: 'properties', label: '房源', icon: Home, countKey: 'properties' as const },
  { value: 'lives', label: '直播', icon: Video, countKey: 'lives' as const },
  { value: 'cases', label: '装修案例', icon: Palette, countKey: 'cases' as const },
  { value: 'contents', label: '内容', icon: FileText, countKey: 'contents' as const },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'

  const [inputValue, setInputValue] = useState(q)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [breakdown, setBreakdown] = useState({ properties: 0, lives: 0, cases: 0, contents: 0 })
  const [total, setTotal] = useState(0)

  const doSearch = async (query: string, searchType: string) => {
    setLoading(true)
    try {
      const response = await api.search.query({
        q: query.trim(),
        type: searchType,
        page: 1,
        pageSize: 20
      }) as any
      setResults(response.data?.results || [])
      setBreakdown(response.data?.breakdown || { properties: 0, lives: 0, cases: 0, contents: 0 })
      setTotal(response.data?.total || 0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setBreakdown({ properties: 0, lives: 0, cases: 0, contents: 0 })
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    doSearch(q, type)
  }, [q, type])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: inputValue.trim(), type })
  }

  const handleTypeChange = (newType: string) => {
    setSearchParams({ q, type: newType })
  }

  const getItemLink = (item: any) => {
    switch (item.result_type) {
      case 'property': return `/properties/${item.id}`
      case 'live': return `/live/${item.id}`
      case 'case': return `/renovation#case-${item.id}`
      case 'content': return `/content/${item.id}`
      default: return '/'
    }
  }

  const getTypeBadge = (resultType: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      property: { bg: 'bg-teal-100', text: 'text-teal-700', label: '房源' },
      live: { bg: 'bg-red-100', text: 'text-red-700', label: '直播' },
      case: { bg: 'bg-amber-100', text: 'text-amber-700', label: '装修案例' },
      content: { bg: 'bg-blue-100', text: 'text-blue-700', label: '内容' },
    }
    const c = config[resultType] || config.property
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    )
  }

  const getResultImage = (item: any) => {
    switch (item.result_type) {
      case 'property': return item.images?.[0]
      case 'live': return item.cover_image
      case 'case': return item.cover_image
      case 'content': return item.media_urls?.[0]
      default: return null
    }
  }

  const getResultTitle = (item: any) => {
    switch (item.result_type) {
      case 'property': return item.title
      case 'live': return item.title
      case 'case': return item.title
      case 'content': return item.title
      default: return item.title
    }
  }

  const getResultSubtitle = (item: any) => {
    switch (item.result_type) {
      case 'property': return `${item.city} · ${item.district} · ${item.layout} · ${item.area}㎡`
      case 'live': return `${item.host_name || item.publisher_name} · ${item.viewer_count || 0}人观看`
      case 'case': return `${item.style} · ${item.budget || ''} · ${item.area || ''}`
      case 'content': return item.author_name || item.author
      default: return ''
    }
  }

  const getResultPrice = (item: any) => {
    if (item.result_type === 'property') {
      return item.listing_type === 'rent'
        ? `¥${(item.price / 10000).toFixed(1)}万/月`
        : `¥${(item.price / 10000).toFixed(0)}万`
    }
    if (item.result_type === 'case' && item.budget) {
      return `预算 ${item.budget}`
    }
    return null
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0">
              <ArrowLeft size={20} strokeWidth={1.5} />
            </Link>
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} strokeWidth={1.5} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="搜索房源、直播、装修案例、内容..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <SearchIcon size={18} strokeWidth={1.5} />}
              搜索
            </button>
          </form>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {typeTabs.map(({ value, label, icon: Icon, countKey }) => {
              const count = countKey === 'total' ? total : breakdown[countKey as keyof typeof breakdown]
              return (
                <button
                  key={value}
                  onClick={() => handleTypeChange(value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                    type === value
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    type === value ? 'bg-white/20' : 'bg-slate-200'
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {q ? (
          <div className="mb-6 text-sm text-slate-500">
            搜索 "<span className="font-medium text-slate-900">{q}</span>" 共找到 <span className="font-medium text-teal-600">{total}</span> 条结果
          </div>
        ) : (
          <div className="mb-6 text-sm text-slate-500">
            为您推荐 <span className="font-medium text-teal-600">{total}</span> 条房源、直播、装修案例和内容，可直接切换上方分类继续查看
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-teal-600 animate-spin mb-4" />
            <p className="text-slate-500">正在搜索中...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item) => (
              <Link
                key={`${item.result_type}-${item.id}`}
                to={getItemLink(item)}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all card-hover"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {getResultImage(item) ? (
                    <img
                      src={stableImageUrl(getResultImage(item), getResultTitle(item))}
                      alt={getResultTitle(item)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Filter size={48} strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    {getTypeBadge(item.result_type)}
                  </div>
                  {item.result_type === 'live' && item.status === 'live' && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full live-pulse" />
                      直播中
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                    {getResultTitle(item)}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <MapPin size={14} strokeWidth={1.5} />
                    <span className="truncate">{getResultSubtitle(item)}</span>
                  </div>
                  {getResultPrice(item) && (
                    <p className="text-lg font-bold text-amber-500">{getResultPrice(item)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : q ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <SearchIcon size={40} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">未找到相关结果</h3>
            <p className="text-slate-500 mb-6">试试其他关键词，或浏览我们的推荐内容</p>
            <div className="flex gap-3">
              <Link to="/properties" className="btn-primary px-6 py-2.5">
                浏览房源
              </Link>
              <Link to="/live" className="px-6 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                观看直播
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6">
              <SearchIcon size={40} className="text-teal-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">暂无推荐结果</h3>
            <p className="text-slate-500">可输入关键词，或浏览房源、直播和装修案例</p>
          </div>
        )}
      </div>
    </div>
  )
}
