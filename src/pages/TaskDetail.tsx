import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Users, CheckCircle2, Upload, Trophy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { currentWorker } from '@/data/users'
import { DIFFICULTY_CONFIG, ACCEPTANCE_PERIOD_LABEL } from '@/types'
import { formatPrice, formatDate, getCommissionMultiplier } from '@/utils'
import DifficultyBadge from '@/components/common/DifficultyBadge'

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const tasks = useStore((s) => s.tasks)
  const acceptedTaskIds = useStore((s) => s.acceptedTaskIds)
  const acceptTask = useStore((s) => s.acceptTask)
  const submitTask = useStore((s) => s.submitTask)
  const submissions = useStore((s) => s.submissions)

  const task = tasks.find((t) => t.id === taskId)
  const isAccepted = task ? acceptedTaskIds.includes(task.id) : false
  const workerSubmission = task
    ? submissions.find((s) => s.taskId === task.id && s.workerId === currentWorker.id)
    : undefined
  const isSubmitted = !!workerSubmission

  const [uploaded, setUploaded] = useState(false)

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="mb-4 text-zinc-400">任务不存在</p>
          <Link to="/tasks" className="text-primary-400 hover:underline">返回任务大厅</Link>
        </div>
      </div>
    )
  }

  const remainingSlots = task.totalSlots - task.takenSlots
  const diffConfig = DIFFICULTY_CONFIG[task.difficulty]
  const multiplier = getCommissionMultiplier(currentWorker.completedTasks)
  const commissionUnlocked = currentWorker.completedTasks >= 10
  const progressPercent = Math.min((currentWorker.completedTasks / 10) * 100, 100)

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/tasks" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-primary-400">
          <ArrowLeft size={16} />
          返回任务大厅
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h1 className="font-serif text-2xl font-bold text-zinc-900">{task.title}</h1>
              <DifficultyBadge level={task.difficulty} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
              <span>发布方：{task.employerName}</span>
              <span>发布于 {formatDate(task.createdAt)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: '佣金',
                value: formatPrice(task.currentPrice),
                sub: task.basePrice !== task.currentPrice ? `基础 ${formatPrice(task.basePrice)} + 加成` : undefined,
                color: 'text-primary-400',
              },
              { label: '验收时效', value: ACCEPTANCE_PERIOD_LABEL[task.acceptancePeriod], icon: Clock },
              {
                label: '剩余名额',
                value: `${remainingSlots}/${task.totalSlots}`,
                color: remainingSlots <= 2 ? 'text-danger-400' : 'text-teal-500',
                icon: Users,
              },
              { label: '难度等级', value: diffConfig.description, sub: diffConfig.label },
            ].map((card) => (
              <div key={card.label} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-1 text-xs text-zinc-400">{card.label}</div>
                <div className={cn('text-lg font-bold', card.color ?? 'text-zinc-900')}>
                  {card.value}
                </div>
                {card.sub && <div className="mt-0.5 text-xs text-zinc-400">{card.sub}</div>}
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">交付标准</h2>
            <div className="space-y-3">
              {task.deliveryStandards.map((std, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-400 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span className="text-sm text-zinc-700">{std}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-gold-500" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">佣金阶梯</h2>
            </div>
            <p className="mb-3 text-sm text-zinc-500">完成10单后单价上浮15%</p>
            <div className="mb-2 h-3 overflow-hidden rounded-full bg-zinc-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full', commissionUnlocked ? 'bg-gold-400' : 'bg-primary-400')}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>0单</span>
              <span>5单</span>
              <span>10单</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-zinc-500">当前加成：</span>
              {commissionUnlocked ? (
                <span className="rounded-full bg-gold-100 px-3 py-0.5 text-sm font-bold text-gold-700">+15% 已解锁</span>
              ) : (
                <span className="text-sm font-medium text-zinc-400">
                  {currentWorker.completedTasks}/10 单（{multiplier > 1 ? `+${Math.round((multiplier - 1) * 100)}%` : '无加成'}）
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            {!isAccepted && !isSubmitted && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => acceptTask(task.id)}
                className="w-full rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 py-4 text-lg font-bold text-white shadow-lg transition-shadow hover:shadow-xl"
              >
                立即接单
              </motion.button>
            )}

            {isAccepted && !isSubmitted && (
              <div className="space-y-4">
                <button
                  onClick={() => setUploaded(true)}
                  className={cn(
                    'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition-colors',
                    uploaded ? 'border-primary-400 bg-primary-50' : 'border-zinc-300 bg-zinc-50 hover:border-primary-300',
                  )}
                >
                  <Upload size={28} className={uploaded ? 'text-primary-400' : 'text-zinc-400'} />
                  <span className="mt-2 text-sm text-zinc-500">{uploaded ? '已选择文件' : '点击上传交付物'}</span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => submitTask(task.id)}
                  disabled={!uploaded}
                  className={cn(
                    'w-full rounded-xl py-4 text-lg font-bold transition-colors',
                    uploaded
                      ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-lg hover:shadow-xl'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed',
                  )}
                >
                  提交交付
                </motion.button>
              </div>
            )}

            {isSubmitted && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-6 text-amber-700">
                <AlertCircle size={20} />
                <span className="text-lg font-semibold">等待验收</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
