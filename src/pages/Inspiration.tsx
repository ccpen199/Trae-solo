import { useState, useMemo } from 'react'
import { mockCases } from '@/store/platformStore'
import { usePlatformStore } from '@/store/platformStore'
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Ruler,
  Wallet,
  Award,
  Heart,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Building,
  TrendingUp,
  Info,
} from 'lucide-react'

const styles = ['全部', '现代简约', '北欧', '新中式', '轻奢', '日式', '工业风']
const layouts = ['全部', '一室一厅', '两室一厅', '三室两厅', '四室两厅', 'LOFT']
const budgets = ['全部', '10万以下', '10-15万', '15-20万', '20-30万', '30万以上']

export default function Inspiration() {
  const { inspirationFilters, setInspirationFilters } = usePlatformStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [showScoreHint, setShowScoreHint] = useState(false)

  const activeFilters = useMemo(() => {
    const list: string[] = []
    if (inspirationFilters.style) list.push(inspirationFilters.style)
    if (inspirationFilters.layout) list.push(inspirationFilters.layout)
    if (inspirationFilters.budget) list.push(inspirationFilters.budget)
    return list
  }, [inspirationFilters])

  const filtered = useMemo(() => {
    return mockCases.filter((c) => {
      if (inspirationFilters.style && c.style !== inspirationFilters.style) return false
      if (inspirationFilters.layout && c.layout !== inspirationFilters.layout) return false
      if (inspirationFilters.budget && c.budget !== inspirationFilters.budget) return false
      if (searchQuery && !c.title.includes(searchQuery) && !c.tags.some((t) => t.includes(searchQuery))) return false
      return true
    })
  }, [inspirationFilters, searchQuery])

  const activeCase = selectedCase ? mockCases.find((c) => c.id === selectedCase) : null

  const resetFilters = () => {
    setInspirationFilters({ style: '', layout: '', budget: '' })
    setSearchQuery('')
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">灵感库</h1>
          <p className="mt-1 text-surface-500">按户型/预算/风格筛选真实完工案例，关联施工方履约评分</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="搜索案例、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'ring-2 ring-brand-200 dark:ring-brand-800' : ''}`}
          >
            <SlidersHorizontal size={16} className="mr-1.5" /> 筛选
            {activeFilters.length > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-6 p-5 animate-slide-up">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                装修风格
              </label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => {
                  const isActive = s === '全部' ? !inspirationFilters.style : inspirationFilters.style === s
                  return (
                    <button
                      key={s}
                      onClick={() => setInspirationFilters({ style: s === '全部' ? '' : s })}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                户型结构
              </label>
              <div className="flex flex-wrap gap-2">
                {layouts.map((l) => {
                  const isActive = l === '全部' ? !inspirationFilters.layout : inspirationFilters.layout === l
                  return (
                    <button
                      key={l}
                      onClick={() => setInspirationFilters({ layout: l === '全部' ? '' : l })}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                预算区间
              </label>
              <div className="flex flex-wrap gap-2">
                {budgets.map((b) => {
                  const isActive = b === '全部' ? !inspirationFilters.budget : inspirationFilters.budget === b
                  return (
                    <button
                      key={b}
                      onClick={() => setInspirationFilters({ budget: b === '全部' ? '' : b })}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {b}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-4 dark:border-surface-700">
            <div className="text-sm text-surface-500">
              已选条件：
              {activeFilters.length > 0 ? (
                <>
                  {activeFilters.map((f, i) => (
                    <span key={f} className="mx-1 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {f}
                    </span>
                  ))}
                </>
              ) : (
                <span className="text-surface-400">全部</span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-surface-500 hover:text-brand-600 dark:hover:text-brand-400"
            >
              重置筛选
            </button>
          </div>
        </div>
      )}

      {!showFilters && activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-surface-500">已选:</span>
          {activeFilters.map((f) => (
            <span key={f} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-surface-500">
          共找到 <span className="font-semibold text-brand-600 dark:text-brand-400">{filtered.length}</span> 个
          <span className="mx-1 text-surface-400">·</span>
          <span className="text-surface-600 dark:text-surface-400">真实完工案例</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <button
            onClick={() => setShowScoreHint(!showScoreHint)}
            className="flex items-center gap-1"
          >
            <Info size={12} />
            评分口径说明
          </button>
        </div>
      </div>

      {showScoreHint && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 animate-slide-up">
          <div className="font-medium mb-1">施工方履约评分口径</div>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>完工案例数：该施工方在平台完成的全案交付数量</li>
            <li>准时交付率：按合同约定时间交付的比例，权重占比40%</li>
            <li>业主满意度：业主验收后综合评分，权重占比30%</li>
            <li>工艺合格率：质检节点一次性通过率，权重占比20%</li>
            <li>售后服务：质保期内问题响应及解决效率，权重占比10%</li>
          </ul>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="card group cursor-pointer overflow-hidden"
              onClick={() => setSelectedCase(c.id)}
            >
              <div className="relative h-48 overflow-hidden bg-surface-100 dark:bg-surface-700">
                <img
                  src={c.imageUrl}
                  alt={c.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-surface-700 backdrop-blur-sm">
                    <Heart size={14} />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-surface-700 backdrop-blur-sm">
                    <Eye size={14} />
                  </button>
                </div>
                <div className="absolute left-3 top-3 flex flex-col gap-1">
                  <span className="badge-brand">{c.style}</span>
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-surface-600 backdrop-blur-sm dark:bg-surface-800/90 dark:text-surface-300">
                    真实案例 · {c.completedDate}
                  </span>
                </div>
                <div className="absolute right-3 top-3">
                  <div className="flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 backdrop-blur-sm dark:bg-surface-800/90">
                    <Star size={11} className="fill-warn-400 text-warn-400" />
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">{c.rating}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2 font-semibold text-surface-900 dark:text-white">{c.title}</h3>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {c.tags.map((tag) => (
                    <span key={tag} className="rounded bg-surface-100 px-2 py-0.5 text-xs text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-surface-500">
                  <div className="flex items-center gap-1">
                    <Ruler size={12} /> {c.area} · {c.layout}
                  </div>
                  <div className="flex items-center gap-1">
                    <Wallet size={12} /> {c.budget}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3 dark:border-surface-700">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                        <Building size={14} className="text-brand-600 dark:text-brand-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-accent-500 text-[10px] font-bold text-white dark:border-surface-800">
                        <CheckCircle2 size={10} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-surface-700 dark:text-surface-300">{c.contractor}</div>
                      <div className="flex items-center gap-1 text-[10px] text-surface-500">
                        <Clock size={10} /> {c.contractorCompletedCases}个案例
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="fill-warn-400 text-warn-400" />
                      <span className="text-sm font-bold text-surface-700 dark:text-surface-300">{c.contractorScore}</span>
                    </div>
                    <div className="text-[10px] text-surface-400">履约评分</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700">
            <Search size={28} className="text-surface-400" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-surface-900 dark:text-white">未找到匹配的案例</h3>
          <p className="mb-4 text-sm text-surface-500">
            当前筛选条件下没有符合的真实完工案例
          </p>
          <button
            onClick={resetFilters}
            className="btn-outline"
          >
            重置筛选条件
          </button>
        </div>
      )}

      {activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedCase(null)}>
          <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 bg-surface-100 dark:bg-surface-700">
              <img src={activeCase.imageUrl} alt={activeCase.title} className="h-full w-full object-cover" />
              <button
                onClick={() => setSelectedCase(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
              >
                <X size={16} />
              </button>
              <div className="absolute left-3 bottom-3">
                <span className="badge-brand">{activeCase.style}</span>
                <span className="ml-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-surface-600 backdrop-blur-sm dark:bg-surface-800/90 dark:text-surface-300">
                  真实完工案例
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">{activeCase.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-surface-500">
                    <MapPin size={14} /> {activeCase.layout} · {activeCase.area} · {activeCase.budget}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 rounded-lg bg-warn-50 px-3 py-1 dark:bg-warn-900/20">
                    <Star size={16} className="fill-warn-400 text-warn-400" />
                    <span className="font-semibold text-warn-700 dark:text-warn-300">{activeCase.rating}</span>
                    <span className="text-xs text-warn-600 dark:text-warn-400">业主评分</span>
                  </div>
                  <div className="text-xs text-surface-400">
                    <Clock size={10} className="inline mr-1" />
                    完工时间: {activeCase.completedDate}
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-800">
                  <div className="text-xs text-surface-500">装修风格</div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeCase.style}</div>
                </div>
                <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-800">
                  <div className="text-xs text-surface-500">预算区间</div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeCase.budget}</div>
                </div>
                <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-800">
                  <div className="text-xs text-surface-500">建筑面积</div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeCase.area}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">设计标签</h3>
                <div className="flex flex-wrap gap-2">
                  {activeCase.tags.map((tag) => (
                    <span key={tag} className="badge-brand">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <Award size={16} className="text-brand-600 dark:text-brand-400" />
                    施工方履约信息
                  </h3>
                  <span className="text-xs text-brand-600 dark:text-brand-400">
                    <CheckCircle2 size={10} className="inline mr-0.5" />
                    平台认证施工方
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-brand-700 dark:text-brand-300">{activeCase.contractorScore}</div>
                    <div className="text-xs text-surface-500">综合履约分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-surface-700 dark:text-surface-300">{activeCase.contractorCompletedCases}</div>
                    <div className="text-xs text-surface-500">完工案例数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-accent-600 dark:text-accent-400">{activeCase.contractorOnTimeRate}%</div>
                    <div className="text-xs text-surface-500">准时交付率</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-brand-200 pt-3 dark:border-brand-700">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{activeCase.contractor}</span>
                  <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
                    查看全部案例 <TrendingUp size={12} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="btn-primary flex-1">
                  <Heart size={16} className="mr-1.5" /> 收藏案例
                </button>
                <button className="btn-outline flex-1">
                  预约同款设计
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
