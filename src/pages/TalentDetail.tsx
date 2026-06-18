import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { MapPin, Building2, Clock, Award, Briefcase, AlertTriangle } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, LoadingSpinner } from '@/components/Shared'
import type { Talent, GapAnalysis, SkillCategory } from '@/types'

const SKILL_STYLE: Record<SkillCategory, string> = {
  '硬技能': 'bg-ice-500/15 text-ice-400 border-ice-500/30',
  '软技能': 'bg-green-500/15 text-green-400 border-green-500/30',
  '认证': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

const RADAR_AXES = [
  { key: 'semanticScore' as const, label: '语义相似度' },
  { key: 'networkScore' as const, label: '人脉热度' },
  { key: 'regionScore' as const, label: '地域聚集度' },
]

function RadarChart({ semantic, network, region }: { semantic: number; network: number; region: number }) {
  const values = [semantic, network, region]
  const cx = 100, cy = 100, r = 70
  const angles = [0, 120, 240].map(d => (d - 90) * Math.PI / 180)
  const pts = values.map((v, i) => {
    const dist = (v / 100) * r
    return { x: cx + dist * Math.cos(angles[i]), y: cy + dist * Math.sin(angles[i]) }
  })
  const axes = angles.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }))
  const polyStr = pts.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox="0 0 200 200" className="w-64 h-64 mx-auto">
      {[0.33, 0.66, 1].map(scale => {
        const sp = angles.map(a => ({ x: cx + r * scale * Math.cos(a), y: cy + r * scale * Math.sin(a) }))
        return <polygon key={scale} points={sp.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#1E3A68" strokeWidth="0.5" />
      })}
      {angles.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={axes[i].x} y2={axes[i].y} stroke="#1E3A68" strokeWidth="0.5" />
      ))}
      <polygon points={polyStr} fill="rgba(245,158,11,0.15)" stroke="#F59E0B" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#F59E0B" />
      ))}
      {axes.map((a, i) => (
        <text key={i} x={a.x + (a.x > cx ? 8 : a.x < cx ? -8 : 0)} y={a.y + (a.y > cy ? 14 : a.y < cy ? -6 : -8)} textAnchor="middle" fill="#5A7FB3" fontSize="9">
          {RADAR_AXES[i].label}
        </text>
      ))}
    </svg>
  )
}

export default function TalentDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const jobId = new URLSearchParams(location.search).get('jobId')

  const [talent, setTalent] = useState<Talent | null>(null)
  const [gap, setGap] = useState<GapAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetchApi<Talent>(`/api/talents/${id}`),
      jobId ? fetchApi<GapAnalysis>(`/api/talents/${id}/gap-analysis?jobId=${jobId}`) : Promise.resolve(null),
    ]).then(([t, g]) => { setTalent(t); setGap(g) }).finally(() => setLoading(false))
  }, [id, jobId])

  if (loading) return <LoadingSpinner />
  if (!talent) return <div className="text-center py-20 text-steel-500">人才信息未找到</div>

  return (
    <div className="space-y-8 pb-12">
      <div className="card-glass p-6 animate-fade-in">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-steel-50 mb-2">{talent.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-steel-400">
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{talent.currentCompany}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{talent.experience}年经验</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{talent.location}</span>
            </div>
          </div>
          <FieldBadge field={talent.field} />
        </div>
      </div>

      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="section-title">技能标签</h2>
        <div className="card-glass p-5 flex flex-wrap gap-2">
          {talent.skills.map(s => (
            <span key={s.id} className={`text-xs px-2.5 py-1 rounded-full border ${SKILL_STYLE[s.category]}`}>
              {s.name}
              <span className="ml-1 opacity-60">{s.level}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="section-title">资质认证</h2>
        <div className="card-glass p-5 space-y-3">
          {talent.certifications.map(c => (
            <div key={c.id} className="flex items-center justify-between border-b border-steel-700/50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-steel-100 text-sm">{c.name}</span>
              </div>
              <div className="text-xs text-steel-400 text-right">
                <div>{c.issuer}</div>
                <div>有效期至 {c.validUntil}</div>
              </div>
            </div>
          ))}
          {talent.certifications.length === 0 && <p className="text-steel-500 text-sm">暂无认证信息</p>}
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="section-title">项目经验</h2>
        <div className="relative pl-6 border-l-2 border-steel-700 space-y-6">
          {talent.projectExperience.map((p, i) => (
            <div key={p.id} className="relative animate-fade-in" style={{ animationDelay: `${0.25 + i * 0.05}s` }}>
              <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-steel-950" />
              <div className="card-glass card-hover p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-steel-100 font-semibold text-sm">{p.title}</h3>
                  <span className="text-xs text-steel-500">{p.duration}</span>
                </div>
                <p className="text-xs text-steel-400 mb-2">{p.company} · 车型: {p.vehicleModel}</p>
                <div className="flex flex-wrap gap-1">
                  {p.skills.map(s => <span key={s} className="badge-hard">{s}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {gap && jobId && (
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="section-title">差距分析</h2>
          <div className="card-glass p-6 space-y-6">
            <div className="text-center">
              <span className="text-4xl font-bold text-amber-400 font-mono">{gap.coverage.toFixed(0)}%</span>
              <p className="text-steel-400 text-sm mt-1">技能覆盖率</p>
            </div>
            <RadarChart
              semantic={gap.matched.length > 0 ? (gap.matched.reduce((a, m) => a + m.score, 0) / gap.matched.length) : 0}
              network={0}
              region={0}
            />
            <div className="grid grid-cols-3 text-center gap-2 text-sm">
              {RADAR_AXES.map(a => (
                <div key={a.key} className="text-steel-400">{a.label}</div>
              ))}
            </div>
            {gap.unmatched.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" />未匹配技能</h3>
                <div className="flex flex-wrap gap-2">
                  {gap.unmatched.map(u => (
                    <span key={u.skill} className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full">
                      {u.skill} <span className="opacity-60">(要求: {u.jobLevel})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
