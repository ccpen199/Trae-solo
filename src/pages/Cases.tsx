import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { WuXingPicker } from '@/components/ui/WuXingPicker'
import { CaseCard } from '@/components/cases/CaseCard'
import { casesApi } from '@/lib/api'
import { cn, type WuXingElement } from '@/lib/utils'
import type { CaseStudy, PaginatedResponse } from '@/types'
import { casesSeed } from '@/data/mockCases'

const STYLE_OPTIONS: SelectOption[] = [
  { value: 'all', label: '全部风格' },
  { value: 'classic', label: '经典' },
  { value: 'modern', label: '现代' },
  { value: 'poetic', label: '诗意' },
  { value: 'grand', label: '大气' },
  { value: 'scholarly', label: '儒雅' },
  { value: 'agile', label: '灵动' },
]

const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: '最新发布' },
  { value: 'popular', label: '最多点赞' },
]

function SkeletonCard() {
  return (
    <div className="bamboo-card rounded-lg p-6 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-12 rounded-full bg-ink-200" />
        <div className="h-5 w-16 rounded-full bg-ink-200" />
        <div className="ml-auto h-8 w-12 rounded-md bg-ink-200" />
      </div>
      <div className="h-12 w-2/3 bg-ink-300 rounded mb-4" />
      <div className="h-4 w-32 bg-ink-200 rounded mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-ink-200 rounded" />
        <div className="h-4 w-4/5 bg-ink-200 rounded" />
      </div>
      <div className="pt-4 border-t border-ink-300/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ink-200" />
          <div className="h-4 w-20 bg-ink-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function Cases() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<PaginatedResponse<CaseStudy>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 9,
  })
  const [keyword, setKeyword] = React.useState('')
  const [style, setStyle] = React.useState('all')
  const [wuxing, setWuxing] = React.useState<WuXingElement[]>([])
  const [sort, setSort] = React.useState('newest')
  const [page, setPage] = React.useState(1)
  const pageSize = 9

  const fetchCases = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await casesApi.list({ page, pageSize, keyword })
      setData(result)
    } catch {
      const filtered = casesSeed.filter((c) => {
        if (!keyword) return true
        return c.name.includes(keyword) || c.inputSummary.includes(keyword)
      })
      const sorted = [...filtered].sort((a, b) => {
        if (sort === 'popular') return b.likes - a.likes
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      const start = (page - 1) * pageSize
      setData({
        items: sorted.slice(start, start + pageSize),
        total: sorted.length,
        page,
        pageSize,
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, sort])

  React.useEffect(() => {
    fetchCases()
  }, [fetchCases])

  const totalPages = Math.ceil(data.total / pageSize)

  return (
    <div className="relative z-10 py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <div className="seal-stamp w-16 h-16 mx-auto mb-6">
            <span className="font-serif text-lg font-bold">案</span>
          </div>
          <h1 className="font-serif text-5xl font-bold ink-text-gradient mb-4">
            名家案例
          </h1>
          <p className="text-ink-500 text-lg">
            已获用户授权的真实起名案例
          </p>
        </div>

        <div className="ink-divider mb-10" />

        <div className="bg-ink-50/60 rounded-lg p-6 mb-10 border border-ink-200 shadow-paper">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Input
                placeholder="搜索名字、关键词..."
                leftIcon={<Search className="h-4 w-4" />}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              options={STYLE_OPTIONS}
              value={style}
              onChange={(e) => {
                setStyle(e.target.value)
                setPage(1)
              }}
            />
            <Select
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              五行筛选
            </label>
            <WuXingPicker
              value={wuxing}
              onChange={(v) => {
                setWuxing(v)
                setPage(1)
              }}
              size="sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink-500">暂无符合条件的案例</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {data.items.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
              />
            ))}
          </div>
        )}

        {!loading && data.total > pageSize && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              上一页
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-9 h-9 rounded-md text-sm font-medium transition-all',
                    p === page
                      ? 'bg-jade-700 text-ink-50'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
