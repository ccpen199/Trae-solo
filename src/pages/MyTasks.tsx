import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, Wallet, RotateCcw, FileText, CheckCircle2, XCircle, Camera,
  ArrowRight, Clock, Upload, AlertCircle, ChevronRight, Landmark,
  ShieldCheck, TrendingUp, X, ListChecks
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAcceptanceDeadline, getAcceptanceTimeRemaining,
  formatPrice, formatDateTime, getCommissionMultiplier,
  getCommissionLevelLabel
} from '@/utils'
import { useStore } from '@/store'
import { currentWorker } from '@/data/users'
import { StatusBadge, DifficultyBadge } from '@/components/common'
import { DIFFICULTY_CONFIG, type Task } from '@/types'

type TabKey = 'signed_up' | 'in_progress' | 'under_review' | 'settled' | 'rejected'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'signed_up', label: '已报名' },
  { key: 'in_progress', label: '进行中' },
  { key: 'under_review', label: '验收中' },
  { key: 'settled', label: '已结算' },
  { key: 'rejected', label: '已驳回' },
]

export default function MyTasks() {
  const navigate = useNavigate()
  const submissions = useStore((s) => s.submissions)
  const acceptedTaskIds = useStore((s) => s.acceptedTaskIds)
  const tasks = useStore((s) => s.tasks)
  const submitTask = useStore((s) => s.submitTask)
  const [activeTab, setActiveTab] = useState<TabKey>('signed_up')

  const mySubmissions = useMemo(
    () => submissions.filter((s) => s.workerId === currentWorker.id),
    [submissions],
  )

  const acceptedTasks = useMemo(
    () => acceptedTaskIds
      .filter((id) => !mySubmissions.some((s) => s.taskId === id))
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean) as Task[],
    [acceptedTaskIds, mySubmissions, tasks],
  )

  const stats = useMemo(() => {
    const settledCount = mySubmissions.filter((s) => s.status === 'approved').length
    const totalEarnings = mySubmissions
      .filter((s) => s.status === 'approved')
      .reduce((sum, s) => sum + s.price, 0)
    const underReview = mySubmissions.filter((s) => s.status === 'submitted' || s.status === 'pending_review').length
    const rejectedCount = mySubmissions.filter((s) => s.status === 'rejected').length
    return {
      signedUp: acceptedTasks.length,
      inProgress: mySubmissions.filter((s) => s.status === 'submitted').length,
      underReview,
      settled: settledCount,
      rejected: rejectedCount,
      totalEarnings,
    }
  }, [acceptedTasks, mySubmissions])

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'signed_up':
        return acceptedTasks.map((t) => ({ type: 'task' as const, task: t }))
      case 'in_progress':
        return mySubmissions
          .filter((s) => s.status === 'submitted')
          .map((s) => ({ type: 'submission' as const, submission: s, showReview: false }))
      case 'under_review':
        return mySubmissions
          .filter((s) => s.status === 'pending_review' || s.status === 'submitted')
          .map((s) => ({ type: 'submission' as const, submission: s, showReview: true }))
      case 'settled':
        return mySubmissions
          .filter((s) => s.status === 'approved')
          .map((s) => ({ type: 'submission' as const, submission: s, showReview: false }))
      case 'rejected':
        return mySubmissions
          .filter((s) => s.status === 'rejected')
          .map((s) => ({ type: 'submission' as const, submission: s, showReview: false }))
    }
  }, [activeTab, mySubmissions, acceptedTasks])

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">我的任务</h1>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="已报名" value={stats.signedUp} color="text-sky-600" bg="bg-sky-50" icon={<ListChecks size={16} />} />
          <StatCard label="进行中" value={stats.inProgress} color="text-amber-600" bg="bg-amber-50" icon={<Clock size={16} />} />
          <StatCard label="已结算" value={stats.settled} color="text-emerald-600" bg="bg-emerald-50" icon={<CheckCircle2 size={16} />} />
          <StatCard label="累计收益" value={`¥${stats.totalEarnings.toFixed(0)}`} color="text-primary-600" bg="bg-primary-50" isPrice icon={<Wallet size={16} />} />
        </div>

        <div className="mb-6 flex border-b border-zinc-200 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tab.key === 'signed_up' ? stats.signedUp
              : tab.key === 'in_progress' ? stats.inProgress
              : tab.key === 'under_review' ? stats.underReview
              : tab.key === 'settled' ? stats.settled
              : stats.rejected
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative shrink-0 px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === tab.key ? 'text-primary-400' : 'text-zinc-400 hover:text-zinc-600',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold',
                    activeTab === tab.key ? 'bg-primary-400 text-white' : 'bg-zinc-200 text-zinc-500'
                  )}>{count}</span>
                )}
                {activeTab === tab.key && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
                )}
              </button>
            )
          })}
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>暂无任务</p>
            <button
              onClick={() => navigate('/tasks')}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary-400 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
            >
              去任务大厅看看 <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, i) => (
              <motion.div
                key={item.type === 'submission' ? item.submission.id : `task-${item.task.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm"
              >
                {item.type === 'submission' ? (
                  <SubmissionCard
                    submission={item.submission}
                    showCountdown={(item as { showReview?: boolean }).showReview}
                    tasks={tasks}
                    onSubmit={submitTask}
                  />
                ) : (
                  <AcceptedTaskCard task={item.task} onSubmit={submitTask} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, bg, isPrice, icon }: { label: string; value: number | string; color: string; bg: string; isPrice?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl p-3', bg)}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        {icon && <span className={cn('opacity-60', color)}>{icon}</span>}
      </div>
      <div className={cn('text-xl font-bold', color)}>{value}</div>
    </div>
  )
}

function CountdownRing({ deadline, size = 56 }: { deadline: string; size?: number }) {
  const { percent, text } = getAcceptanceTimeRemaining(deadline)
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const isLow = percent < 25

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={isLow ? '#f43f5e' : '#0ea5e9'}
          strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-[11px] font-semibold', isLow ? 'text-rose-500' : 'text-sky-600')}>{text}</span>
      </div>
    </div>
  )
}

function UploadZone({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/30 p-5 text-center">
      <Upload size={28} className="mx-auto mb-2 text-primary-400" />
      <div className="text-sm font-medium text-zinc-700">上传交付截图证明</div>
      <div className="mt-1 text-xs text-zinc-500">支持 PNG/JPG，可多张上传</div>
      <button
        onClick={onUpload}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary-400 to-primary-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md"
      >
        <Camera size={14} /> 选择截图并提交
      </button>
    </div>
  )
}

function ProofModal({ isOpen, onClose, taskTitle, attachments }: { isOpen: boolean; onClose: () => void; taskTitle: string; attachments?: string[] }) {
  const files = attachments ?? ['screenshot_confirm.png']
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-zinc-900">交付证明详情</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
            </div>
            <div className="mb-3 text-sm text-zinc-600">{taskTitle}</div>
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Camera size={18} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-900">{f}</div>
                    <div className="text-xs text-zinc-500">已上传 · {(Math.random() * 3 + 0.5).toFixed(1)} MB</div>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="mt-5 w-full rounded-lg bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600">
              关闭
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SubmissionCard({
  submission,
  showCountdown,
  tasks,
  onSubmit,
}: {
  submission: ReturnType<typeof useStore.getState>['submissions'][0]
  showCountdown?: boolean
  tasks: Task[]
  onSubmit: (taskId: string) => void
}) {
  const [showProof, setShowProof] = useState(false)
  const task = tasks.find((t) => t.id === submission.taskId)
  const acceptancePeriod = task?.acceptancePeriod ?? '24h'
  const acceptanceDeadline = getAcceptanceDeadline(submission.submittedAt, acceptancePeriod)
  const showCommissionBadge = currentWorker.completedTasks >= 10
  const isApproved = submission.status === 'approved'
  const isRejected = submission.status === 'rejected'
  const isSubmitted = submission.status === 'submitted'
  const isPendingReview = submission.status === 'pending_review'
  const multiplier = getCommissionMultiplier(currentWorker.completedTasks)
  const actualBonus = Math.round((multiplier - 1) * 100)

  const getSettlementBadge = () => {
    if (isApproved) return { label: '已到账', class: 'bg-emerald-100 text-emerald-700', icon: <Landmark size={12} /> }
    if (isRejected) return { label: '被驳回', class: 'bg-rose-100 text-rose-700', icon: <XCircle size={12} /> }
    return { label: '待结算', class: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> }
  }
  const settlementBadge = getSettlementBadge()

  return (
    <div>
      <ProofModal isOpen={showProof} onClose={() => setShowProof(false)} taskTitle={submission.taskTitle} attachments={submission.attachments} />

      <div className="mb-3 flex items-start gap-4">
        {(showCountdown || isSubmitted || isPendingReview) && !isApproved && !isRejected && (
          <CountdownRing deadline={acceptanceDeadline} />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <Link to={`/tasks/${submission.taskId}`}
              className="line-clamp-1 font-serif text-base font-semibold text-zinc-900 hover:text-primary-400">
              {submission.taskTitle}
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium', settlementBadge.class)}>
                {settlementBadge.icon} {settlementBadge.label}
              </span>
              <StatusBadge status={submission.status} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-bold text-primary-400">{formatPrice(submission.price)}</span>
            {showCommissionBadge && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                含+{actualBonus}%上浮
              </span>
            )}
          </div>
        </div>
      </div>

      {task && (
        <div className="mb-3 rounded-lg bg-zinc-50 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <DifficultyBadge level={task.difficulty} />
            <span className="text-[11px] text-zinc-400">验收{
              task.acceptancePeriod === '24h' ? '24小时' :
              task.acceptancePeriod === '72h' ? '72小时' : '7天'
            }</span>
          </div>
          <div className="text-xs text-zinc-600 line-clamp-1">
            交付标准：{task.deliveryStandards[0]}
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span>提交于 {formatDateTime(submission.submittedAt)}</span>
        {isApproved && submission.reviewedAt && (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 size={12} /> 到账时间：{formatDateTime(submission.reviewedAt)}
          </span>
        )}
      </div>

      {isApproved && (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 text-sm">
            <CheckCircle2 size={16} /> 结算已完成
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">任务佣金</span><span className="font-medium text-zinc-900">{formatPrice(submission.price)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">佣金上浮</span><span className="font-medium text-amber-600">+{actualBonus}%</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">实际到账</span><span className="font-bold text-emerald-700">{formatPrice(submission.price)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">到账账户</span><span className="font-medium text-zinc-700">工行****6789</span></div>
          </div>
        </div>
      )}

      {submission.reviewNotes && (
        <div className={cn(
          'mb-3 rounded-lg px-3 py-2.5 text-sm',
          isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-zinc-50 text-zinc-600',
        )}>
          {isRejected ? (
            <>
              <div className="mb-1 flex items-center gap-1 font-semibold">
                <AlertCircle size={14} /> 驳回原因
              </div>
              {submission.reviewNotes}
              <button className="ml-2 inline-flex items-center gap-0.5 rounded border border-rose-300 px-2 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-100">
                <RotateCcw size={10} /> 修正后重新提交
              </button>
            </>
          ) : (
            <><span className="font-medium">审核备注：</span>{submission.reviewNotes}</>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(isSubmitted || isPendingReview) && (
          <button onClick={() => setShowProof(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-100">
            <Camera size={12} /> 查看交付截图
          </button>
        )}
        {isSubmitted && (
          <Link to={`/tasks/${submission.taskId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200">
            <Eye size={12} /> 查看详情
          </Link>
        )}
        {isApproved && (
          <>
            <button onClick={() => setShowProof(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-100">
              <Camera size={12} /> 查看交付截图
            </button>
            <Link to="/profile"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100">
              <Wallet size={12} /> 查看提现
            </Link>
          </>
        )}
        {isRejected && (
          <button onClick={() => onSubmit(submission.taskId)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-100">
            <RotateCcw size={12} /> 修正后重新提交
          </button>
        )}
      </div>
    </div>
  )
}

function AcceptedTaskCard({ task, onSubmit }: { task: Task; onSubmit: (taskId: string) => void }) {
  const navigate = useNavigate()
  const [uploaded, setUploaded] = useState(false)
  const showCommissionBadge = currentWorker.completedTasks >= 10
  const multiplier = getCommissionMultiplier(currentWorker.completedTasks)
  const actualBonus = Math.round((multiplier - 1) * 100)
  const estimatedPrice = +(task.currentPrice * multiplier).toFixed(2)
  const diffConfig = DIFFICULTY_CONFIG[task.difficulty]
  const acceptanceLabel = task.acceptancePeriod === '24h' ? '24小时' : task.acceptancePeriod === '72h' ? '72小时' : '7天'

  const handleUpload = () => {
    setUploaded(true)
    setTimeout(() => {
      onSubmit(task.id)
    }, 800)
  }

  return (
    <div>
      <div className="mb-3 flex items-start gap-4">
        <CountdownRing deadline={task.deadline} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <Link to={`/tasks/${task.id}`}
              className="line-clamp-1 font-serif text-base font-semibold text-zinc-900 hover:text-primary-400">
              {task.title}
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                待完成
              </span>
              <DifficultyBadge level={task.difficulty} />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="font-bold text-primary-400">{formatPrice(task.currentPrice)}</span>
            {showCommissionBadge && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                含+{actualBonus}%上浮 = {formatPrice(estimatedPrice)}
              </span>
            )}
            <span className="flex items-center gap-0.5"><Clock size={11} /> 验收{acceptanceLabel}</span>
          </div>
        </div>
      </div>

      <div className="mb-3 rounded-lg bg-zinc-50 p-3">
        <div className="mb-1 text-[11px] font-semibold text-zinc-700">交付标准</div>
        <ol className="space-y-1">
          {task.deliveryStandards.slice(0, 3).map((s, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-600">
              <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                diffConfig.color.replace('text-', 'bg-').replace('500', '100')
              )}>
                <span className={diffConfig.color}>{i + 1}</span>
              </span>
              {s}
            </li>
          ))}
          {task.deliveryStandards.length > 3 && (
            <li className="text-xs text-zinc-400 pl-5">…另有 {task.deliveryStandards.length - 3} 条标准</li>
          )}
        </ol>
      </div>

      <div className="mb-3 text-xs text-zinc-500">
        任务截止：{formatDateTime(task.deadline)} · 剩余{task.totalSlots - task.takenSlots}名
      </div>

      {!uploaded ? (
        <UploadZone onUpload={handleUpload} />
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          <div className="animate-spin h-4 w-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full" />
          截图已上传，正在提交交付证明…
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/tasks/${task.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200">
          <Eye size={12} /> 查看任务详情
        </Link>
      </div>
    </div>
  )
}
