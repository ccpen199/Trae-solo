import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Briefcase, Target, Clock, ClipboardCheck, Building2,
  UserPlus, FileText, GitCompareArrows, BarChart3, GraduationCap, Settings,
  UserSearch as Headhunting, ArrowRight, Sparkles, CheckCircle, AlertTriangle,
  Code, TrendingUp, Award, DollarSign, Phone, Hash, Video,
  Shield, Database, CreditCard, ChevronRight,
} from 'lucide-react'
import { api } from '../utils/api'

const funnelColors = [
  'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
]

const followupStatusLabel = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
const followupStatusColor = { pending: 'bg-amber-50 text-amber-700', in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-red-50 text-red-700' }
const commTypeIcon = { phone: Phone, wechat: Hash, video: Video }
const commTypeLabel = { phone: '电话', wechat: '微信', video: '视频' }
const sentimentLabel = { positive: '积极', neutral: '中性', negative: '消极' }
const sentimentColor = { positive: 'text-emerald-600', neutral: 'text-slate-500', negative: 'text-red-600' }

const LEVEL_ORDER = ['P4', 'P5', 'P6', 'P7', 'P8', 'P9']

function formatSalary(v) {
  if (v == null) return '-'
  if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}万`
  return `${v}`
}

function MiniScoreBar({ label, score, weight, icon: Icon }) {
  const color = score > 70 ? 'bg-emerald-500' : score > 40 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = score > 70 ? 'text-emerald-600' : score > 40 ? 'text-amber-600' : 'text-red-500'
  return (
    <div className="flex items-center gap-2">
      <Icon size={12} className="text-slate-400 shrink-0" />
      <span className="text-[11px] text-slate-500 w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className={`text-[11px] font-semibold ${textColor} w-8 text-right shrink-0`}>{Math.round(score)}</span>
      <span className="text-[10px] text-slate-400 w-9 text-right shrink-0">×{Math.round(weight * 100)}%</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [topMatches, setTopMatches] = useState([])
  const [comms, setComms] = useState([])
  const [followups, setFollowups] = useState([])
  const [interviews, setInterviews] = useState([])
  const [funnelData, setFunnelData] = useState([])
  const [attributionData, setAttributionData] = useState([])
  const [internships, setInternships] = useState([])
  const [enterprises, setEnterprises] = useState([])
  const [salaryBenchmarks, setSalaryBenchmarks] = useState([])
  const [aiDatasets, setAiDatasets] = useState([])
  const [privacyRules, setPrivacyRules] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/overview').catch(() => null),
      api.get('/candidates/1/matches').catch(() => []),
      api.get('/headhunter/communications').catch(() => []),
      api.get('/headhunter/followups').catch(() => []),
      api.get('/interviews').catch(() => []),
      api.get('/analytics/funnel').catch(() => []),
      api.get('/analytics/attribution').catch(() => []),
      api.get('/campus/internships').catch(() => []),
      api.get('/admin/enterprises').catch(() => []),
      api.get('/admin/salary-benchmarks').catch(() => []),
      api.get('/admin/ai-datasets').catch(() => []),
      api.get('/admin/privacy-rules').catch(() => []),
    ])
      .then(([overviewData, matches, commsData, followupsData, interviewsData, funnel, attribution, interns, entps, benchmarks, datasets, rules]) => {
        setOverview(overviewData)
        setTopMatches((Array.isArray(matches) ? matches : []).slice(0, 3))
        setComms(Array.isArray(commsData) ? commsData : [])
        setFollowups(Array.isArray(followupsData) ? followupsData : [])
        setInterviews(Array.isArray(interviewsData) ? interviewsData : [])
        setFunnelData(Array.isArray(funnel) ? funnel : [])
        setAttributionData(Array.isArray(attribution) ? attribution : [])
        setInternships(Array.isArray(interns) ? interns : [])
        setEnterprises(Array.isArray(entps) ? entps : [])
        setSalaryBenchmarks(Array.isArray(benchmarks) ? benchmarks : [])
        setAiDatasets(Array.isArray(datasets) ? datasets : [])
        setPrivacyRules(Array.isArray(rules) ? rules : [])
      })
      .catch((err) => setError(err.message || '数据加载失败'))
  }, [])

  const summary = overview?.summary || {}
  const activeRules = privacyRules.filter((r) => r.is_active || r.enabled)
  const avgCredit = enterprises.length > 0 ? Math.round(enterprises.reduce((s, e) => s + (e.credit_score || 0), 0) / enterprises.length) : 0
  const avgConvProb = internships.length > 0 ? Math.round(internships.reduce((s, i) => s + (i.conversion_probability || 0), 0) / internships.length * 100) : 0
  const highRiskInterns = internships.filter((i) => (i.conversion_probability || 0) < 0.4)

  const stats = [
    { label: '候选人', value: summary.candidates ?? '-', sub: `${summary.activeJobs ?? 0} 个活跃职位`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '匹配结果', value: summary.matchResults ?? '-', sub: `均分 ${topMatches.length > 0 ? Math.round(topMatches.reduce((s, m) => s + (m.overallScore ?? 0), 0) / topMatches.length) : '-'}%`, icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: '待跟进', value: summary.pendingFollowups ?? '-', sub: `${comms.length} 条沟通记录`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '面试', value: summary.interviews ?? '-', sub: `${interviews.filter((i) => i.status === 'scheduled').length} 场待面`, icon: ClipboardCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: '合作企业', value: summary.enterprises ?? '-', sub: `均信用 ${avgCredit || '-'} 分`, icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: '校招日程', value: summary.activeJobs ?? '-', sub: `${internships.length} 名实习生`, icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">智能职业匹配工作台</h1>
        <p className="mt-2 text-sm text-slate-500">
          TalentMatch Pro — 人才档案、岗位匹配、服务流程与管理后台的业务闭环中枢
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 truncate">{sub}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitCompareArrows size={18} className="text-violet-600" />
            <h2 className="text-base font-semibold text-slate-900">匹配智能 — 双向解释链</h2>
          </div>
          <button onClick={() => navigate('/matching')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
            全部匹配 <ArrowRight size={12} />
          </button>
        </div>
        {topMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无匹配数据</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {topMatches.map((m, idx) => {
              const overall = Math.round(m.overallScore ?? 0)
              const techScore = m.techScore ?? 0
              const expScore = m.expScore ?? 0
              const levelScore = m.levelScore ?? 0
              const salaryScore = m.salaryScore ?? 0
              let details = {}
              try { details = typeof m.matchDetails === 'string' ? JSON.parse(m.matchDetails) : m.matchDetails || {} } catch {}
              const matched = details?.techStack?.matched || []
              const missing = details?.techStack?.missing || []
              return (
                <div key={m.id || idx} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                      overall > 70 ? 'bg-emerald-50 text-emerald-600' : overall > 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className="text-lg font-bold">{overall}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{m.candidate_name || `候选人 #${m.candidate_id}`}</p>
                      <p className="text-xs text-slate-500 truncate">→ {m.job_title || m.title || `职位 #${m.job_id}`}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <MiniScoreBar label="技术栈" score={techScore} weight={0.35} icon={Code} />
                    <MiniScoreBar label="经验" score={expScore} weight={0.25} icon={TrendingUp} />
                    <MiniScoreBar label="职级" score={levelScore} weight={0.25} icon={Award} />
                    <MiniScoreBar label="薪资" score={salaryScore} weight={0.15} icon={DollarSign} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {matched.slice(0, 4).map((s, i) => (
                      <span key={i} className="inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">{s}</span>
                    ))}
                    {missing.slice(0, 2).map((s, i) => (
                      <span key={i} className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">{s}</span>
                    ))}
                  </div>
                  {m.career_level && m.required_level && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>职级 {m.career_level}</span>
                      <ChevronRight size={10} />
                      <span>要求 {m.required_level}</span>
                      {m.experience_years != null && <span className="ml-auto">{m.experience_years}年经验</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Headhunting size={16} className="text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">猎头服务 — 沟通与跟进</h2>
            </div>
            <button onClick={() => navigate('/headhunter')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
              工作台 <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {comms.slice(0, 3).map((c) => {
              const CommIcon = commTypeIcon[c.comm_type] || FileText
              return (
                <div key={c.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CommIcon size={12} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-800">{c.headhunter_name || `猎头#${c.headhunter_id}`}</span>
                    <span className="text-[10px] text-slate-400">→</span>
                    <span className="text-xs text-slate-600">{c.candidate_name || `候选人#${c.candidate_id}`}</span>
                    <span className="ml-auto text-[10px] text-slate-400">{commTypeLabel[c.comm_type] || c.comm_type}</span>
                    {c.sentiment && <span className={`text-[10px] font-medium ${sentimentColor[c.sentiment]}`}>{sentimentLabel[c.sentiment]}</span>}
                  </div>
                  {c.summary ? (
                    <div className="rounded bg-primary/5 px-2.5 py-1.5 border border-primary/10">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Sparkles size={10} className="text-primary" />
                        <span className="text-[10px] font-medium text-primary">AI 摘要</span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2">{c.summary}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 line-clamp-1">{c.content}</p>
                  )}
                </div>
              )
            })}
            {followups.filter((f) => f.status === 'pending').slice(0, 2).map((f) => (
              <div key={`f-${f.id}`} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-amber-800 truncate">{f.plan_text}</p>
                  <p className="text-[10px] text-amber-600">{f.candidate_name} · {f.scheduled_at ? new Date(f.scheduled_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : ''}</p>
                </div>
                <span className={`ml-2 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${followupStatusColor[f.status] || followupStatusColor.pending}`}>
                  {followupStatusLabel[f.status] || '待处理'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-rose-600" />
              <h2 className="text-base font-semibold text-slate-900">面试评估 — 评分与复查</h2>
            </div>
            <button onClick={() => navigate('/interviews')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
              全部面试 <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {interviews.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">暂无面试安排</p>
            ) : (
              interviews.slice(0, 4).map((iv) => {
                const evalDone = iv.technical_skill != null
                return (
                  <div key={iv.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800">{iv.candidate_name || `候选人#${iv.candidate_id}`}</p>
                        <p className="text-[10px] text-slate-500">{iv.job_title || `职位#${iv.job_id}`}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        iv.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        iv.status === 'scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {iv.status === 'completed' ? '已完成' : iv.status === 'scheduled' ? '待面试' : iv.status}
                      </span>
                    </div>
                    {evalDone ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: '技术', val: iv.technical_skill },
                          { label: '沟通', val: iv.communication },
                          { label: '项目', val: iv.project_experience },
                          { label: '文化', val: iv.cultural_fit },
                        ].map(({ label, val }) => (
                          <div key={label} className="text-center">
                            <div className={`text-xs font-bold ${val >= 7 ? 'text-emerald-600' : val >= 4 ? 'text-amber-600' : 'text-red-500'}`}>{val ?? '-'}</div>
                            <div className="text-[9px] text-slate-400">{label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <AlertTriangle size={10} />
                        <span>尚未评估</span>
                        <button onClick={() => navigate(`/interviews/${iv.id}`)} className="ml-auto text-primary font-medium hover:text-primary/80">
                          去评估 →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-600" />
              <h2 className="text-base font-semibold text-slate-900">招聘漏斗 — 转化与归因</h2>
            </div>
            <button onClick={() => navigate('/analytics')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
              深度分析 <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-1.5 mb-4">
            {funnelData.map((stage, idx) => {
              const maxCount = Math.max(...funnelData.map((s) => s.candidate_count), 1)
              const widthPct = Math.max((stage.candidate_count / maxCount) * 100, 15)
              return (
                <div key={stage.stage_name} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[11px] text-slate-600 text-right truncate">{stage.stage_name}</span>
                  <div className="flex-1 h-5 rounded bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded ${funnelColors[idx % funnelColors.length]} flex items-center justify-end px-1.5 transition-all`} style={{ width: `${widthPct}%` }}>
                      <span className="text-[9px] font-bold text-white">{stage.candidate_count}</span>
                    </div>
                  </div>
                  {idx > 0 && stage.conversion_rate != null ? (
                    <span className={`w-10 shrink-0 text-[11px] font-medium text-right ${stage.conversion_rate >= 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {(stage.conversion_rate * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="w-10 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
          {attributionData.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-slate-500 mb-2">流失归因 TOP3</p>
              <div className="space-y-1.5">
                {attributionData.slice(0, 3).map((a) => (
                  <div key={a.reason} className="flex items-center justify-between rounded bg-slate-50 px-2.5 py-1.5">
                    <span className="text-xs text-slate-700">{a.reason}</span>
                    <span className={`text-xs font-bold ${a.total_percentage >= 30 ? 'text-red-600' : 'text-amber-600'}`}>{a.total_percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">校招通道 — 转正与大使</h2>
            </div>
            <button onClick={() => navigate('/campus')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
              校招管理 <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[11px] text-emerald-600">实习生转正率预测</p>
              <p className="text-2xl font-bold text-emerald-700">{avgConvProb}%</p>
              <div className="mt-1 h-2 rounded-full bg-emerald-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${avgConvProb}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-[11px] text-amber-600">转正风险</p>
              <p className="text-2xl font-bold text-amber-700">{highRiskInterns.length}<span className="text-sm font-normal text-amber-500"> 人</span></p>
              <p className="text-[10px] text-amber-500 mt-1">转化概率 &lt; 40%</p>
            </div>
          </div>
          {internships.slice(0, 3).map((intern) => {
            const prob = Math.round((intern.conversion_probability ?? 0) * 100)
            return (
              <div key={intern.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">{intern.candidate_name || `实习生#${intern.id}`}</p>
                  <p className="text-[10px] text-slate-500">{intern.university} · {intern.major}</p>
                </div>
                <div className="w-16">
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span className="text-slate-500">转正率</span>
                    <span className={`font-semibold ${prob >= 70 ? 'text-emerald-600' : prob >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{prob}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${prob >= 70 ? 'bg-emerald-500' : prob >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${prob}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-cyan-600" />
            <h2 className="text-base font-semibold text-slate-900">后台管理 — 信用·脱敏·AI·薪酬</h2>
          </div>
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
            管理后台 <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={14} className="text-cyan-600" />
              <span className="text-xs font-semibold text-slate-700">企业信用评级</span>
            </div>
            {enterprises.slice(0, 3).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-slate-600 truncate">{e.name}</span>
                <span className={`text-[11px] font-bold ${(e.credit_score || 0) >= 80 ? 'text-emerald-600' : (e.credit_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {e.credit_score || '-'}分
                </span>
              </div>
            ))}
            <p className="mt-1.5 text-[10px] text-slate-400">评级依据: 履约率·付款时效·合作评级</p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-violet-600" />
              <span className="text-xs font-semibold text-slate-700">隐私脱敏沙箱</span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-600">活跃规则</span>
              <span className="text-[11px] font-bold text-violet-600">{activeRules.length}/{privacyRules.length}</span>
            </div>
            <div className="space-y-1">
              {privacyRules.slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{r.field_name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">{r.rule_type}</span>
                    <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ${(r.is_active || r.enabled) ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      {(r.is_active || r.enabled) && <CheckCircle size={8} className="text-emerald-600" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">沙箱: 脱敏前后对比·操作日志</p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">AI面试训练集</span>
            </div>
            {aiDatasets.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-slate-600 truncate">{d.name}</span>
                <span className="text-[11px] text-blue-600 font-medium">{d.quality_score || '-'}★</span>
              </div>
            ))}
            <p className="mt-1.5 text-[10px] text-slate-400">版本历史·样本量·训练状态</p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">行业薪酬基准</span>
            </div>
            {salaryBenchmarks.slice(0, 3).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-slate-600 truncate">{b.industry}/{b.position}</span>
                <span className="text-[11px] font-medium text-emerald-600">{formatSalary(b.p50)}</span>
              </div>
            ))}
            <p className="mt-1.5 text-[10px] text-slate-400">P25/P50/P75/P90·走势·更新记录</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">快捷操作</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '新建候选人', icon: UserPlus, path: '/candidates/new', color: 'bg-blue-600 hover:bg-blue-700' },
            { label: '发布职位', icon: FileText, path: '/jobs/new', color: 'bg-emerald-600 hover:bg-emerald-700' },
            { label: '发起匹配', icon: GitCompareArrows, path: '/matching', color: 'bg-violet-600 hover:bg-violet-700' },
            { label: '招聘分析', icon: BarChart3, path: '/analytics', color: 'bg-amber-600 hover:bg-amber-700' },
            { label: '猎头工作台', icon: Headhunting, path: '/headhunter', color: 'bg-blue-600 hover:bg-blue-700' },
            { label: '面试评估', icon: ClipboardCheck, path: '/interviews', color: 'bg-rose-600 hover:bg-rose-700' },
            { label: '校招通道', icon: GraduationCap, path: '/campus', color: 'bg-emerald-600 hover:bg-emerald-700' },
            { label: '后台管理', icon: Settings, path: '/admin', color: 'bg-cyan-600 hover:bg-cyan-700' },
          ].map(({ label, icon: Icon, path, color }) => (
            <button key={label} onClick={() => navigate(path)} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${color}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
