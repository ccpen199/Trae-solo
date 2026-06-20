import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap, MapPin, Clock, Shield, CheckCircle, Star } from 'lucide-react'
import { serviceOrders, elderProfiles } from '../../data/mockData'

const typeMap: Record<string, string> = {
  bathing: '助浴',
  meal_delivery: '送餐',
  medical_escort: '陪医',
  cleaning: '保洁',
  companionship: '陪伴',
  rehabilitation: '康复',
}

const urgencyMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-green-100 text-green-700' },
  medium: { label: '中', color: 'bg-blue-100 text-blue-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  critical: { label: '紧急', color: 'bg-red-100 text-red-700' },
}

const healthLevelConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  healthy: { label: '健康', color: 'text-green-700', bgColor: 'bg-green-100' },
  mild: { label: '轻度', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  moderate: { label: '中度', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  severe: { label: '重度', color: 'text-red-700', bgColor: 'bg-red-100' },
}

const CHART_COLORS = ['#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4']

const healthWeights = [
  { level: 'healthy', label: '健康', weight: 20, color: 'bg-green-500' },
  { level: 'mild', label: '轻度', weight: 40, color: 'bg-blue-500' },
  { level: 'moderate', label: '中度', weight: 70, color: 'bg-orange-500' },
  { level: 'severe', label: '重度', weight: 100, color: 'bg-red-500' },
]

const urgencyTimeWindows = [
  { level: 'low', label: '低', window: '48小时内', color: 'text-green-600', bg: 'bg-green-50' },
  { level: 'medium', label: '中', window: '24小时内', color: 'text-blue-600', bg: 'bg-blue-50' },
  { level: 'high', label: '高', window: '8小时内', color: 'text-orange-600', bg: 'bg-orange-50' },
  { level: 'critical', label: '紧急', window: '2小时内', color: 'text-red-600', bg: 'bg-red-50' },
]

interface MatchResult {
  score: number
  distance: number
  providerName: string
  providerCert: string
  healthCompat: string
  responseTime: string
}

function generateMatchResult(order: typeof serviceOrders[0]): MatchResult {
  const elder = elderProfiles.find(e => e.id === order.elderId)
  const healthWeight = elder ? healthLevelConfig[elder.healthLevel] : healthLevelConfig.healthy
  const baseScore = elder?.healthLevel === 'severe' ? 92 : elder?.healthLevel === 'moderate' ? 85 : elder?.healthLevel === 'mild' ? 78 : 72
  const urgencyBonus = order.urgency === 'critical' ? 5 : order.urgency === 'high' ? 3 : 0

  return {
    score: Math.min(baseScore + urgencyBonus + Math.floor(Math.random() * 5), 99),
    distance: +(1.2 + Math.random() * 4.8).toFixed(1),
    providerName: order.serviceProviderName,
    providerCert: order.serviceProviderCert,
    healthCompat: healthWeight?.label || '健康',
    responseTime: order.urgency === 'critical' ? '30分钟' : order.urgency === 'high' ? '2小时' : order.urgency === 'medium' ? '6小时' : '12小时',
  }
}

function HealthWeightBar({ item }: { item: typeof healthWeights[0] }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-10">{item.label}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.weight}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right">{item.weight}%</span>
    </div>
  )
}

function RadiusVisualization() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-slate-200" />
        <div className="absolute inset-5 rounded-full border-2 border-dashed border-blue-200" />
        <div className="absolute inset-10 rounded-full border-2 border-dashed border-green-200" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-400">5km</span>
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-blue-400">3km</span>
        <span className="absolute top-9 left-1/2 -translate-x-1/2 text-[10px] text-green-500">1km</span>
      </div>
    </div>
  )
}

function MatchResultPanel({ result }: { result: MatchResult }) {
  const scoreColor = result.score >= 90 ? 'text-green-600' : result.score >= 80 ? 'text-blue-600' : result.score >= 70 ? 'text-orange-600' : 'text-red-600'
  const scoreBg = result.score >= 90 ? 'bg-green-50' : result.score >= 80 ? 'bg-blue-50' : result.score >= 70 ? 'bg-orange-50' : 'bg-red-50'

  return (
    <div className={`${scoreBg} rounded-xl p-4 mt-3 border border-slate-200`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-2xl font-bold ${scoreColor}`}>{result.score}%</div>
        <div className="text-sm text-slate-600">
          <div>匹配分数</div>
          <div className="text-xs text-slate-400">综合评估结果</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-xs text-slate-400">距离</div>
            <div className="text-sm font-medium text-slate-800">{result.distance} km</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <div>
            <div className="text-xs text-slate-400">供应商</div>
            <div className="text-sm font-medium text-slate-800">{result.providerName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="text-xs text-slate-400">健康等级兼容</div>
            <div className="text-sm font-medium text-slate-800">{result.healthCompat}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-xs text-slate-400">响应时间</div>
            <div className="text-sm font-medium text-slate-800">{result.responseTime}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-xs text-slate-500">资质编号: <span className="font-mono text-slate-700">{result.providerCert}</span></span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Shield className="w-3 h-3" />
          已核验
        </span>
      </div>
    </div>
  )
}

export default function SmartScheduling() {
  const [matchResults, setMatchResults] = useState<Record<string, MatchResult>>({})

  const pendingOrders = serviceOrders.filter(o => o.status === 'pending')

  const getElderHealthLevel = (elderId: string) => {
    const elder = elderProfiles.find(e => e.id === elderId)
    return elder?.healthLevel || 'healthy'
  }

  const handleMatch = (orderId: string) => {
    const order = serviceOrders.find(o => o.id === orderId)
    if (order) {
      const result = generateMatchResult(order)
      setMatchResults(prev => ({ ...prev, [orderId]: result }))
    }
  }

  const typeDistribution = Object.entries(
    serviceOrders.reduce<Record<string, number>>((acc, o) => {
      const label = typeMap[o.type] || o.type
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">服务资源智能调度</h1>
        <p className="text-slate-500 mt-1">根据老人健康等级、地理位置、服务需求紧迫度智能匹配供应商</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            健康等级权重
          </h3>
          <div className="space-y-3">
            {healthWeights.map(item => (
              <HealthWeightBar key={item.level} item={item} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            地理距离因素
          </h3>
          <RadiusVisualization />
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                1km内 - 优先匹配
              </span>
              <span className="text-slate-400">权重高</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                1-3km - 常规匹配
              </span>
              <span className="text-slate-400">权重中</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                3-5km - 扩展匹配
              </span>
              <span className="text-slate-400">权重低</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            需求紧迫度
          </h3>
          <div className="space-y-2.5">
            {urgencyTimeWindows.map(item => (
              <div key={item.level} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${item.bg}`}>
                <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
                <span className="text-xs text-slate-500">{item.window}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">待调度工单</h3>
          <span className="text-xs text-slate-400">共 {pendingOrders.length} 条待调度</span>
        </div>
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">暂无待调度工单</p>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map(order => {
              const healthLevel = getElderHealthLevel(order.elderId)
              const hlConfig = healthLevelConfig[healthLevel]
              const urgConfig = urgencyMap[order.urgency]
              const result = matchResults[order.id]

              return (
                <div key={order.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-semibold text-slate-800">{order.elderName}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                          {typeMap[order.type]}
                        </span>
                        {urgConfig && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgConfig.color}`}>
                            {urgConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {order.address.length > 20 ? order.address.slice(0, 20) + '...' : order.address}
                        </span>
                        {hlConfig && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${hlConfig.bgColor} ${hlConfig.color}`}>
                            {hlConfig.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMatch(order.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                    >
                      <Zap className="w-4 h-4" />
                      智能匹配
                    </button>
                  </div>
                  {result && <MatchResultPanel result={result} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">调度效率分析</h3>
        <div className="flex items-center gap-8">
          <div className="w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} 单`, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {typeDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                <span className="text-sm text-slate-600 flex-1">{item.name}</span>
                <span className="text-sm font-semibold text-slate-800">{item.value} 单</span>
                <span className="text-xs text-slate-400">{((item.value / serviceOrders.length) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
