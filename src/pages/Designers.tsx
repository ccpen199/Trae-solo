import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import DesignerCard from '@/components/DesignerCard'
import { REGIONS, STYLES } from '@/lib/types'
import { fetchApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { DesignerItem } from '@/lib/types'

const PAGE_SIZE = 10

interface DesignersResponse {
  items: DesignerItem[]
  total: number
}

const inputCls = 'rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-sand-900 outline-none focus:border-sand-400'

function SkeletonCard() {
  return (
    <div className="flex gap-4 rounded-xl bg-white p-4">
      <div className="h-20 w-20 flex-shrink-0 animate-pulse rounded-full bg-sand-200" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-sand-200" />
        <div className="h-3 w-16 animate-pulse rounded bg-sand-200" />
        <div className="h-3 w-32 animate-pulse rounded bg-sand-200" />
      </div>
    </div>
  )
}

export default function Designers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [designers, setDesigners] = useState<DesignerItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const page = Number(searchParams.get('page') || '1')
  const region = searchParams.get('region') || ''
  const style = searchParams.get('style') || ''
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''
  const sort = searchParams.get('sort') || 'rating'

  const [localRegion, setLocalRegion] = useState(region)
  const [localStyle, setLocalStyle] = useState(style)
  const [localPriceMin, setLocalPriceMin] = useState(priceMin)
  const [localPriceMax, setLocalPriceMax] = useState(priceMax)
  const [localSort, setLocalSort] = useState(sort)

  const syncLocal = useCallback(() => {
    setLocalRegion(region)
    setLocalStyle(style)
    setLocalPriceMin(priceMin)
    setLocalPriceMax(priceMax)
    setLocalSort(sort)
  }, [region, style, priceMin, priceMax, sort])

  useEffect(() => { syncLocal() }, [syncLocal])

  const onApply = () => {
    const params = new URLSearchParams()
    params.set('page', '1')
    if (localRegion) params.set('region', localRegion)
    if (localStyle) params.set('style', localStyle)
    if (localPriceMin) params.set('priceMin', localPriceMin)
    if (localPriceMax) params.set('priceMax', localPriceMax)
    if (localSort) params.set('sort', localSort)
    setSearchParams(params)
  }

  const onReset = () => {
    setLocalRegion('')
    setLocalStyle('')
    setLocalPriceMin('')
    setLocalPriceMax('')
    setLocalSort('rating')
    setSearchParams({})
  }

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))
    if (region) params.set('region', region)
    if (style) params.set('style', style)
    if (priceMin) params.set('priceMin', priceMin)
    if (priceMax) params.set('priceMax', priceMax)
    if (sort) params.set('sort', sort)
    fetchApi<DesignersResponse>(`/api/designers?${params.toString()}`)
      .then((data) => {
        setDesigners(data.items || data as unknown as DesignerItem[])
        setTotal(data.total || (data as unknown as DesignerItem[]).length)
      })
      .catch(() => { setDesigners([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [page, region, style, priceMin, priceMax, sort])

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
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-sand-900">找设计师</h1>
        </div>
        <div className="mx-auto max-w-8xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">地区</label>
              <select value={localRegion} onChange={(e) => setLocalRegion(e.target.value)} className={inputCls}>
                <option value="">全部</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">风格</label>
              <select value={localStyle} onChange={(e) => setLocalStyle(e.target.value)} className={inputCls}>
                <option value="">全部</option>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">价格 (万元/㎡)</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="最低" value={localPriceMin} onChange={(e) => setLocalPriceMin(e.target.value)} className={cn(inputCls, 'w-24')} />
                <span className="text-sand-400">—</span>
                <input type="number" placeholder="最高" value={localPriceMax} onChange={(e) => setLocalPriceMax(e.target.value)} className={cn(inputCls, 'w-24')} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold tracking-wider text-sand-900/60 uppercase">排序</label>
              <select value={localSort} onChange={(e) => setLocalSort(e.target.value)} className={inputCls}>
                <option value="rating">评分</option>
                <option value="price">价格</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={onApply} className="rounded-lg bg-sand-400 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sand-500">筛选</button>
              <button onClick={onReset} className="rounded-lg border border-sand-200 px-5 py-2 text-sm font-medium text-sand-900/70 transition-colors hover:bg-sand-200">重置</button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 text-sm text-sand-900/60">
          {loading ? '加载中…' : `共 ${total} 位设计师`}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : designers.length === 0 ? (
          <div className="py-20 text-center text-sand-900/40">
            <p className="font-display text-xl">暂无匹配设计师</p>
            <p className="mt-2 text-sm">尝试调整筛选条件</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {designers.map((d) => <DesignerCard key={d.id} designer={d} />)}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-1">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="rounded-lg p-2 text-sand-900/60 transition-colors hover:bg-sand-200 disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            {pageNumbers.map((n) => (
              <button key={n} onClick={() => goToPage(n)} className={cn('h-9 w-9 rounded-lg text-sm font-medium transition-colors', n === page ? 'bg-sand-400 text-white' : 'text-sand-900/60 hover:bg-sand-200')}>
                {n}
              </button>
            ))}
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="rounded-lg p-2 text-sand-900/60 transition-colors hover:bg-sand-200 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </div>

      <Footer />
    </div>
  )
}
