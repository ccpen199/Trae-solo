import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Building2, Users, Globe } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, LoadingSpinner } from '@/components/Shared'
import type { MatchDetail, Job, Talent } from '@/types'

const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
const barColor = (s: number) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-amber-500' : 'bg-red-500'

function RadarChart({ semantic, network, region }: { semantic: number; network: number; region: number }) {
  const cx = 120, cy = 120, r = 90
  const angles = [-90, 30, 150]
  const points = angles.map((a, i) => {
    const val = [semantic, network, region][i] / 100
    const rad = (a * Math.PI) / 180
    return `${cx + r * val * Math.cos(rad)},${cy + r * val * Math.sin(rad)}`
  })
  const axes = angles.map(a => {
    const rad = (a * Math.PI) / 180
    return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`
  })
  const labels = ['语义', '人脉', '地域']

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px]">
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon key={scale} points={angles.map(a => { const rad = (a * Math.PI) / 180; return `${cx + r * scale * Math.cos(rad)},${cy + r * scale * Math.sin(rad)}` }).join(' ')} fill="none" stroke="#1E3A68" strokeWidth="1" />
      ))}
      {angles.map((a, i) => (<line key={i} x1={cx} y1={cy} x2={axes[i].split(',')[0]} y2={axes[i].split(',')[1]} stroke="#1E3A68" strokeWidth="1" />))}
      <polygon points={points.join(' ')} fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth="2" />
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180
        return (<circle key={i} cx={cx + r * ([semantic, network, region][i] / 100) * Math.cos(rad)} cy={cy + r * ([semantic, network, region][i] / 100) * Math.sin(rad)} r="4" fill="#F59E0B" />)
      })}
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180
        const lx = cx + (r + 18) * Math.cos(rad)
        const ly = cy + (r + 18) * Math.sin(rad)
        return (<text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-steel-400">{labels[i]}</text>)
      })}
    </svg>
  )
}

export default function MatchDetail() {
  const { jobId, talentId } = useParams<{ jobId: string; talentId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [talent, setTalent] = useState<Talent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!jobId || !talentId) return
    Promise.all([
      fetchApi<MatchDetail>(`/api/match/${jobId}/${talentId}`),
      fetchApi<Job>(`/api/jobs/${jobId}`),
      fetchApi<Talent>(`/api/talents/${talentId}`),
    ]).then(([d, j, t]) => { setDetail(d); setJob(j); setTalent(t) }).finally(() => setLoading(false))
  }, [jobId, talentId])

  if (loading) return <LoadingSpinner />
  if (!detail || !job || !talent) return <div className="text-center py-20 text-steel-500">匹配数据不存在</div>

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/match')} className="flex items-center gap-1 text-sm text-steel-400 hover:text-amber-400 transition-colors"><ArrowLeft className="w-4 h-4" />返回匹配中心</button>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-glass p-5">
          <h3 className="section-title text-base">人才信息</h3>
          <div className="space-y-2 text-sm">
            <p className="text-steel-100 font-semibold text-lg">{talent.name}</p>
            <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-steel-400" /><span className="text-steel-300">{talent.currentCompany}</span><FieldBadge field={talent.field} /></div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-steel-400" /><span className="text-steel-300">{talent.location}</span></div>
          </div>
        </div>

        <div className="card-glass p-5 flex flex-col items-center justify-center">
          <RadarChart semantic={detail.semanticScore} network={detail.networkScore} region={detail.regionScore} />
          <div className="mt-2 text-center">
            <span className="text-3xl font-bold text-gradient font-mono">{detail.overallScore.toFixed(0)}</span>
            <span className="text-sm text-steel-400 ml-1">综合分</span>
          </div>
        </div>

        <div className="card-glass p-5">
          <h3 className="section-title text-base">职位信息</h3>
          <div className="space-y-2 text-sm">
            <p className="text-steel-100 font-semibold text-lg">{job.title}</p>
            <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-steel-400" /><span className="text-steel-300">{job.company}</span><FieldBadge field={job.field} /></div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-steel-400" /><span className="text-steel-300">{job.location}</span></div>
          </div>
        </div>
      </div>

      <div className="card-glass p-6">
        <h2 className="section-title">技能匹配详情</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-steel-400 border-b border-steel-700"><th className="text-left pb-2">技能</th><th className="text-left pb-2">职位要求</th><th className="text-left pb-2">人才级别</th><th className="text-left pb-2">匹配分</th></tr></thead>
          <tbody>
            {detail.skillMatch.map((s, i) => (
              <tr key={i} className="border-b border-steel-800">
                <td className="py-2 text-steel-200">{s.skill}</td>
                <td className="py-2 text-steel-300">{s.jobRequired}</td>
                <td className="py-2 text-steel-300">{s.talentLevel}</td>
                <td className="py-2"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-steel-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barColor(s.matchScore)}`} style={{ width: `${s.matchScore}%` }} /></div><span className={`font-mono text-xs ${scoreColor(s.matchScore)}`}>{s.matchScore.toFixed(0)}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass p-6">
          <h2 className="section-title flex items-center gap-2"><Users className="w-4 h-4 text-amber-500" />人脉重叠</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-steel-400">共同校友</span><span className="text-ice-400 font-mono">{detail.networkOverlap.sharedAlumni} 人</span></div>
            <div className="flex justify-between"><span className="text-steel-400">共同公司</span><span className="text-ice-400 font-mono">{detail.networkOverlap.sharedCompanies} 家</span></div>
            <div className="flex justify-between"><span className="text-steel-400">热度评分</span><span className={`font-mono ${scoreColor(detail.networkOverlap.warmthScore)}`}>{detail.networkOverlap.warmthScore.toFixed(1)}</span></div>
          </div>
        </div>

        <div className="card-glass p-6">
          <h2 className="section-title flex items-center gap-2"><Globe className="w-4 h-4 text-amber-500" />地域优势</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-steel-400">人才位置</span><span className="text-steel-200">{detail.regionAdvantage.talentLocation}</span></div>
            <div className="flex justify-between"><span className="text-steel-400">职位位置</span><span className="text-steel-200">{detail.regionAdvantage.jobLocation}</span></div>
            <div className="flex justify-between"><span className="text-steel-400">产业集群</span><span className="text-ice-400">{detail.regionAdvantage.clusterName}</span></div>
            <div className="flex justify-between"><span className="text-steel-400">集群评分</span><span className={`font-mono ${scoreColor(detail.regionAdvantage.clusterScore)}`}>{detail.regionAdvantage.clusterScore.toFixed(1)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
