import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Building2, ChevronDown, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const departments = ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科']
const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京']
const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
const salaryRanges = [
  { label: '5K以下', min: 0, max: 5000 },
  { label: '5K-10K', min: 5000, max: 10000 },
  { label: '10K-20K', min: 10000, max: 20000 },
  { label: '20K-30K', min: 20000, max: 30000 },
  { label: '30K-50K', min: 30000, max: 50000 },
  { label: '50K以上', min: 50000, max: 999999 },
]

interface JobItem {
  id: string
  title: string
  department: string
  institution_name: string
  institution_type: string
  location: string
  salary_min: number
  salary_max: number
  required_title: string
  publishedAt: string
}

function formatSalary(min: number, max: number) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${fmt(min)}-${fmt(max)}`
}

export default function Jobs() {
  const [searchParams] = useSearchParams()
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    searchParams.get('department') ? [searchParams.get('department')!] : []
  )
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedTitles, setSelectedTitles] = useState<string[]>([])
  const [selectedSalary, setSelectedSalary] = useState('')
  const [page, setPage] = useState(1)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageSize = 6

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (selectedDepts.length > 0) params.set('department', selectedDepts.join(','))
      if (selectedLocation) params.set('location', selectedLocation)
      if (selectedTitles.length > 0) params.set('title', selectedTitles.join(','))
      const res = await apiFetch(`/jobs?${params.toString()}`)
      if (res.success) {
        setJobs(res.data.items || [])
        setTotal(res.data.total || 0)
        setTotalPages(res.data.totalPages || 0)
      }
    } catch {
      setJobs([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page, selectedDepts, selectedLocation, selectedTitles])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept])
    setPage(1)
  }
  const toggleTitle = (title: string) => {
    setSelectedTitles((prev) => prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title])
    setPage(1)
  }

  const clearFilters = () => {
    setSelectedDepts([])
    setSelectedLocation('')
    setSelectedTitles([])
    setSelectedSalary('')
    setPage(1)
  }

  const hasFilters = selectedDepts.length > 0 || selectedLocation || selectedTitles.length > 0 || selectedSalary

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-6">
        <aside className="w-64 shrink-0">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-stone-200 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-stone-800">筛选条件</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1">
                  <X className="w-3 h-3" /> 清除
                </button>
              )}
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-stone-600 mb-2">科室</h4>
              <div className="space-y-1.5">
                {departments.map((dept) => (
                  <label key={dept} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDepts.includes(dept)}
                      onChange={() => toggleDept(dept)}
                      className="w-4 h-4 rounded border-stone-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span className="text-stone-700">{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-stone-600 mb-2">地域</h4>
              <div className="relative">
                <select
                  value={selectedLocation}
                  onChange={(e) => { setSelectedLocation(e.target.value); setPage(1) }}
                  className="w-full h-9 pl-3 pr-8 border border-stone-300 rounded-lg appearance-none text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">全部</option>
                  {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-medium text-stone-600 mb-2">职称</h4>
              <div className="space-y-1.5">
                {titles.map((title) => (
                  <label key={title} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTitles.includes(title)}
                      onChange={() => toggleTitle(title)}
                      className="w-4 h-4 rounded border-stone-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span className="text-stone-700">{title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-stone-600 mb-2">薪资范围</h4>
              <div className="space-y-1.5">
                {salaryRanges.map((range) => (
                  <label key={range.label} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="salary"
                      checked={selectedSalary === range.label}
                      onChange={() => { setSelectedSalary(range.label); setPage(1) }}
                      className="w-4 h-4 border-stone-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span className="text-stone-700">{range.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">共 {total} 个职位</p>
          </div>
          {loading ? (
            <div className="text-center text-stone-500 py-12">加载中...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="bg-white border border-stone-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-stone-800">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{job.department}</span>
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded">{job.required_title}</span>
                      </div>
                    </div>
                    <span className="text-amber-600 font-bold whitespace-nowrap">{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-stone-500">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.institution_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-teal-700 text-white' : 'border border-stone-300 hover:bg-stone-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-stone-300 rounded-lg text-sm disabled:opacity-40 hover:bg-stone-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
