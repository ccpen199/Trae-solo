import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Car, Cog, Zap, Brain, MapPin, Building2, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { StatCard, FieldBadge } from '@/components/Shared'
import type { AnalyticsOverview, Job } from '@/types'

const FIELDS = [
  { name: '汽车制造', icon: Car, color: 'text-ice-400' },
  { name: '零部件', icon: Cog, color: 'text-purple-400' },
  { name: '新能源', icon: Zap, color: 'text-green-400' },
  { name: '智能驾驶', icon: Brain, color: 'text-amber-400' },
]

const CITIES = [
  { name: '长春', count: 12000 },
  { name: '武汉', count: 9800 },
  { name: '合肥', count: 8500 },
  { name: '上海', count: 15000 },
  { name: '重庆', count: 7200 },
  { name: '广州', count: 11000 },
]

export default function Home() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [hotJobs, setHotJobs] = useState<Job[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchApi<AnalyticsOverview>('/api/analytics/overview'),
      fetchApi<Job[]>('/api/jobs?status=招聘中'),
    ]).then(([ov, jobs]) => {
      if (cancelled) return
      setOverview(ov)
      setHotJobs(Array.isArray(jobs) ? jobs.slice(0, 4) : [])
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const fieldCount = (name: string) =>
    overview?.fieldDistribution?.find(f => f.field === name)?.count ?? 0

  return (
    <div className="space-y-12 pb-12">
      <section className="text-center py-16 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-gradient">汽车行业人才智能匹配平台</span>
        </h1>
        <p className="text-steel-400 text-lg mb-8 max-w-2xl mx-auto">
          基于语义分析与人脉图谱的汽车行业精准人才推荐，加速您的招聘流程
        </p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-steel-400" />
          <input
            className="input-dark w-full pl-12 pr-24 py-3 text-base"
            placeholder="搜索岗位、人才或技能..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(`/talent?search=${encodeURIComponent(search)}`)}
          />
          <button className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm" onClick={() => navigate(`/talent?search=${encodeURIComponent(search)}`)}>
            搜索
          </button>
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <h2 className="section-title">领域分布</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FIELDS.map(f => (
            <div key={f.name} className="card-glass card-hover p-5 flex flex-col items-center gap-3 cursor-pointer" onClick={() => navigate(`/talent?field=${encodeURIComponent(f.name)}`)}>
              <f.icon className={`w-8 h-8 ${f.color}`} />
              <span className="text-sm text-steel-200 font-medium">{f.name}</span>
              <span className="text-2xl font-bold text-steel-50 font-mono">{fieldCount(f.name).toLocaleString()}</span>
              <span className="text-xs text-steel-500">人才储备</span>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <>
              <div className="card-glass p-5 h-[108px] animate-pulse bg-steel-800/40" />
              <div className="card-glass p-5 h-[108px] animate-pulse bg-steel-800/40" />
              <div className="card-glass p-5 h-[108px] animate-pulse bg-steel-800/40" />
            </>
          ) : (
            <>
              <StatCard label="活跃岗位" value={overview?.activeJobs ?? 0} suffix="+" icon={TrendingUp} color="amber" />
              <StatCard label="注册人才" value={overview?.totalTalents ?? 0} suffix="+" icon={Users} color="ice" />
              <StatCard label="匹配成功" value={overview?.totalMatches ?? 0} suffix="+" icon={CheckCircle} color="green" />
            </>
          )}
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <h2 className="section-title">热门岗位</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              <div className="card-glass p-5 h-[140px] animate-pulse bg-steel-800/40" />
              <div className="card-glass p-5 h-[140px] animate-pulse bg-steel-800/40" />
              <div className="card-glass p-5 h-[140px] animate-pulse bg-steel-800/40" />
              <div className="card-glass p-5 h-[140px] animate-pulse bg-steel-800/40" />
            </>
          ) : hotJobs.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-steel-500">暂无热门岗位</div>
          ) : (
            hotJobs.map(job => (
              <div key={job.id} className="card-glass card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-steel-100 font-semibold">{job.title}</h3>
                  <FieldBadge field={job.field} />
                </div>
                <div className="text-amber-400 font-mono text-lg mb-2">
                  {(job.salaryMin / 1000).toFixed(0)}K-{(job.salaryMax / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-4 text-sm text-steel-400">
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <h2 className="section-title">产业集群</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CITIES.map(city => (
            <div key={city.name} className="card-glass card-hover p-4 flex flex-col items-center gap-2 cursor-pointer" onClick={() => navigate(`/talent?location=${encodeURIComponent(city.name)}`)}>
              <MapPin className="w-5 h-5 text-amber-400" />
              <span className="text-steel-100 font-medium">{city.name}</span>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-400 font-mono text-sm font-bold">{(city.count / 1000).toFixed(1)}k</span>
                </div>
              </div>
              <span className="text-xs text-steel-500">人才数量</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
