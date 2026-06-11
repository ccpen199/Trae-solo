import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Activity, Send, CalendarDays, Plus, Search,
  BookOpen, Briefcase, ArrowRight, Clock, TrendingUp,
  Zap, Sparkles, Layout,
} from 'lucide-react'
import { useStore } from '@/store'
import type { Resume, ResumeSection } from '@/types'

const JD_SKILLS = ['React','Vue','Angular','TypeScript','JavaScript','Node.js','Python','Java','Go','Docker','Kubernetes','AWS','CI/CD','Git','SQL','MongoDB','Redis','GraphQL','REST','Webpack','Vite','Tailwind','CSS','HTML','Sass','Jest','Cypress','Figma','Agile','Scrum','Linux','Nginx','Microservices']

function AnimatedScore({ target }: { target: number }) {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const steps = 60
    const increment = target / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      if (step >= steps) { setCurrent(target); clearInterval(timer) }
      else setCurrent(Math.round(increment * step))
    }, 1000 / steps)
    return () => clearInterval(timer)
  }, [target])
  return <span className="stat-number text-amber-400">{current}</span>
}

function CircularProgress({ value, size = 64, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 80 ? '#00B894' : value >= 60 ? '#D4A853' : '#E17055'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill="#0F2B46" fontWeight="700" fontSize={size * 0.22}>{value}</text>
    </svg>
  )
}

function getResumeSkills(sections: ResumeSection[]) {
  const skillsSection = sections.find((s) => s.type === 'skills')
  const items = (skillsSection?.content?.items as string[]) || []
  const text = sections.map((s) => Object.values(s.content).flat().join(' ')).join(' ')
  return [...new Set([...items, ...JD_SKILLS.filter((sk) => text.toLowerCase().includes(sk.toLowerCase()))])]
}

function calcFitness(resume: Resume) {
  const skills = getResumeSkills(resume.sections)
  const hasExp = resume.sections.some((s) => s.type === 'experience')
  const hasEdu = resume.sections.some((s) => s.type === 'education')
  const kd = resume.keywordDensity
  const dims = [
    { name: '技能匹配', score: Math.min(100, skills.length * 15), benchmark: 70 },
    { name: '经验相关性', score: hasExp ? 75 : 30, benchmark: 65 },
    { name: '教育背景', score: hasEdu ? 80 : 40, benchmark: 60 },
    { name: '关键词密度', score: kd.atsScore, benchmark: 70 },
    { name: '格式规范', score: resume.sections.length >= 3 ? 85 : 50, benchmark: 65 },
  ]
  return { overall: Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length), dimensions: dims }
}

function buildSuggestions(fitness: ReturnType<typeof calcFitness>) {
  return fitness.dimensions
    .filter((d) => d.score < d.benchmark)
    .map((d) => ({
      priority: d.score < d.benchmark - 20 ? 'high' : d.score < d.benchmark - 10 ? 'medium' : 'low' as const,
      category: d.name,
      content: `${d.name}得分${d.score}分，低于行业基准${d.benchmark}分，建议优化`,
    }))
    .sort((a, b) => (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) - (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2))
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const PRIORITY_BADGE: Record<string, string> = { high: 'bg-coral/10 text-coral', medium: 'bg-amber-400/10 text-amber-500', low: 'bg-navy-100 text-navy-500' }
const PRIORITY_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }
const statusLabels: Record<string, string> = { applied: '已投递', interview: '面试中', offer: '已录用', rejected: '已拒绝', todo: '待投递' }
const statusColors: Record<string, string> = { applied: 'bg-amber-400/10 text-amber-600', interview: 'bg-navy-50 text-navy-500', offer: 'bg-emerald/10 text-emerald', rejected: 'bg-coral/10 text-coral', todo: 'bg-gray-100 text-gray-500' }

export default function Home() {
  const { resumes, applications, currentUser, auditLogs, cases } = useStore()

  const interviewCount = applications.filter((a) => a.status === 'interview').length
  const diagnosisCount = auditLogs.filter((log) => log.action === 'diagnosis').length
  const appliedCount = applications.filter((a) => ['applied', 'interview', 'offer'].includes(a.status)).length
  const avgAtsScore = resumes.length > 0
    ? Math.round(resumes.reduce((sum, r) => sum + r.keywordDensity.atsScore, 0) / resumes.length) : 0

  const stats = [
    { label: '简历数量', value: resumes.length, icon: FileText, color: 'text-navy-500', bg: 'bg-navy-50' },
    { label: '诊断完成', value: diagnosisCount, icon: Activity, color: 'text-emerald', bg: 'bg-emerald/10' },
    { label: '网申投递', value: appliedCount, icon: Send, color: 'text-amber-500', bg: 'bg-amber-400/10' },
    { label: '面试安排', value: interviewCount, icon: CalendarDays, color: 'text-coral', bg: 'bg-coral/10' },
  ]

  const maxDensity = resumes.length > 0
    ? Math.max(...resumes.flatMap((r) => r.keywordDensity.keywords.map((k) => k.density))) : 1

  const firstResume = resumes[0]
  const fitness = firstResume ? calcFitness(firstResume) : null
  const suggestions = fitness ? buildSuggestions(fitness).slice(0, 3) : []

  const pipelineCounts = {
    todo: applications.filter((a) => a.status === 'todo').length,
    applied: applications.filter((a) => a.status === 'applied').length,
    interview: applications.filter((a) => a.status === 'interview').length,
    offer: applications.filter((a) => a.status === 'offer').length,
  }

  const topCases = cases.slice(0, 3)
  const templates = [{ name: '经典专业', color: 'bg-navy-500' }, { name: '现代简约', color: 'bg-slate-600' }, { name: '创意设计', color: 'bg-purple-600' }]
  const recentResumes = [...resumes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3)
  const recentApps = applications.filter((a) => a.status !== 'todo').sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()).slice(0, 3)

  return (
    <div className="min-h-screen bg-ivory">
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700">
        <div className="absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="hero-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1.5" fill="white" />
                <path d="M0 30h60M30 0v60" stroke="white" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-amber-400 flex items-center justify-center">
              <FileText className="h-5 w-5 text-navy-700" />
            </div>
            <span className="font-display text-2xl font-bold text-white tracking-wide">CareerForge</span>
          </div>
          <p className="text-navy-200 text-lg mb-8">让每一份简历都成为你的竞争力</p>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-navy-300 text-sm mb-1">综合 ATS 评分</p>
              <div className="flex items-baseline gap-2">
                <AnimatedScore target={avgAtsScore} />
                <span className="text-navy-300 text-lg">/ 100</span>
              </div>
            </div>
            <div className="ml-6 flex items-center gap-2 text-emerald text-sm">
              <TrendingUp className="h-4 w-4" /><span>持续优化中</span>
            </div>
          </div>
          {currentUser && <p className="absolute top-6 right-6 text-navy-300 text-sm">你好，{currentUser.name}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5 animate-slide-up hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className={`${stat.bg} p-2 rounded-lg`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                <span className="text-sm text-graphite/70">{stat.label}</span>
              </div>
              <p className={`${stat.color} stat-number`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title mb-5">ATS 评分明细</h2>
        {resumes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {resumes.map((resume) => {
              const topKw = resume.keywordDensity.keywords.slice(0, 3)
              return (
                <Link key={resume.id} to={`/resume/editor/${resume.id}`} className="glass-card p-5 hover:shadow-md transition-shadow duration-200 block">
                  <div className="flex items-start gap-4">
                    <CircularProgress value={resume.keywordDensity.atsScore} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy-700 truncate">{resume.title}</h3>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${resume.lang === 'zh' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {resume.lang === 'zh' ? '中' : 'EN'}
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {topKw.map((kw) => (
                          <div key={kw.word} className="flex items-center gap-2">
                            <span className="text-xs text-graphite/70 w-16 truncate">{kw.word}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(kw.density / maxDensity) * 100}%` }} />
                            </div>
                            <span className="text-xs text-graphite/50 w-10 text-right">{kw.density}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-8 text-center mb-10">
            <FileText className="h-8 w-8 text-graphite/20 mx-auto mb-3" />
            <p className="text-graphite/40 mb-3">暂无简历</p>
            <Link to="/resume" className="btn-amber text-sm inline-flex items-center gap-1">创建简历 <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        )}

        <h2 className="section-title mb-5">最近诊断结果</h2>
        {fitness ? (
          <div className="glass-card p-6 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald/10 p-2 rounded-lg"><Sparkles className="h-5 w-5 text-emerald" /></div>
              <div className="flex-1">
                <h3 className="font-semibold text-navy-700">{firstResume.title}</h3>
                <p className="text-xs text-graphite/50">综合适配度评分</p>
              </div>
              <span className={`text-4xl font-bold font-display ${fitness.overall >= 80 ? 'text-emerald' : fitness.overall >= 60 ? 'text-amber-500' : 'text-coral'}`}>
                {fitness.overall}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {fitness.dimensions.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-graphite/70">{d.name}</span>
                    <span className={d.score >= d.benchmark ? 'text-emerald' : 'text-amber-500'}>{d.score}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.score >= d.benchmark ? 'bg-emerald' : 'bg-amber-400'}`} style={{ width: `${d.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {suggestions.length > 0 && (
              <div className="space-y-2 mb-4">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PRIORITY_BADGE[s.priority]}`}>{PRIORITY_LABEL[s.priority]}</span>
                    <span className="text-graphite/70">{s.content}</span>
                  </div>
                ))}
              </div>
            )}
            <Link to={`/resume/diagnosis/${firstResume.id}`} className="btn-secondary text-sm inline-flex items-center gap-1 w-full justify-center">
              查看完整诊断 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="glass-card p-8 text-center mb-10">
            <Zap className="h-8 w-8 text-graphite/20 mx-auto mb-3" />
            <p className="text-graphite/40 mb-3">尚未进行简历诊断</p>
            <Link to="/resume/diagnosis/new" className="btn-primary text-sm inline-flex items-center gap-1">开始诊断 <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        )}

        <h2 className="section-title mb-5">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Link to="/resume" className="glass-card p-5 hover:shadow-md transition-all duration-200 flex flex-col">
            <div className="bg-navy-50 p-2.5 rounded-lg w-fit mb-3"><Plus className="h-5 w-5 text-navy-500" /></div>
            <h3 className="font-semibold text-navy-500 mb-2">创建简历</h3>
            <div className="flex gap-2 mb-3">
              {templates.map((t) => (
                <div key={t.name} className="flex-1 text-center">
                  <div className={`${t.color} h-10 rounded flex items-center justify-center mb-1`}>
                    <Layout className="h-4 w-4 text-white/60" />
                  </div>
                  <span className="text-[10px] text-graphite/60">{t.name}</span>
                </div>
              ))}
            </div>
            <span className="btn-amber text-sm text-center mt-auto inline-flex items-center justify-center gap-1">选择模板 <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>

          <Link to="/resume/diagnosis/new" className="glass-card p-5 hover:shadow-md transition-all duration-200 flex flex-col">
            <div className="bg-navy-50 p-2.5 rounded-lg w-fit mb-3"><Search className="h-5 w-5 text-navy-500" /></div>
            <h3 className="font-semibold text-navy-500 mb-2">智能诊断</h3>
            <textarea className="input-field h-14 text-xs resize-none mb-2" placeholder="粘贴目标 JD，快速分析匹配度..." readOnly />
            <span className="btn-primary text-sm text-center mt-auto inline-flex items-center justify-center gap-1">开始分析 <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>

          <Link to="/cases" className="glass-card p-5 hover:shadow-md transition-all duration-200 flex flex-col">
            <div className="bg-navy-50 p-2.5 rounded-lg w-fit mb-3"><BookOpen className="h-5 w-5 text-navy-500" /></div>
            <h3 className="font-semibold text-navy-500 mb-2">浏览案例</h3>
            <div className="space-y-1.5 mb-3">
              {topCases.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-600">{c.industry}</span>
                  <span className="text-graphite/70 truncate">{c.company}</span>
                </div>
              ))}
            </div>
            <span className="btn-primary text-sm text-center mt-auto inline-flex items-center justify-center gap-1">查看更多 <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>

          <Link to="/tracking" className="glass-card p-5 hover:shadow-md transition-all duration-200 flex flex-col">
            <div className="bg-navy-50 p-2.5 rounded-lg w-fit mb-3"><Briefcase className="h-5 w-5 text-navy-500" /></div>
            <h3 className="font-semibold text-navy-500 mb-2">投递管理</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">待投递 {pipelineCounts.todo}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-600">已投递 {pipelineCounts.applied}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-navy-50 text-navy-500">面试中 {pipelineCounts.interview}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">已录用 {pipelineCounts.offer}</span>
            </div>
            <span className="btn-primary text-sm text-center mt-auto inline-flex items-center justify-center gap-1">管理投递 <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          <div>
            <h2 className="section-title mb-5">最近简历</h2>
            {recentResumes.length > 0 ? (
              <div className="space-y-3">
                {recentResumes.map((r) => (
                  <Link key={r.id} to={`/resume/editor/${r.id}`} className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                    <div className="bg-navy-50 p-2 rounded-lg shrink-0"><FileText className="h-5 w-5 text-navy-500" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-700 truncate">{r.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${r.lang === 'zh' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          {r.lang === 'zh' ? '中' : 'EN'}
                        </span>
                        <span className="badge-ats">ATS {r.keywordDensity.atsScore}</span>
                        {r.keywordDensity.keywords.slice(0, 3).map((kw) => (
                          <span key={kw.word} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-600">{kw.word}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-graphite/50 shrink-0">
                      <Clock className="h-3 w-3" />{formatDate(r.updatedAt)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center text-graphite/40">暂无简历</div>
            )}
          </div>

          <div>
            <h2 className="section-title mb-5">最近投递</h2>
            {recentApps.length > 0 ? (
              <div className="space-y-3">
                {recentApps.map((app) => {
                  const nextInterview = app.interviews.find((iv) => new Date(iv.date) > new Date())
                  return (
                    <Link key={app.id} to="/tracking" className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
                      <div className="bg-amber-400/10 p-2 rounded-lg shrink-0"><Briefcase className="h-5 w-5 text-amber-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy-700 truncate">{app.company}</p>
                        <p className="text-sm text-graphite/60 truncate">{app.position}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[app.status]}`}>{statusLabels[app.status]}</span>
                          {nextInterview && (
                            <span className="text-xs text-navy-500 flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />{formatDate(nextInterview.date)}
                            </span>
                          )}
                          {app.notes && <span className="text-xs text-graphite/40 truncate max-w-[120px]">{app.notes}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="glass-card p-8 text-center text-graphite/40">暂无投递记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
