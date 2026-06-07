import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MapPin, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'

const INDUSTRIES = ['互联网', '人工智能', '金融科技', '医疗健康', '智能制造']
const CAREER_LEVELS = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9']
const JOB_STATUSES = [
  { value: 'open', label: '开放机会' },
  { value: 'exploring', label: '深度沟通' },
  { value: 'closed', label: '不活跃' },
]

const jobStatusColor = {
  open: 'bg-blue-50 text-blue-700',
  exploring: 'bg-purple-50 text-purple-700',
  closed: 'bg-slate-50 text-slate-500',
}

const jobStatusLabel = {
  open: '开放机会',
  exploring: '深度沟通',
  closed: '不活跃',
}

const levelBadgeColor = {
  P4: 'bg-slate-100 text-slate-600',
  P5: 'bg-green-50 text-green-700',
  P6: 'bg-blue-50 text-blue-700',
  P7: 'bg-violet-50 text-violet-700',
  P8: 'bg-amber-50 text-amber-700',
  P9: 'bg-red-50 text-red-700',
}

export default function Candidates() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [careerLevel, setCareerLevel] = useState('')
  const [jobStatus, setJobStatus] = useState('')
  const limit = 12

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', limit)
      if (search) params.set('search', search)
      if (industry) params.set('industry', industry)
      if (careerLevel) params.set('career_level', careerLevel)
      if (jobStatus) params.set('job_status', jobStatus)

      const data = await api.get(`/candidates?${params.toString()}`)
      setCandidates(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setCandidates([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, industry, careerLevel, jobStatus])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchCandidates()
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">候选人</h1>
          <p className="mt-2 text-sm text-slate-500">统一管理人才档案、技能画像和跟进状态</p>
        </div>
        <button
          onClick={() => navigate('/candidates/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md"
        >
          <Plus size={16} />
          新建候选人
        </button>
      </section>

      <section className="space-y-3">
        <form onSubmit={handleSearch} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名、职位、公司..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </form>

        <div className="flex flex-wrap gap-3">
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">全部行业</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>

          <select
            value={careerLevel}
            onChange={(e) => { setCareerLevel(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">全部职级</option>
            {CAREER_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={jobStatus}
            onChange={(e) => { setJobStatus(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">全部状态</option>
            {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-200" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-14 rounded-full bg-slate-200" />
                <div className="h-5 w-10 rounded-full bg-slate-200" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-3 w-16 rounded bg-slate-200" />
                <div className="h-3 w-12 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <p className="text-sm text-slate-400">暂无候选人数据</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {candidates.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/candidates/${c.id}`)}
              className="cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  {c.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-slate-900">{c.name}</h3>
                  <p className="mt-0.5 truncate text-sm text-slate-500">{c.current_title}</p>
                  {c.current_company && (
                    <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                      <Building2 size={12} />
                      {c.current_company}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {c.industry && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {c.industry}
                  </span>
                )}
                {c.career_level && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${levelBadgeColor[c.career_level] || 'bg-slate-100 text-slate-600'}`}>
                    {c.career_level}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  {c.experience_years != null && <span>{c.experience_years}年经验</span>}
                  {c.location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin size={10} />
                      {c.location}
                    </span>
                  )}
                </div>
                {c.job_status && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${jobStatusColor[c.job_status] || 'bg-slate-50 text-slate-500'}`}>
                    {jobStatusLabel[c.job_status] || c.job_status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            上一页
          </button>
          <span className="px-3 text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一页
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
