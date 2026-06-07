import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'

const INDUSTRIES = ['互联网', '人工智能', '金融科技', '医疗健康', '智能制造']
const STATUSES = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'paused', label: '已暂停' },
  { value: 'closed', label: '已关闭' },
]
const FUNCTION_TYPES = [
  { value: '技术', label: '技术' },
  { value: '产品', label: '产品' },
  { value: '数据', label: '数据' },
  { value: '设计', label: '设计' },
]

const statusColor = {
  draft: 'bg-slate-50 text-slate-500',
  published: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-amber-50 text-amber-700',
  closed: 'bg-red-50 text-red-700',
}

const statusLabel = {
  draft: '草稿',
  published: '已发布',
  paused: '已暂停',
  closed: '已关闭',
}

function formatSalary(val) {
  if (val == null) return '-'
  if (val >= 10000) return `${(val / 10000).toFixed(val % 10000 === 0 ? 0 : 1)}万`
  return `${val}`
}

export default function Jobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState('')
  const [functionType, setFunctionType] = useState('')
  const limit = 10

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page)
      params.set('limit', limit)
      if (search) params.set('search', search)
      if (industry) params.set('industry', industry)
      if (status) params.set('status', status)
      if (functionType) params.set('function_type', functionType)

      const data = await api.get(`/jobs?${params.toString()}`)
      setJobs(data.items || [])
      setTotal(data.total || 0)
    } catch {
      setJobs([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, industry, status, functionType])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">职位管理</h1>
          <p className="mt-2 text-sm text-slate-500">管理企业需求、招聘预算和岗位发布进度</p>
        </div>
        <button
          onClick={() => navigate('/jobs/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md"
        >
          <Plus size={16} />
          发布新职位
        </button>
      </section>

      <section className="space-y-3">
        <form onSubmit={handleSearch} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索职位名称、企业..."
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
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">全部状态</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <select
            value={functionType}
            onChange={(e) => { setFunctionType(e.target.value); setPage(1) }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">全部职能</option>
            {FUNCTION_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="animate-pulse p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-slate-200" />
            ))}
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <p className="text-sm text-slate-400">暂无职位数据</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">职位名称</th>
                <th className="px-4 py-3 text-left font-semibold">企业</th>
                <th className="px-4 py-3 text-left font-semibold">行业</th>
                <th className="px-4 py-3 text-left font-semibold">职级要求</th>
                <th className="px-4 py-3 text-left font-semibold">经验要求</th>
                <th className="px-4 py-3 text-left font-semibold">薪资范围</th>
                <th className="px-4 py-3 text-left font-semibold">状态</th>
                <th className="px-4 py-3 text-left font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{job.title}</td>
                  <td className="px-4 py-3 text-slate-700">{job.enterprise_name || job.enterprise || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{job.industry || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{job.required_level || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {job.min_experience_years != null ? `${job.min_experience_years}年+` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {job.salary_min != null && job.salary_max != null
                      ? `${formatSalary(job.salary_min)}-${formatSalary(job.salary_max)}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[job.status] || 'bg-slate-50 text-slate-500'}`}>
                      {statusLabel[job.status] || job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Eye size={12} />
                        查看详情
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        <Users size={12} />
                        匹配候选人
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
