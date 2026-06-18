import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Filter } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, LoadingSpinner } from '@/components/Shared'
import type { Talent, Field } from '@/types'

const FIELDS: ['全部', ...Field[]] = ['全部', '汽车制造', '零部件', '新能源', '智能驾驶']
const LOCATIONS = ['全部', '长春', '武汉', '合肥', '上海', '重庆', '广州']

const SKILL_BADGE: Record<string, string> = {
  '硬技能': 'badge-hard',
  '软技能': 'badge-soft',
  '认证': 'badge-cert',
}

export default function TalentCenter() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [talents, setTalents] = useState<Talent[]>([])
  const [loading, setLoading] = useState(true)
  const [field, setField] = useState(params.get('field') || '全部')
  const [location, setLocation] = useState(params.get('location') || '全部')
  const [search, setSearch] = useState(params.get('search') || '')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadTalents = useCallback(async (p: number, append = false) => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (field !== '全部') q.set('field', field)
      if (location !== '全部') q.set('location', location)
      if (search) q.set('search', search)
      q.set('page', String(p))
      q.set('pageSize', '12')
      const data = await fetchApi<Talent[]>(`/api/talents?${q.toString()}`)
      const list = Array.isArray(data) ? data : []
      setTalents(prev => append ? [...prev, ...list] : list)
      setHasMore(list.length >= 12)
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [field, location, search])

  useEffect(() => {
    setPage(1)
    loadTalents(1)
  }, [loadTalents])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadTalents(next, true)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center gap-3 animate-fade-in">
        <Filter className="w-4 h-4 text-steel-400" />
        <select className="input-dark text-sm" value={field} onChange={e => setField(e.target.value)}>
          {FIELDS.map(f => <option key={f} value={f}>{f === '全部' ? '全部领域' : f}</option>)}
        </select>
        <select className="input-dark text-sm" value={location} onChange={e => setLocation(e.target.value)}>
          {LOCATIONS.map(l => <option key={l} value={l}>{l === '全部' ? '全部地区' : l}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-400" />
          <input
            className="input-dark w-full pl-9 pr-3 py-2 text-sm"
            placeholder="搜索人才姓名或技能..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && talents.length === 0 ? (
        <LoadingSpinner />
      ) : talents.length === 0 ? (
        <div className="text-center py-20 text-steel-500">暂无匹配人才</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((t, i) => (
            <div
              key={t.id}
              className="card-glass card-hover p-5 animate-fade-in cursor-pointer"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => navigate(`/talent/${t.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-steel-100 font-semibold text-base">{t.name}</h3>
                  <p className="text-steel-400 text-sm mt-0.5">{t.currentCompany}</p>
                </div>
                <FieldBadge field={t.field} />
              </div>
              <div className="flex items-center gap-4 text-sm text-steel-400 mb-3">
                <span>{t.experience}年经验</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{t.location}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {t.skills.slice(0, 3).map(s => (
                  <span key={s.id} className={SKILL_BADGE[s.category] || 'badge-hard'}>{s.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center pt-4">
          <button className="btn-secondary" onClick={loadMore} disabled={loading}>
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}
