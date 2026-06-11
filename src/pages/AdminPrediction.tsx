import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, Star, Lightbulb, BarChart3, Zap, Target, Award,
  ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Minus
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, LabelList
} from 'recharts'
import { heatPredictions, completionTrend } from '@/data/heatPredictions'
import { formatPrice } from '@/utils'
import AdminSidebar from '@/components/common/AdminSidebar'
import DifficultyBadge from '@/components/common/DifficultyBadge'
import { cn } from '@/lib/utils'
import type { TaskHeatPrediction, DifficultyLevel } from '@/types'

const FACTOR_CONFIG = {
  completion: { name: '历史完成率', weight: 0.4, icon: Target, color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  abandon: { name: '弃单率（反向）', weight: 0.3, icon: XCircle, color: '#EF4444', bg: 'bg-danger-50', text: 'text-danger-600', bar: 'bg-danger-500' },
  commission: { name: '佣金吸引力', weight: 0.2, icon: Award, color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-500' },
  supply: { name: '名额供需比', weight: 0.1, icon: Zap, color: '#8B5CF6', bg: 'bg-violet-50', text: 'text-violet-600', bar: 'bg-violet-500' },
} as const

const MOCK_SUPPLY_RATIO: Record<string, number> = {
  T017: 2.5, T006: 2.1, T001: 1.9, T007: 1.5, T002: 1.8, T012: 1.3,
  T008: 1.1, T019: 0.8, T010: 0.9, T003: 1.6, T016: 0.7, T004: 0.6,
  T011: 0.5, T009: 0.55, T005: 0.5, T018: 0.45,
}

function calcCommissionScore(price: number, difficulty: DifficultyLevel): number {
  const baseMap: Record<DifficultyLevel, number> = { L1: 5, L2: 25, L3: 80, L4: 300, L5: 800 }
  const ratio = price / baseMap[difficulty]
  return Math.round(Math.min(100, ratio * 70 + 30))
}

function calcFactorScores(p: TaskHeatPrediction) {
  const completionScore = Math.round(p.historicalCompletionRate * 100)
  const abandonScore = Math.round((1 - p.abandonmentRate) * 100)
  const commissionScore = calcCommissionScore(p.basePrice, p.difficulty)
  const ratio = MOCK_SUPPLY_RATIO[p.taskId] ?? 1.0
  const supplyScore = Math.round(Math.min(100, (ratio / 3) * 100))
  const predicted = Math.round(
    completionScore * FACTOR_CONFIG.completion.weight +
    abandonScore * FACTOR_CONFIG.abandon.weight +
    commissionScore * FACTOR_CONFIG.commission.weight +
    supplyScore * FACTOR_CONFIG.supply.weight
  )
  return { completionScore, abandonScore, commissionScore, supplyScore, predicted, ratio }
}

function heatColor(score: number) {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-amber-600'
  return 'text-danger-500'
}
function heatBg(score: number) {
  if (score >= 90) return 'bg-emerald-50 border-emerald-200'
  if (score >= 80) return 'bg-amber-50 border-amber-200'
  return 'bg-danger-50 border-danger-200'
}

function FactorProgressBar({ score, color, label }: { score: number; color: string; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-semibold text-zinc-700">{score}分</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  )
}

function HeatRingChart({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const strokeColor = score >= 90 ? '#10B981' : score >= 80 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f4f4f5" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth={6}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
    </svg>
  )
}

function MiniBarChart({ score }: { score: number }) {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[0.3, 0.5, 0.7, 0.85, 1].map((f, i) => (
        <div key={i} className={cn('w-1.5 rounded-sm', score >= f * 100 ? 'bg-amber-500' : 'bg-zinc-200')}
          style={{ height: `${f * 100}%` }}></div>
      ))}
    </div>
  )
}

export default function AdminPrediction() {
  const [recommendedMap, setRecommendedMap] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    heatPredictions.forEach(p => { m[p.taskId] = p.recommended })
    return m
  })

  const sortedPredictions = useMemo(
    () => [...heatPredictions].sort((a, b) => calcFactorScores(b).predicted - calcFactorScores(a).predicted),
    []
  )
  const recommendedList = heatPredictions.filter(p => recommendedMap[p.taskId])

  const toggleRecommended = (id: string) =>
    setRecommendedMap(prev => ({ ...prev, [id]: !prev[id] }))

  const lastTwo = completionTrend.slice(-2)
  const completionDelta = ((lastTwo[1].completionRate - lastTwo[0].completionRate) * 100).toFixed(1)
  const abandonDelta = ((lastTwo[1].abandonmentRate - lastTwo[0].abandonmentRate) * 100).toFixed(1)
  const completionUp = parseFloat(completionDelta) >= 0
  const abandonUp = parseFloat(abandonDelta) >= 0

  const labeledTrend = completionTrend.map((d, i) => ({
    ...d,
    isLast: i === completionTrend.length - 1,
    compLabel: `${(d.completionRate * 100).toFixed(0)}%`,
    abanLabel: `${(d.abandonmentRate * 100).toFixed(0)}%`,
  }))

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar />
      <div className="pl-56">
        <div className="px-6 py-8">
          <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">热度预测看板</h1>

          {/* ========= 模块 A: 预测算法说明卡片 ========= */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-gold-500" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">预测算法说明</h2>
            </div>

            <div className="rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 via-white to-amber-50 p-6 shadow-sm">
              <div className="mb-6 text-center">
                <div className="inline-block rounded-xl bg-white px-6 py-4 shadow-sm">
                  <div className="text-sm text-zinc-500 mb-2">综合热度评分公式</div>
                  <div className="flex flex-wrap items-center justify-center gap-1 text-base font-semibold">
                    <span className="text-emerald-600">完成率</span>
                    <span className="text-zinc-500">×0.4</span>
                    <span className="text-zinc-400 mx-1">+</span>
                    <span className="text-danger-500">(1-弃单率)</span>
                    <span className="text-zinc-500">×0.3</span>
                    <span className="text-zinc-400 mx-1">+</span>
                    <span className="text-amber-600">佣金吸引力</span>
                    <span className="text-zinc-500">×0.2</span>
                    <span className="text-zinc-400 mx-1">+</span>
                    <span className="text-violet-600">供需比</span>
                    <span className="text-zinc-500">×0.1</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {(Object.entries(FACTOR_CONFIG) as [keyof typeof FACTOR_CONFIG, typeof FACTOR_CONFIG.completion][]).map(([key, cfg]) => (
                  <div key={key} className="rounded-xl border border-zinc-100 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn('rounded-lg p-1.5', cfg.bg)}>
                        <cfg.icon size={16} className={cfg.text} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{cfg.name}</div>
                        <div className="text-[10px] text-zinc-400">权重 ×{cfg.weight}</div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 leading-relaxed">
                      {key === 'completion' && '基于历史30天任务完成比例，越高越稳定'}
                      {key === 'abandon' && '已接单后放弃的比例，越低越可靠'}
                      {key === 'commission' && '佣金相对同类任务均价的溢价水平'}
                      {key === 'supply' && '报名人数与名额的比值，越高越抢手'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-gold-300 bg-white/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Award size={16} className="text-gold-500" />
                  <span className="text-sm font-semibold text-gold-700">举例说明</span>
                </div>
                <div className="text-sm text-zinc-600 leading-relaxed">
                  某任务：<b>完成率90%</b> + <b>弃单率5%</b> + <b>佣金为均价150%</b> + <b>供需比2.0</b>
                  <div className="mt-2 font-mono text-xs bg-zinc-50 rounded p-2 inline-block">
                    = 90×0.4 + 95×0.3 + 90×0.2 + 67×0.1 = 36 + 28.5 + 18 + 6.7 = <b className="text-emerald-600">89.2分</b>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========= 模块 B: 完成率/弃单率趋势分析 ========= */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-500" />
                <h2 className="font-serif text-lg font-bold text-zinc-900">完成率 · 弃单率 趋势分析</h2>
              </div>
              <div className="flex gap-2">
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  completionUp ? 'bg-emerald-50 text-emerald-600' : 'bg-danger-50 text-danger-600')}>
                  {completionUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  完成率 {completionDelta}%
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  !abandonUp ? 'bg-emerald-50 text-emerald-600' : 'bg-danger-50 text-danger-600')}>
                  {!abandonUp ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                  弃单率 {abandonDelta}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 rounded-xl bg-white p-6 shadow-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={labeledTrend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa"
                      tickFormatter={(v: number) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
                    <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="completionRate" name="完成率" stroke="#1A535C" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#1A535C', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}>
                      <LabelList dataKey="compLabel" position="top" content={({ x, y, value, index }: { x: number; y: number; value: string; index: number }) =>
                        labeledTrend[index].isLast ? <text x={x} y={y - 8} fill="#1A535C" fontSize={11} fontWeight="bold" textAnchor="middle">{value}</text> : null
                      } />
                    </Line>
                    <Line type="monotone" dataKey="abandonmentRate" name="弃单率" stroke="#EF476F" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#EF476F', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}>
                      <LabelList dataKey="abanLabel" position="top" content={({ x, y, value, index }: { x: number; y: number; value: string; index: number }) =>
                        labeledTrend[index].isLast ? <text x={x} y={y - 8} fill="#EF476F" fontSize={11} fontWeight="bold" textAnchor="middle">{value}</text> : null
                      } />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-zinc-700">每日数据明细</h3>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-zinc-50">
                      <tr className="border-b border-zinc-100 text-left text-zinc-500">
                        <th className="px-4 py-2 font-medium">日期</th>
                        <th className="px-4 py-2 font-medium">完成率</th>
                        <th className="px-4 py-2 font-medium">弃单率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completionTrend.map((d, i) => {
                        const prev = i > 0 ? completionTrend[i - 1] : null
                        const compTrend = prev ? d.completionRate - prev.completionRate : 0
                        const abanTrend = prev ? d.abandonmentRate - prev.abandonmentRate : 0
                        return (
                          <tr key={d.date} className="border-b border-zinc-50 hover:bg-zinc-50">
                            <td className="px-4 py-2 font-medium text-zinc-700">{d.date}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-emerald-600">{(d.completionRate * 100).toFixed(0)}%</span>
                                {prev && (compTrend !== 0) && (
                                  <span className={cn('inline-flex items-center', compTrend >= 0 ? 'text-emerald-500' : 'text-danger-500')}>
                                    {compTrend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-danger-500">{(d.abandonmentRate * 100).toFixed(0)}%</span>
                                {prev && (abanTrend !== 0) && (
                                  <span className={cn('inline-flex items-center', abanTrend <= 0 ? 'text-emerald-500' : 'text-danger-500')}>
                                    {abanTrend <= 0 ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                                  </span>
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
            </div>
          </section>

          {/* ========= 模块 C: 推荐任务池（增强） ========= */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star size={20} className="text-gold-500" />
                <h2 className="font-serif text-lg font-bold text-zinc-900">推荐任务池</h2>
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700">
                  {recommendedList.length} 个精选
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedList.map((pred, i) => {
                const scores = calcFactorScores(pred)
                return (
                  <motion.div key={pred.taskId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="group rounded-xl border border-gold-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 font-serif text-sm font-semibold text-zinc-900 flex-1">{pred.taskTitle}</h3>
                      <DifficultyBadge level={pred.difficulty} />
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <div className="relative">
                        <HeatRingChart score={scores.predicted} />
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: scores.predicted >= 90 ? '#10B981' : scores.predicted >= 80 ? '#F59E0B' : '#EF4444' }}>
                          {scores.predicted}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold', heatBg(scores.predicted), heatColor(scores.predicted))}>
                            <TrendingUp size={12} className="mr-1" />热度 {scores.predicted}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-zinc-500">明日名额</span><span className="font-bold text-teal-600">{pred.predictedTomorrowSlots}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-500">供需比</span><span className="font-bold text-violet-600">{scores.ratio}x</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <FactorProgressBar score={scores.completionScore} color={FACTOR_CONFIG.completion.bar} label={`完成率 ${(pred.historicalCompletionRate * 100).toFixed(0)}%`} />
                      <p className="-mt-1.5 text-[10px] text-zinc-400 pl-1">历史完成稳定，交付可靠</p>
                      <FactorProgressBar score={scores.abandonScore} color={FACTOR_CONFIG.abandon.bar} label={`弃单控制 ${(1 - pred.abandonmentRate) * 100 | 0}分`} />
                      <p className="-mt-1.5 text-[10px] text-zinc-400 pl-1">弃单率极低，承诺兑现率高</p>
                      <FactorProgressBar score={scores.commissionScore} color={FACTOR_CONFIG.commission.bar} label={`佣金溢价 ${scores.commissionScore}分`} />
                      <p className="-mt-1.5 text-[10px] text-zinc-400 pl-1">高于同类均价，吸引优质接单者</p>
                      <FactorProgressBar score={scores.supplyScore} color={FACTOR_CONFIG.supply.bar} label={`供需比 ${scores.ratio}x`} />
                      <p className="-mt-1.5 text-[10px] text-zinc-400 pl-1">名额抢手，筛选空间充足</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                      <span className="text-lg font-bold text-primary-400">{formatPrice(pred.basePrice)}</span>
                      <button onClick={() => toggleRecommended(pred.taskId)}
                        className="flex items-center gap-1 rounded-lg bg-gold-100 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-200 transition-colors">
                        <Star size={12} fill="currentColor" /> 已推荐
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </section>

          {/* ========= 模块 D: 完整预测明细大改造 ========= */}
          <section className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-500" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">完整预测明细</h2>
            </div>

            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-zinc-500">
                      <th className="px-4 py-3 font-medium">排名</th>
                      <th className="px-4 py-3 font-medium">任务标题</th>
                      <th className="px-4 py-3 font-medium">完成率</th>
                      <th className="px-4 py-3 font-medium">弃单率</th>
                      <th className="px-4 py-3 font-medium">佣金吸引力</th>
                      <th className="px-4 py-3 font-medium">供需比</th>
                      <th className="px-4 py-3 font-medium">综合热度</th>
                      <th className="px-4 py-3 font-medium">明日名额</th>
                      <th className="px-4 py-3 font-medium text-right">推荐</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPredictions.map((pred, idx) => {
                      const scores = calcFactorScores(pred)
                      const rank = idx + 1
                      const isGold = rank <= 3
                      const completionColor = pred.historicalCompletionRate >= 0.85 ? 'text-emerald-600 bg-emerald-50'
                        : pred.historicalCompletionRate >= 0.7 ? 'text-amber-600 bg-amber-50'
                        : 'text-danger-600 bg-danger-50'
                      const abandonColor = pred.abandonmentRate <= 0.1 ? 'text-emerald-600 bg-emerald-50'
                        : pred.abandonmentRate <= 0.2 ? 'text-amber-600 bg-amber-50'
                        : 'text-danger-600 bg-danger-50'
                      const isRec = recommendedMap[pred.taskId]

                      return (
                        <tr key={pred.taskId} className={cn(
                          'border-b border-zinc-50 transition-colors hover:bg-zinc-50',
                          isGold && 'bg-gradient-to-r from-gold-50/80 via-gold-50/40 to-transparent'
                        )}>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs',
                              rank === 1 && 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-md',
                              rank === 2 && 'bg-gradient-to-br from-zinc-200 to-zinc-400 text-white shadow',
                              rank === 3 && 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow',
                              rank > 3 && 'bg-zinc-100 text-zinc-500'
                            )}>
                              {rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-900">{pred.taskTitle}</span>
                              <DifficultyBadge level={pred.difficulty} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', completionColor)}>
                              {(pred.historicalCompletionRate * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', abandonColor)}>
                              {(pred.abandonmentRate * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MiniBarChart score={scores.commissionScore} />
                              <span className="text-xs font-semibold text-amber-600">{scores.commissionScore}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                              scores.ratio >= 1.5 ? 'bg-violet-50 text-violet-600' :
                              scores.ratio >= 1 ? 'bg-sky-50 text-sky-600' :
                              'bg-zinc-100 text-zinc-500'
                            )}>
                              <Zap size={10} className="mr-0.5" />{scores.ratio}x
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <HeatRingChart score={scores.predicted} size={40} />
                              <div>
                                <div className={cn('text-lg font-bold leading-tight', heatColor(scores.predicted))}>
                                  {scores.predicted}
                                </div>
                                <div className="text-[10px] text-zinc-400">综合分</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-teal-600">{pred.predictedTomorrowSlots}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => toggleRecommended(pred.taskId)}
                              className={cn('inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                                isRec
                                  ? 'bg-gold-100 text-gold-700 hover:bg-gold-200'
                                  : 'border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50')}>
                              <Star size={12} fill={isRec ? 'currentColor' : 'none'} />
                              {isRec ? '移出推荐' : '加入推荐'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 模型效果指标 */}
            <div className="mt-5 grid grid-cols-4 gap-4">
              {[
                { label: '历史推荐准确率', value: '92.3%', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50', desc: '实际表现符合预测比例' },
                { label: '推荐任务平均完成率', value: '87.6%', icon: Target, color: 'text-sky-500 bg-sky-50', desc: '高于整体基准82.1%' },
                { label: '推荐任务平均弃单率', value: '6.2%', icon: Minus, color: 'text-danger-500 bg-danger-50', desc: '低于整体基准9.8%' },
                { label: '对比随机选择提升', value: '+23.4%', icon: TrendingUp, color: 'text-amber-500 bg-amber-50', desc: '模型价值量化体现' },
              ].map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={cn('rounded-lg p-2', m.color.split(' ')[1])}>
                      <m.icon size={18} className={m.color.split(' ')[0]} />
                    </span>
                    {i === m.label.length - 1 - 1 && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        <ArrowDownRight size={10} /> 优化
                      </span>
                    )}
                    {i === 0 || i === 3 ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        <ArrowUpRight size={10} /> 优秀
                      </span>
                    ) : null}
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">{m.value}</div>
                  <div className="mt-1 text-sm text-zinc-500">{m.label}</div>
                  <div className="mt-2 text-[11px] text-zinc-400">{m.desc}</div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
