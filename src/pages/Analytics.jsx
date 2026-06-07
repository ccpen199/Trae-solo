import { useState, useEffect, useCallback } from 'react'
import { BarChart3, TrendingDown, Filter, ChevronDown, Clock, Users, DollarSign, Target, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, CartesianGrid } from 'recharts'
import { api } from '../utils/api'

const STAGE_ORDER = ['职位发布', '简历收取', '简历筛选', '面试邀约', '面试进行', 'Offer发放', '入职确认']

const stageColors = [
  'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
]

const severityColor = (pct) => {
  if (pct >= 40) return 'border-l-red-500 bg-red-50 text-red-800'
  if (pct >= 20) return 'border-l-amber-500 bg-amber-50 text-amber-800'
  return 'border-l-blue-500 bg-blue-50 text-blue-800'
}

const barColors = ['#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#f97316', '#f43f5e']

const pieColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null
}

export default function Analytics() {
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [funnelData, setFunnelData] = useState([])
  const [conversionData, setConversionData] = useState(null)
  const [attributionData, setAttributionData] = useState([])
  const [efficiencyMetrics, setEfficiencyMetrics] = useState(null)
  const [attritionTrendData, setAttritionTrendData] = useState([])
  const [jobDimensionData, setJobDimensionData] = useState([])
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    api.get('/jobs?status=published').then((data) => {
      setJobs((data.items || []).map((j) => ({ value: String(j.id), label: j.title })))
    }).catch(() => {})
  }, [])

  const fetchFunnel = useCallback(async () => {
    setLoading(true)
    try {
      const params = selectedJob ? `?jobId=${selectedJob}` : ''
      const data = await api.get(`/analytics/funnel${params}`)
      setFunnelData(Array.isArray(data) ? data : [])
    } catch { setFunnelData([]) }
    finally { setLoading(false) }
  }, [selectedJob])

  const fetchConversion = useCallback(async () => {
    try {
      const data = await api.get('/analytics/conversion')
      setConversionData(data)
    } catch { setConversionData(null) }
  }, [])

  const fetchAttribution = useCallback(async () => {
    try {
      const params = selectedJob ? `?jobId=${selectedJob}` : ''
      const data = await api.get(`/analytics/attribution${params}`)
      setAttributionData(Array.isArray(data) ? data : [])
      setEfficiencyMetrics(data.efficiency_metrics || null)
      setAttritionTrendData(Array.isArray(data.attrition_trend) ? data.attrition_trend : [])
      setJobDimensionData(Array.isArray(data.job_dimension) ? data.job_dimension : [])
    } catch {
      setAttributionData([])
      setEfficiencyMetrics(null)
      setAttritionTrendData([])
      setJobDimensionData([])
    }
  }, [selectedJob])

  useEffect(() => {
    fetchFunnel()
    fetchConversion()
    fetchAttribution()
  }, [fetchFunnel, fetchConversion, fetchAttribution])

  const maxCount = Math.max(...funnelData.map((s) => s.candidate_count), 1)

  const chartData = (conversionData?.stages || []).map((s) => ({
    name: s.stage_name,
    conversion: Math.round((s.avg_conversion_rate || 0) * 100) / 100,
    avgDays: Math.round((s.avg_days || 0) * 10) / 10,
  }))

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">招聘效能分析</h1>
          <p className="mt-2 text-sm text-slate-500">漏斗转化、归因洞察和效率指标全览</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
          >
            <Filter size={15} />
            {selectedJob ? jobs.find((j) => j.value === selectedJob)?.label || '选择职位' : '全部职位（聚合）'}
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-white py-1 shadow-lg">
              <button
                onClick={() => { setSelectedJob(''); setDropdownOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${!selectedJob ? 'text-primary font-medium' : 'text-slate-700'}`}
              >
                全部职位（聚合）
              </button>
              {jobs.map((j) => (
                <button
                  key={j.value}
                  onClick={() => { setSelectedJob(j.value); setDropdownOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${selectedJob === j.value ? 'text-primary font-medium' : 'text-slate-700'}`}
                >
                  {j.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-slate-900">招聘漏斗</h2>
        </div>
        {loading ? (
          <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-24 rounded bg-slate-200" style={{ width: `${120 - i * 12}px` }} />
              ))}
            </div>
          </div>
        ) : funnelData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无漏斗数据</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-end justify-center gap-1.5 overflow-x-auto pb-2">
              {funnelData.map((stage, idx) => {
                const widthPct = 40 + (stage.candidate_count / maxCount) * 60
                return (
                  <div key={stage.stage_name} className="flex flex-col items-center" style={{ minWidth: 80 }}>
                    <span className="mb-1 text-xs font-semibold text-slate-700 text-center leading-tight">
                      {stage.candidate_count}
                    </span>
                    <div
                      className={`flex flex-col items-center justify-center rounded-md text-white transition-all ${stageColors[idx % stageColors.length]}`}
                      style={{ width: `${widthPct}%`, minWidth: 70, height: 64 }}
                    >
                      <span className="text-xs font-bold text-center leading-tight px-1">{stage.stage_name}</span>
                      {stage.conversion_rate != null && idx > 0 && (
                        <span className="text-[10px] opacity-90 mt-0.5">{(stage.conversion_rate * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users size={18} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">阶段详情</h2>
        </div>
        {loading ? (
          <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-slate-200" />
              ))}
            </div>
          </div>
        ) : funnelData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无阶段详情数据</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">阶段</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">人数</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">转化率</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">平均天数</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">流失原因分布</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {funnelData.map((stage, idx) => (
                    <tr key={stage.stage_name} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${stageColors[idx % stageColors.length]}`} />
                          <span className="font-medium text-slate-700">{stage.stage_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {stage.candidate_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {idx === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className={`font-medium ${(stage.conversion_rate || 0) >= 0.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {((stage.conversion_rate || 0) * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {stage.avg_days != null ? `${stage.avg_days.toFixed(1)}天` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {stage.attrition_reasons && stage.attrition_reasons.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {stage.attrition_reasons.slice(0, 3).map((reason, ridx) => (
                              <span
                                key={ridx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600"
                              >
                                {reason.name} {reason.percentage}%
                              </span>
                            ))}
                            {stage.attrition_reasons.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500">
                                +{stage.attrition_reasons.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={18} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">转化率统计</h2>
          {conversionData && (
            <span className="ml-auto text-sm text-slate-500">
              总转化率 <strong className="text-slate-900">{conversionData.overall_conversion_rate?.toFixed(1)}%</strong>
              {' '}({conversionData.total_hired}/{conversionData.total_candidates})
            </span>
          )}
        </div>
        {!conversionData || chartData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无转化率数据</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'conversion' ? `${value}%` : `${value}天`,
                    name === 'conversion' ? '转化率' : '平均天数',
                  ]}
                />
                <Bar dataKey="conversion" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={barColors[idx % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {chartData.map((s, idx) => (
                <div key={s.name} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 text-slate-600 text-right">{s.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${stageColors[idx % stageColors.length]}`}
                      style={{ width: `${Math.min(s.conversion, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-medium text-slate-700">{s.conversion}%</span>
                  <span className="w-20 text-right text-slate-400">{s.avgDays}天</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <TrendingDown size={18} className="text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">归因分析</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="h-64 rounded bg-slate-200" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded-lg bg-slate-200" />
              ))}
            </div>
          </div>
        ) : attributionData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无归因数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <PieChartIcon size={16} className="text-rose-500" />
                流失原因分布
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={attributionData.map((item) => ({ name: item.reason, value: item.total_percentage }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '占比']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {attributionData.map((item) => (
                <div
                  key={item.reason}
                  className={`flex items-center justify-between rounded-lg border-l-4 px-4 py-3 ${severityColor(item.total_percentage)}`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{item.reason}</span>
                    <span className="ml-2 text-xs opacity-70">
                      阶段: {item.stages?.join(', ')}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{item.total_percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Target size={18} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">职位维度细分</h2>
        </div>
        {loading ? (
          <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="h-72 rounded bg-slate-200" />
          </div>
        ) : jobDimensionData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无职位维度数据</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={jobDimensionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis dataKey="job_title" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    const labels = { conversion_rate: '转化率', attrition_rate: '流失率', avg_days: '平均天数' }
                    const units = { conversion_rate: '%', attrition_rate: '%', avg_days: '天' }
                    return [`${value}${units[name] || ''}`, labels[name] || name]
                  }}
                />
                <Legend />
                <Bar dataKey="conversion_rate" name="转化率" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="attrition_rate" name="流失率" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={18} className="text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">流失原因时间趋势</h2>
        </div>
        {loading ? (
          <div className="animate-pulse rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="h-72 rounded bg-slate-200" />
          </div>
        ) : attritionTrendData.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无趋势数据</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={attritionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {['薪资不符', '职业发展', '工作地点', '竞争Offer', '面试体验'].map((reason, idx) => (
                  <Line
                    key={reason}
                    type="monotone"
                    dataKey={reason}
                    stroke={pieColors[idx % pieColors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">效率指标</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="h-4 w-24 rounded bg-slate-200 mb-3" />
                <div className="h-8 w-16 rounded bg-slate-200 mb-2" />
                <div className="h-3 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : !efficiencyMetrics ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">暂无效率指标数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Clock size={18} className="text-blue-600" />
                </div>
                <span className="text-sm text-slate-500">平均招聘周期</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.avg_hiring_days != null ? `${efficiencyMetrics.avg_hiring_days}天` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                从简历筛选到入职
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Target size={18} className="text-emerald-600" />
                </div>
                <span className="text-sm text-slate-500">Offer接受率</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.offer_acceptance_rate != null ? `${efficiencyMetrics.offer_acceptance_rate}%` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {efficiencyMetrics.offer_accepted} / {efficiencyMetrics.offer_sent} 人接受
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <DollarSign size={18} className="text-amber-600" />
                </div>
                <span className="text-sm text-slate-500">人均招聘成本</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.avg_cost_per_hire != null ? `¥${efficiencyMetrics.avg_cost_per_hire.toLocaleString()}` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                含渠道、面试等费用
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-rose-100">
                  <Users size={18} className="text-rose-600" />
                </div>
                <span className="text-sm text-slate-500">渠道贡献率</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.top_channel || '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                贡献 {efficiencyMetrics.top_channel_rate || 0}% 的入职
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-cyan-100">
                  <BarChart3 size={18} className="text-cyan-600" />
                </div>
                <span className="text-sm text-slate-500">面试通过率</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.interview_pass_rate != null ? `${efficiencyMetrics.interview_pass_rate}%` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                通过面试人数 / 面试总人数
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                <span className="text-sm text-slate-500">简历筛选率</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.resume_screening_rate != null ? `${efficiencyMetrics.resume_screening_rate}%` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                通过筛选 / 收到简历
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock size={18} className="text-orange-600" />
                </div>
                <span className="text-sm text-slate-500">平均面试轮次</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.avg_interview_rounds != null ? `${efficiencyMetrics.avg_interview_rounds}轮` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                入职者平均面试次数
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-teal-100">
                  <Users size={18} className="text-teal-600" />
                </div>
                <span className="text-sm text-slate-500">招聘完成率</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {efficiencyMetrics.hiring_completion_rate != null ? `${efficiencyMetrics.hiring_completion_rate}%` : '-'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                已完成 / 计划招聘
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
