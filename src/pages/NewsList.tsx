import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Newspaper,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  Briefcase,
  Shield,
  Building,
  Heart,
  UsersRound,
  GraduationCap,
  Flag,
  AlertCircle,
  Scale,
  Music,
  Microscope,
  Clock,
  ArrowRight,
  LogIn,
  Activity,
  CheckCircle2,
  Hourglass,
  Loader2,
  MapPin,
  ChevronDown,
  BadgeCheck,
  Landmark,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Category {
  id: number
  name: string
}

interface NewsItem {
  id: number
  title: string
  summary: string
  cover_image: string | null
  source: string
  published_at: string
  view_count: number
  category_id: number
}

interface NewsResponse {
  list: NewsItem[]
  total: number
  page: number
  pageSize: number
}

interface Region {
  code: string
  name: string
  level: number
}

const SERVICE_ENTRIES: Record<string, { icon: React.ElementType; label: string }[]> = {
  '时政要闻': [
    { icon: FileText, label: '政府工作报告' },
    { icon: Flag, label: '政策解读' },
    { icon: UserCheck, label: '人事任免' },
  ],
  '民生资讯': [
    { icon: Shield, label: '社保查询' },
    { icon: Building, label: '公积金办理' },
    { icon: Heart, label: '医保服务' },
    { icon: UsersRound, label: '户籍办理' },
  ],
  '社会热点': [
    { icon: AlertCircle, label: '举报投诉' },
    { icon: Scale, label: '消费者维权' },
    { icon: Briefcase, label: '法律援助' },
  ],
  '科教文体': [
    { icon: GraduationCap, label: '教育报名' },
    { icon: Music, label: '文体活动' },
    { icon: Microscope, label: '科技申报' },
  ],
}

const GOV_STATUS_ITEMS = [
  { id: 'GZ20260601001', label: '社保转移', status: '办理中', color: 'bg-yellow-100 text-yellow-700', region: '贵阳市', time: '2026-05-28', group: '在职职工', steps: ['已提交', '初审通过', '复审中', '办结'] , currentStep: 2 },
  { id: 'GZ20260530002', label: '公积金提取', status: '已完成', color: 'bg-green-100 text-green-700', region: '贵阳市', time: '2026-05-20', group: '城镇居民', steps: ['已提交', '初审通过', '复审通过', '已办结'], currentStep: 3 },
  { id: 'GZ20260602003', label: '户籍迁移', status: '待提交', color: 'bg-gray-100 text-gray-600', region: '遵义市', time: '-', group: '常住人口', steps: ['待提交', '初审', '复审', '办结'], currentStep: -1 },
  { id: 'GZ20260529004', label: '医保报销', status: '审核中', color: 'bg-blue-100 text-blue-700', region: '毕节市', time: '2026-05-29', group: '城乡居民', steps: ['已提交', '初审通过', '复审中', '办结'], currentStep: 2 },
]

const ACTIVITIES = [
  { title: '2026年贵州省公务员招录考试报名', status: '报名中', statusColor: 'bg-green-100 text-green-700' },
  { title: '贵阳市2026年度社保缴费基数调整', status: '进行中', statusColor: 'bg-blue-100 text-blue-700' },
  { title: '贵州省居民医保集中征缴期', status: '即将开始', statusColor: 'bg-yellow-100 text-yellow-700' },
]

function getSourceBadge(source: string) {
  if (source === '百姓关注' || source === '贵州广播电视台') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium"><BadgeCheck className="w-3 h-3" />权威发布</span>
  }
  if (source.includes('政府') || source.includes('官方')) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium"><Landmark className="w-3 h-3" />官方消息</span>
  }
  return null
}

export default function NewsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { isLoggedIn } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [regions, setRegions] = useState<Region[]>([])
  const [regionOpen, setRegionOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')

  const categoryId = searchParams.get('category_id') || ''
  const page = Number(searchParams.get('page') || '1')
  const selectedRegion = searchParams.get('region') || ''

  const currentCategoryName = useMemo(() => {
    if (!categoryId) return '全部'
    return categories.find(c => String(c.id) === categoryId)?.name || '全部'
  }, [categoryId, categories])

  const activeServiceEntries = useMemo(() => {
    if (currentCategoryName === '全部') {
      return Object.values(SERVICE_ENTRIES).flat()
    }
    return SERVICE_ENTRIES[currentCategoryName] || Object.values(SERVICE_ENTRIES).flat()
  }, [currentCategoryName])

  useEffect(() => {
    api.get<Category[]>('/categories?type=news').then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    api.get<Region[]>('/regions').then((data) => {
      setRegions(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', '12')
    if (categoryId) params.set('category_id', categoryId)
    if (selectedRegion) params.set('region', selectedRegion)
    const kw = searchParams.get('keyword')
    if (kw) params.set('keyword', kw)
    api.get<NewsResponse>(`/news?${params.toString()}`).then((data) => {
      setNews(data.list)
      setTotalPages(Math.ceil(data.total / data.pageSize))
    }).catch(() => {})
  }, [page, categoryId, selectedRegion, searchParams])

  useEffect(() => {
    const handleClickOutside = () => setRegionOpen(false)
    if (regionOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [regionOpen])

  const handleCategoryChange = (id: string) => {
    const params = new URLSearchParams(searchParams)
    if (id) {
      params.set('category_id', id)
    } else {
      params.delete('category_id')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleRegionChange = (code: string) => {
    const params = new URLSearchParams(searchParams)
    if (code) {
      params.set('region', code)
    } else {
      params.delete('region')
    }
    params.set('page', '1')
    setSearchParams(params)
    setRegionOpen(false)
  }

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (keyword.trim()) {
      params.set('keyword', keyword.trim())
    } else {
      params.delete('keyword')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
    window.scrollTo(0, 0)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          <Link to="/" className="hover:text-blue-600">首页</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">政务资讯</span>
        </div>
        <h1 className="text-2xl font-bold">政务资讯</h1>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-red-600" />
          <span className="text-sm font-semibold text-red-800">
            {currentCategoryName === '全部' ? '便民服务入口' : `${currentCategoryName} · 相关服务`}
          </span>
        </div>
        <div className={`grid gap-3 ${currentCategoryName === '全部' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'}`}>
          {activeServiceEntries.map((entry, i) => (
            <a
              key={`${entry.label}-${i}`}
              href="#"
              className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-lg border border-red-100 hover:border-red-300 hover:shadow-sm transition-all group"
            >
              <entry.icon className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-xs text-gray-700 group-hover:text-red-700 font-medium truncate">{entry.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap pb-2">
            <button
              onClick={() => handleCategoryChange('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!categoryId ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(String(cat.id))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoryId === String(cat.id) ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 items-center">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setRegionOpen(!regionOpen) }}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <span className={selectedRegion ? 'text-gray-900' : 'text-gray-500'}>
                {selectedRegion ? regions.find(r => r.code === selectedRegion)?.name || '选择地区' : '选择地区'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
            </button>
            {regionOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px] max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleRegionChange('')}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!selectedRegion ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                >
                  全部地区
                </button>
                {regions.map((region) => (
                  <button
                    key={region.code}
                    onClick={() => handleRegionChange(region.code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedRegion === region.code ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索资讯..."
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {news.length === 0 ? (
            <div className="text-center py-20 text-gray-400">暂无资讯</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item) => {
                const catName = categories.find(c => c.id === item.category_id)?.name
                const badge = getSourceBadge(item.source)
                const isGovRelated = item.source.includes('政府') || item.source.includes('官方') || item.source === '百姓关注'
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="h-44 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center relative">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <Newspaper className="w-12 h-12 text-red-300" />
                      )}
                      {badge && (
                        <span className="absolute top-3 left-3">{badge}</span>
                      )}
                      {catName && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 text-xs rounded-full bg-white/90 text-gray-700 font-medium">{catName}</span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                      {item.summary && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.summary}</p>
                      )}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                          <div className="flex items-center gap-3">
                            {item.source && <span>{item.source}</span>}
                            <span>{item.published_at}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{item.view_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/news/${item.id}`}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            阅读详情 <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          {isGovRelated && (
                            <a
                              href="#"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              在线办理 <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="lg:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              政务办理状态
            </h3>
            {isLoggedIn ? (
              <div className="space-y-4">
                {GOV_STATUS_ITEMS.map((item) => (
                  <div key={item.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${item.color}`}>{item.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">受理编号: {item.id} · 受理时间: {item.time}</p>
                    <div className="flex items-center gap-1 mb-2">
                      {item.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${i <= item.currentStep ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                              {i < item.currentStep ? '✓' : i + 1}
                            </div>
                            <span className={`text-[9px] mt-0.5 ${i <= item.currentStep ? 'text-gray-700' : 'text-gray-400'}`}>{step}</span>
                          </div>
                          {i < item.steps.length - 1 && (
                            <div className={`w-4 h-0.5 mb-3 ${i < item.currentStep ? 'bg-red-600' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-blue-50 text-blue-600">
                        <MapPin className="w-2.5 h-2.5" />{item.region}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-purple-50 text-purple-600">
                        <UsersRound className="w-2.5 h-2.5" />{item.group}
                      </span>
                    </div>
                    <a href="#" className="text-xs text-red-600 hover:underline">
                      {item.currentStep >= item.steps.length - 1 ? '查看复查记录 →' : '跟踪进度 →'}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <LogIn className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">登录后查看您的政务办理状态</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  <LogIn className="w-4 h-4" />
                  立即登录
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              服务地区和人群
            </h3>
            <div className="mb-3">
              <span className="text-xs text-gray-500 block mb-1.5">地区筛选</span>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setRegionOpen(!regionOpen) }}
                  className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 transition-colors"
                >
                  <span className={selectedRegion ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedRegion ? regions.find(r => r.code === selectedRegion)?.name || '全部地区' : '全部地区'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
                </button>
                {regionOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-full max-h-48 overflow-y-auto">
                    <button
                      onClick={() => handleRegionChange('')}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${!selectedRegion ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                    >
                      全部地区
                    </button>
                    {regions.map((region) => (
                      <button
                        key={region.code}
                        onClick={() => handleRegionChange(region.code)}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${selectedRegion === region.code ? 'text-red-600 font-medium' : 'text-gray-700'}`}
                      >
                        {region.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1.5">人群适配</span>
              <div className="flex flex-wrap gap-1.5">
                {['', '职工', '居民', '老年人', '青少年', '农村居民'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${selectedGroup === g ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {g || '全部人群'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              近期政务活动
            </h3>
            <div className="space-y-4">
              {ACTIVITIES.map((item) => (
                <div key={item.title} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <h4 className="text-sm text-gray-800 font-medium mb-1.5 line-clamp-2">{item.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${item.statusColor}`}>{item.status}</span>
                    <a href="#" className="text-xs text-red-600 hover:underline">了解详情 →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              办事复查记录
            </h3>
            <div className="space-y-0">
              <div className="flex gap-3 pb-3 relative">
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                </div>
                <div className="pb-3">
                  <p className="text-xs text-gray-800 font-medium">社保转移申请已受理</p>
                  <p className="text-[10px] text-gray-400">2026-05-28 09:30</p>
                </div>
              </div>
              <div className="flex gap-3 pb-3 relative">
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                </div>
                <div className="pb-3">
                  <p className="text-xs text-gray-800 font-medium">初审材料审核通过</p>
                  <p className="text-[10px] text-gray-400">2026-05-29 14:15</p>
                </div>
              </div>
              <div className="flex gap-3 pb-3 relative">
                <div className="flex flex-col items-center">
                  <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                  <div className="w-px flex-1 bg-gray-200 mt-1" />
                </div>
                <div className="pb-3">
                  <p className="text-xs text-gray-800 font-medium">复审进入省社保中心</p>
                  <p className="text-[10px] text-gray-400">2026-05-30 10:00</p>
                </div>
              </div>
              <div className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
                </div>
                <div>
                  <p className="text-xs text-gray-800 font-medium">等待最终审批</p>
                  <p className="text-[10px] text-gray-400">2026-06-01 08:45</p>
                </div>
              </div>
            </div>
            <a href="#" className="block text-xs text-red-600 hover:underline mt-3">查看全部记录 →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
