import { useState } from 'react'
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
} from 'lucide-react'

const styles = ['全部', '现代简约', '北欧', '新中式', '轻奢', '日式', '工业风']
const layouts = ['全部', '一室一厅', '两室一厅', '三室两厅', '四室两厅', 'LOFT']
const budgets = ['全部', '10万以下', '10-15万', '15-20万', '20-30万', '30万以上']

export default function Inspiration() {
  const { inspirationFilters, setInspirationFilters } = usePlatformStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)

  const filtered = mockCases.filter((c) => {
    if (inspirationFilters.style && c.style !== inspirationFilters.style) return false
    if (inspirationFilters.layout && c.layout !== inspirationFilters.layout) return false
    if (inspirationFilters.budget && c.budget !== inspirationFilters.budget) return false
    if (searchQuery && !c.title.includes(searchQuery) && !c.tags.some((t) => t.includes(searchQuery))) return false
    return true
  })

  const activeCase = selectedCase ? mockCases.find((c) => c.id === selectedCase) : null

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
            className={`btn-secondary ${showFilters ? 'ring-2 ring-brand-200' : ''}`}
          >
            <SlidersHorizontal size={16} className="mr-1.5" /> 筛选
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card mb-6 p-4 animate-slide-up">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-600 dark:text-surface-400">风格</label>
              <div className="flex flex-wrap gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInspirationFilters({ style: s === '全部' ? '' : s })}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      (s === '全部' ? !inspirationFilters.style : inspirationFilters.style === s)
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-600 dark:text-surface-400">户型</label>
              <div className="flex flex-wrap gap-2">
                {layouts.map((l) => (
                  <button
                    key={l}
                    onClick={() => setInspirationFilters({ layout: l === '全部' ? '' : l })}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      (l === '全部' ? !inspirationFilters.layout : inspirationFilters.layout === l)
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-600 dark:text-surface-400">预算</label>
              <div className="flex flex-wrap gap-2">
                {budgets.map((b) => (
                  <button
                    key={b}
                    onClick={() => setInspirationFilters({ budget: b === '全部' ? '' : b })}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      (b === '全部' ? !inspirationFilters.budget : inspirationFilters.budget === b)
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 text-sm text-surface-500">
        共找到 <span className="font-medium text-brand-600 dark:text-brand-400">{filtered.length}</span> 个案例
      </div>

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
              <div className="absolute left-3 top-3">
                <span className="badge-brand">{c.style}</span>
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
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                    <Award size={12} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-surface-700 dark:text-surface-300">{c.contractor}</div>
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="fill-warn-400 text-warn-400" />
                      <span className="text-xs text-surface-500">{c.contractorScore}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={14} className="fill-warn-400 text-warn-400" />
                  <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">{c.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">{activeCase.title}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-surface-500">
                    <MapPin size={14} /> {activeCase.layout} · {activeCase.area}
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-warn-50 px-3 py-1 dark:bg-warn-900/20">
                  <Star size={16} className="fill-warn-400 text-warn-400" />
                  <span className="font-semibold text-warn-700 dark:text-warn-300">{activeCase.rating}</span>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-800">
                  <div className="text-xs text-surface-500">风格</div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeCase.style}</div>
                </div>
                <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-800">
                  <div className="text-xs text-surface-500">预算</div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeCase.budget}</div>
                </div>
                <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-800">
                  <div className="text-xs text-surface-500">面积</div>
                  <div className="font-medium text-surface-900 dark:text-white">{activeCase.area}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {activeCase.tags.map((tag) => (
                    <span key={tag} className="badge-brand">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                    <Award size={20} className="text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900 dark:text-white">{activeCase.contractor}</div>
                    <div className="text-sm text-surface-500">施工方履约评分</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-warn-400 text-warn-400" />
                    <span className="text-lg font-bold text-surface-900 dark:text-white">{activeCase.contractorScore}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="btn-primary flex-1">
                  <Heart size={16} className="mr-1.5" /> 收藏案例
                </button>
                <button className="btn-outline flex-1">
                  咨询设计师
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
