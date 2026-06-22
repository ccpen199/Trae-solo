import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Map, Calculator, Shuffle, MessageSquareWarning, Search, LayoutDashboard, UserRound, X } from 'lucide-react'
import { Building, FeedItem } from '@/types'
import { api } from '@/utils/api'
import BuildingCard from '@/components/BuildingCard'
import Loading from '@/components/Loading'
import { heroBannerImage } from '@/utils/visuals'

const quickTools = [
  { icon: Map, label: '地图找房', path: '/map', color: 'bg-brand' },
  { icon: Calculator, label: '购房计算器', path: '/calculator', color: 'bg-brand' },
  { icon: Shuffle, label: '摇号报名', path: '/lottery/demo', color: 'bg-brand' },
  { icon: MessageSquareWarning, label: '黑猫投诉', path: '/complaint', color: 'bg-brand' },
  { icon: UserRound, label: '个人中心', path: '/my', color: 'bg-brand' },
  { icon: LayoutDashboard, label: '后台管理', path: '/admin', color: 'bg-brand' },
]

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKeyword, setActiveKeyword] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const buildingListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [buildingsRes, feedRes] = await Promise.all([
          api.getBuildings(),
          api.getFeed(),
        ])
        setBuildings(buildingsRes.data || [])
        setFeedItems(feedRes.data || [])
      } catch {
        setBuildings([])
        setFeedItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const executeSearch = async () => {
    const keyword = searchQuery.trim()
    if (!keyword) return
    setSearchLoading(true)
    try {
      const buildingsRes = await api.getBuildings({ keyword })
      setBuildings(buildingsRes.data || [])
      setActiveKeyword(keyword)
    } catch {
      setBuildings([])
    } finally {
      setSearchLoading(false)
    }
    setTimeout(() => {
      buildingListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch()
    }
  }

  const clearSearch = async () => {
    setSearchQuery('')
    setActiveKeyword('')
    setSearchLoading(true)
    try {
      const buildingsRes = await api.getBuildings()
      setBuildings(buildingsRes.data || [])
    } catch {
      setBuildings([])
    } finally {
      setSearchLoading(false)
    }
  }

  const computeMatchHighlights = (building: Building, keyword: string) => {
    if (!keyword) return undefined
    const normalized = keyword.toLowerCase()
    return {
      name: building.name.toLowerCase().includes(normalized),
      district: building.district.toLowerCase().includes(normalized),
      developer: building.developer.toLowerCase().includes(normalized),
    }
  }

  if (loading) return <Loading />

  const buildingNameMap = Object.fromEntries(buildings.map(b => [b.id, b.name]))
  const isSearchActive = activeKeyword.length > 0

  return (
    <div>
      <section className="relative h-[480px] md:h-[560px] overflow-hidden">
        <img
          src={heroBannerImage}
          alt="hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/50 to-brand/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-up">
            居易 — 发现理想新居
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            一站式房产信息平台，从选房到签约的全流程服务
          </p>
          <div className="w-full max-w-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden">
              <Search size={20} className="text-charcoal/40 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索楼盘名称、区域、开发商..."
                className="flex-1 px-4 py-4 text-charcoal placeholder:text-charcoal/40 outline-none text-base"
              />
              <button
                onClick={executeSearch}
                disabled={searchLoading}
                className="bg-brand text-white px-6 py-4 font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                搜索
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <section ref={buildingListRef}>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">
                {isSearchActive ? '搜索结果' : '热门楼盘'}
              </h2>
              <p className="mt-2 text-sm text-charcoal/55">
                {isSearchActive
                  ? `关键词：${activeKeyword} · 共找到 ${buildings.length} 个楼盘`
                  : `共收录 ${buildings.length} 个在售与待开项目`}
              </p>
            </div>
            {isSearchActive && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-charcoal/70 bg-charcoal/5 rounded-lg hover:bg-charcoal/10 transition-colors"
              >
                <X size={16} />
                清空搜索
              </button>
            )}
          </div>
          {searchLoading ? (
            <Loading />
          ) : buildings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildings.map((building) => (
                <BuildingCard
                  key={building.id}
                  building={building}
                  matchHighlights={computeMatchHighlights(building, activeKeyword)}
                />
              ))}
            </div>
          ) : (
            <div className="card p-10 text-center text-charcoal/55">
              未找到匹配的楼盘，请尝试输入区域、楼盘名或开发商关键词。
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title mb-6">快捷工具</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className="card p-6 flex flex-col items-center gap-3 group hover:shadow-lg"
                >
                  <div className="w-14 h-14 bg-brand rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-gold font-semibold text-sm">{tool.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="section-title mb-6">探盘动态</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin">
            {feedItems.map((item) => (
              <div
                key={item.id}
                className="card p-4 min-w-[280px] max-w-[280px] shrink-0 snap-start"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-serif font-semibold text-sm">
                      {item.source?.charAt(0) || '平'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-charcoal font-medium text-sm truncate">{item.source}</p>
                    <p className="text-charcoal/50 text-xs">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
                <h4 className="text-charcoal font-medium text-sm mb-1 line-clamp-2">{item.title}</h4>
                <p className="text-gold text-xs font-medium">{buildingNameMap[item.buildingId] || item.type}</p>
              </div>
            ))}
            {feedItems.length === 0 && (
              <p className="text-charcoal/50 text-sm py-8">暂无动态</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
