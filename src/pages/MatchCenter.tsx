import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GitMerge, MapPin, Sparkles, Users, Target, Globe, Award, TrendingUp, CheckCircle, XCircle, Building2, GraduationCap } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, ScoreBar, LoadingSpinner, StatCard } from '@/components/Shared'
import type { Job, MatchResult } from '@/types'

export default function MatchCenter() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const urlJobId = params.get('jobId') || ''
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)

  useEffect(() => {
    fetchApi<Job[]>('/api/jobs').then(data => {
      const activeJobs = Array.isArray(data) ? data.filter(j => j.status === '招聘中') : []
      setJobs(activeJobs)
      if (activeJobs.length > 0) {
        const preferred = urlJobId && activeJobs.some(j => j.id === urlJobId) ? urlJobId : activeJobs[0].id
        setSelectedJobId(preferred)
      }
    }).finally(() => setLoading(false))
  }, [urlJobId])

  useEffect(() => {
    if (!selectedJobId) { setMatches([]); return }
    setMatchLoading(true)
    fetchApi<MatchResult[]>(`/api/match?jobId=${selectedJobId}`)
      .then(data => setMatches(Array.isArray(data) ? data : []))
      .finally(() => setMatchLoading(false))
  }, [selectedJobId])

  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [jobs, selectedJobId])

  const avgScores = useMemo(() => {
    if (matches.length === 0) return { semantic: 0, network: 0, region: 0, overall: 0 }
    return {
      semantic: Math.round(matches.reduce((s, m) => s + m.semanticScore, 0) / matches.length),
      network: Math.round(matches.reduce((s, m) => s + m.networkScore, 0) / matches.length),
      region: Math.round(matches.reduce((s, m) => s + m.regionScore, 0) / matches.length),
      overall: Math.round(matches.reduce((s, m) => s + m.overallScore, 0) / matches.length),
    }
  }, [matches])

  const highMatches = useMemo(() => matches.filter(m => m.overallScore >= 70).length, [matches])
  const regionMatchCount = useMemo(() => matches.filter(m => m.regionScore >= 60).length, [matches])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-amber-500" />智能匹配中心
          </h1>
          <p className="text-steel-400 text-sm mt-1">基于语义分析、人脉图谱与产业集群的三维智能匹配</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-steel-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>实时计算匹配度</span>
        </div>
      </div>

      <div className="card-glass p-5">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm text-steel-400 mb-2 block">选择职位查看匹配结果</label>
            <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="input-dark w-full max-w-lg">
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title} - {j.company}</option>)}
            </select>
          </div>
          {selectedJob && (
            <div className="flex items-center gap-4 border-l border-steel-700 pl-4">
              <FieldBadge field={selectedJob.field} />
              <span className="flex items-center gap-1 text-sm text-steel-400">
                <MapPin className="w-3.5 h-3.5" />{selectedJob.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="匹配候选人" value={matches.length} suffix="位" icon={Users} color="amber" />
          <StatCard label="高匹配度(≥70)" value={highMatches} suffix="人" icon={Target} color="green" />
          <StatCard label="平均匹配分" value={avgScores.overall} suffix="分" icon={TrendingUp} color="ice" />
          <StatCard label="地域契合(≥60)" value={regionMatchCount} suffix="人" icon={Globe} color="purple" />
        </div>
      )}

      {matchLoading && <LoadingSpinner />}

      {!matchLoading && selectedJobId && matches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title mb-0">候选人列表</h2>
              <span className="text-sm text-steel-400">按综合匹配度排序</span>
            </div>
            <div className="space-y-3">
              {matches.map((m, idx) => (
                <div
                  key={m.talentId}
                  onClick={() => navigate(`/match/${m.jobId}/${m.talentId}`)}
                  className="card-glass card-hover p-5 cursor-pointer"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                        m.overallScore >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        m.overallScore >= 60 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-steel-700/50 text-steel-400 border border-steel-600'
                      }`}>
                        {m.overallScore.toFixed(0)}
                      </div>
                      <span className="text-xs text-steel-500 mt-1">综合分</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-steel-100 font-semibold text-base">{m.talentName}</h3>
                          <p className="text-steel-400 text-sm">{m.talentCompany} · {m.talentExperience}年经验</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FieldBadge field={m.talentField} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-steel-400 mb-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.talentLocation}</span>
                        {m.clusterName && <span className="flex items-center gap-1 text-green-400/80"><Globe className="w-3 h-3" />{m.clusterName}</span>}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <ScoreBar score={m.semanticScore} label="语义" />
                        <ScoreBar score={m.networkScore} label="人脉" />
                        <ScoreBar score={m.regionScore} label="地域" />
                      </div>

                      <div className="mt-4 space-y-2 border-t border-steel-700/50 pt-3">
                        {m.matchedSkills && m.matchedSkills.length > 0 && (
                          <div className="flex items-start gap-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-steel-400">JD关键词命中：</span>
                              <div className="flex flex-wrap gap-1 mt-1 inline">
                                {m.matchedSkills.map(s => (
                                  <span key={s} className="inline-block px-1.5 py-0.5 rounded bg-green-500/15 text-green-300 text-[11px] border border-green-500/20">{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {m.missingSkills && m.missingSkills.length > 0 && (
                          <div className="flex items-start gap-2 text-xs">
                            <XCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-steel-400">待补齐技能：</span>
                              <div className="flex flex-wrap gap-1 mt-1 inline">
                                {m.missingSkills.map(s => (
                                  <span key={s} className="inline-block px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/80 text-[11px] border border-amber-500/20">{s}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {m.matchedConstraintTypes && m.matchedConstraintTypes.length > 0 && (
                          <div className="flex items-start gap-2 text-xs">
                            <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-steel-400">强约束满足：</span>
                              <div className="flex flex-wrap gap-1 mt-1 inline">
                                {m.matchedConstraintTypes.map(c => (
                                  <span key={c} className="inline-block px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[11px] border border-amber-500/20">{c}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {(m.sharedAlumniCount && m.sharedAlumniCount > 0) || (m.sharedCompanies && m.sharedCompanies > 0) ? (
                          <div className="flex items-start gap-2 text-xs">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div className="text-steel-400">
                              {m.sharedAlumniCount && m.sharedAlumniCount > 0 && <span>校友网络 {m.sharedAlumniCount} 人</span>}
                              {m.sharedAlumniCount && m.sharedAlumniCount > 0 && m.sharedCompanies && m.sharedCompanies > 0 && <span className="mx-2 text-steel-600">·</span>}
                              {m.sharedCompanies && m.sharedCompanies > 0 && <span className="flex items-center gap-1 inline-flex"><Building2 className="w-3 h-3" />前司与招聘方重合</span>}
                            </div>
                          </div>
                        ) : null}
                        {m.sameRegion && (
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-steel-400">与招聘岗位同城，地域优势显著</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="section-title mb-0">匹配维度分析</h2>

            <div className="card-glass p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-steel-200">三维匹配度</span>
              </div>
              <div className="space-y-5 py-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-steel-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-ice-400" />语义相似度
                    </span>
                    <span className="text-sm font-mono text-steel-200">{avgScores.semantic}%</span>
                  </div>
                  <div className="h-2 bg-steel-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-ice-500 to-ice-400 rounded-full transition-all duration-1000" style={{ width: `${avgScores.semantic}%` }} />
                  </div>
                  <p className="text-xs text-steel-500 mt-1">基于岗位描述与简历项目经历的语义匹配</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-steel-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />人脉热度
                    </span>
                    <span className="text-sm font-mono text-steel-200">{avgScores.network}%</span>
                  </div>
                  <div className="h-2 bg-steel-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000" style={{ width: `${avgScores.network}%` }} />
                  </div>
                  <p className="text-xs text-steel-500 mt-1">校友/前司重合度与行业人脉网络</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-steel-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-green-400" />地域聚集度
                    </span>
                    <span className="text-sm font-mono text-steel-200">{avgScores.region}%</span>
                  </div>
                  <div className="h-2 bg-steel-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${avgScores.region}%` }} />
                  </div>
                  <p className="text-xs text-steel-500 mt-1">产业集群区位优势与人才留存率</p>
                </div>
              </div>
            </div>

            <div className="card-glass p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-steel-200">匹配说明</span>
              </div>
              <ul className="text-xs text-steel-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>语义分析：提取岗位JD关键词与简历项目经历进行相似度计算</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>人脉热度：基于校友网络、前司重合度计算行业人脉权重</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>地域聚集：长春/武汉/合肥等汽车产业集群优先推荐</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>综合评分 = 语义 50% + 人脉 20% + 地域 30%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!matchLoading && selectedJobId && matches.length === 0 && (
        <div className="text-center py-16 text-steel-500 card-glass">暂无匹配结果</div>
      )}

      {!selectedJobId && jobs.length === 0 && (
        <div className="text-center py-16 text-steel-500 card-glass">
          <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无招聘中的职位</p>
          <button onClick={() => navigate('/jobs/create')} className="btn-primary mt-4">
            创建职位开始匹配
          </button>
        </div>
      )}
    </div>
  )
}
