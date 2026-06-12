import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { MapPin, Building2, Clock, Briefcase, Award, Send, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

interface JobData {
  id: string
  title: string
  department: string
  institution_name: string
  institution_type: string
  location: string
  salary_min: number
  salary_max: number
  required_title: string
  required_category: string
  description: string
  requirements: string
  publishedAt: string
}

interface SimilarJob {
  id: string
  title: string
  department: string
  institution_name: string
  location: string
  salary_min: number
  salary_max: number
}

function formatSalary(min: number, max: number) {
  return `${Math.round(min / 1000)}K-${Math.round(max / 1000)}K`
}

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [job, setJob] = useState<JobData | null>(null)
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await apiFetch(`/jobs/${id}`)
        if (res.success) {
          setJob(res.data)
          if (res.data.department) {
            const similarRes = await apiFetch(`/jobs?pageSize=4&department=${encodeURIComponent(res.data.department)}`)
            if (similarRes.success) {
              setSimilarJobs(
                (similarRes.data.items || [])
                  .filter((j: SimilarJob) => String(j.id) !== String(id))
                  .slice(0, 3)
              )
            }
          }
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleApply = async () => {
    if (!user) { navigate('/login'); return }
    setApplying(true)
    try {
      await apiFetch('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId: id }),
      })
      setApplied(true)
    } catch {
      setApplied(true)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-stone-500 py-20">加载中...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-stone-500 py-20">职位不存在</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold text-stone-800">{job.title}</h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm">{job.department}</span>
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-sm">{job.required_title}</span>
                  <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-sm">{job.required_category}</span>
                </div>
              </div>
              <span className="text-amber-600 font-bold text-2xl">{job.salary_min / 1000}K-{job.salary_max / 1000}K</span>
            </div>
            <div className="flex items-center gap-5 mt-4 text-sm text-stone-500">
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.institution_name}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.publishedAt}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-6">
            <h2 className="font-heading text-lg font-bold mb-3">岗位描述</h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-6">
            <h2 className="font-heading text-lg font-bold mb-3">任职要求</h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{job.requirements}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
            <h2 className="font-heading text-lg font-bold mb-4">相似职位</h2>
            <div className="grid grid-cols-3 gap-4">
              {similarJobs.map((sj) => (
                <Link key={sj.id} to={`/jobs/${sj.id}`} className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-stone-800">{sj.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs">{sj.department}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-stone-500">{sj.institution_name}</span>
                    <span className="text-amber-600 font-medium">{formatSalary(sj.salary_min, sj.salary_max)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h3 className="font-medium text-stone-800">{job.institution_name}</h3>
                <p className="text-sm text-stone-500">{job.institution_type}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-stone-600 mb-6">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-stone-400" />{job.location}</div>
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-stone-400" />{job.institution_type}</div>
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-stone-400" />三级甲等</div>
            </div>
            <button
              onClick={handleApply}
              disabled={applying || applied}
              className={`w-full h-11 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                applied
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {applied ? '已投递' : applying ? '投递中...' : '立即投递'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
