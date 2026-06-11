import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import { useStore } from '@/store'
import { formatPrice } from '@/utils'
import AdminSidebar from '@/components/common/AdminSidebar'
import DifficultyBadge from '@/components/common/DifficultyBadge'
import StatusBadge from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'

const RISK_TAGS: Record<string, string[]> = {
  T004: ['低名额高佣金'],
  T015: ['佣金异常高'],
  T021: ['刷单返利疑似'],
  T022: ['涉嫌传销拉新', '非法集资风险'],
}

export default function Admin() {
  const { tasks, approveCompliance, rejectCompliance } = useStore()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const pendingTasks = tasks.filter((t) => t.complianceStatus === 'pending')
  const reviewedTasks = tasks.filter((t) => t.complianceStatus !== 'pending').slice(0, 5)
  const approvedCount = tasks.filter((t) => t.complianceStatus === 'approved').length
  const rejectedCount = tasks.filter((t) => t.complianceStatus === 'rejected').length
  const todayReviewed = 3
  const passRate = approvedCount + rejectedCount > 0 ? Math.round((approvedCount / (approvedCount + rejectedCount)) * 100) : 0

  const handleReject = (taskId: string) => {
    if (rejectReason.trim()) {
      rejectCompliance(taskId, rejectReason)
      setRejectingId(null)
      setRejectReason('')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar />
      <div className="pl-56">
        <div className="px-6 py-8">
          <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">合规审核</h1>

          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: '待审核任务', value: pendingTasks.length, icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
              { label: '今日已审核', value: todayReviewed, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
              { label: '通过率', value: `${passRate}%`, icon: TrendingUp, color: 'text-primary-400 bg-primary-50' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
                <span className={cn('rounded-lg p-2.5', s.color.split(' ')[1])}>
                  <s.icon size={20} className={s.color.split(' ')[0]} />
                </span>
                <div>
                  <div className="text-2xl font-bold text-zinc-900">{s.value}</div>
                  <div className="text-sm text-zinc-500">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">审核队列</h2>
            {pendingTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">暂无待审核任务</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-zinc-500">
                      <th className="pb-3 font-medium">任务ID</th>
                      <th className="pb-3 font-medium">任务标题</th>
                      <th className="pb-3 font-medium">雇主</th>
                      <th className="pb-3 font-medium">难度</th>
                      <th className="pb-3 font-medium">佣金</th>
                      <th className="pb-3 font-medium">风险标签</th>
                      <th className="pb-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingTasks.map((task) => (
                      <tr key={task.id} className="border-b border-zinc-50">
                        <td className="py-3 font-mono text-xs text-zinc-500">{task.id}</td>
                        <td className="py-3 font-medium text-zinc-900">{task.title}</td>
                        <td className="py-3 text-zinc-600">{task.employerName}</td>
                        <td className="py-3"><DifficultyBadge level={task.difficulty} /></td>
                        <td className="py-3 font-medium text-primary-400">{formatPrice(task.basePrice)}</td>
                        <td className="py-3">
                          {(RISK_TAGS[task.id] ?? []).map((tag) => (
                            <span key={tag} className="mr-1 inline-flex items-center rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-500">
                              <AlertTriangle size={10} className="mr-1" />{tag}
                            </span>
                          ))}
                        </td>
                        <td className="py-3 text-right">
                          {rejectingId === task.id ? (
                            <div className="flex flex-col items-end gap-2">
                              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} className="w-48 rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-danger-400 focus:outline-none" placeholder="驳回原因" />
                              <div className="flex gap-2">
                                <button onClick={() => setRejectingId(null)} className="rounded px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50">取消</button>
                                <button onClick={() => handleReject(task.id)} className="rounded bg-danger-400 px-3 py-1 text-xs text-white hover:bg-danger-500">确认驳回</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => approveCompliance(task.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100">通过</button>
                              <button onClick={() => setRejectingId(task.id)} className="rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-100">驳回</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">已审核记录</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="pb-3 font-medium">任务ID</th>
                    <th className="pb-3 font-medium">任务标题</th>
                    <th className="pb-3 font-medium">雇主</th>
                    <th className="pb-3 font-medium">难度</th>
                    <th className="pb-3 font-medium">佣金</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedTasks.map((task) => (
                    <tr key={task.id} className="border-b border-zinc-50">
                      <td className="py-3 font-mono text-xs text-zinc-500">{task.id}</td>
                      <td className="py-3 font-medium text-zinc-900">{task.title}</td>
                      <td className="py-3 text-zinc-600">{task.employerName}</td>
                      <td className="py-3"><DifficultyBadge level={task.difficulty} /></td>
                      <td className="py-3 font-medium text-primary-400">{formatPrice(task.basePrice)}</td>
                      <td className="py-3"><StatusBadge status={task.complianceStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
