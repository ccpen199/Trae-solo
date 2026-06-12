import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { Link } from 'react-router-dom'
import { MapPin, Building2, Clock, ChevronRight } from 'lucide-react'

type AppStatus = '投递' | '已读' | '邀约' | '面试' | '录用' | '不合适'

interface TimelineItem {
  status: AppStatus
  time: string
  note?: string
}

interface Application {
  id: string
  job_title: string
  department: string
  institution_name: string
  institution_type: string
  location: string
  salary_min: number
  salary_max: number
  status: string
  timeline: string
}

const statusMap: Record<string, AppStatus> = {
  applied: '投递',
  read: '已读',
  invited: '邀约',
  interview: '面试',
  offered: '录用',
  rejected: '不合适',
}

const statusColors: Record<AppStatus, string> = {
  '投递': 'bg-blue-100 text-blue-700',
  '已读': 'bg-stone-100 text-stone-600',
  '邀约': 'bg-amber-100 text-amber-700',
  '面试': 'bg-teal-100 text-teal-700',
  '录用': 'bg-green-100 text-green-700',
  '不合适': 'bg-red-100 text-red-700',
}

function formatSalary(min: number, max: number) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${fmt(min)}-${fmt(max)}`
}

function parseTimeline(timelineStr: string): TimelineItem[] {
  try {
    const parsed = JSON.parse(timelineStr)
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        status: statusMap[item.status] || item.status,
        time: item.time || '',
        note: item.note,
      }))
    }
    return []
  } catch {
    return []
  }
}

interface MappedApp {
  id: string
  jobTitle: string
  department: string
  institution: string
  location: string
  salary: string
  status: AppStatus
  timeline: TimelineItem[]
}

export default function Applications() {
  const { user } = useAuthStore()
  const [selectedApp, setSelectedApp] = useState<MappedApp | null>(null)
  const [filterStatus, setFilterStatus] = useState<AppStatus | '全部'>('全部')
  const [applications, setApplications] = useState<MappedApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/applications')
        if (res.success) {
          const mapped: MappedApp[] = (res.data || []).map((app: Application) => ({
            id: String(app.id),
            jobTitle: app.job_title,
            department: app.department,
            institution: app.institution_name,
            location: app.location,
            salary: formatSalary(app.salary_min, app.salary_max),
            status: statusMap[app.status] || ('投递' as AppStatus),
            timeline: parseTimeline(app.timeline),
          }))
          setApplications(mapped)
        }
      } catch {
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchApps()
  }, [])

  const filteredApps = filterStatus === '全部'
    ? applications
    : applications.filter((a) => a.status === filterStatus)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-bold mb-6">投递追踪</h1>
        <div className="text-center text-stone-500 py-20">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">投递追踪</h1>

      <div className="flex gap-2 mb-6">
        {(['全部', '投递', '已读', '邀约', '面试', '录用', '不合适'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`bg-white border rounded-lg p-5 cursor-pointer transition-all ${
                  selectedApp?.id === app.id ? 'border-teal-500 shadow-md' : 'border-stone-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Link to={`/jobs/${app.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-lg text-stone-800 hover:text-teal-700">
                      {app.jobTitle}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">{app.department}</span>
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{app.institution}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{app.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-600 font-bold">{app.salary}</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[app.status]}`}>{app.status}</span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedApp && (
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 sticky top-24">
              <h3 className="font-heading font-bold text-lg mb-4">投递进度</h3>
              <div className="space-y-0">
                {selectedApp.timeline.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        i === selectedApp.timeline.length - 1 ? 'bg-teal-600 ring-4 ring-teal-100' : 'bg-teal-500'
                      }`} />
                      {i < selectedApp.timeline.length - 1 && <div className="w-0.5 h-12 bg-teal-200" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[item.status]}`}>{item.status}</span>
                      </div>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{item.time}
                      </div>
                      {item.note && <div className="text-xs text-stone-600 mt-1">{item.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
