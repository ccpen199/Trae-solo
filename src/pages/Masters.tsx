import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, type SelectOption } from '@/components/ui/Select'
import { MasterCard } from '@/components/masters/MasterCard'
import { mastersApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Master, PaginatedResponse } from '@/types'
import { mastersSeed } from '@/data/mockMasters'

const SORT_OPTIONS: SelectOption[] = [
  { value: 'rating', label: '综合评分' },
  { value: 'caseCount', label: '案例数量' },
  { value: 'experience', label: '从业年限' },
]

const ALL_SPECIALTIES = [
  '国学经典',
  '诗词典故',
  '五行补益',
  '八字命理',
  '音律美学',
  '家族字辈',
  '诗意命名',
  '现代美学',
  '女宝宝起名',
  '男宝宝起名',
  '商品牌号',
  '英文名搭配',
]

function SkeletonCard() {
  return (
    <div className="rounded-lg p-6 animate-pulse border border-ink-200 bg-ink-50">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-ink-200 mb-4" />
        <div className="h-7 w-20 bg-ink-300 rounded mb-1" />
        <div className="h-5 w-28 bg-ink-200 rounded-full mb-3" />
        <div className="flex items-center gap-4 mb-3">
          <div className="h-4 w-16 bg-ink-200 rounded" />
          <div className="h-4 w-4 bg-ink-200 rounded-full" />
          <div className="h-4 w-16 bg-ink-200 rounded" />
        </div>
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-4 h-4 bg-ink-200 rounded-sm" />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 w-16 bg-ink-200 rounded-full" />
          ))}
        </div>
        <div className="space-y-2 mb-4 w-full">
          <div className="h-4 w-full bg-ink-200 rounded" />
          <div className="h-4 w-4/5 bg-ink-200 rounded mx-auto" />
        </div>
        <div className="flex gap-2 w-full">
          <div className="flex-1 h-8 bg-ink-200 rounded" />
          <div className="flex-1 h-8 bg-ink-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function Masters() {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<PaginatedResponse<Master>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 9,
  })
  const [specialties, setSpecialties] = React.useState<string[]>([])
  const [sort, setSort] = React.useState('rating')

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const fetchMasters = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await mastersApi.list({
        specialties: specialties.join(','),
      })
      setData(result)
    } catch {
      let filtered = [...mastersSeed]
      if (specialties.length > 0) {
        filtered = filtered.filter((m) =>
          specialties.some((s) => m.specialties.includes(s))
        )
      }
      filtered.sort((a, b) => {
        if (sort === 'caseCount') return b.caseCount - a.caseCount
        if (sort === 'experience') return b.experience - a.experience
        return b.rating - a.rating
      })
      setData({
        items: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 9,
      })
    } finally {
      setLoading(false)
    }
  }, [specialties, sort])

  React.useEffect(() => {
    fetchMasters()
  }, [fetchMasters])

  return (
    <div className="relative z-10 py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <div className="seal-stamp w-16 h-16 mx-auto mb-6">
            <span className="font-serif text-lg font-bold">师</span>
          </div>
          <h1 className="font-serif text-5xl font-bold ink-text-gradient mb-4">
            命名师团队
          </h1>
          <p className="text-ink-500 text-lg">
            经平台严格审核认证的专业命名师
          </p>
        </div>

        <div className="ink-divider mb-10" />

        <div className="bg-ink-50/60 rounded-lg p-6 mb-10 border border-ink-200 shadow-paper">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-ink-700 mb-3">
                专长领域
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_SPECIALTIES.map((s) => {
                  const active = specialties.includes(s)
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSpecialty(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all border',
                        active
                          ? 'bg-jade-700 text-ink-50 border-jade-700'
                          : 'bg-ink-50 text-ink-600 border-ink-300 hover:border-jade-400 hover:text-jade-700'
                      )}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="w-full md:w-48 flex-shrink-0">
              <Select
                label="排序方式"
                options={SORT_OPTIONS}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              />
            </div>
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
            <p className="text-ink-500">暂无符合条件的命名师</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((master) => (
              <MasterCard
                key={master.id}
                master={master}
                onViewProfile={() => navigate(`/masters/${master.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
