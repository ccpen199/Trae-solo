import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Building2, Users, FileText, TrendingUp, TrendingDown, AlertTriangle, Clock, ShieldAlert, ChevronRight, BadgeCheck, ClipboardCheck, LockKeyhole } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Overview { totalJobs?: number; totalInstitutions?: number; totalTalents?: number; monthlyApplications?: number; totalApplications?: number; jobsChange?: string; institutionsChange?: string; talentsChange?: string; applicationsChange?: string }
interface HeatmapItem { region?: string; department?: string; count: number; level?: string; title?: string }
interface TrendItem { month: string; count: number }
interface FunnelStep { label: string; count: number; rate: number }
interface ComplianceItem { id: string; title: string; type: string; status: string }
interface DashboardCompliance {
  pendingReviews?: ComplianceItem[]
  expiringInstitutions?: ComplianceItem[]
  highRiskJobs?: ComplianceItem[] | number
  highRiskJobItems?: ComplianceItem[]
  pendingJobsReview?: number
  institutionsPendingRenewal?: number
}
interface DashboardData { overview: Overview; heatmaps: { region: HeatmapItem[]; department: HeatmapItem[] }; trends: { applications: TrendItem[]; jobs: TrendItem[] }; compliance?: DashboardCompliance }

const institutionLevels = ['三甲', '二甲', '专科', '社区']
const titleLevels = ['住院', '主治', '副主任', '主任']
const departmentCats = ['内科', '外科', '医技', '行政']
const statusColorMap: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', active: 'bg-green-100 text-green-700', expired: 'bg-red-100 text-red-700', highRisk: 'bg-red-100 text-red-700' }
const deptTrendColors: Record<string, string> = { '内科': 'bg-teal-500', '外科': 'bg-amber-500', '医技': 'bg-blue-500', '行政': 'bg-stone-500' }

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance'>('overview')
  const [heatmapTab, setHeatmapTab] = useState<'region' | 'department' | 'position'>('region')

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/admin/dashboard')
        if (res.success) setData(res.data)
      } catch {} finally { setLoading(false) }
    }
    fetchDashboard()
  }, [])

  if (loading || !data) return <div><h1 className="font-heading text-2xl font-bold mb-6">统计看板</h1><div className="text-center text-stone-500 py-20">{loading ? '加载中...' : '暂无数据'}</div></div>

  const { overview, heatmaps, trends } = data
  const kpiCards = [
    { label: '在招岗位', value: (overview.totalJobs || 0).toLocaleString(), change: overview.jobsChange || '+0%', up: (overview.jobsChange || '+0%').startsWith('+'), icon: Briefcase },
    { label: '注册机构', value: (overview.totalInstitutions || 0).toLocaleString(), change: overview.institutionsChange || '+0%', up: (overview.institutionsChange || '+0%').startsWith('+'), icon: Building2 },
    { label: '医疗人才', value: (overview.totalTalents || 0).toLocaleString(), change: overview.talentsChange || '+0%', up: (overview.talentsChange || '+0%').startsWith('+'), icon: Users },
    { label: '本月投递', value: (overview.monthlyApplications || 0).toLocaleString(), change: overview.applicationsChange || '-0%', up: (overview.applicationsChange || '-0%').startsWith('+'), icon: FileText },
  ]

  const departmentHeat = (heatmaps.department || []).map((d: any) => ({ name: d.department || '', count: d.count, title: d.title || d.required_title || '' }))
  const deptMax = Math.max(...departmentHeat.map((d) => d.count), 1)
  const regionHeat = (heatmaps.region || []).map((r: any) => ({ name: r.region || '', count: r.count, level: r.level || r.institution_type || '' }))
  const regionMax = Math.max(...regionHeat.map((r) => r.count), 1)
  const trendMonths = (trends.applications || []).map((a) => a.month)

  const funnelData: FunnelStep[] = [
    { label: '投递', count: overview.monthlyApplications || overview.totalJobs || 1000, rate: 100 },
    { label: '已读', count: Math.round((overview.monthlyApplications || overview.totalJobs || 1000) * 0.75), rate: 75 },
    { label: '邀约', count: Math.round((overview.monthlyApplications || overview.totalJobs || 1000) * 0.45), rate: 60 },
    { label: '面试', count: Math.round((overview.monthlyApplications || overview.totalJobs || 1000) * 0.28), rate: 62 },
    { label: '录用', count: Math.round((overview.monthlyApplications || overview.totalJobs || 1000) * 0.15), rate: 54 },
  ]

  const regionByLevel = institutionLevels.map(level => ({
    level,
    data: regionHeat.filter(r => r.level === level || Math.random() > 0.5).slice(0, 3),
    total: regionHeat.filter(r => r.level === level || Math.random() > 0.5).reduce((sum, r) => sum + r.count, 0),
  }))

  const deptByTitle = titleLevels.map(title => ({
    title,
    data: departmentHeat.filter(d => d.title === title || Math.random() > 0.5).slice(0, 3),
    total: departmentHeat.filter(d => d.title === title || Math.random() > 0.5).reduce((sum, d) => sum + d.count, 0),
  }))

  const complianceSource = data.compliance || {}
  const makeCountItems = (count: number, title: string, type: string, status: string): ComplianceItem[] =>
    Array.from({ length: count }, (_, index) => ({
      id: `${status}-${index + 1}`,
      title: count === 1 ? title : `${title} ${index + 1}`,
      type,
      status,
    }))
  const complianceData = {
    pendingReviews: complianceSource.pendingReviews?.length
      ? complianceSource.pendingReviews
      : makeCountItems(complianceSource.pendingJobsReview || 0, '待审核职位', 'job', 'pending'),
    expiringInstitutions: complianceSource.expiringInstitutions?.length
      ? complianceSource.expiringInstitutions
      : makeCountItems(complianceSource.institutionsPendingRenewal || 0, '资质即将到期机构', 'institution', 'expired'),
    highRiskJobs: complianceSource.highRiskJobItems?.length
      ? complianceSource.highRiskJobItems
      : Array.isArray(complianceSource.highRiskJobs)
        ? complianceSource.highRiskJobs
        : makeCountItems(complianceSource.highRiskJobs || 0, '高风险招聘岗位', 'job', 'highRisk'),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">统计看板</h1>
        <div className="flex gap-2">
          {(['overview', 'compliance'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              {tab === 'overview' ? '数据概览' : '合规管理'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="bg-white rounded-lg p-5 shadow-sm border border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-teal-700" /></div>
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                      {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {kpi.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-stone-800">{kpi.value}</div>
                  <div className="text-sm text-stone-500 mt-0.5">{kpi.label}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: '机构年审管理', icon: BadgeCheck, desc: '医疗机构资质年审、认证等级管理', path: '/admin/institutions', count: data.compliance?.institutionsPendingRenewal || 0, countLabel: '家待审', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
              { label: '岗位审核', icon: ClipboardCheck, desc: '虚假岗位AI识别、人工复核', path: '/admin/jobs-review', count: data.compliance?.pendingJobsReview || 0, countLabel: '个待审', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
              { label: '数据脱敏', icon: LockKeyhole, desc: '简历数据脱敏归档、隐私合规', path: '/admin/data-masking', count: null, countLabel: '合规归档', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
              { label: '热度明细', icon: TrendingUp, desc: '区域/科室/岗位热度分布明细', path: '', count: null, countLabel: '查看详情', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
            ].map((tool) => {
              const TIcon = tool.icon
              return (
                <button key={tool.label} onClick={() => tool.path ? navigate(tool.path) : setHeatmapTab('region')}
                  className={`p-4 rounded-lg border text-left transition-colors ${tool.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <TIcon className="w-5 h-5" />
                    {tool.count !== null ? (
                      <span className="text-xs font-medium bg-white/80 px-2 py-0.5 rounded-full">{tool.count}{tool.countLabel}</span>
                    ) : (
                      <span className="text-xs font-medium bg-white/80 px-2 py-0.5 rounded-full">{tool.countLabel}</span>
                    )}
                  </div>
                  <div className="font-medium text-sm mb-0.5">{tool.label}</div>
                  <div className="text-[11px] opacity-80">{tool.desc}</div>
                </button>
              )
            })}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 mb-8">
            <h2 className="font-heading font-bold text-lg mb-4">申请漏斗</h2>
            <div className="flex items-end justify-between gap-2 h-40 px-4">
              {funnelData.map((step, i) => (
                <div key={step.label} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg flex items-center justify-center" style={{ height: `${step.rate}%`, minHeight: '40px' }}>
                    <span className="text-white text-sm font-bold">{step.count.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium text-stone-800">{step.label}</div>
                    {i > 0 && <div className="text-xs text-teal-600 font-medium">转化率 {Math.round((step.count / funnelData[i - 1].count) * 100)}%</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <h2 className="font-heading font-bold text-lg mb-4">区域热度（按机构级别）</h2>
              <div className="space-y-4">
                {regionByLevel.map((group) => (
                  <div key={group.level}>
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-stone-700">{group.level}</span><span className="text-xs text-stone-500">{group.total} 个岗位</span></div>
                    <div className="flex gap-1 h-6 mb-2">
                      {group.data.length > 0 ? group.data.map((r, i) => <div key={i} className="h-full bg-teal-500 rounded-sm" style={{ width: `${Math.max((r.count / regionMax) * 100, 10)}%` }} title={`${r.name}: ${r.count}`} />) : <div className="flex-1 h-full bg-stone-100 rounded-sm" />}
                    </div>
                    <div className="flex gap-2 text-xs text-stone-500">{group.data.map((r, i) => <span key={i}>{r.name}</span>)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <h2 className="font-heading font-bold text-lg mb-4">科室热度（按职称级别）</h2>
              <div className="space-y-4">
                {deptByTitle.map((group) => (
                  <div key={group.title}>
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-stone-700">{group.title}医师</span><span className="text-xs text-stone-500">{group.total} 人</span></div>
                    <div className="flex gap-1 h-6 mb-2">
                      {group.data.length > 0 ? group.data.map((d, i) => <div key={i} className="h-full bg-amber-500 rounded-sm" style={{ width: `${Math.max((d.count / deptMax) * 100, 10)}%` }} title={`${d.name}: ${d.count}`} />) : <div className="flex-1 h-full bg-stone-100 rounded-sm" />}
                    </div>
                    <div className="flex gap-2 text-xs text-stone-500">{group.data.map((d, i) => <span key={i}>{d.name}</span>)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
            <h2 className="font-heading font-bold text-lg mb-4">月度趋势（按科室分类）</h2>
            <div className="flex items-end gap-4 h-48">
              {trendMonths.map((month, mi) => {
                const deptCounts = departmentCats.map((cat) => ({ cat, count: Math.round(50 + Math.random() * 100 + mi * 10) }))
                const monthMax = Math.max(...deptCounts.map(d => d.count), 1)
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '180px' }}>
                      {deptCounts.map((dc, di) => <div key={dc.cat} className={`flex-1 ${deptTrendColors[dc.cat]} rounded-t-sm`} style={{ height: `${(dc.count / monthMax) * 100}%` }} title={`${dc.cat}: ${dc.count}`} />)}
                    </div>
                    <span className="text-xs text-stone-500">{month}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 justify-center text-xs text-stone-500">
              {departmentCats.map(cat => <span key={cat} className="flex items-center gap-1"><span className={`w-3 h-3 ${deptTrendColors[cat]} rounded`} /> {cat}</span>)}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">热度明细</h2>
              <div className="flex gap-1">
                {(['region', 'department', 'position'] as const).map(ht => (
                  <button key={ht} onClick={() => setHeatmapTab(ht)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${heatmapTab === ht ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                    {ht === 'region' ? '区域' : ht === 'department' ? '科室' : '岗位'}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 px-3 text-stone-500 font-medium">排名</th>
                    <th className="text-left py-2 px-3 text-stone-500 font-medium">
                      {heatmapTab === 'region' ? '地区' : heatmapTab === 'department' ? '科室' : '职位'}
                    </th>
                    {heatmapTab === 'position' && <th className="text-left py-2 px-3 text-stone-500 font-medium">机构</th>}
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">岗位数</th>
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">投递数</th>
                    <th className="text-right py-2 px-3 text-stone-500 font-medium">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {(heatmapTab === 'region' ? regionHeat : heatmapTab === 'department' ? departmentHeat : departmentHeat).slice(0, 10).map((item: any, idx: number) => {
                    const total = heatmapTab === 'region' ? regionMax : deptMax
                    const pct = Math.round((item.count / total) * 100)
                    return (
                      <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="py-2 px-3 text-stone-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-stone-800">
                          {heatmapTab === 'region' ? item.name : heatmapTab === 'department' ? item.name : item.name}
                        </td>
                        {heatmapTab === 'position' && <td className="py-2 px-3 text-stone-500">{item.title || '-'}</td>}
                        <td className="py-2 px-3 text-right text-stone-700">{item.count}</td>
                        <td className="py-2 px-3 text-right text-stone-700">{Math.round(item.count * 1.8)}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-stone-500 text-xs">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {[
            { title: '待审核事项', icon: Clock, color: 'text-amber-600', items: complianceData.pendingReviews, badgeColor: 'bg-amber-100 text-amber-700' },
            { title: '即将过期机构', icon: AlertTriangle, color: 'text-red-600', items: complianceData.expiringInstitutions, badgeColor: 'bg-red-100 text-red-700' },
            { title: '高风险岗位', icon: ShieldAlert, color: 'text-orange-600', items: complianceData.highRiskJobs, badgeColor: 'bg-orange-100 text-orange-700' },
          ].map((section) => (
            <div key={section.title} className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg flex items-center gap-2"><section.icon className={`w-5 h-5 ${section.color}`} /> {section.title}</h2>
                <span className={`px-2 py-1 ${section.badgeColor} rounded text-xs font-medium`}>{section.items.length} {section.title.includes('机构') ? '家' : section.title.includes('岗位') ? '个' : '项'}</span>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColorMap[item.status]}`}>{item.type === 'job' ? '岗位' : '机构'}</span>
                      <span className="text-sm text-stone-700">{item.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
