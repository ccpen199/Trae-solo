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
  Info,
  Clock,
  CheckCircle2,
  Building,
  TrendingUp,
  User,
  Home,
  BadgeCheck,
  ChevronRight,
  ThumbsUp,
  ShieldCheck,
  Headphones,
} from 'lucide-react'

const styles = ['全部', '现代简约', '北欧', '新中式', '轻奢', '日式', '工业风']
const layouts = ['全部', '一室一厅', '两室一厅', '三室两厅', '四室两厅', 'LOFT']
const budgets = ['全部', '10万以下', '10-15万', '15-20万', '20-30万', '30万以上']

export default function Inspiration() {
  const { inspirationFilters, setInspirationFilters } = usePlatformStore()
  const [searchQuery, setSearchQuery] = useState('')
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
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">灵感库</h1>
          <p className="mt-1 text-surface-500">按户型/预算/风格筛选真实完工案例，关联施工方履约评分</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="搜索案例、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 w-56"
            />
          </div>
          <div className="btn-secondary cursor-default flex items-center">
            <SlidersHorizontal size={16} className="mr-1.5 text-brand-500" />
            <span className="text-brand-600 font-medium">筛选</span>
            {activeFilters.length > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                {activeFilters.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-6 p-5 animate-slide-up border-l-4 border-l-brand-500">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            已选筛选条件
            {activeFilters.length === 0 ? (
              <span className="ml-2 text-surface-400 font-normal">（未设置，展示全部案例）</span>
            ) : (
              activeFilters.map((f, i) => (
                <span key={f} className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {f}
                </span>
              ))
            )}
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-surface-500 hover:text-brand-600 dark:hover:text-brand-400"
          >
            一键重置
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200 flex items-center gap-1">
              <Award size={14} className="text-amber-500" /> 装修风格
            </label>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => {
                const isActive = s === '全部' ? !inspirationFilters.style : inspirationFilters.style === s
                const hitCount = s === '全部' ? mockCases.length : mockCases.filter((c) => c.style === s).length
                return (
                  <button
                    key={s}
                    onClick={() => setInspirationFilters({ style: s === '全部' ? '' : s })}
                    className={`group rounded-lg px-3 py-1.5 text-sm font-medium transition-all border-2 ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                        : 'bg-white text-surface-700 border-surface-200 hover:border-brand-300 hover:bg-brand-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-600 dark:hover:border-brand-600'
                    }`}
                  >
                    {s}
                    <span className={`ml-1 text-[10px] px-1 rounded ${
                      isActive ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                    }`}>
                      {hitCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200 flex items-center gap-1">
              <Home size={14} className="text-brand-500" /> 户型结构
            </label>
            <div className="flex flex-wrap gap-2">
              {layouts.map((l) => {
                const isActive = l === '全部' ? !inspirationFilters.layout : inspirationFilters.layout === l
                const hitCount = l === '全部' ? mockCases.length : mockCases.filter((c) => c.layout === l).length
                return (
                  <button
                    key={l}
                    onClick={() => setInspirationFilters({ layout: l === '全部' ? '' : l })}
                    className={`group rounded-lg px-3 py-1.5 text-sm font-medium transition-all border-2 ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                        : 'bg-white text-surface-700 border-surface-200 hover:border-brand-300 hover:bg-brand-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-600 dark:hover:border-brand-600'
                    }`}
                  >
                    {l}
                    <span className={`ml-1 text-[10px] px-1 rounded ${
                      isActive ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                    }`}>
                      {hitCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200 flex items-center gap-1">
              <Wallet size={14} className="text-accent-500" /> 预算区间
            </label>
            <div className="flex flex-wrap gap-2">
              {budgets.map((b) => {
                const isActive = b === '全部' ? !inspirationFilters.budget : inspirationFilters.budget === b
                const hitCount = b === '全部' ? mockCases.length : mockCases.filter((c) => c.budget === b).length
                return (
                  <button
                    key={b}
                    onClick={() => setInspirationFilters({ budget: b === '全部' ? '' : b })}
                    className={`group rounded-lg px-3 py-1.5 text-sm font-medium transition-all border-2 ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                        : 'bg-white text-surface-700 border-surface-200 hover:border-brand-300 hover:bg-brand-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-600 dark:hover:border-brand-600'
                    }`}
                  >
                    {b}
                    <span className={`ml-1 text-[10px] px-1 rounded ${
                      isActive ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-700 text-surface-500'
                    }`}>
                      {hitCount}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-surface-500">
          筛选结果：共找到
          <span className="mx-1.5 text-lg font-bold text-brand-600 dark:text-brand-400">
            {filtered.length}
          </span>
          个
          <span className="mx-1 text-surface-600 dark:text-surface-400">真实完工案例</span>
          {activeFilters.length > 0 && (
            <span className="text-surface-400">（匹配 {activeFilters.join(' + ')}）</span>
          )}
        </div>
        <button
          onClick={() => setShowScoreHint(!showScoreHint)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            showScoreHint ? 'text-brand-600 dark:text-brand-400 font-medium' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Info size={13} />
          施工方履约评分口径
          <ChevronRight size={12} className={`transition-transform ${showScoreHint ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {showScoreHint && (
        <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/80 p-4 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-200 animate-slide-up">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400" />
            施工方履约评分体系（5维度加权）
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {[
              { name: '准时交付率', weight: '40%', icon: Clock, hint: '按合同约定时间交付比例' },
              { name: '业主满意度', weight: '30%', icon: ThumbsUp, hint: '业主验收后综合评分' },
              { name: '质检通过率', weight: '20%', icon: BadgeCheck, hint: '各节点一次性通过比例' },
              { name: '售后响应', weight: '10%', icon: Headphones, hint: '质保期问题解决效率' },
              { name: '完工案例数', weight: '参考', icon: Building, hint: '平台全案交付数量' },
            ].map((d) => (
              <div key={d.name} className="rounded-lg bg-white/70 dark:bg-surface-800/50 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <d.icon size={12} className="text-brand-600 dark:text-brand-400" />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {d.weight}
                  </span>
                </div>
                <div className="text-[10px] text-brand-600/80 dark:text-brand-300/80">{d.hint}</div>
              </div>
            ))}
          </div>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="badge-brand shadow">{c.style}</span>
                    <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-surface-700 backdrop-blur shadow">
                      ✓ 真实案例 · 完工 {c.completedDate.slice(5)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 shadow backdrop-blur">
                      <Star size={10} className="fill-warn-400 text-warn-400" />
                      <span className="text-xs font-bold text-surface-700">{c.rating}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow backdrop-blur">
                        <Heart size={13} />
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-brand-600 shadow backdrop-blur">
                        <Eye size={13} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="font-semibold text-surface-900 dark:text-white leading-snug">{c.title}</h3>
                </div>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {c.tags.map((tag) => (
                    <span key={tag} className="rounded bg-surface-100 px-2 py-0.5 text-[11px] text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-surface-500 mb-3 pb-3 border-b border-surface-100 dark:border-surface-700">
                  <div className="flex items-center gap-1">
                    <Ruler size={10} /> {c.area}
                  </div>
                  <div className="flex items-center gap-1">
                    <Home size={10} /> {c.layout}
                  </div>
                  <div className="flex items-center gap-1">
                    <Wallet size={10} /> {c.budget}
                  </div>
                </div>

                <div className="mb-2 rounded-lg bg-gradient-to-br from-surface-50 to-brand-50/40 dark:from-surface-800 dark:to-brand-900/10 p-2.5 border border-surface-100 dark:border-surface-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                        <Building size={11} className="text-brand-600 dark:text-brand-400" />
                      </div>
                      <span className="text-xs font-medium text-surface-800 dark:text-surface-200 truncate max-w-[100px]">{c.contractor}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star size={11} className="fill-warn-400 text-warn-400" />
                      <span className="text-sm font-bold text-surface-800 dark:text-surface-200">{c.contractorScore}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '交付', value: c.contractorOnTimeRate, unit: '%' },
                      { label: '满意', value: c.contractorSatisfaction, unit: '%' },
                      { label: '质检', value: c.contractorQualityPass, unit: '%' },
                      { label: '售后', value: c.contractorAfterSale, unit: '%' },
                    ].map((dim) => (
                      <div key={dim.label} className="text-center">
                        <div className="text-[11px] font-bold text-brand-700 dark:text-brand-300">{dim.value}</div>
                        <div className="text-[9px] text-surface-500">{dim.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-surface-500">
                    <User size={10} /> 项目经理 {c.projectManager}
                  </div>
                  <div className="flex items-center gap-1 text-brand-600 font-medium dark:text-brand-400">
                    查看案例详情 <ChevronRight size={10} />
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
          <h3 className="mb-1 text-lg font-semibold text-surface-900 dark:text-white">
            该条件下暂无匹配的真实完工案例
          </h3>
          <p className="mb-5 text-sm text-surface-500">
            建议放宽筛选条件，或更换风格/户型/预算的组合
            {activeFilters.length > 0 && (
              <span className="block mt-1">
                当前条件：{activeFilters.join(' + ')}
              </span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => setInspirationFilters({ style: '北欧' })}
              className="btn-secondary text-sm"
            >
              试试北欧风格
            </button>
            <button
              onClick={() => setInspirationFilters({ layout: '两室一厅', budget: '10-15万' })}
              className="btn-outline text-sm"
            >
              两室一厅 10-15万
            </button>
            <button
              onClick={resetFilters}
              className="btn-primary text-sm"
            >
              重置全部筛选
            </button>
          </div>
        </div>
      )}

      {activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={() => setSelectedCase(null)}>
          <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-72 bg-surface-100 dark:bg-surface-700">
              <img src={activeCase.imageUrl} alt={activeCase.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
              <button
                onClick={() => setSelectedCase(null)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur hover:bg-black/50 transition"
              >
                <X size={18} />
              </button>
              <div className="absolute left-5 bottom-5 right-5">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1.5">{activeCase.title}</h2>
                    <div className="flex items-center gap-3 text-white/85 text-sm">
                      <span className="flex items-center gap-1"><MapPin size={13} /> {activeCase.layout}</span>
                      <span className="flex items-center gap-1"><Ruler size={13} /> {activeCase.area}</span>
                      <span className="flex items-center gap-1"><Wallet size={13} /> 预算 {activeCase.budget}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 rounded-xl bg-white/20 backdrop-blur px-3 py-1.5">
                      <Star size={16} className="fill-warn-400 text-warn-400" />
                      <span className="text-lg font-bold text-white">{activeCase.rating}</span>
                    </div>
                    <div className="text-xs text-white/70 mt-1">业主评分 · 完工 {activeCase.completedDate}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '实际造价', value: activeCase.actualBudget, color: 'text-brand-600' },
                  { label: '施工周期', value: activeCase.projectDuration, color: 'text-accent-600' },
                  { label: '项目经理', value: activeCase.projectManager, color: 'text-purple-600' },
                  { label: '建筑面积', value: activeCase.area, color: 'text-amber-600' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-surface-50 p-3 text-center dark:bg-surface-800">
                    <div className={`text-base font-bold ${item.color} dark:${item.color.replace('text-', 'text-').replace('600', '400')}`}>
                      {item.value}
                    </div>
                    <div className="text-[11px] text-surface-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2.5">设计亮点</h4>
                <div className="flex flex-wrap gap-2">
                  {activeCase.tags.map((tag) => (
                    <span key={tag} className="badge-brand text-xs">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-5 dark:border-brand-800 dark:from-brand-900/20 dark:to-surface-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={18} className="text-brand-600 dark:text-brand-400" />
                    施工方履约档案
                  </h4>
                  <span className="badge-accent">平台认证</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-surface-500 mb-1">施工单位</div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                        <Building size={16} className="text-brand-600 dark:text-brand-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-surface-900 dark:text-white">{activeCase.contractor}</div>
                        <div className="text-xs text-surface-500">累计完工 {activeCase.contractorCompletedCases} 个案例</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-surface-500 mb-1">综合履约评分</div>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">{activeCase.contractorScore}</div>
                      <div className="text-xs text-surface-500 mb-1.5">/ 5.00</div>
                      <div className="mb-1">
                        <Star size={14} className="fill-warn-400 text-warn-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: '准时交付率', value: activeCase.contractorOnTimeRate, weight: '40%', hint: '按约定期限交付的项目占比' },
                    { label: '业主满意度', value: activeCase.contractorSatisfaction, weight: '30%', hint: '业主验收后五星评分占比' },
                    { label: '质检通过率', value: activeCase.contractorQualityPass, weight: '20%', hint: '各节点一次性验收通过占比' },
                    { label: '售后响应', value: activeCase.contractorAfterSale, weight: '10%', hint: '质保问题24小时内响应占比' },
                  ].map((dim) => (
                    <div key={dim.label} className="rounded-lg bg-white/70 p-3 dark:bg-surface-800/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-surface-700 dark:text-surface-300">{dim.label}</span>
                        <span className="text-[10px] bg-brand-600/10 text-brand-700 px-1.5 rounded dark:bg-brand-500/20 dark:text-brand-300">权重 {dim.weight}</span>
                      </div>
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-xl font-bold text-surface-900 dark:text-white">{dim.value}<span className="text-xs">%</span></span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700 mb-1">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all"
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-surface-400">{dim.hint}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-brand-200/50 dark:border-brand-700/50">
                  <div className="text-xs text-surface-500 mb-2">本案例所属施工方的其他相关案例</div>
                  <div className="flex flex-wrap gap-2">
                    {activeCase.caseRelatedCases.map((name) => {
                      const related = mockCases.find((x) => x.title === name)
                      return (
                        <button
                          key={name}
                          onClick={(e) => { e.stopPropagation(); setSelectedCase(related?.id || null); }}
                          className="inline-flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs text-surface-700 hover:border-brand-300 hover:bg-brand-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-brand-900/20 transition"
                        >
                          <TrendingUp size={11} className="text-accent-500" />
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="btn-primary flex-1 py-2.5">
                  <Heart size={16} className="mr-1.5" /> 收藏案例
                </button>
                <button className="btn-outline flex-1 py-2.5">
                  预约同款设计师
                </button>
                <button className="btn-secondary py-2.5 px-5">
                  <Eye size={14} className="mr-1" /> 全景图
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
