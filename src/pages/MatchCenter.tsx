import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitMerge, MapPin } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, ScoreBar, LoadingSpinner } from '@/components/Shared'
import type { Job, MatchResult } from '@/types'

export default function MatchCenter() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)

  useEffect(() => {
    fetchApi<Job[]>('/api/jobs').then(setJobs).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedJobId) { setMatches([]); return }
    setMatchLoading(true)
    fetchApi<MatchResult[]>(`/api/match?jobId=${selectedJobId}`).then(setMatches).finally(() => setMatchLoading(false))
  }, [selectedJobId])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">智能匹配中心</h1>
        <GitMerge className="w-6 h-6 text-amber-500" />
      </div>

      <div className="card-glass p-4">
        <label className="text-sm text-steel-400 mb-2 block">选择职位</label>
        <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="input-dark w-full max-w-md">
          <option value="">-- 请选择职位 --</option>
          {jobs.filter(j => j.status === '招聘中').map(j => <option key={j.id} value={j.id}>{j.title} - {j.company}</option>)}
        </select>
      </div>

      {matchLoading && <LoadingSpinner />}

      {!matchLoading && selectedJobId && (
        <div className="space-y-4">
          <p className="text-sm text-steel-400">共匹配到 <span className="text-amber-400 font-mono">{matches.length}</span> 位候选人</p>
          <div className="grid grid-cols-2 gap-4">
            {matches.map(m => (
              <div
                key={m.talentId}
                onClick={() => navigate(`/match/${m.jobId}/${m.talentId}`)}
                className="card-glass card-hover p-5 cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-steel-100 font-semibold">{m.talentName}</h3>
                    <p className="text-steel-400 text-sm">{m.talentCompany}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-amber-400 font-mono">{m.overallScore.toFixed(0)}</span>
                    <span className="text-xs text-steel-400 ml-0.5">分</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FieldBadge field={m.talentField} />
                  <span className="flex items-center gap-1 text-xs text-steel-400"><MapPin className="w-3 h-3" />{m.talentLocation}</span>
                </div>
                <div className="space-y-2">
                  <ScoreBar score={m.semanticScore} label="语义相似度" />
                  <ScoreBar score={m.networkScore} label="人脉热度" />
                  <ScoreBar score={m.regionScore} label="地域聚集度" />
                </div>
              </div>
            ))}
          </div>
          {matches.length === 0 && <p className="text-center py-12 text-steel-500">暂无匹配结果</p>}
        </div>
      )}

      {!selectedJobId && (
        <div className="text-center py-16 text-steel-500">请先选择一个职位查看匹配结果</div>
      )}
    </div>
  )
}
