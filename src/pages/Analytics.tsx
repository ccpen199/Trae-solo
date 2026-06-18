import { useState, useEffect } from 'react'
import { Briefcase, Users, Zap, GitMerge, TrendingUp, Clock, Target, DollarSign, BarChart3 } from 'lucide-react'
import { StatCard, LoadingSpinner } from '@/components/Shared'
import { FunnelChart, FillCycleTrend, FieldFillCycle, HeadhunterROITable } from '@/components/AnalyticsCharts'
import { fetchApi } from '@/utils/api'
import type { AnalyticsOverview, FunnelAnalytics, FillCycleData, HeadhunterROI } from '@/types'

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [funnel, setFunnel] = useState<FunnelAnalytics | null>(null)
  const [fillCycle, setFillCycle] = useState<FillCycleData | null>(null)
  const [roi, setRoi] = useState<HeadhunterROI | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchApi<AnalyticsOverview>('/api/analytics/overview'),
      fetchApi<FunnelAnalytics>('/api/analytics/funnel'),
      fetchApi<FillCycleData>('/api/analytics/fill-cycle'),
      fetchApi<HeadhunterROI>('/api/analytics/headhunter-roi'),
    ])
      .then(([o, f, fc, r]) => {
        setOverview(o)
        setFunnel(f)
        setFillCycle(fc)
        setRoi(r)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-5 h-5 text-amber-500" />
        <h1 className="section-title mb-0">数据分析</h1>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="总岗位数" value={overview?.totalJobs ?? 0} icon={Briefcase} color="amber" />
        <StatCard label="总人才数" value={overview?.totalTalents ?? 0} icon={Users} color="ice" />
        <StatCard label="活跃岗位" value={overview?.activeJobs ?? 0} icon={Zap} color="green" />
        <StatCard label="匹配总数" value={overview?.totalMatches ?? 0} icon={GitMerge} color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-steel-200">招聘漏斗</h3>
          </div>
          {funnel && <FunnelChart data={funnel} />}
        </div>

        <div className="card-glass card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-steel-200">填充周期趋势</h3>
          </div>
          {fillCycle && <FillCycleTrend data={fillCycle} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-ice-400" />
            <h3 className="text-sm font-semibold text-steel-200">各领域填充周期</h3>
          </div>
          {fillCycle && <FieldFillCycle data={fillCycle} />}
        </div>

        <div className="card-glass card-hover p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-steel-200">猎头ROI</h3>
          </div>
          {roi && <HeadhunterROITable data={roi} />}
        </div>
      </div>
    </div>
  )
}
