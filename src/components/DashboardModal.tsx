import React from 'react'
import {
  X, Briefcase, Users, FileText, TrendingUp, ChevronRight,
  ArrowUpRight, ArrowDownRight, ShieldAlert, AlertTriangle,
  Clock, Flame, MapPin, Building2, Stethoscope, Award,
  CheckCircle2, BarChart3
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface DashboardModalProps {
  open: boolean
  onClose: () => void
  overview?: {
    totalJobs?: number
    totalTalents?: number
    totalInstitutions?: number
    totalApplications?: number
    activeJobs?: number
    pendingJobs?: number
    pendingReviews?: number
  }
  dashboard?: {
    overview?: any
    funnel?: any[]
    heatmaps?: {
      region?: any[]
      department?: any[]
      position?: any[]
    }
    compliance?: {
      pendingJobsReview: number
      institutionsPendingRenewal: number
      highRiskJobs: number
    }
  }
}

const FUNNEL_STAGES = [
  { key: 'applied', label: '已投递', color: 'bg-stone-400', bgLight: 'bg-stone-50' },
  { key: 'read', label: '已读', color: 'bg-blue-500', bgLight: 'bg-blue-50' },
  { key: 'invited', label: '邀约', color: 'bg-amber-500', bgLight: 'bg-amber-50' },
  { key: 'interview', label: '面试', color: 'bg-purple-500', bgLight: 'bg-purple-50' },
  { key: 'offered', label: '录用', color: 'bg-green-500', bgLight: 'bg-green-50' },
]

export default function DashboardModal({ open, onClose, overview, dashboard }: DashboardModalProps) {
  const navigate = useNavigate()

  if (!open) return null

  const src = dashboard?.overview || overview

  const kpiCards = [
    { label: '在招岗位', value: src?.activeJobs || src?.totalJobs || 0, icon: Briefcase, trend: '+12%', up: true, color: 'from-teal-50 to-teal-100 border-teal-200', iconBg: 'bg-teal-200', iconColor: 'text-teal-700' },
    { label: '注册人才', value: src?.totalTalents || 0, icon: Users, trend: '+8%', up: true, color: 'from-blue-50 to-blue-100 border-blue-200', iconBg: 'bg-blue-200', iconColor: 'text-blue-700' },
    { label: '本月投递', value: src?.totalApplications || 0, icon: FileText, trend: '+15%', up: true, color: 'from-amber-50 to-amber-100 border-amber-200', iconBg: 'bg-amber-200', iconColor: 'text-amber-700' },
    { label: '认证机构', value: src?.totalInstitutions || 0, icon: Building2, trend: '+5%', up: true, color: 'from-purple-50 to-purple-100 border-purple-200', iconBg: 'bg-purple-200', iconColor: 'text-purple-700' },
  ]

  const funnelData = dashboard?.funnel || []
  const stageMap: Record<string, number> = {}
  funnelData.forEach((item: any) => {
    stageMap[item.status] = item.count
  })

  const funnelStages = FUNNEL_STAGES.map(stage => ({
    ...stage,
    count: stageMap[stage.key] || 0,
  }))
  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1)

  const regions = dashboard?.heatmaps?.region?.slice(0, 5) || []
  const departments = dashboard?.heatmaps?.department?.slice(0, 5) || []
  const positions = dashboard?.heatmaps?.position?.slice(0, 5) || []

  const compliance = dashboard?.compliance || { pendingJobsReview: 0, institutionsPendingRenewal: 0, highRiskJobs: 0 }

  const matchedCount = stageMap['offered'] || stageMap['read'] || 0

  const renderProportionBar = (count: number, max: number, color: string) => {
    const pct = max > 0 ? (count / max) * 100 : 0
    return (
      <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all flex items-center justify-end pr-2`}
          style={{ width: `${Math.max(pct, 6)}%` }}
        >
          <span className="text-[10px] font-bold text-white">{count > 0 ? count : ''}</span>
        </div>
      </div>
    )
  }

  const renderFunnel = () => (
    <div className="bg-white rounded-xl border border-stone-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-heading font-bold text-stone-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" /> 投递转化漏斗
        </h4>
        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> 成功匹配 {matchedCount} 人
        </span>
      </div>
      {funnelStages.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">暂无漏斗数据</p>
      ) : (
        <div className="space-y-3">
          {funnelStages.map((stage, i) => {
            const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0
            const convRate = i > 0 && funnelStages[i - 1].count > 0
              ? ((stage.count / funnelStages[i - 1].count) * 100).toFixed(1)
              : null
            const overallRate = funnelStages[0].count > 0
              ? ((stage.count / funnelStages[0].count) * 100).toFixed(1)
              : null
            return (
              <div key={stage.key}>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-xs text-stone-500 text-right flex-shrink-0">{stage.label}</span>
                  <div className="flex-1">
                    <div className="bg-stone-100 rounded-lg h-8 overflow-hidden">
                      <div
                        className={`h-full ${stage.color} rounded-lg transition-all flex items-center justify-end pr-3`}
                        style={{ width: `${Math.max(pct, 8)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{stage.count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right flex-shrink-0">
                    {i === 0 ? (
                      <span className="text-xs text-stone-400">基数</span>
                    ) : convRate !== null ? (
                      <span className={`text-xs font-medium ${Number(convRate) >= 30 ? 'text-green-600' : Number(convRate) >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                        → {convRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">-</span>
                    )}
                  </div>
                </div>
                {i > 0 && i < funnelStages.length && (
                  <div className="flex items-center ml-10 mt-0.5 mb-0.5">
                    <span className="text-[10px] text-stone-400">
                      总转化 {overallRate}%
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderHeatmapSection = (
    title: string,
    icon: React.ReactNode,
    items: any[],
    barColor: string,
    groupKey?: string
  ) => {
    if (items.length === 0) return null
    const maxVal = Math.max(...items.map((i: any) => i.count || 0), 1)
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h4 className="font-heading font-bold text-stone-800 flex items-center gap-2 mb-3">
          {icon} {title}
        </h4>
        <div className="space-y-2.5">
          {items.map((item: any, idx: number) => {
            const count = item.count || 0
            const pct = maxVal > 0 ? (count / maxVal) * 100 : 0
            const breakdown = item.breakdown || item.byType || item.byTitle || null
            return (
              <div key={idx}>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-stone-600 truncate flex-shrink-0 text-right">{item.name}</span>
                  <div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-stone-700 w-10 text-right flex-shrink-0">{count}</span>
                </div>
                {breakdown && typeof breakdown === 'object' && (
                  <div className="ml-16 mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(breakdown).map(([key, val]) => (
                      <span key={key} className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
                        {key} {val as number}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderPositionHeatmap = () => {
    if (positions.length === 0) return null
    const maxVal = Math.max(...positions.map((i: any) => i.count || 0), 1)
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h4 className="font-heading font-bold text-stone-800 flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-teal-500" /> 岗位热度 Top5
        </h4>
        <div className="space-y-2">
          {positions.map((item: any, idx: number) => {
            const count = item.count || 0
            const pct = maxVal > 0 ? (count / maxVal) * 100 : 0
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  idx === 0 ? 'bg-red-100 text-red-600' :
                  idx === 1 ? 'bg-amber-100 text-amber-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-stone-100 text-stone-500'
                }`}>
                  {idx + 1}
                </span>
                <span className="text-sm text-stone-700 flex-1 truncate">{item.name}</span>
                {renderProportionBar(count, maxVal, idx < 3 ? 'bg-teal-500' : 'bg-teal-300')}
                <span className="text-xs font-medium text-stone-600 w-10 text-right flex-shrink-0">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderCompliance = () => (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h4 className="font-heading font-bold text-stone-800 flex items-center gap-2 mb-3">
        <ShieldAlert className="w-5 h-5 text-red-500" /> 合规预警
      </h4>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] text-amber-600">待审岗位</span>
          </div>
          <div className="text-xl font-bold text-amber-700">{compliance.pendingJobsReview}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] text-red-600">高风险岗位</span>
          </div>
          <div className="text-xl font-bold text-red-700">{compliance.highRiskJobs}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] text-blue-600">即将到期机构</span>
          </div>
          <div className="text-xl font-bold text-blue-700">{compliance.institutionsPendingRenewal}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-stone-50 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white rounded-t-2xl">
          <h3 className="font-heading text-lg font-bold text-stone-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" /> 热度数据看板
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {kpiCards.map(card => {
              const Icon = card.icon
              return (
                <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 border`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-9 h-9 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${card.up ? 'text-green-600' : 'text-red-500'}`}>
                      {card.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {card.trend}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-stone-800">{card.value.toLocaleString()}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{card.label}</div>
                </div>
              )
            })}
          </div>

          {renderFunnel()}

          <div className="grid grid-cols-2 gap-4">
            {renderHeatmapSection(
              '区域热度 Top5',
              <MapPin className="w-5 h-5 text-red-500" />,
              regions,
              'bg-red-400',
              'byType'
            )}
            {renderHeatmapSection(
              '科室热度 Top5',
              <Stethoscope className="w-5 h-5 text-amber-500" />,
              departments,
              'bg-amber-400',
              'byTitle'
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {renderPositionHeatmap()}
            {renderCompliance()}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-stone-200 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={() => { onClose(); navigate('/admin/dashboard') }}
            className="flex-1 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 flex items-center justify-center gap-1 transition-colors"
          >
            查看完整看板 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
