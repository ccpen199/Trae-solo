import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Briefcase, Clock, Building2, Edit, PlayCircle, PauseCircle, XCircle, Users } from 'lucide-react'
import { api } from '../utils/api'

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

function SalaryBar({ min, max }) {
  if (min == null || max == null) return null
  const maxRef = Math.max(max, 1)
  const leftPct = (min / maxRef) * 100
  const widthPct = ((max - min) / maxRef) * 100

  return (
    <div className="mt-3">
      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-primary to-blue-400"
          style={{ marginLeft: `${leftPct * 0.6}%`, width: `${Math.max(widthPct * 0.6, 4)}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
        <span>{formatSalary(min)}</span>
        <span>{formatSalary(max)}</span>
      </div>
    </div>
  )
}

function MatchScoreCircle({ score }) {
  const normalizedScore = Math.round(score)
  let colorClass = 'text-red-600 border-red-200 bg-red-50'
  if (normalizedScore > 70) colorClass = 'text-emerald-600 border-emerald-200 bg-emerald-50'
  else if (normalizedScore > 40) colorClass = 'text-amber-600 border-amber-200 bg-amber-50'

  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-bold text-xs ${colorClass}`}>
      {normalizedScore}
    </div>
  )
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/jobs/${id}`),
      api.get(`/jobs/${id}/matches`),
    ])
      .then(([jobData, matchesData]) => {
        setJob(jobData)
        setMatches(matchesData || [])
      })
      .catch((err) => setError(err.message || '数据加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      const updated = await api.patch(`/jobs/${id}/status`, { status: newStatus })
      setJob((prev) => ({ ...prev, status: newStatus, ...updated }))
    } catch (err) {
      setError(err.message || '状态更新失败')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-5 w-20 rounded bg-slate-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-slate-200" />
                <div className="h-4 w-32 rounded bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="animate-pulse h-40 rounded-xl border border-border bg-card p-6 shadow-sm" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={14} />
          返回列表
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!job) return null

  const topMatches = matches.slice(0, 8)

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/jobs')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        返回职位列表
      </button>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[job.status] || 'bg-slate-50 text-slate-500'}`}>
                {statusLabel[job.status] || job.status}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              <Building2 size={14} className="text-slate-400" />
              {job.enterprise_name || job.enterprise || '-'}
              {job.department && <span className="text-slate-400">· {job.department}</span>}
            </div>
          </div>
          <button
            onClick={() => navigate(`/jobs/${id}/edit`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Edit size={14} />
            编辑
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {job.industry && (
            <span className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-slate-400" />
              {job.industry}
            </span>
          )}
          {job.function_type && (
            <span className="flex items-center gap-1.5">
              <Briefcase size={14} className="text-slate-400" />
              {job.function_type}
            </span>
          )}
          {job.required_level && (
            <span>{job.required_level}</span>
          )}
          {job.min_experience_years != null && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              {job.min_experience_years}年+经验
            </span>
          )}
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              {job.location}
            </span>
          )}
        </div>

        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">薪资范围</p>
          {job.salary_min != null && job.salary_max != null ? (
            <>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatSalary(job.salary_min)} - {formatSalary(job.salary_max)}
              </p>
              <SalaryBar min={job.salary_min} max={job.salary_max} />
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">暂无薪资数据</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('published')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <PlayCircle size={14} />
              发布
            </button>
          )}
          {job.status === 'published' && (
            <button
              onClick={() => handleStatusChange('paused')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              <PauseCircle size={14} />
              暂停
            </button>
          )}
          {(job.status === 'published' || job.status === 'paused') && (
            <button
              onClick={() => handleStatusChange('closed')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
            >
              <XCircle size={14} />
              关闭
            </button>
          )}
          {job.status === 'paused' && (
            <button
              onClick={() => handleStatusChange('published')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <PlayCircle size={14} />
              恢复发布
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {job.description && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">职位描述</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
            </div>
          )}

          {job.requirements?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">任职要求</h3>
              <ul className="mt-3 space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.benefits?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">福利待遇</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.benefits.map((b, i) => (
                  <span key={i} className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.tech_stack?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">技术栈</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.tech_stack.map((t, i) => (
                  <span key={i} className="inline-flex rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h3 className="text-sm font-semibold text-slate-900">匹配候选人</h3>
            </div>
            {topMatches.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">暂无匹配结果</p>
            ) : (
              <div className="mt-3 space-y-3">
                {topMatches.map((m, i) => (
                  <div key={m.candidate_id || i} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                    <MatchScoreCircle score={m.match_score ?? m.overallScore ?? 0} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{m.name || m.candidate_name}</p>
                      <p className="truncate text-xs text-slate-500">{m.title || m.current_title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        {m.experience_years != null && <span>{m.experience_years}年经验</span>}
                        {m.expected_salary_min != null && m.expected_salary_max != null && (
                          <span>{formatSalary(m.expected_salary_min)}-{formatSalary(m.expected_salary_max)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
