import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, UserRoundSearch, Briefcase, Loader2, ChevronRight, CheckCircle, AlertTriangle, Target, TrendingUp, Award, DollarSign, Code, Sparkles, ExternalLink } from 'lucide-react'
import { api } from '../utils/api'

const WEIGHTS = {
  tech: 0.35,
  experience: 0.25,
  level: 0.25,
  salary: 0.15,
}

function formatSalary(val) {
  if (val == null) return '-'
  if (val >= 10000) return `${(val / 10000).toFixed(val % 10000 === 0 ? 0 : 1)}万`
  return `${val}`
}

function ScoreCircle({ score }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score > 70 ? 'text-emerald-500' : score > 40 ? 'text-amber-500' : 'text-red-500'
  const strokeColor = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-slate-400">综合匹配</span>
      </div>
    </div>
  )
}

function ScoreWithWeight({ label, rawScore, weight, icon: Icon }) {
  const weightedScore = Math.round(rawScore * weight)
  const color = rawScore > 70 ? 'text-emerald-600' : rawScore > 40 ? 'text-amber-600' : 'text-red-500'
  const bgColor = rawScore > 70 ? 'bg-emerald-50' : rawScore > 40 ? 'bg-amber-50' : 'bg-red-50'

  return (
    <div className={`rounded-lg ${bgColor} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-[10px] text-slate-400 ml-auto">权重 {Math.round(weight * 100)}%</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-lg font-bold ${color}`}>{Math.round(rawScore)}</span>
        <span className="text-[10px] text-slate-400">原始分</span>
        <ChevronRight size={12} className="text-slate-300" />
        <span className={`text-lg font-bold ${color}`}>{weightedScore}</span>
        <span className="text-[10px] text-slate-400">加权分</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            rawScore > 70 ? 'bg-emerald-500' : rawScore > 40 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${rawScore}%` }}
        />
      </div>
    </div>
  )
}

function TechExplanation({ matchedSkills, missingSkills, requiredSkills = [] }) {
  const matchRate = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : matchedSkills.length > 0 ? 85 : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-primary" />
          <span className="text-sm font-medium text-slate-700">技术栈匹配详情</span>
        </div>
        <span className="text-xs text-slate-500">匹配率 {matchRate}%</span>
      </div>
      <div className="space-y-2">
        {matchedSkills.length > 0 && (
          <div>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 mb-1.5">
              <CheckCircle size={12} /> 已匹配技能 ({matchedSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((s, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {missingSkills.length > 0 && (
          <div>
            <span className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1.5">
              <AlertTriangle size={12} /> 待提升技能 ({missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((s, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ExperienceExplanation({ candidateExp, requiredMinExp, requiredMaxExp, score }) {
  const getExplanation = () => {
    if (candidateExp == null) return '候选人经验数据暂缺'
    const diff = candidateExp - requiredMinExp
    if (diff >= 2) return `候选人拥有 ${candidateExp} 年经验，超出职位最低要求 ${diff} 年，经验丰富`
    if (diff >= 0) return `候选人拥有 ${candidateExp} 年经验，符合职位 ${requiredMinExp}${requiredMaxExp ? `-${requiredMaxExp}` : '+'} 年要求`
    return `候选人拥有 ${candidateExp} 年经验，距离职位最低要求还差 ${Math.abs(diff)} 年`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-primary" />
        <span className="text-sm font-medium text-slate-700">经验匹配解释</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <div className="flex-1">
          <span className="text-slate-400">候选人</span>
          <span className="ml-2 font-semibold text-slate-700">{candidateExp ?? '-'}年</span>
        </div>
        <ChevronRight size={12} className="text-slate-300" />
        <div className="flex-1 text-right">
          <span className="text-slate-400">职位要求</span>
          <span className="ml-2 font-semibold text-slate-700">{requiredMinExp ?? '-'}{requiredMaxExp ? `-${requiredMaxExp}` : '+'}年</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2">{getExplanation()}</p>
    </div>
  )
}

function LevelExplanation({ candidateLevel, requiredLevel, score }) {
  const levelOrder = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9']
  const candidateIdx = levelOrder.indexOf(candidateLevel)
  const requiredIdx = levelOrder.indexOf(requiredLevel)

  const getExplanation = () => {
    if (candidateIdx === -1 || requiredIdx === -1) return '职级数据暂缺'
    const diff = candidateIdx - requiredIdx
    if (diff > 0) return `候选人职级 ${candidateLevel} 高于职位要求 ${requiredLevel}，可胜任更高职责`
    if (diff === 0) return `候选人职级 ${candidateLevel} 与职位要求 ${requiredLevel} 完全匹配`
    return `候选人职级 ${candidateLevel} 低于职位要求 ${requiredLevel}，有成长空间`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Award size={14} className="text-primary" />
        <span className="text-sm font-medium text-slate-700">职级匹配判断</span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
          candidateIdx >= requiredIdx ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {candidateLevel || '-'}
        </div>
        <div className="w-8 h-0.5 bg-slate-200" />
        <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
          {requiredLevel || '-'}
        </div>
      </div>
      <p className="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2 text-center">{getExplanation()}</p>
    </div>
  )
}

function SalaryExplanation({ candidateMin, candidateMax, jobMin, jobMax, score }) {
  const getOverlapStatus = () => {
    if (candidateMin == null || candidateMax == null || jobMin == null || jobMax == null) {
      return { status: 'unknown', text: '薪资数据暂缺' }
    }
    const overlapStart = Math.max(candidateMin, jobMin)
    const overlapEnd = Math.min(candidateMax, jobMax)
    if (overlapStart <= overlapEnd) {
      const overlap = overlapEnd - overlapStart
      const candidateRange = candidateMax - candidateMin
      const ratio = Math.round((overlap / candidateRange) * 100)
      return {
        status: 'match',
        text: `薪资区间高度重合，重叠度约 ${ratio}%`,
        overlap: [overlapStart, overlapEnd]
      }
    }
    if (candidateMax < jobMin) {
      return { status: 'below', text: '候选人期望低于职位预算，有议价空间' }
    }
    return { status: 'above', text: '候选人期望高于职位预算，需进一步沟通' }
  }

  const statusInfo = getOverlapStatus()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <DollarSign size={14} className="text-primary" />
        <span className="text-sm font-medium text-slate-700">薪资区间对比</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">候选人期望</span>
          <span className="font-semibold text-slate-700">{formatSalary(candidateMin)} - {formatSalary(candidateMax)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">职位预算</span>
          <span className="font-semibold text-slate-700">{formatSalary(jobMin)} - {formatSalary(jobMax)}</span>
        </div>
      </div>
      <p className={`text-xs rounded-md px-3 py-2 ${
        statusInfo.status === 'match' ? 'bg-emerald-50 text-emerald-700' :
        statusInfo.status === 'below' ? 'bg-blue-50 text-blue-700' :
        statusInfo.status === 'above' ? 'bg-amber-50 text-amber-700' :
        'bg-slate-50 text-slate-600'
      }`}>
        {statusInfo.text}
      </p>
    </div>
  )
}

function MatchExplanationChain({ details, candidateLevel, requiredLevel, candidateExp, requiredMinExp, requiredMaxExp, candidateMin, candidateMax, jobMin, jobMax, techScore, expScore, levelScore, salaryScore }) {
  const [expandedSection, setExpandedSection] = useState(null)

  const sections = [
    {
      id: 'tech',
      title: '技术栈匹配',
      icon: Code,
      component: TechExplanation,
      props: {
        matchedSkills: details?.techStack?.matched || [],
        missingSkills: details?.techStack?.missing || [],
        requiredSkills: details?.techStack?.required || [],
      }
    },
    {
      id: 'experience',
      title: '经验匹配',
      icon: TrendingUp,
      component: ExperienceExplanation,
      props: { candidateExp, requiredMinExp, requiredMaxExp, score: expScore }
    },
    {
      id: 'level',
      title: '职级匹配',
      icon: Award,
      component: LevelExplanation,
      props: { candidateLevel, requiredLevel, score: levelScore }
    },
    {
      id: 'salary',
      title: '薪资匹配',
      icon: DollarSign,
      component: SalaryExplanation,
      props: { candidateMin, candidateMax, jobMin, jobMax, score: salaryScore }
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-primary" />
        <span className="text-sm font-semibold text-slate-700">匹配解释链</span>
      </div>
      <div className="space-y-2">
        {sections.map((section, index) => {
          const Component = section.component
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          return (
            <div key={section.id} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon size={12} className="text-primary" />
                  </div>
                  {index < sections.length - 1 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-2 bg-slate-200" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700 flex-1 text-left">{section.title}</span>
                <ChevronRight size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-border bg-slate-50/50">
                  <Component {...section.props} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecommendationReasons({ reasons }) {
  const defaultReasons = reasons?.length > 0 ? reasons : [
    '技术栈高度匹配，具备职位所需核心技能',
    '行业经验丰富，能够快速融入团队',
    '成长潜力大，与团队发展方向契合',
  ]

  return (
    <div className="rounded-lg bg-emerald-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle size={14} className="text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">推荐原因</span>
      </div>
      <ul className="space-y-1">
        {defaultReasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-700">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  )
}

function RiskWarnings({ warnings }) {
  const defaultWarnings = warnings?.length > 0 ? warnings : [
    '部分细分技能需要进一步提升',
    '薪资期望略高于预算区间',
  ]

  return (
    <div className="rounded-lg bg-amber-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} className="text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">风险提示</span>
      </div>
      <ul className="space-y-1">
        {defaultWarnings.map((warning, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
            {warning}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Matching() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [matchMode, setMatchMode] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/candidates?limit=50').catch(() => ({ items: [] })),
      api.get('/jobs?limit=50').catch(() => ({ items: [] })),
    ]).then(([cData, jData]) => {
      setCandidates(cData.items || [])
      setJobs(jData.items || [])
    })
  }, [])

  const handleMatch = useCallback(async (mode) => {
    if (mode === 'candidate' && !selectedCandidate) return
    if (mode === 'job' && !selectedJob) return

    setLoading(true)
    setMatchMode(mode)
    setMatches([])

    try {
      let data
      if (mode === 'candidate') {
        data = await api.get(`/candidates/${selectedCandidate}/matches`)
      } else {
        data = await api.get(`/jobs/${selectedJob}/matches`)
      }
      setMatches(Array.isArray(data) ? data : data.items || [data])
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [selectedCandidate, selectedJob])

  const getLabel = (m) => {
    if (matchMode === 'candidate') return m.job_title || m.title || `职位 #${m.job_id || m.id}`
    return m.candidate_name || m.name || `候选人 #${m.candidate_id || m.id}`
  }

  const getTargetId = (m) => {
    if (matchMode === 'candidate') return m.job_id || m.id
    return m.candidate_id || m.id
  }

  const handleViewDetail = (m) => {
    const id = getTargetId(m)
    if (matchMode === 'candidate') {
      navigate(`/jobs/${id}`)
    } else {
      navigate(`/candidates/${id}`)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">匹配中心</h1>
        <p className="mt-2 text-sm text-slate-500">候选人与职位双向推荐、分值拆解和风险提示</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">选择候选人</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">-- 请选择 --</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.current_title ? ` - ${c.current_title}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">选择职位</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">-- 请选择 --</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleMatch('candidate')}
            disabled={!selectedCandidate || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserRoundSearch size={16} />
            候选人→职位匹配
          </button>
          <button
            onClick={() => handleMatch('job')}
            disabled={!selectedJob || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Briefcase size={16} />
            职位→候选人匹配
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-sm text-slate-500">正在分析匹配度...</span>
        </div>
      ) : matches.length > 0 ? (
        <section className="space-y-4">
          {matches.map((m, idx) => {
            const overallScore = m.overallScore ?? m.overall_score ?? m.score ?? 0
            const techScore = m.techScore ?? m.tech_stack_score ?? 0
            const expScore = m.expScore ?? m.experience_score ?? 0
            const levelScore = m.levelScore ?? m.level_score ?? 0
            const salaryScore = m.salaryScore ?? m.salary_score ?? 0

            let matchDetails = {}
            try {
              matchDetails = typeof m.matchDetails === 'string' ? JSON.parse(m.matchDetails) : m.matchDetails || {}
            } catch {}

            return (
              <div key={m.id || idx} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start gap-5 mb-5">
                  <div className="shrink-0">
                    <ScoreCircle score={Math.round(overallScore)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRightLeft size={14} className="text-primary" />
                      <h3 className="text-base font-semibold text-slate-900 truncate">{getLabel(m)}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <ScoreWithWeight label="技术栈" rawScore={techScore} weight={WEIGHTS.tech} icon={Code} />
                      <ScoreWithWeight label="经验" rawScore={expScore} weight={WEIGHTS.experience} icon={TrendingUp} />
                      <ScoreWithWeight label="职级" rawScore={levelScore} weight={WEIGHTS.level} icon={Award} />
                      <ScoreWithWeight label="薪资" rawScore={salaryScore} weight={WEIGHTS.salary} icon={DollarSign} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <MatchExplanationChain
                    details={matchDetails}
                    candidateLevel={m.candidate_level || m.career_level}
                    requiredLevel={m.required_level}
                    candidateExp={m.experience_years}
                    requiredMinExp={m.min_experience_years}
                    requiredMaxExp={m.max_experience_years}
                    candidateMin={m.expected_salary_min}
                    candidateMax={m.expected_salary_max}
                    jobMin={m.salary_min}
                    jobMax={m.salary_max}
                    techScore={techScore}
                    expScore={expScore}
                    levelScore={levelScore}
                    salaryScore={salaryScore}
                  />
                  <div className="space-y-3">
                    <RecommendationReasons reasons={matchDetails.recommendations} />
                    <RiskWarnings warnings={matchDetails.risks} />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-end">
                  <button
                    onClick={() => handleViewDetail(m)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink size={14} />
                    查看详情
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
          <ArrowRightLeft size={36} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">请选择候选人或职位进行匹配分析</p>
        </div>
      )}
    </div>
  )
}
