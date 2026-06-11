import { useState } from 'react'
import { Clock, Navigation, Wrench, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatusBadge from '@/components/StatusBadge'

const slaData = {
  daily: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    response: 12 + Math.random() * 8,
    arrival: 35 + Math.random() * 15,
    completion: 80 + Math.random() * 40,
  })),
  weekly: Array.from({ length: 7 }, (_, i) => ({
    time: `周${['一', '二', '三', '四', '五', '六', '日'][i]}`,
    response: 10 + Math.random() * 5,
    arrival: 30 + Math.random() * 10,
    completion: 70 + Math.random() * 30,
  })),
  monthly: Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}日`,
    response: 10 + Math.random() * 6,
    arrival: 30 + Math.random() * 12,
    completion: 75 + Math.random() * 35,
  })),
}

const metricCards = [
  { label: '平均响应时间', value: '12.5', unit: '分钟', icon: Clock, color: 'text-accent', bgColor: 'bg-accent/10' },
  { label: '平均到场时间', value: '38.2', unit: '分钟', icon: Navigation, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  { label: '平均完成时间', value: '95.6', unit: '分钟', icon: Wrench, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  { label: '超时率', value: '3.2', unit: '%', icon: AlertTriangle, color: 'text-alert', bgColor: 'bg-alert/10' },
]

const alerts = [
  { orderId: 'ORD-20240601', type: '响应超时', duration: '25分钟', status: 'open' },
  { orderId: 'ORD-20240602', type: '到场超时', duration: '65分钟', status: 'processing' },
  { orderId: 'ORD-20240603', type: '完成超时', duration: '180分钟', status: 'closed' },
  { orderId: 'ORD-20240604', type: '响应超时', duration: '18分钟', status: 'open' },
]

type TimeRange = 'daily' | 'weekly' | 'monthly'

export default function SLA() {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily')
  const chartData = slaData[timeRange]

  return (
    <div className="animate-fade-in">
      <h1 className="font-title text-2xl font-bold text-white">SLA 看板</h1>
      <p className="mt-1 text-gray-400">实时监控服务等级指标</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card) => (
          <div key={card.label} className="gradient-card rounded-lg p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{card.label}</span>
              <div className={`rounded-lg ${card.bgColor} p-2`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className={`font-title text-3xl font-bold ${card.color}`}>{card.value}</span>
              <span className="text-sm text-gray-500">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-title text-lg font-semibold text-white">SLA 趋势</h3>
          <div className="flex items-center gap-1 rounded-lg bg-primary p-1">
            {([['daily', '日'], ['weekly', '周'], ['monthly', '月']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                  timeRange === key ? 'bg-accent text-primary' : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradResponse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradArrival" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCompletion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#1E293B', border: '1px solid #334155', color: '#fff' }} />
              <Area type="monotone" dataKey="response" name="响应时间" stroke="#06D6A0" fill="url(#gradResponse)" strokeWidth={2} />
              <Area type="monotone" dataKey="arrival" name="到场时间" stroke="#60a5fa" fill="url(#gradArrival)" strokeWidth={2} />
              <Area type="monotone" dataKey="completion" name="完成时间" stroke="#c084fc" fill="url(#gradCompletion)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 bg-surface p-6">
        <h3 className="font-title text-lg font-semibold text-white">实时告警</h3>
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div key={alert.orderId} className="flex items-center justify-between rounded-lg bg-primary p-4">
              <div className="flex items-center gap-4">
                <AlertTriangle className={`h-4 w-4 ${alert.status === 'closed' ? 'text-gray-500' : 'text-alert'}`} />
                <div>
                  <span className="font-mono text-sm text-accent">{alert.orderId}</span>
                  <span className="ml-3 text-sm text-gray-400">{alert.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">超时 {alert.duration}</span>
                <StatusBadge status={alert.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
