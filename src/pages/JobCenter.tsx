import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MapPin, DollarSign, Briefcase, Filter } from 'lucide-react'
import { fetchApi } from '@/utils/api'
import { FieldBadge, LoadingSpinner } from '@/components/Shared'
import type { Job, Field, JobStatus } from '@/types'

const fields: (Field | '') = '' as const
const fieldOptions: ('' | Field)[] = ['', '汽车制造', '零部件', '新能源', '智能驾驶']
const statusOptions: ('' | JobStatus | '全部')[] = ['全部', '招聘中', '草稿', '已关闭']

const statusStyle: Record<JobStatus, string> = {
  '招聘中': 'bg-green-500/20 text-green-400 border-green-500/30',
  '草稿': 'bg-steel-500/20 text-steel-300 border-steel-500/30',
  '已关闭': 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function JobCenter() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [fieldFilter, setFieldFilter] = useState<'' | Field>('')
  const [statusFilter, setStatusFilter] = useState<'' | JobStatus | '全部'>('全部')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (fieldFilter) params.set('field', fieldFilter)
    if (statusFilter && statusFilter !== '全部') params.set('status', statusFilter)
    if (search) params.set('q', search)
    fetchApi<Job[]>(`/api/jobs?${params.toString()}`)
      .then(setJobs)
      .finally(() => setLoading(false))
  }, [fieldFilter, statusFilter, search])

  const formatSalary = (min: number, max: number) => `${min / 1000}K-${max / 1000}K`

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">职位中心</h1>
        <button onClick={() => navigate('/jobs/create')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />创建职位
        </button>
      </div>

      <div className="card-glass p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-steel-400" />
          <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value as '' | Field)} className="input-dark text-sm">
            <option value="">全部领域</option>
            {fieldOptions.slice(1).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as '' | JobStatus | '全部')} className="input-dark text-sm">
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索职位..." className="input-dark text-sm w-full pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {jobs.map(job => (
          <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="card-glass card-hover p-5 cursor-pointer space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-steel-100 font-semibold text-base">{job.title}</h3>
                <p className="text-steel-400 text-sm mt-0.5">{job.company}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle[job.status]}`}>{job.status}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <FieldBadge field={job.field} />
              <span className="flex items-center gap-1 text-xs text-steel-400"><MapPin className="w-3 h-3" />{job.location}</span>
              <span className="flex items-center gap-1 text-xs text-amber-400"><DollarSign className="w-3 h-3" />{formatSalary(job.salaryMin, job.salaryMax)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-steel-400">
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />技能要求 {(job as any).skill_requirement_count ?? 0}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />强约束 {(job as any).hard_constraint_count ?? 0}</span>
            </div>
          </div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-16 text-steel-500">暂无职位数据</div>
      )}
    </div>
  )
}
