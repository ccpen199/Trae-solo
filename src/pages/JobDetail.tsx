import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, DollarSign, ArrowLeft, Users } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, ScoreBar, LoadingSpinner } from '@/components/Shared'
import type { Job, MatchResult, SkillCategory } from '@/types'

const statusStyle: Record<string, string> = {
  '招聘中': 'bg-green-500/20 text-green-400 border-green-500/30',
  '草稿': 'bg-steel-500/20 text-steel-300 border-steel-500/30',
  '已关闭': 'bg-red-500/20 text-red-400 border-red-500/30',
}
const catBadge: Record<SkillCategory, string> = { '硬技能': 'badge-hard', '软技能': 'badge-soft', '认证': 'badge-cert' }

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetchApi<Job>(`/api/jobs/${id}`),
      fetchApi<MatchResult[]>(`/api/jobs/${id}/candidates`),
    ]).then(([j, c]) => { setJob(j); setCandidates(c) }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!job) return <div className="text-center py-20 text-steel-500">职位不存在</div>

  const funnel = job.funnel
  const funnelStages = [
    { label: '简历', count: funnel.totalResumes, color: 'bg-ice-500' },
    { label: '筛选', count: funnel.screened, color: 'bg-amber-500' },
    { label: '面试', count: funnel.interviewed, color: 'bg-green-500' },
    { label: 'Offer', count: funnel.offered, color: 'bg-amber-400' },
  ]
  const maxFunnel = Math.max(funnel.totalResumes, 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-sm text-steel-400 hover:text-amber-400 transition-colors"><ArrowLeft className="w-4 h-4" />返回职位列表</button>

      <div className="card-glass p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-steel-50">{job.title}</h1>
            <p className="text-steel-400 mt-1">{job.company}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle[job.status]}`}>{job.status}</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <FieldBadge field={job.field} />
          <span className="flex items-center gap-1 text-sm text-steel-400"><MapPin className="w-4 h-4" />{job.location}</span>
          <span className="flex items-center gap-1 text-sm text-amber-400"><DollarSign className="w-4 h-4" />{job.salaryMin / 1000}K-{job.salaryMax / 1000}K</span>
        </div>
      </div>

      <div className="card-glass p-6">
        <h2 className="section-title">职位描述</h2>
        <p className="text-steel-300 text-sm leading-relaxed">{job.description}</p>
      </div>

      <div className="card-glass p-6">
        <h2 className="section-title">技能要求</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-steel-400 border-b border-steel-700"><th className="text-left pb-2">名称</th><th className="text-left pb-2">类别</th><th className="text-left pb-2">级别</th><th className="text-left pb-2">属性</th></tr></thead>
          <tbody>
            {job.skillRequirements.map(s => (
              <tr key={s.id} className="border-b border-steel-800">
                <td className="py-2 text-steel-200">{s.name}</td>
                <td className="py-2"><span className={catBadge[s.category]}>{s.category}</span></td>
                <td className="py-2 text-steel-300">{s.preferredLevel}</td>
                <td className="py-2">{s.required ? <span className="text-amber-400 text-xs">必须</span> : <span className="text-steel-500 text-xs">优先</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-glass p-6">
        <h2 className="section-title">强约束条件</h2>
        <div className="space-y-2">
          {job.hardConstraints.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-steel-800/50 rounded-lg px-3 py-2">
              <span className="badge-hard">{c.type}</span>
              <span className="text-sm text-steel-200">{c.value}</span>
              {c.required && <span className="text-xs text-amber-400">必须</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-6">
        <h2 className="section-title">招聘漏斗</h2>
        <div className="space-y-3">
          {funnelStages.map(stage => (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="text-xs text-steel-400 w-10">{stage.label}</span>
              <div className="flex-1 h-6 bg-steel-800 rounded-full overflow-hidden">
                <div className={`h-full ${stage.color} rounded-full transition-all duration-700`} style={{ width: `${(stage.count / maxFunnel) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-steel-200 w-12 text-right">{stage.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-glass p-6">
        <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-amber-500" /><h2 className="section-title mb-0">候选人匹配</h2></div>
        <div className="space-y-3">
          {candidates.map(c => (
            <div key={c.talentId} className="bg-steel-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-steel-100 font-medium text-sm">{c.talentName}</span><FieldBadge field={c.talentField} /></div>
                <span className="text-amber-400 font-mono text-sm">{c.overallScore.toFixed(1)}%</span>
              </div>
              <ScoreBar score={c.overallScore} label="综合匹配" />
            </div>
          ))}
          {candidates.length === 0 && <p className="text-steel-500 text-sm">暂无匹配候选人</p>}
        </div>
      </div>
    </div>
  )
}
