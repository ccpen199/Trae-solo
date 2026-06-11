import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, Smartphone, Users, DollarSign, Eye, Ban,
  CheckCircle2, XCircle, Clock, Landmark, Activity, X, UserCheck,
  UserX, FileSearch, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart
} from 'recharts'
import {
  fundFlowData, deviceDistribution, deviceBlockRecords,
  withdrawalReviewRecords, reviewHistoryRecords, type DeviceBlockRecord
} from '@/data/riskAlerts'
import { formatPrice, formatDateTime } from '@/utils'
import AdminSidebar from '@/components/common/AdminSidebar'
import { cn } from '@/lib/utils'

const RISK_LEVEL_STYLE = {
  low: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  high: 'bg-danger-50 text-danger-600 border-danger-200',
}
const RISK_LABEL = { low: '低', medium: '中', high: '高' }
const DEVICE_STATUS_STYLE = {
  banned: 'bg-danger-50 text-danger-600 border-danger-200',
  observing: 'bg-amber-50 text-amber-600 border-amber-200',
  released: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}
const DEVICE_STATUS_LABEL = { banned: '已封禁', observing: '观察中', released: '已解封' }
const WITHDRAWAL_TAB_STYLE = (active: boolean) =>
  active ? 'bg-primary-500 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
const REVIEW_TABS = [
  { key: 'pending', label: '待复核' },
  { key: 'approved', label: '已通过' },
  { key: 'frozen', label: '已冻结' },
] as const

export default function AdminRisk() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceBlockRecord | null>(null)
  const [deviceStatusMap, setDeviceStatusMap] = useState<Record<string, DeviceBlockRecord['status']>>({})
  const [withdrawalTab, setWithdrawalTab] = useState<'pending' | 'approved' | 'frozen'>('pending')
  const [withdrawalStatusMap, setWithdrawalStatusMap] = useState<Record<string, 'pending' | 'approved' | 'frozen'>>({})

  const getDeviceStatus = (d: DeviceBlockRecord) => deviceStatusMap[d.deviceId] ?? d.status
  const setDeviceStatus = (deviceId: string, status: DeviceBlockRecord['status']) =>
    setDeviceStatusMap({ ...deviceStatusMap, [deviceId]: status })

  const getWithdrawalStatus = (w: typeof withdrawalReviewRecords[0]) =>
    withdrawalStatusMap[w.id] ?? w.status
  const setWithdrawalStatus = (id: string, status: 'pending' | 'approved' | 'frozen') =>
    setWithdrawalStatusMap({ ...withdrawalStatusMap, [id]: status })

  const todayDeviceBlocks = deviceBlockRecords.filter(d => d.firstRegister.startsWith('2026-06-11')).length
  const totalDeviceBlocks = deviceBlockRecords.length
  const totalAffectedAccounts = deviceBlockRecords.reduce((sum, d) => sum + d.accountCount, 0)
  const falseAppealedCount = 47

  const todayPendingCount = withdrawalReviewRecords.filter(w => getWithdrawalStatus(w) === 'pending').length
  const weekLargeTotal = withdrawalReviewRecords
    .filter(w => w.submitTime >= '2026-06-04')
    .reduce((sum, w) => sum + w.amount, 0)
  const totalReviewed = withdrawalReviewRecords.filter(w => w.status !== 'pending').length
  const approvedCount = withdrawalReviewRecords.filter(w => w.status === 'approved').length
  const reviewPassRate = totalReviewed > 0 ? ((approvedCount / totalReviewed) * 100).toFixed(1) : '0.0'
  const frozenTotal = withdrawalReviewRecords
    .filter(w => getWithdrawalStatus(w) === 'frozen')
    .reduce((sum, w) => sum + w.amount, 0)

  const deviceChartData = deviceDistribution.map(d => ({
    ...d,
    anomalyRate: ((d.anomaly / d.count) * 100).toFixed(1),
  }))

  const filteredWithdrawals = withdrawalReviewRecords.filter(w => getWithdrawalStatus(w) === withdrawalTab)

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar />
      <div className="pl-56">
        <div className="px-6 py-8">
          <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">风控看板</h1>

          {/* ========= 模块 A: 设备审计 ========= */}
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Smartphone size={20} className="text-primary-500" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">设备审计 · 同设备多账号拦截</h2>
            </div>

            <div className="mb-5 grid grid-cols-4 gap-4">
              {[
                { label: '今日拦截数', value: todayDeviceBlocks, icon: ShieldCheck, color: 'text-danger-400 bg-danger-50', trend: '+12%', trendUp: true },
                { label: '累计拦截总数', value: totalDeviceBlocks, icon: Ban, color: 'text-amber-500 bg-amber-50', trend: '+8.3%', trendUp: true },
                { label: '关联账号总数', value: totalAffectedAccounts, icon: Users, color: 'text-sky-500 bg-sky-50', trend: '+15.2%', trendUp: true },
                { label: '误判申诉通过', value: falseAppealedCount, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50', trend: '-2.1%', trendUp: false },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={cn('rounded-lg p-2', s.color.split(' ')[1])}>
                      <s.icon size={18} className={s.color.split(' ')[0]} />
                    </span>
                    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      s.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-danger-50 text-danger-600')}>
                      {s.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {s.trend}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">{s.value}</div>
                  <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-700">设备拦截明细</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="inline-flex h-2 w-2 rounded-full bg-danger-500"></span> 待处理
                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-500"></span> 已处理
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-500">
                      <th className="px-6 py-3 font-medium">设备ID</th>
                      <th className="px-6 py-3 font-medium">关联账号</th>
                      <th className="px-6 py-3 font-medium">首次注册</th>
                      <th className="px-6 py-3 font-medium">最近注册</th>
                      <th className="px-6 py-3 font-medium">IP段</th>
                      <th className="px-6 py-3 font-medium">风险等级</th>
                      <th className="px-6 py-3 font-medium">状态</th>
                      <th className="px-6 py-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceBlockRecords.map((device) => {
                      const status = getDeviceStatus(device)
                      const handled = status === 'banned' || status === 'released'
                      return (
                        <tr key={device.deviceId} className={cn('border-b border-zinc-50 transition-colors hover:bg-zinc-50', handled && 'opacity-70')}>
                          <td className="px-6 py-3">
                            <span className="font-mono font-semibold text-zinc-900">{device.deviceId}</span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                              device.accountCount >= 3 ? 'border-danger-200 bg-danger-50 text-danger-600' : 'border-zinc-200 bg-zinc-50 text-zinc-600')}>
                              {device.accountCount} 个
                            </span>
                          </td>
                          <td className="px-6 py-3 text-zinc-600">{formatDateTime(device.firstRegister)}</td>
                          <td className="px-6 py-3 text-zinc-600">{formatDateTime(device.lastRegister)}</td>
                          <td className="px-6 py-3"><code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700">{device.ipSegment}</code></td>
                          <td className="px-6 py-3">
                            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', RISK_LEVEL_STYLE[device.riskLevel])}>
                              {RISK_LABEL[device.riskLevel]}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', DEVICE_STATUS_STYLE[status])}>
                              {DEVICE_STATUS_LABEL[status]}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setSelectedDevice(device)}
                                className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100">
                                <Eye size={12} /> 详情
                              </button>
                              {status !== 'banned' && (
                                <button onClick={() => setDeviceStatus(device.deviceId, 'banned')}
                                  className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-600 hover:bg-danger-100">
                                  <Ban size={12} /> 封禁
                                </button>
                              )}
                              {status === 'observing' && (
                                <button onClick={() => setDeviceStatus(device.deviceId, 'released')}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100">
                                  <CheckCircle2 size={12} /> 误判
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ========= 模块 B: 资金流监控 ========= */}
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Landmark size={20} className="text-primary-500" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">资金流监控 · 单日提现超5000元人工复核</h2>
            </div>

            <div className="mb-5 grid grid-cols-4 gap-4">
              {[
                { label: '今日待复核数', value: todayPendingCount, icon: Clock, color: 'text-amber-500 bg-amber-50', suffix: '单' },
                { label: '本周累计大额提现', value: '¥' + (weekLargeTotal / 1000).toFixed(1) + 'k', icon: DollarSign, color: 'text-primary-500 bg-primary-50' },
                { label: '人工复核通过率', value: reviewPassRate + '%', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50', trend: '+1.2%', trendUp: true },
                { label: '已拦截可疑金额', value: '¥' + (frozenTotal / 1000).toFixed(1) + 'k', icon: XCircle, color: 'text-danger-500 bg-danger-50' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={cn('rounded-lg p-2', s.color.split(' ')[1])}>
                      <s.icon size={18} className={s.color.split(' ')[0]} />
                    </span>
                    {s.trend && (
                      <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                        s.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-danger-50 text-danger-600')}>
                        {s.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {s.trend}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {s.value}{s.suffix && <span className="ml-0.5 text-sm font-normal text-zinc-500">{s.suffix}</span>}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="mb-5 grid grid-cols-3 gap-5">
              <div className="col-span-2 rounded-xl bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                  <h3 className="text-sm font-semibold text-zinc-700">人工复核队列</h3>
                  <div className="flex gap-1.5 rounded-lg bg-zinc-50 p-1">
                    {REVIEW_TABS.map(tab => {
                      const count = withdrawalReviewRecords.filter(w => getWithdrawalStatus(w) === tab.key).length
                      return (
                        <button key={tab.key} onClick={() => setWithdrawalTab(tab.key)}
                          className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                            WITHDRAWAL_TAB_STYLE(withdrawalTab === tab.key))}>
                          {tab.label}
                          <span className={cn('rounded-full px-1.5 py-0.5 text-xs',
                            withdrawalTab === tab.key ? 'bg-white/20' : 'bg-white')}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-50">
                      <tr className="border-b border-zinc-100 text-left text-zinc-500">
                        <th className="px-6 py-3 font-medium">提现单号</th>
                        <th className="px-6 py-3 font-medium">接单者</th>
                        <th className="px-6 py-3 font-medium">本次金额</th>
                        <th className="px-6 py-3 font-medium">当日累计</th>
                        <th className="px-6 py-3 font-medium">历史次数</th>
                        <th className="px-6 py-3 font-medium">7日任务</th>
                        <th className="px-6 py-3 font-medium">风险标签</th>
                        <th className="px-6 py-3 font-medium">提交时间</th>
                        {withdrawalTab === 'pending' && <th className="px-6 py-3 font-medium text-right">操作</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWithdrawals.map(w => (
                        <tr key={w.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                          <td className="px-6 py-3 font-mono text-xs text-zinc-700">{w.orderNo}</td>
                          <td className="px-6 py-3 font-medium text-zinc-900">{w.workerName}</td>
                          <td className={cn('px-6 py-3 font-semibold', w.amount > 5000 ? 'text-danger-500' : 'text-zinc-900')}>
                            {formatPrice(w.amount)}
                          </td>
                          <td className="px-6 py-3 font-medium text-zinc-700">{formatPrice(w.dailyTotal)}</td>
                          <td className="px-6 py-3 text-zinc-600">{w.historyCount}次</td>
                          <td className="px-6 py-3 text-zinc-600">{w.tasksLast7Days}个</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-1">
                              {w.riskTags.length === 0 ? (
                                <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">无</span>
                              ) : w.riskTags.map(tag => (
                                <span key={tag} className="inline-flex rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-600">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-xs text-zinc-500">{formatDateTime(w.submitTime)}</td>
                          {withdrawalTab === 'pending' && (
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => setWithdrawalStatus(w.id, 'approved')}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100">
                                  <CheckCircle2 size={12} /> 通过
                                </button>
                                <button onClick={() => setWithdrawalStatus(w.id, 'frozen')}
                                  className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-2.5 py-1 text-xs font-medium text-danger-600 hover:bg-danger-100">
                                  <XCircle size={12} /> 冻结
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-6 py-4">
                  <h3 className="text-sm font-semibold text-zinc-700">历史复核记录</h3>
                </div>
                <div className="max-h-[420px] overflow-y-auto px-6 py-4">
                  <div className="relative space-y-4">
                    <div className="absolute left-2.5 top-1 h-[calc(100%-1rem)] w-px bg-zinc-200"></div>
                    {reviewHistoryRecords.map(r => (
                      <div key={r.id} className="relative pl-7">
                        <span className={cn('absolute left-0 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow',
                          r.action === 'approved' ? 'bg-emerald-500' : 'bg-danger-500')}>
                          {r.action === 'approved' ? <CheckCircle2 size={10} className="text-white" /> : <XCircle size={10} className="text-white" />}
                        </span>
                        <div className="rounded-lg bg-zinc-50 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-900">{r.operator}</span>
                            <span className="text-[10px] text-zinc-400">{formatDateTime(r.time)}</span>
                          </div>
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium',
                              r.action === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-danger-50 text-danger-600')}>
                              {r.action === 'approved' ? '已通过' : '已冻结'}
                            </span>
                            <span className="text-sm font-bold text-zinc-900">{formatPrice(r.amount)}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-zinc-500">{r.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700">资金流趋势（近7日）</h3>
                  <p className="mt-1 text-xs text-zinc-500">红色阴影标注负净额日，右侧折线为大额提现笔数</p>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[#1A535C]"></span>充值</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[#EF476F]"></span>提现</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[#FF6B35]"></span>净额</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-[#8B5CF6]"></span>大额笔数</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={fundFlowData} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="depositGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A535C" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1A535C" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="withdrawalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF476F" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#EF476F" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF476F" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#EF476F" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#a1a1aa" tickFormatter={(v: number) => `${v / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#8B5CF6" />
                  <Tooltip
                    formatter={(v: number, name: string) => {
                      if (name === '大额提现笔数') return [`${v}笔`, name]
                      return [formatPrice(v), name]
                    }}
                  />
                  {fundFlowData.map((entry, i) => entry.net < 0 && (
                    <Area key={`neg-${i}`} yAxisId="left" type="monotone" dataKey="net" fill="url(#negativeGrad)" stroke="none" />
                  ))}
                  <Area yAxisId="left" type="monotone" dataKey="deposit" name="充值" stroke="#1A535C" strokeWidth={2} fill="url(#depositGrad)" />
                  <Area yAxisId="left" type="monotone" dataKey="withdrawal" name="提现" stroke="#EF476F" strokeWidth={2} fill="url(#withdrawalGrad)" />
                  <Line yAxisId="left" type="monotone" dataKey="net" name="净额" stroke="#FF6B35" strokeWidth={2.5}
                    dot={(props: Record<string, unknown>) => {
                      const { cx, cy, payload } = props as { cx: number; cy: number; payload: { net: number } }
                      return <circle key={cx} cx={cx} cy={cy} r={5} fill={payload.net < 0 ? '#EF476F' : '#FF6B35'} stroke="#fff" strokeWidth={2} />
                    }} />
                  <Line yAxisId="right" type="monotone" dataKey="largeWithdrawals" name="大额提现笔数" stroke="#8B5CF6" strokeWidth={2.5}
                    strokeDasharray="5 3" dot={{ r: 4, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ========= 模块 C: IP 异常分布图 ========= */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary-500" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">IP异常分布 · 城市维度统计</h2>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs text-zinc-500">红色柱子表示异常比例超过15%，标签为异常数/总数</p>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[#1A535C]"></span>设备总数</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-[#EF476F]"></span>异常设备</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                  <Tooltip
                    formatter={(v: number, name: string) => {
                      if (name === '异常率') return [`${v}%`, name]
                      return [v, name]
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="设备总数" fill="#1A535C" radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10, fill: '#71717a', formatter: (_: unknown, p: { payload: { anomaly: number; count: number } }) => `${p.payload.anomaly}/${p.payload.count}` }} />
                  <Bar dataKey="anomaly" name="异常设备" radius={[4, 4, 0, 0]}>
                    {deviceChartData.map((entry, i) => {
                      const rate = parseFloat(entry.anomalyRate)
                      return <Cell key={i} fill={rate > 15 ? '#EF476F' : rate > 10 ? '#FFD166' : '#94a3b8'} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>

      {/* ========= 设备详情 Modal ========= */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-8">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                <div>
                  <h2 className="font-serif text-lg font-bold text-zinc-900">设备详情 · {selectedDevice.deviceId}</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {selectedDevice.model} | {selectedDevice.os}
                    <span className={cn('ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      DEVICE_STATUS_STYLE[getDeviceStatus(selectedDevice)])}>
                      {DEVICE_STATUS_LABEL[getDeviceStatus(selectedDevice)]}
                    </span>
                  </p>
                </div>
                <button onClick={() => setSelectedDevice(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4">
                  {[
                    { label: '设备型号', value: selectedDevice.model },
                    { label: '操作系统', value: selectedDevice.os },
                    { label: '浏览器', value: selectedDevice.browser },
                    { label: '浏览器指纹', value: selectedDevice.browserFingerprint },
                    { label: 'IP 段', value: selectedDevice.ipSegment, code: true },
                    { label: '风险等级', value: (
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', RISK_LEVEL_STYLE[selectedDevice.riskLevel])}>
                        {RISK_LABEL[selectedDevice.riskLevel]}
                      </span>
                    ) },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="mb-1 text-xs text-zinc-500">{item.label}</div>
                      {item.code ? <code className="rounded bg-white px-2 py-1 text-xs text-zinc-700">{item.value}</code> : <div className="text-sm text-zinc-900">{item.value}</div>}
                    </div>
                  ))}
                </div>

                {/* 关联账号 */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <Users size={14} /> 关联账号列表 ({selectedDevice.associatedAccounts.length})
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-zinc-100">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 font-medium">用户名</th>
                          <th className="px-4 py-2 font-medium">注册时间</th>
                          <th className="px-4 py-2 font-medium">接单数</th>
                          <th className="px-4 py-2 font-medium">实名</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDevice.associatedAccounts.map(acc => (
                          <tr key={acc.userId} className="border-t border-zinc-50">
                            <td className="px-4 py-2">
                              <span className="font-medium text-zinc-900">{acc.username}</span>
                              <span className="ml-1 text-xs text-zinc-400">({acc.userId})</span>
                            </td>
                            <td className="px-4 py-2 text-zinc-600">{formatDateTime(acc.registerTime)}</td>
                            <td className="px-4 py-2 text-zinc-700">{acc.taskCount} 单</td>
                            <td className="px-4 py-2">
                              {acc.realNameVerified
                                ? <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600"><UserCheck size={12} />已认证</span>
                                : <span className="inline-flex items-center gap-0.5 text-xs text-danger-500"><UserX size={12} />未认证</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 行为模式 */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <Zap size={14} /> 行为模式分析
                  </h3>
                  <ul className="space-y-2">
                    {selectedDevice.behaviorPatterns.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 历史记录 */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700">
                    <FileSearch size={14} /> 历史处理记录
                  </h3>
                  <div className="space-y-2">
                    {selectedDevice.historyRecords.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3">
                        <span className={cn('flex-shrink-0 rounded-full p-1.5',
                          r.action === 'ban' ? 'bg-danger-50 text-danger-500' : r.action === 'release' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500')}>
                          {r.action === 'ban' ? <Ban size={14} /> : r.action === 'release' ? <CheckCircle2 size={14} /> : <Eye size={14} />}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-900">{r.operator}</span>
                            <span className="text-xs text-zinc-400">{formatDateTime(r.time)}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            <span className="font-medium">
                              {r.action === 'ban' ? '封禁设备' : r.action === 'release' ? '解除封禁' : '进入观察'}
                            </span>
                            <span className="mx-1">·</span>{r.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部操作 */}
              <div className="sticky bottom-0 border-t border-zinc-100 bg-white px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button onClick={() => setSelectedDevice(null)}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                    取消
                  </button>
                  <button onClick={() => { setDeviceStatus(selectedDevice.deviceId, 'observing'); setSelectedDevice(null) }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-200">
                    <Eye size={14} /> 仅观察
                  </button>
                  <button onClick={() => { setDeviceStatus(selectedDevice.deviceId, 'released'); setSelectedDevice(null) }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-200">
                    <CheckCircle2 size={14} /> 标记误判
                  </button>
                  <button onClick={() => { setDeviceStatus(selectedDevice.deviceId, 'banned'); setSelectedDevice(null) }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-danger-500 px-4 py-2 text-sm font-medium text-white hover:bg-danger-600">
                    <Ban size={14} /> 封禁全部账号
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
