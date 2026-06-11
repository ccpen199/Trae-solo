import { useEffect, useState } from 'react'
import {
  Activity, Clock, AlertTriangle, CheckCircle2, XCircle, TrendingDown,
  RefreshCw, ChevronDown, ChevronUp, Server, Eye, Zap,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts'
import { apiFetch, mapHealthMetric } from '@/utils/api'
import type { HealthMetrics } from '@/types'

const depts = [
  { id: 'dept-001', name: '人社局', short: '人社局' },
  { id: 'dept-002', name: '税务局', short: '税务局' },
  { id: 'dept-003', name: '公安局', short: '公安局' },
  { id: 'dept-004', name: '住建局', short: '住建局' },
  { id: 'dept-005', name: '城管局', short: '城管局' },
  { id: 'dept-006', name: '自然资源局', short: '自然资源局' },
  { id: 'dept-007', name: '水务局', short: '水务局' },
  { id: 'dept-008', name: '市场监管局', short: '市场监管局' },
]

const trendSeries = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0') + ':00'
  return {
    time: h,
    response: 80 + Math.round(Math.sin(i / 3) * 40 + Math.random() * 30),
    failure: +(0.1 + Math.random() * 1.2).toFixed(2),
    timeout: Math.random() > 0.75 ? Math.floor(Math.random() * 6) + 1 : 0,
    qps: 200 + Math.round(Math.sin(i / 2) * 120 + Math.random() * 80),
  }
})

interface AlertItem {
  id: number
  level: 'critical' | 'warning' | 'info' | 'resolved'
  dept: string
  msg: string
  value: string
  threshold: string
  time: string
  ack: boolean
}

const defaultAlerts: AlertItem[] = [
  { id: 1, level: 'critical', dept: '自然资源局', msg: '不动产查询接口连续超时', value: '386ms/12次', threshold: '>300ms连续3次', time: '14:32:18', ack: false },
  { id: 2, level: 'warning', dept: '税务局', msg: '税务预约失败率异常升高', value: '1.24%', threshold: '>1%', time: '14:18:04', ack: false },
  { id: 3, level: 'warning', dept: '水务局', msg: '水费缴纳接口响应慢', value: '312ms', threshold: '>300ms', time: '13:50:22', ack: true },
  { id: 4, level: 'critical', dept: '城管局', msg: '违章处理回调504网关超时', value: '7次', threshold: '连续2次', time: '13:22:10', ack: false },
  { id: 5, level: 'info', dept: '人社局', msg: '社保缴纳QPS峰值触发限流', value: '512 req/s', threshold: '>500', time: '11:20:33', ack: true },
  { id: 6, level: 'resolved', dept: '住建局', msg: '公积金接口已自动恢复', value: '145ms', threshold: '<200ms', time: '10:47:01', ack: true },
  { id: 7, level: 'warning', dept: '市场监管局', msg: '营业执照查询成功率下降', value: '98.1%', threshold: '<98.5%', time: '09:32:58', ack: true },
  { id: 8, level: 'info', dept: '公安局', msg: '户籍办理接口完成版本切换', value: 'v2.3.0', threshold: '-', time: '09:05:12', ack: true },
]

function StatusDot({ status }: { status: HealthMetrics['status'] }) {
  const map = {
    healthy: { cls: 'bg-green-500', ring: 'ring-green-200' },
    degraded: { cls: 'bg-amber-500', ring: 'ring-amber-200' },
    down: { cls: 'bg-red-500', ring: 'ring-red-200' },
    unknown: { cls: 'bg-gray-400', ring: 'ring-gray-200' },
  }
  const c = map[status] || map.unknown
  return <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${c.cls} ${c.ring} ring-4`} />
}

function StatusBadge({ status, text }: { status: HealthMetrics['status']; text?: string }) {
  const map = {
    healthy: { label: '健康', cls: 'bg-green-50 text-green-700 border-green-200' },
    degraded: { label: '降级', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    down: { label: '故障', cls: 'bg-red-50 text-red-700 border-red-200' },
    unknown: { label: '未知', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  }
  const c = map[status] || map.unknown
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border font-medium ${c.cls}`}>{text || c.label}</span>
}

export default function Monitor() {
  const [metrics, setMetrics] = useState<HealthMetrics[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>(defaultAlerts)
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'avgResponse' | 'failureRate' | 'timeout' | 'qps'>('avgResponse')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    apiFetch<{ summary?: Record<string, unknown>; list?: Array<Record<string, unknown>> }>('/api/monitor/health')
      .then((d) => {
        const arr = (d.list || d as unknown as Array<Record<string, unknown>>) as Array<Record<string, unknown>>
        if (Array.isArray(arr) && arr.length) setMetrics(arr.map(mapHealthMetric))
        else {
          setMetrics(depts.map((dept, i) => {
            const status: HealthMetrics['status'] = ['dept-006', 'dept-005'].includes(dept.id) ? 'degraded' : 'dept-001' === dept.id && i % 11 === 0 ? 'down' : 'healthy'
            const avg = status === 'down' ? 2480 : status === 'degraded' ? 220 + i * 25 : 90 + i * 18
            const fail = status === 'down' ? 15.2 : status === 'degraded' ? 0.8 + i * 0.15 : 0.05 + i * 0.08
            const lastCheckStr = new Date(Date.now() - i * 60000).toISOString()
            return {
              id: dept.id,
              departmentId: dept.id,
              departmentName: dept.name,
              avgResponseTime: avg,
              avgResponse: avg,
              p50: Math.round(avg * 0.7),
              p95: Math.round(avg * 1.6),
              p99: Math.round(avg * 2.1),
              failureRate: +fail.toFixed(2),
              timeoutCount: status === 'degraded' ? 4 + i : status === 'down' ? 38 : 0,
              totalRequests: 82000 + i * 7652,
              successRate: +(100 - fail).toFixed(2),
              qps: status === 'down' ? 2 : 150 + i * 32,
              status,
              lastCheckTime: lastCheckStr,
              lastCheck: lastCheckStr,
              endpoints: [
                { name: '查询接口', path: `/api/${dept.id}/query`, method: 'GET', avgResponseTime: Math.round(avg * 0.8), avgResponse: Math.round(avg * 0.8), failureRate: +(fail * 0.6).toFixed(2), fail: +(fail * 0.6).toFixed(2), totalCalls: 12000 + i * 500, calls: 12000 + i * 500 },
                { name: '提交接口', path: `/api/${dept.id}/submit`, method: 'POST', avgResponseTime: Math.round(avg * 1.2), avgResponse: Math.round(avg * 1.2), failureRate: +(fail * 1.2).toFixed(2), fail: +(fail * 1.2).toFixed(2), totalCalls: 5400 + i * 300, calls: 5400 + i * 300 },
                { name: '回调接口', path: `/api/${dept.id}/callback`, method: 'POST', avgResponseTime: Math.round(avg * 1.5), avgResponse: Math.round(avg * 1.5), failureRate: +(fail * 1.5).toFixed(2), fail: +(fail * 1.5).toFixed(2), totalCalls: 1800 + i * 120, calls: 1800 + i * 120 },
              ],
            }
          }))
        }
      }).catch(() => {})
  }, [])

  const sorted = [...metrics].sort((a, b) => {
    const v1 = (a as unknown as Record<string, unknown>)[sortKey] as number
    const v2 = (b as unknown as Record<string, unknown>)[sortKey] as number
    return sortAsc ? v1 - v2 : v2 - v1
  })
  const avgResp = metrics.length ? Math.round(metrics.reduce((s, m) => s + m.avgResponse, 0) / metrics.length) : 128
  const avgFail = metrics.length ? +(metrics.reduce((s, m) => s + m.failureRate, 0) / metrics.length).toFixed(2) : 0.42
  const healthScore = Math.min(100, 100 - avgFail * 10 - (avgResp > 200 ? (avgResp - 200) * 0.2 : 0))
  const unackCount = alerts.filter((a) => !a.ack && a.level !== 'resolved').length

  const barData = sorted.map((m) => ({
    dept: m.departmentName.replace('市', '').replace('局', ''),
    avg: m.avgResponse, p95: m.p95, p99: m.p99,
    fail: m.failureRate, status: m.status,
  }))

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const gaugeData = [
    { name: 'L1', value: 80, fill: '#e5e7eb' },
    { name: 'L2', value: healthScore - 80 < 0 ? 0 : healthScore - 80 < 15 ? healthScore - 80 : 0, fill: '#E76F51' },
    { name: 'L3', value: healthScore >= 80 ? 15 : healthScore - 65 < 0 ? 0 : healthScore - 65, fill: '#2EC4B6' },
    { name: 'L4', value: healthScore >= 95 ? healthScore - 95 : 0, fill: '#1A5FB4' },
    { name: 'total', value: 100, fill: 'transparent' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">健康监测详情</h2>
        <p className="text-xs text-gray-500 mt-1">委办局接口状态、调用链和告警处置总览</p>
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-400 mb-1">综合健康分</p>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="92%" startAngle={180} endAngle={0} barSize={8} data={gaugeData}>
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <p className="text-3xl font-bold text-gray-800">{healthScore.toFixed(0)}</p>
              <p className="text-[10px] text-gray-400">满分100</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] mt-2">
            <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />优</span>
            <span className="text-gray-400">· 较昨日 +1.2</span>
          </div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2"><Clock className="w-3.5 h-3.5" />平均响应时长</div>
          <p className="text-3xl font-bold text-gray-800">{avgResp}<span className="text-sm text-gray-400 ml-1">ms</span></p>
          <div className="flex items-center gap-1 mt-3 text-[10px]">
            <TrendingDown className="w-3 h-3 text-green-500" />
            <span className="text-green-600">下降 8.6%</span>
            <span className="text-gray-400 ml-1">· 优于阈值200ms</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-convenience rounded-full" style={{ width: `${Math.min(100, (avgResp / 300) * 100)}%` }} />
          </div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2"><XCircle className="w-3.5 h-3.5" />平均失败率</div>
          <p className="text-3xl font-bold text-gray-800">{avgFail}<span className="text-sm text-gray-400 ml-1">%</span></p>
          <div className="flex items-center gap-1 mt-3 text-[10px]">
            <TrendingDown className="w-3 h-3 text-green-500" />
            <span className="text-green-600">下降 0.23pp</span>
            <span className="text-gray-400 ml-1">· 阈值1.0%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div className={`h-full rounded-full ${avgFail > 1 ? 'bg-alert' : 'bg-convenience'}`} style={{ width: `${Math.min(100, (avgFail / 2) * 100)}%` }} />
          </div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2"><AlertTriangle className="w-3.5 h-3.5" />活跃告警</div>
          <p className="text-3xl font-bold text-gray-800">{unackCount}<span className="text-sm text-gray-400 ml-1">条</span></p>
          <div className="flex items-center gap-2 mt-3 text-[10px]">
            <span className="flex items-center gap-1 text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />严重 2</span>
            <span className="flex items-center gap-1 text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />警告 2</span>
            <span className="flex items-center gap-1 text-blue-600"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />信息 1</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden flex">
            <div className="bg-red-400 h-full" style={{ width: `${(2 / Math.max(unackCount, 1)) * 100}%` }} />
            <div className="bg-amber-400 h-full" style={{ width: `${(2 / Math.max(unackCount, 1)) * 100}%` }} />
            <div className="bg-blue-400 h-full" style={{ width: `${(1 / Math.max(unackCount, 1)) * 100}%` }} />
          </div>
        </div>
        <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2"><Zap className="w-3.5 h-3.5" />QPS 峰值</div>
          <p className="text-3xl font-bold text-gray-800">512<span className="text-sm text-gray-400 ml-1">/s</span></p>
          <div className="flex items-center gap-1 mt-3 text-[10px]">
            <Activity className="w-3 h-3 text-gov-blue-500" />
            <span className="text-gray-600">人社局 社保缴纳</span>
          </div>
          <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-400">
            <RefreshCw className="w-3 h-3" />24小时累计 {metrics.reduce((s, m) => s + m.totalRequests, 0).toLocaleString()} 请求
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800 flex items-center gap-2"><Server className="w-4 h-4 text-gov-blue-500" />各委办局响应时长分布（单位：ms）</h3>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gov-blue-400" />平均</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gov-blue-600" />P95</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-alert" />P99</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="avg" name="平均" fill="#4787DF" radius={[2, 2, 0, 0]} />
              <Bar dataKey="p95" name="P95" fill="#1A5FB4" radius={[2, 2, 0, 0]} />
              <Bar dataKey="p99" name="P99" fill="#E76F51" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4 text-alert" />失败率（%）vs QPS</h3>
            <span className="text-[10px] text-gray-400">最近24小时 · 每小时</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={3} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="qps" stroke="#1A5FB4" fill="#D6E4F5" fillOpacity={0.6} name="QPS" />
              <Line yAxisId="right" type="monotone" dataKey="failure" stroke="#E76F51" strokeWidth={2} dot={{ r: 2 }} name="失败率(%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-800 flex items-center gap-2"><Eye className="w-4 h-4 text-gov-blue-500" />服务健康度总览（8个委办局 · {sorted.length}个接入点）</h3>
            <button className="text-xs text-gov-blue-500 hover:underline flex items-center gap-1"><RefreshCw className="w-3 h-3" />立即巡检</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">部门</th>
                  <th className="text-left px-3 py-2.5 font-medium">状态</th>
                  {(['avgResponse', 'failureRate', 'timeout', 'qps'] as const).map((k) => (
                    <th key={k} className="text-right px-3 py-2.5 font-medium cursor-pointer select-none hover:bg-gray-100" onClick={() => toggleSort(k)}>
                      <span className="inline-flex items-center gap-1">
                        {k === 'avgResponse' ? '平均响应' : k === 'failureRate' ? '失败率' : k === 'timeout' ? '超时次数' : 'QPS'}
                        {sortKey === k && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </span>
                    </th>
                  ))}
                  <th className="text-right px-3 py-2.5 font-medium">成功率</th>
                  <th className="text-center px-3 py-2.5 font-medium">明细</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => {
                  const deptId = m.departmentId
                  const isExp = expandedDept === deptId
                  const eps = (m as HealthMetrics & { endpoints: Array<Record<string, unknown>> }).endpoints || []
                  return [
                      <tr key={deptId} className="border-t border-gray-50 hover:bg-gov-blue-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusDot status={m.status} />
                            <span className="text-sm font-medium text-gray-700">{m.departmentName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
                        <td className={`px-3 py-3 text-right font-mono ${m.avgResponse > 250 ? 'text-alert font-medium' : 'text-gray-700'}`}>{m.avgResponse}ms</td>
                        <td className={`px-3 py-3 text-right font-mono ${m.failureRate > 1 ? 'text-alert font-medium' : m.failureRate > 0.5 ? 'text-amber-600' : 'text-gray-700'}`}>{m.failureRate}%</td>
                        <td className={`px-3 py-3 text-right font-mono ${m.timeoutCount > 0 ? 'text-alert font-medium' : 'text-gray-500'}`}>{m.timeoutCount}</td>
                        <td className="px-3 py-3 text-right font-mono text-gray-700">{m.qps}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={`text-xs font-medium ${m.successRate >= 99.5 ? 'text-green-600' : m.successRate >= 99 ? 'text-convenience' : 'text-alert'}`}>
                            {m.successRate}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => setExpandedDept(isExp ? null : deptId)} className="text-gov-blue-500 hover:underline inline-flex items-center gap-1">
                            {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}接口
                          </button>
                        </td>
                      </tr>,
                      isExp && eps.map((ep, idx) => (
                        <tr key={`${deptId}-${idx}`} className="bg-gray-50/60">
                          <td className="pl-10 pr-4 py-2.5 text-[11px] font-mono text-gray-600" colSpan={2}><span className="text-gray-400 mr-2">→</span>{ep.path}</td>
                          <td className="px-3 py-2.5 text-right text-[11px] font-mono text-gray-600">{ep.avgResponseTime}ms</td>
                          <td className="px-3 py-2.5 text-right text-[11px] font-mono text-gray-600">{ep.failureRate}%</td>
                          <td className="px-3 py-2.5 text-right text-[11px] font-mono text-gray-500">—</td>
                          <td className="px-3 py-2.5 text-right text-[11px] font-mono text-gray-500">—</td>
                          <td className="px-3 py-2.5 text-right text-[11px] font-mono text-gray-500" colSpan={2}>调用 {String(ep.totalCalls).padStart(6, ' ')}</td>
                        </tr>
                      ))
                  ]
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-alert" />超时告警时序表
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">{unackCount} 未处理</span>
            </h3>
            <span className="text-[10px] text-gray-400">今日 {alerts.length} 条</span>
          </div>
          <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-50">
            {alerts.map((a) => {
              const cfg = {
                critical: { icon: XCircle, iconColor: 'text-red-500', bg: 'bg-red-50', bd: 'border-l-4 border-red-500', tag: '严重' },
                warning: { icon: AlertTriangle, iconColor: 'text-amber-500', bg: 'bg-amber-50', bd: 'border-l-4 border-amber-400', tag: '警告' },
                info: { icon: Activity, iconColor: 'text-blue-500', bg: 'bg-blue-50', bd: 'border-l-4 border-blue-400', tag: '信息' },
                resolved: { icon: CheckCircle2, iconColor: 'text-green-500', bg: 'bg-green-50/50 opacity-70', bd: 'border-l-4 border-green-400', tag: '已恢复' },
              }[a.level]
              const IC = cfg.icon
              return (
                <div key={a.id} className={`flex items-start gap-3 p-3.5 ${cfg.bg} ${cfg.bd} ${a.ack || a.level === 'resolved' ? '' : 'relative after:absolute after:top-3.5 after:right-3 after:w-2 after:h-2 after:rounded-full after:bg-alert after:animate-pulse'}`}>
                  <IC className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${a.level === 'critical' ? 'bg-red-100 text-red-700' : a.level === 'warning' ? 'bg-amber-100 text-amber-700' : a.level === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'} font-medium`}>{cfg.tag}</span>
                      <span className="text-xs font-medium text-gray-700">{a.dept}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{a.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 mb-1.5">{a.msg}</p>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                      <span>当前 <span className="font-mono text-gray-700">{a.value}</span></span>
                      <span>阈值 <span className="font-mono text-gray-500">{a.threshold}</span></span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {!a.ack && a.level !== 'resolved' && (
                        <button
                          onClick={() => setAlerts((prev) => prev.map((x) => x.id === a.id ? { ...x, ack: true } : x))}
                          className="text-[10px] px-2 py-1 rounded border border-gov-blue-200 text-gov-blue-600 hover:bg-gov-blue-50"
                        >
                          确认
                        </button>
                      )}
                      <button className="text-[10px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">查看调用链</button>
                      {a.level === 'critical' && <button className="text-[10px] px-2 py-1 rounded bg-alert text-white hover:opacity-90">立即干预</button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
