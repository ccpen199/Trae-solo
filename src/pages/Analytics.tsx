import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import { DollarSign, TrendingUp, AlertCircle, Users, Map, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

interface Overview {
  riders: { total: number; online: number; novice: number }
  orders: { total: number; pending: number; delivered: number; timeout: number }
  alerts: { active: number }
  income: { total: number }
}

interface IncomeBreakdown {
  total_base_fee: number
  total_reward: number
  total_subsidy: number
  total_penalty: number
}

interface RiderIncome {
  id: number
  name: string
  phone: string
  total_orders: number
  total_income: number
  base_fee_sum: number
  reward_sum: number
  subsidy_sum: number
}

interface ViolationByType {
  type: string
  count: number
  avg_penalty: number
}

interface ViolationByRider {
  id: number
  name: string
  violation_count: number
  total_penalty: number
}

interface TimeoutByHour {
  hour: string
  timeout_count: number
}

interface CapacityGap {
  id: number
  grid_code: string
  grid_name: string
  center_lat: number
  center_lng: number
  heat_density: number
  rider_count: number
  active_orders: number
  load_balance_coefficient: number
  weather_factor: number
  weather_description: string
  gap_level: string
  rider_shortage: number
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const gapLevelColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  normal: 'bg-green-100 text-green-800',
}

const gapLevelLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  normal: '正常',
}

const violationTypeLabels: Record<string, string> = {
  gps_deviation: 'GPS偏移',
  arrived_not_picked: '到达未取货',
  fake_signin: '虚假签到',
  timeout_risk: '超时风险',
  late_delivery: '延迟配送',
  other: '其他',
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [incomeBreakdown, setIncomeBreakdown] = useState<IncomeBreakdown | null>(null)
  const [riderIncomeRanking, setRiderIncomeRanking] = useState<RiderIncome[]>([])
  const [violationByType, setViolationByType] = useState<ViolationByType[]>([])
  const [violationByRider, setViolationByRider] = useState<ViolationByRider[]>([])
  const [timeoutByHour, setTimeoutByHour] = useState<TimeoutByHour[]>([])
  const [capacityGaps, setCapacityGaps] = useState<CapacityGap[]>([])
  const [expandedRiderId, setExpandedRiderId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [overviewData, breakdownData, rankingData, violationsData, gapsData] = await Promise.all([
        api.getOverview(),
        api.getIncomeBreakdown(),
        api.getRiderIncomeRanking(20),
        api.getViolationClusters(),
        api.getCapacityGaps(),
      ])
      setOverview(overviewData)
      setIncomeBreakdown(breakdownData)
      setRiderIncomeRanking(rankingData || [])
      setViolationByType(violationsData?.by_type || [])
      setViolationByRider(violationsData?.by_rider || [])
      setTimeoutByHour(violationsData?.timeout_by_hour || [])
      setCapacityGaps(gapsData || [])
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const pieData = incomeBreakdown ? [
    { name: '基础运费', value: incomeBreakdown.total_base_fee, color: '#3b82f6' },
    { name: '奖励', value: incomeBreakdown.total_reward, color: '#22c55e' },
    { name: '补贴', value: incomeBreakdown.total_subsidy, color: '#f59e0b' },
    { name: '罚款扣除', value: Math.abs(incomeBreakdown.total_penalty), color: '#ef4444' },
  ].filter(d => d.value > 0) : []

  const stats = overview ? {
    totalIncome: overview.income.total || 0,
    avgOrderValue: overview.orders.delivered > 0 ? (overview.income.total / overview.orders.delivered) : 0,
    onTimeRate: overview.orders.total > 0
      ? ((overview.orders.delivered - overview.orders.timeout) / overview.orders.delivered) * 100
      : 0,
    violationRate: overview.orders.total > 0
      ? (violationByRider.reduce((sum, r) => sum + r.violation_count, 0) / overview.orders.total) * 100
      : 0,
  } : {
    totalIncome: 0,
    avgOrderValue: 0,
    onTimeRate: 0,
    violationRate: 0,
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getRiderBreakdownData = (rider: RiderIncome) => [
    { name: '基础运费', value: rider.base_fee_sum, fill: '#3b82f6' },
    { name: '奖励', value: rider.reward_sum, fill: '#22c55e' },
    { name: '补贴', value: rider.subsidy_sum, fill: '#f59e0b' },
  ]

  const barChartData = violationByType.map(v => ({
    name: violationTypeLabels[v.type] || v.type,
    count: v.count,
  }))

  const lineChartData = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    const found = timeoutByHour.find(t => t.hour === hour)
    return {
      hour: `${hour}:00`,
      timeout_count: found?.timeout_count || 0,
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">数据分析与报告</h1>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              收入
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总收入</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalIncome)}</p>
            <p className="text-sm text-gray-500 mt-2">累计配送收入</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              平均值
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">平均订单价值</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.avgOrderValue)}</p>
            <p className="text-sm text-gray-500 mt-2">每单平均收入</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              效率
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">准时率</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{formatPercent(stats.onTimeRate)}</p>
            <p className="text-sm text-gray-500 mt-2">按时完成订单比例</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              风险
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">违规率</h3>
            <p className="text-3xl font-bold text-red-600 mt-1">{formatPercent(stats.violationRate)}</p>
            <p className="text-sm text-gray-500 mt-2">订单违规比例</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">收入构成</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">骑手收入排行榜</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    排名
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    订单数
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    基础运费
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    奖励
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    补贴
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    总收入
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    详情
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {riderIncomeRanking.slice(0, 10).map((rider, index) => (
                  <>
                    <tr key={rider.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {rider.name}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {rider.total_orders}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatCurrency(rider.base_fee_sum)}
                      </td>
                      <td className="py-4 px-4 text-sm text-green-600">
                        +{formatCurrency(rider.reward_sum)}
                      </td>
                      <td className="py-4 px-4 text-sm text-yellow-600">
                        +{formatCurrency(rider.subsidy_sum)}
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(rider.total_income)}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setExpandedRiderId(expandedRiderId === rider.id ? null : rider.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          {expandedRiderId === rider.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRiderId === rider.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="py-4 px-6">
                          <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getRiderBreakdownData(rider)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tickFormatter={(v) => `¥${v}`} tick={{ fontSize: 12 }} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                                <Tooltip
                                  formatter={(value: number) => formatCurrency(value)}
                                  contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                  }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                  {getRiderBreakdownData(rider).map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">违规分析</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">按类型分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="违规数" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">违规骑手排行</h3>
            <div className="space-y-3">
              {violationByRider.slice(0, 10).map((rider, index) => (
                <div key={rider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-red-100 text-red-800' :
                      index === 1 ? 'bg-orange-100 text-orange-800' :
                      index === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{rider.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-red-600 font-medium">{rider.violation_count} 次</span>
                    <span className="text-xs text-gray-500">扣{rider.total_penalty}分</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">超时时段分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6b7280' }} interval={2} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="timeout_count"
                    name="超时数"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">运力缺口热力图</h2>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">共 {capacityGaps.length} 个网格</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  网格代码
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  网格名称
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  热度密度
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  骑手数
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  活跃订单
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  骑手缺口
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  缺口等级
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {capacityGaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Map className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">暂无运力数据</p>
                  </td>
                </tr>
              ) : (
                capacityGaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-gray-600">{gap.grid_code}</span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                      {gap.grid_name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              gap.heat_density >= 0.8 ? 'bg-red-500' :
                              gap.heat_density >= 0.5 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(gap.heat_density * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{(gap.heat_density * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {gap.rider_count}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                      {gap.active_orders}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-sm font-semibold ${
                        gap.rider_shortage > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {gap.rider_shortage > 0 ? `+${gap.rider_shortage}` : gap.rider_shortage}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gapLevelColors[gap.gap_level] || gapLevelColors.normal}`}
                      >
                        {gapLevelLabels[gap.gap_level] || gap.gap_level}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
