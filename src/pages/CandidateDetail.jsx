import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, GraduationCap, MapPin, Clock, Briefcase, TrendingUp, Zap, Award, Target, BarChart3, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'

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
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 font-bold text-sm ${colorClass}`}>
      {normalizedScore}
    </div>
  )
}

function ProficiencyDots({ level }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i < level ? 'bg-primary' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  )
}

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/candidates/${id}`),
      api.get(`/candidates/${id}/matches`),
    ])
      .then(([candidateData, matchesData]) => {
        setCandidate(candidateData)
        setMatches(matchesData || [])
      })
      .catch((err) => setError(err.message || '数据加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-5 w-20 rounded bg-slate-200" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-32 rounded bg-slate-200" />
                  <div className="h-4 w-48 rounded bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse h-40 rounded-xl border border-border bg-card p-6 shadow-sm" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/candidates')}
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

  if (!candidate) return null

  const topMatches = matches.slice(0, 5)

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/candidates')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        返回候选人列表
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">
                {candidate.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
                  {candidate.career_level && (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${levelBadgeColor[candidate.career_level] || 'bg-slate-100 text-slate-600'}`}>
                      {candidate.career_level}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {candidate.current_title}{candidate.current_company ? ` · ${candidate.current_company}` : ''}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {candidate.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  {candidate.email}
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  {candidate.phone}
                </div>
              )}
              {candidate.education && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <GraduationCap size={14} className="text-slate-400" />
                  {candidate.education}
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  {candidate.location}
                </div>
              )}
              {candidate.experience_years != null && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} className="text-slate-400" />
                  {candidate.experience_years}年经验
                </div>
              )}
              {candidate.industry && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase size={14} className="text-slate-400" />
                  {candidate.industry}
                </div>
              )}
            </div>
          </div>

          {(() => {
            const levelNum = { P4: 1, P5: 2, P6: 3, P7: 4, P8: 5, P9: 6 }
            const currentNum = levelNum[candidate.career_level] || 0
            const levels = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9']
            return (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={18} className="text-primary" />
                  <h3 className="text-base font-semibold text-slate-900">职级跃迁路径</h3>
                </div>
                <div className="flex items-center gap-1">
                  {levels.map((lvl, i) => {
                    const isReached = (levelNum[lvl] || 0) <= currentNum
                    const isCurrent = lvl === candidate.career_level
                    return (
                      <div key={lvl} className="flex items-center">
                        <div className={`flex flex-col items-center ${isReached ? '' : 'opacity-35'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isCurrent ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-110' :
                            isReached ? 'bg-primary/10 text-primary border-primary/30' :
                            'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            {lvl}
                          </div>
                          {isCurrent && (
                            <span className="mt-1 text-[10px] font-semibold text-primary">当前</span>
                          )}
                        </div>
                        {i < levels.length - 1 && (
                          <div className={`w-6 h-0.5 mx-0.5 ${isReached && (levelNum[levels[i+1]] || 0) <= currentNum ? 'bg-primary' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={12} />{candidate.experience_years}年行业经验</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} />{candidate.industry || '-'}</span>
                  {candidate.skills_vector && (
                    <span className="flex items-center gap-1"><Target size={12} />匹配向量: {candidate.skills_vector.split(',').length}项技能</span>
                  )}
                </div>
              </div>
            )
          })()}

          {candidate.skills?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="text-base font-semibold text-slate-900">技术栈权重画像</h3>
              </div>
              <div className="space-y-3">
                {candidate.skills
                  .slice()
                  .sort((a, b) => (b.weight * b.proficiency) - (a.weight * a.proficiency))
                  .map((s) => {
                    const score = s.weight * s.proficiency
                    const maxScore = 2.0 * 5
                    const pct = Math.round((score / maxScore) * 100)
                    return (
                      <div key={s.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{s.skill_name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{s.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>熟练度 {s.proficiency}/5</span>
                            <span>权重 ×{s.weight}</span>
                            <span>{s.years_used}年</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-primary' : pct >= 30 ? 'bg-amber-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
              {candidate.skills_vector && (
                <div className="mt-4 pt-3 border-t border-border">
                  <span className="text-xs text-slate-400">匹配向量: </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {candidate.skills_vector.split(',').map((s, i) => (
                      <span key={i} className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {candidate.projects?.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">项目经历</h3>
              <div className="mt-4 space-y-4">
                {candidate.projects.map((p) => (
                  <div key={p.id} className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{p.project_name}</h4>
                        {p.role && (
                          <p className="mt-0.5 text-xs text-slate-500">角色：{p.role}</p>
                        )}
                      </div>
                    </div>
                    {p.tech_stack && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.tech_stack.split(',').map((t) => (
                          <span key={t} className="inline-flex rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.description && (
                      <p className="mt-2 text-sm text-slate-600">{p.description}</p>
                    )}
                    {p.quantified_outcome && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-700">
                        <TrendingUp size={14} />
                        {p.quantified_outcome}
                      </div>
                    )}
                    {(p.revenue_impact || p.efficiency_gain) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {p.revenue_impact > 0 && (
                          <span>收入影响：{formatSalary(p.revenue_impact)}</span>
                        )}
                        {p.efficiency_gain > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Zap size={10} />
                            效率提升 {p.efficiency_gain}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">期望薪资</h3>
            {candidate.expected_salary_min != null && candidate.expected_salary_max != null ? (
              <>
                <p className="mt-2 text-lg font-bold text-primary">
                  {formatSalary(candidate.expected_salary_min)} - {formatSalary(candidate.expected_salary_max)}
                </p>
                <SalaryBar min={candidate.expected_salary_min} max={candidate.expected_salary_max} />
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">暂无薪资期望数据</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">求职状态</h3>
            <div className="mt-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${jobStatusColor[candidate.job_status] || 'bg-slate-50 text-slate-500'}`}>
                {jobStatusLabel[candidate.job_status] || candidate.job_status || '-'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">匹配职位推荐</h3>
            {topMatches.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">暂无匹配结果</p>
            ) : (
              <div className="mt-3 space-y-3">
                {topMatches.map((m) => {
                  const overallScore = m.overallScore ?? m.overall_score ?? 0
                  const techScore = m.techScore ?? m.tech_stack_score ?? 0
                  const expScore = m.expScore ?? m.experience_score ?? 0
                  const levelScore = m.levelScore ?? m.level_score ?? 0
                  const salaryScore = m.salaryScore ?? m.salary_score ?? 0
                  return (
                    <div
                      key={m.jobId || m.id}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <MatchScoreCircle score={overallScore} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{m.title || m.job_title}</p>
                          {(m.enterprise_name || m.enterprise) && (
                            <p className="truncate text-xs text-slate-500">{m.enterprise_name || m.enterprise}</p>
                          )}
                          {(m.salary_min != null || m.salary_max != null) && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatSalary(m.salary_min)} - {formatSalary(m.salary_max)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {[
                          { label: '技术栈', val: Math.round(techScore) },
                          { label: '经验', val: Math.round(expScore) },
                          { label: '职级', val: Math.round(levelScore) },
                          { label: '薪资', val: Math.round(salaryScore) },
                        ].map((dim) => (
                          <div key={dim.label} className="text-center">
                            <div className="text-[10px] text-slate-400">{dim.label}</div>
                            <div className={`text-xs font-bold ${dim.val >= 70 ? 'text-emerald-600' : dim.val >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                              {dim.val}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
