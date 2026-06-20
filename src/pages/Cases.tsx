import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CaseCard from '@/components/CaseCard'
import { STYLES, HOUSE_TYPES } from '@/lib/types'
import { fetchApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CaseItem } from '@/lib/types'

const PAGE_SIZE = 9

interface CasesResponse {
  items: CaseItem[]
  total: number
}

function FilterPanel({
  filters,
  setFilter,
  onApply,
  onReset,
  mobile = false,
}: {
  filters: Record<string, string>
  setFilter: (k: string, v: string) => void
  onApply: () => void
  onReset: () => void
  mobile?: boolean
}) {
  const inputCls = 'w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 outline-none focus:border-sand-400'

  return (
    <div className={cn('space-y-5', mobile && 'p-4')}>
      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">风格</label>
        <select
          value={filters.style}
          onChange={(e) => setFilter('style', e.target.value)}
          className={inputCls}
        >
          <option value="">全部</option>
          {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">户型</label>
        <select
          value={filters.houseType}
          onChange={(e) => setFilter('houseType', e.target.value)}
          className={inputCls}
        >
          <option value="">全部</option>
          {HOUSE_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">面积 (㎡)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="最小"
            value={filters.areaMin}
            onChange={(e) => setFilter('areaMin', e.target.value)}
            className={inputCls}
          />
          <span className="text-sand-400">—</span>
          <input
            type="number"
            placeholder="最大"
            value={filters.areaMax}
            onChange={(e) => setFilter('areaMax', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">预算 (万元)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="最小"
            value={filters.budgetMin}
            onChange={(e) => setFilter('budgetMin', e.target.value)}
            className={inputCls}
          />
          <span className="text-sand-400">—</span>
          <input
            type="number"
            placeholder="最大"
            value={filters.budgetMax}
            onChange={(e) => setFilter('budgetMax', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onApply} className="flex-1 rounded-lg bg-sand-400 py-2 text-sm font-semibold text-white transition-colors hover:bg-sand-500">
          筛选
        </button>
        <button onClick={onReset} className="flex-1 rounded-lg border border-sand-200 py-2 text-sm font-medium text-sand-900/70 transition-colors hover:bg-sand-200">
          重置
        </button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl">
      <div className="aspect-[4/3] animate-pulse bg-sand-200" />
      <div className="mt-3 space-y-2 px-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-sand-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-sand-200" />
      </div>
    </div>
  )
}

export default function Cases() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cases, setCases] = useState<CaseItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const getFilters = useCallback(() => ({
    style: searchParams.get('style') || '',
    houseType: searchParams.get('houseType') || '',
    areaMin: searchParams.get('areaMin') || '',
    areaMax: searchParams.get('areaMax') || '',
    budgetMin: searchParams.get('budgetMin') || '',
    budgetMax: searchParams.get('budgetMax') || '',
  }), [searchParams])

  const [localFilters, setLocalFilters] = useState(getFilters)

  useEffect(() => {
    setLocalFilters(getFilters())
  }, [getFilters])

  const page = Number(searchParams.get('page') || '1')

  const setFilter = (key: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const onApply = () => {
    const params = new URLSearchParams()
    params.set('page', '1')
    Object.entries(localFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    setSearchParams(params)
    setDrawerOpen(false)
  }

  const onReset = () => {
    setLocalFilters({ style: '', houseType: '', areaMin: '', areaMax: '', budgetMin: '', budgetMax: '' })
    setSearchParams({})
    setDrawerOpen(false)
  }

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))
    fetchApi<CasesResponse>(`/api/cases?${params.toString()}`)
      .then((data) => {
        setCases(data.items)
        setTotal(data.total)
      })
      .catch(() => { setCases([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [searchParams, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    setSearchParams(params)
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <header className="border-b border-sand-200 bg-white/60">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-sand-900">案例库</h1>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-sand-900/70 transition-colors hover:bg-sand-200 lg:hidden"
          >
            <SlidersHorizontal size={16} /> 筛选
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-sand-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-display text-lg font-semibold text-sand-900">筛选条件</h2>
              <FilterPanel filters={localFilters} setFilter={setFilter} onApply={onApply} onReset={onReset} />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-4 text-sm text-sand-900/60">
              {loading ? '加载中…' : `共 ${total} 个案例`}
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : cases.length === 0 ? (
              <div className="py-20 text-center text-sand-900/40">
                <p className="font-display text-xl">暂无匹配案例</p>
                <p className="mt-2 text-sm">尝试调整筛选条件</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cases.map((c) => <CaseCard key={c.id} item={c} />)}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg p-2 text-sand-900/60 transition-colors hover:bg-sand-200 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => goToPage(n)}
                    className={cn(
                      'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                      n === page ? 'bg-sand-400 text-white' : 'text-sand-900/60 hover:bg-sand-200'
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg p-2 text-sand-900/60 transition-colors hover:bg-sand-200 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-sand-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
              <span className="font-display text-lg font-semibold text-sand-900">筛选</span>
              <button onClick={() => setDrawerOpen(false)} className="text-sand-900/60">
                <X size={20} />
              </button>
            </div>
            <FilterPanel filters={localFilters} setFilter={setFilter} onApply={onApply} onReset={onReset} mobile />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
