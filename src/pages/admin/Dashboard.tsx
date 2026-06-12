import { useState, useEffect } from 'react'
import { Briefcase, Building2, Users, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store'

interface Overview {
  totalJobs?: number
  totalInstitutions?: number
  totalTalents?: number
  monthlyApplications?: number
  jobsChange?: string
  institutionsChange?: string
  talentsChange?: string
  applicationsChange?: string
  [key: string]: any
}

interface HeatmapItem {
  region?: string
  department?: string
  position?: string
  count: number
}

interface TrendItem {
  month: string
  count: number
}

interface DashboardData {
  overview: Overview
  heatmaps: {
    region: HeatmapItem[]
    department: HeatmapItem[]
    position: HeatmapItem[]
  }
  distributions: {
    applicationStatus: { status: string; count: number }[]
  }
  trends: {
    applications: TrendItem[]
    jobs: TrendItem[]
  }
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/admin/dashboard')
        if (res.success) {
          setData(res.data)
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold mb-6">统计看板</h1>
        <div className="text-center text-stone-500 py-20">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold mb-6">统计看板</h1>
        <div className="text-center text-stone-500 py-20">暂无数据</div>
      </div>
    )
  }

  const { overview, heatmaps, trends } = data

  const kpiCards = [
    {
      label: '在招岗位',
      value: (overview.totalJobs || 0).toLocaleString(),
      change: overview.jobsChange || '+0%',
      up: (overview.jobsChange || '+0%').startsWith('+'),
      icon: Briefcase,
    },
    {
      label: '注册机构',
      value: (overview.totalInstitutions || 0).toLocaleString(),
      change: overview.institutionsChange || '+0%',
      up: (overview.institutionsChange || '+0%').startsWith('+'),
      icon: Building2,
    },
    {
      label: '医疗人才',
      value: (overview.totalTalents || 0).toLocaleString(),
      change: overview.talentsChange || '+0%',
      up: (overview.talentsChange || '+0%').startsWith('+'),
      icon: Users,
    },
    {
      label: '本月投递',
      value: (overview.monthlyApplications || 0).toLocaleString(),
      change: overview.applicationsChange || '-0%',
      up: (overview.applicationsChange || '-0%').startsWith('+'),
      icon: FileText,
    },
  ]

  const departmentHeat = (heatmaps.department || []).map((d) => ({
    name: d.department || '',
    count: d.count,
  }))
  const deptMax = Math.max(...departmentHeat.map((d) => d.count), 1)

  const regionHeat = (heatmaps.region || []).map((r) => ({
    name: r.region || '',
    count: r.count,
  }))
  const regionMax = Math.max(...regionHeat.map((r) => r.count), 1)

  const trendMonths = (trends.applications || []).map((a) => a.month)
  const trendApps = trends.applications || []
  const trendJobs = trends.jobs || []
  const maxApp = Math.max(...trendApps.map((t) => t.count), 1)
  const maxJob = Math.max(...trendJobs.map((t) => t.count), 1)
  const chartMax = Math.max(maxApp, maxJob)

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">统计看板</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-lg p-5 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-700" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-stone-800">{kpi.value}</div>
              <div className="text-sm text-stone-500 mt-0.5">{kpi.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
          <h2 className="font-heading font-bold text-lg mb-4">科室热度</h2>
          <div className="space-y-3">
            {departmentHeat.map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="w-16 text-sm text-stone-600 text-right">{dept.name}</span>
                <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(dept.count / deptMax) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{dept.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
          <h2 className="font-heading font-bold text-lg mb-4">地域热度</h2>
          <div className="space-y-3">
            {regionHeat.map((region) => (
              <div key={region.name} className="flex items-center gap-3">
                <span className="w-16 text-sm text-stone-600 text-right">{region.name}</span>
                <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${(region.count / regionMax) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{region.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
        <h2 className="font-heading font-bold text-lg mb-4">月度趋势</h2>
        <div className="flex items-end gap-4 h-48">
          {trendMonths.map((month, i) => {
            const jobVal = trendJobs[i]?.count || 0
            const appVal = trendApps[i]?.count || 0
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end" style={{ height: '160px' }}>
                  <div className="flex-1 bg-teal-400 rounded-t" style={{ height: `${chartMax ? (jobVal / chartMax) * 100 : 0}%` }} title={`岗位: ${jobVal}`} />
                  <div className="flex-1 bg-amber-400 rounded-t" style={{ height: `${chartMax ? (appVal / chartMax) * 100 : 0}%` }} title={`投递: ${appVal}`} />
                </div>
                <span className="text-xs text-stone-500">{month}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-6 mt-3 justify-center text-xs text-stone-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-teal-400 rounded" /> 岗位数</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded" /> 投递数</span>
        </div>
      </div>
    </div>
  )
}
