import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, TrendingUp, CheckCircle2, ShieldCheck, ChevronRight, Banknote,
  Camera, AlertCircle, History, DollarSign, X, Clock, Eye, RotateCcw,
  ArrowRight, Landmark, UserCheck, Building2, XCircle, FileCheck, Search
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { currentWorker } from '@/data/users'
import { submissions, withdrawalRecords } from '@/data/submissions'
import { formatPrice, formatDate, formatDateTime } from '@/utils'
import { DifficultyBadge, StatusBadge } from '@/components/common'
import { tasks } from '@/data/tasks'
import type { DifficultyLevel } from '@/types'

const MILESTONES = [
  { count: 0, label: '新手', bonus: '+0%', desc: '0单：基础佣金' },
  { count: 5, label: '5单', bonus: '+8%', desc: '5单：所有任务佣金上浮8%' },
  { count: 10, label: '10单', bonus: '+15%', desc: '10单：所有任务佣金上浮15%' },
  { count: 20, label: '20单', bonus: '+20%', desc: '20单：所有任务佣金上浮20%' },
  { count: 50, label: '50单', bonus: '+30%', desc: '50单：所有任务佣金上浮30%' },
]

const DAILY_LIMIT = 5000

function getLocalMultiplier(completedTasks: number): number {
  if (completedTasks >= 50) return 1.30
  if (completedTasks >= 20) return 1.20
  if (completedTasks >= 10) return 1.15
  if (completedTasks >= 5) return 1.08
  return 1.0
}

function getCommissionLevelLabelLocal(level: number): string {
  const labels = ['新手接单者', '初级接单者', '中级接单者', '高级接单者', '金牌接单者']
  return labels[Math.min(level, labels.length - 1)]
}

const earnings14d = Array.from({ length: 14 }, (_, i) => {
  const d = new Date('2026-06-11')
  d.setDate(d.getDate() - (13 - i))
  const amounts = [45, 88, 120, 65, 180, 95, 210, 35, 156, 78, 142, 205, 89, 128]
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    amount: amounts[i],
  }
})

interface WithdrawalDetail {
  id: string
  amount: number
  status: 'submitted' | 'auto_processing' | 'manual_review' | 'review_passed' | 'completed' | 'rejected'
  submittedAt: string
  step1At?: string
  step2At?: string
  step3At?: string
  step4At?: string
  rejectReason?: string
  bankName: string
  bankCardTail: string
  actualArrival?: string
  reviewBy?: string
  exceedLimit: boolean
}

const MOCK_WITHDRAWAL_DETAILS: WithdrawalDetail[] = [
  {
    id: 'WD-MOCK-01', amount: 5500, status: 'manual_review',
    submittedAt: '2026-06-11T08:15:00Z',
    step1At: '2026-06-11T08:15:30Z',
    bankName: '中国工商银行', bankCardTail: '6789',
    exceedLimit: true,
  },
  {
    id: 'WD01', amount: 500, status: 'completed',
    submittedAt: '2026-06-05T10:00:00Z',
    step1At: '2026-06-05T10:00:30Z',
    step2At: '2026-06-05T10:02:00Z',
    step3At: '2026-06-05T10:05:00Z',
    step4At: '2026-06-05T12:30:00Z',
    bankName: '中国工商银行', bankCardTail: '6789',
    actualArrival: '2026-06-05T12:30:00Z',
    exceedLimit: false,
  },
  {
    id: 'WD-MOCK-02', amount: 6800, status: 'rejected',
    submittedAt: '2026-05-15T09:00:00Z',
    step1At: '2026-05-15T09:00:30Z',
    step2At: '2026-05-15T14:00:00Z',
    rejectReason: '账户与实名信息不符，请核实银行卡开户人信息后重新提交',
    reviewBy: '风控审核员 李主管',
    bankName: '中国工商银行', bankCardTail: '6789',
    exceedLimit: true,
  },
  {
    id: 'WD02', amount: 1000, status: 'completed',
    submittedAt: '2026-05-28T14:00:00Z',
    step1At: '2026-05-28T14:00:30Z',
    step2At: '2026-05-28T14:01:30Z',
    step3At: '2026-05-28T14:05:00Z',
    step4At: '2026-05-28T16:45:00Z',
    bankName: '中国工商银行', bankCardTail: '6789',
    actualArrival: '2026-05-28T16:45:00Z',
    exceedLimit: false,
  },
  {
    id: 'WD-MOCK-03', amount: 5200, status: 'review_passed',
    submittedAt: '2026-06-10T18:00:00Z',
    step1At: '2026-06-10T18:00:30Z',
    step2At: '2026-06-10T18:02:00Z',
    step3At: '2026-06-11T09:30:00Z',
    reviewBy: '风控审核员 王专员',
    bankName: '中国工商银行', bankCardTail: '6789',
    exceedLimit: true,
  },
  {
    id: 'WD03', amount: 500, status: 'completed',
    submittedAt: '2026-05-20T09:00:00Z',
    step1At: '2026-05-20T09:00:30Z',
    step2At: '2026-05-20T09:01:00Z',
    step3At: '2026-05-20T09:04:00Z',
    step4At: '2026-05-20T11:15:00Z',
    bankName: '中国工商银行', bankCardTail: '6789',
    actualArrival: '2026-05-20T11:15:00Z',
    exceedLimit: false,
  },
]

const WITHDRAW_STEPS = [
  { key: 'submitted', label: '提交申请', icon: <CheckCircle2 size={14} /> },
  { key: 'auto_processing', label: '系统校验', icon: <Landmark size={14} /> },
  { key: 'review_passed', label: '人工复核', icon: <UserCheck size={14} />, manualKey: 'manual_review' },
  { key: 'completed', label: '到账完成', icon: <Wallet size={14} /> },
]

function getStepIndex(status: string): number {
  switch (status) {
    case 'submitted': return 0
    case 'auto_processing': return 1
    case 'manual_review': return 2
    case 'review_passed': return 2
    case 'completed': return 3
    case 'rejected': return -1
    default: return 0
  }
}

function StatCard({ label, value, icon: Icon, delay }: { label: string; value: string; icon: typeof Wallet; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
        <Icon size={16} />
        {label}
      </div>
      <div className="text-2xl font-bold text-zinc-900">{value}</div>
    </motion.div>
  )
}

function getDifficultyForTask(taskId: string): DifficultyLevel {
  const task = tasks.find((t) => t.id === taskId)
  return (task?.difficulty ?? 'L1') as DifficultyLevel
}

const workerWithdrawals = withdrawalRecords.filter((w) => w.workerId === currentWorker.id)
const approvedSubmissions = submissions.filter((s) => s.workerId === currentWorker.id && s.status === 'approved')
const recentSubmissions = submissions.filter((s) => s.workerId === currentWorker.id)

export default function Profile() {
  const multiplier = getLocalMultiplier(currentWorker.completedTasks)
  const currentBonus = Math.round((multiplier - 1) * 100)

  const activeMilestoneIdx = MILESTONES.reduce((acc, m, i) => {
    if (currentWorker.completedTasks >= m.count) return i
    return acc
  }, 0)

  const nextMilestone = MILESTONES[activeMilestoneIdx + 1]
  const progressToNext = nextMilestone
    ? (currentWorker.completedTasks - MILESTONES[activeMilestoneIdx].count) /
      (nextMilestone.count - MILESTONES[activeMilestoneIdx].count)
    : 1

  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<WithdrawalDetail | null>(null)
  const [myWithdrawals, setMyWithdrawals] = useState<WithdrawalDetail[]>(MOCK_WITHDRAWAL_DETAILS)

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0) return
    if (amt > currentWorker.withdrawableBalance) return
    const now = new Date().toISOString()
    const exceedLimit = amt > DAILY_LIMIT
    const newWD: WithdrawalDetail = {
      id: `WD-${Date.now()}`,
      amount: amt,
      status: exceedLimit ? 'manual_review' : 'auto_processing',
      submittedAt: now,
      step1At: now,
      step2At: exceedLimit ? undefined : now,
      bankName: '中国工商银行',
      bankCardTail: '6789',
      exceedLimit,
    }
    setMyWithdrawals((prev) => [newWD, ...prev])
    setWithdrawAmount('')
    if (exceedLimit) {
      setShowLimitModal(true)
    } else {
      setShowSuccessModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600">
            {currentWorker.name[0]}
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-zinc-900">{currentWorker.name}</h1>
            <p className="text-sm text-zinc-500">{getCommissionLevelLabelLocal(currentWorker.commissionLevel)}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="累计收益" value={formatPrice(currentWorker.totalEarnings)} icon={TrendingUp} delay={0} />
          <StatCard label="本月收益" value="¥1,256.00" icon={TrendingUp} delay={0.08} />
          <StatCard label="可提现余额" value={formatPrice(currentWorker.withdrawableBalance)} icon={Wallet} delay={0.16} />
          <StatCard label="已完成任务" value={`${currentWorker.completedTasks}单`} icon={CheckCircle2} delay={0.24} />
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-serif text-lg font-bold text-zinc-900">佣金阶梯详情</h2>

          <div className="relative mb-8">
            <div className="absolute left-0 right-0 top-5 h-1 bg-zinc-200" style={{ marginLeft: '8%', marginRight: '8%' }} />
            <div
              className="absolute left-0 top-5 h-1 bg-gradient-to-r from-primary-400 to-gold-400"
              style={{
                marginLeft: '8%',
                width: `${(activeMilestoneIdx / (MILESTONES.length - 1)) * 84 + progressToNext * (84 / (MILESTONES.length - 1))}%`,
              }}
            />
            <div className="relative flex justify-between">
              {MILESTONES.map((m, i) => {
                const isCompleted = i < activeMilestoneIdx
                const isCurrent = i === activeMilestoneIdx
                const isNext = i === activeMilestoneIdx + 1
                return (
                  <div key={m.count} className="flex w-1/5 flex-col items-center">
                    <div
                      className={cn(
                        'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-3 text-sm font-bold transition-all',
                        isCompleted || isCurrent
                          ? 'border-gold-400 bg-gold-400 text-white shadow-md shadow-gold-200'
                          : isNext
                          ? 'border-gold-300 bg-white text-gold-500'
                          : 'border-zinc-300 bg-white text-zinc-400'
                      )}
                      style={{ opacity: isNext ? 0.6 : 1 }}
                    >
                      {isCompleted ? <CheckCircle2 size={20} /> : m.count === 0 ? '0' : m.count}
                    </div>
                    <div className="mt-3 text-center">
                      <div className={cn(
                        'text-sm font-semibold',
                        isCompleted || isCurrent ? 'text-zinc-900' : 'text-zinc-400'
                      )}>
                        {m.label}
                      </div>
                      <div className={cn(
                        'mt-0.5 text-xs font-bold',
                        isCompleted || isCurrent ? 'text-gold-600' : isNext ? 'text-gold-400 opacity-60' : 'text-zinc-400'
                      )}>
                        {m.bonus}
                      </div>
                    </div>
                    <div className={cn(
                      'mt-2 max-w-[120px] text-xs leading-relaxed',
                      isCompleted || isCurrent ? 'text-zinc-500' : 'text-zinc-400'
                    )}>
                      {m.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4">
            <span className="text-sm text-zinc-500">
              已完成 <span className="font-bold text-zinc-900">{currentWorker.completedTasks}</span> 单
            </span>
            <span className="rounded-full bg-gold-100 px-4 py-1.5 text-sm font-bold text-gold-700">
              当前加成：+{currentBonus}%
            </span>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-zinc-900">
              <History size={18} className="mr-2 inline text-primary-400" />
              近14天收益
            </h2>
            <span className="text-xs text-zinc-400">单位：元</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earnings14d} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  formatter={(v: number) => [`¥${v.toFixed(2)}`, '收益']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {earnings14d.map((_, idx) => (
                    <Cell key={idx} fill={idx === earnings14d.length - 1 ? '#fbbf24' : 'url(#grad)'} />
                  ))}
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">
            <DollarSign size={18} className="mr-2 inline text-emerald-500" />
            任务结算流水
          </h2>
          {approvedSubmissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">暂无结算记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="pb-3 font-medium">任务标题</th>
                    <th className="pb-3 font-medium">难度</th>
                    <th className="pb-3 font-medium">基础佣金</th>
                    <th className="pb-3 font-medium">实际收入</th>
                    <th className="pb-3 font-medium">提交时间</th>
                    <th className="pb-3 font-medium">结算时间</th>
                    <th className="pb-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedSubmissions.map((sub) => {
                    const actualIncome = sub.price * multiplier
                    return (
                      <tr key={sub.id} className="border-b border-zinc-50">
                        <td className="py-3 font-medium text-zinc-900">{sub.taskTitle}</td>
                        <td className="py-3"><DifficultyBadge level={getDifficultyForTask(sub.taskId)} /></td>
                        <td className="py-3 text-zinc-600">{formatPrice(sub.price)}</td>
                        <td className="py-3">
                          <span className="font-bold text-emerald-600">{formatPrice(actualIncome)}</span>
                          {currentBonus > 0 && (
                            <span className="ml-1 text-xs text-gold-600">(+{currentBonus}%)</span>
                          )}
                        </td>
                        <td className="py-3 text-zinc-500">{formatDateTime(sub.submittedAt)}</td>
                        <td className="py-3 text-zinc-500">{sub.reviewedAt ? formatDateTime(sub.reviewedAt) : '-'}</td>
                        <td className="py-3"><span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">已到账</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">
            <Camera size={18} className="mr-2 inline text-sky-500" />
            交付截图记录
          </h2>
          {recentSubmissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">暂无提交记录</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentSubmissions.map((sub) => (
                <div key={sub.id} className="flex gap-3 rounded-xl border border-zinc-100 p-3 transition-colors hover:border-zinc-200">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200">
                    <Camera size={24} className="text-zinc-400" />
                    {sub.attachments.length > 1 && (
                      <span className="absolute right-1 top-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {sub.attachments.length}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-zinc-900">{sub.taskTitle}</div>
                    <div className="mt-1 text-xs text-zinc-400">{formatDateTime(sub.submittedAt)}</div>
                    <div className="mt-2"><StatusBadge status={sub.status} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-zinc-900">
              <Wallet size={18} className="mr-2 inline text-primary-400" />
              提现管理
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Building2 size={14} />
              中国工商银行 **** 6789
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-gold-50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-500">可提现余额</div>
                <div className="text-3xl font-bold text-zinc-900">{formatPrice(currentWorker.withdrawableBalance)}</div>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-zinc-400">今日已提现：{formatPrice(currentWorker.dailyWithdrawn)} / {formatPrice(DAILY_LIMIT)}</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="输入提现金额"
                      className="w-44 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    />
                    <button
                      onClick={() => setWithdrawAmount(String(currentWorker.withdrawableBalance))}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-50"
                    >
                      全部
                    </button>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleWithdraw}
                  className="rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Banknote size={16} className="mr-1 inline" />
                  申请提现
                </motion.button>
              </div>
            </div>

            <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">单日提现上限 ¥{DAILY_LIMIT.toLocaleString()}</span>；
                ≤{DAILY_LIMIT.toLocaleString()}元：系统自动处理，预计<span className="font-semibold">2小时内</span>到账；
                超限额：进入<span className="font-semibold">人工复核</span>，预计1-2工作日到账
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="rounded-lg bg-white p-3 text-center">
                <div className="mb-1 text-xs text-zinc-400">本月已提现</div>
                <div className="text-base font-bold text-zinc-900">¥3,500.00</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center">
                <div className="mb-1 text-xs text-zinc-400">累计提现次数</div>
                <div className="text-base font-bold text-zinc-900">8 次</div>
              </div>
              <div className="rounded-lg bg-white p-3 text-center">
                <div className="mb-1 text-xs text-zinc-400">平均到账时长</div>
                <div className="text-base font-bold text-emerald-600">1.8 小时</div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-700">提现进度追踪</h3>
              <span className="text-xs text-zinc-400">共 {myWithdrawals.length} 条记录</span>
            </div>
            <div className="space-y-3">
              {myWithdrawals.map((wd) => {
                const stepIdx = getStepIndex(wd.status)
                const isRejected = wd.status === 'rejected'
                return (
                  <div key={wd.id} className={cn(
                    'rounded-xl border p-4 transition-colors',
                    isRejected ? 'border-danger-200 bg-danger-50/50' :
                    wd.status === 'manual_review' ? 'border-amber-200 bg-amber-50/50' :
                    wd.status === 'completed' ? 'border-emerald-200 bg-emerald-50/30' :
                    'border-zinc-200 bg-zinc-50/50'
                  )}>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          wd.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                          isRejected ? 'bg-danger-100 text-danger-500' :
                          wd.status === 'manual_review' ? 'bg-amber-100 text-amber-600' :
                          'bg-sky-100 text-sky-600'
                        )}>
                          {isRejected ? <XCircle size={18} /> :
                           wd.status === 'completed' ? <CheckCircle2 size={18} /> :
                           wd.status === 'manual_review' ? <UserCheck size={18} /> :
                           <Clock size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-zinc-900">{formatPrice(wd.amount)}</span>
                            {wd.exceedLimit && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                超5000元·人工复核
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500">
                            {formatDateTime(wd.submittedAt)} · {wd.bankName} ****{wd.bankCardTail}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium',
                          wd.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          isRejected ? 'bg-danger-100 text-danger-700' :
                          wd.status === 'manual_review' ? 'bg-amber-100 text-amber-700' :
                          wd.status === 'review_passed' ? 'bg-sky-100 text-sky-700' :
                          'bg-zinc-100 text-zinc-600'
                        )}>
                          {wd.status === 'completed' ? '已到账' :
                           isRejected ? '已驳回' :
                           wd.status === 'manual_review' ? '复核中' :
                           wd.status === 'review_passed' ? '复核通过·到账中' :
                           wd.status === 'auto_processing' ? '处理中' : '已提交'}
                        </span>
                        <button
                          onClick={() => setShowDetailModal(wd)}
                          className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                        >
                          <Eye size={12} /> 详情
                        </button>
                      </div>
                    </div>

                    {isRejected && wd.rejectReason && (
                      <div className="mb-3 rounded-lg bg-white p-3 text-xs text-danger-700 border border-danger-200">
                        <div className="mb-1 flex items-center gap-1 font-semibold">
                          <AlertCircle size={12} /> 驳回原因
                          {wd.reviewBy && <span className="ml-2 text-zinc-400 font-normal">· {wd.reviewBy}</span>}
                        </div>
                        {wd.rejectReason}
                        <button className="ml-2 inline-flex items-center gap-0.5 rounded border border-danger-300 px-2 py-0.5 text-[11px] font-medium hover:bg-danger-50">
                          <RotateCcw size={10} /> 修正后重试
                        </button>
                      </div>
                    )}

                    <div className="relative mt-2">
                      <div className="absolute left-4 right-4 top-4 h-0.5 bg-zinc-200" />
                      <div
                        className={cn('absolute left-4 top-4 h-0.5',
                          isRejected ? 'bg-danger-300 w-1/4' :
                          `bg-gradient-to-r from-primary-400 to-emerald-400`
                        )}
                        style={{ width: isRejected ? '50%' : `${((stepIdx + 1) / WITHDRAW_STEPS.length) * 100}%` }}
                      />
                      <div className="relative flex justify-between">
                        {WITHDRAW_STEPS.map((step, i) => {
                          const isManual = wd.exceedLimit && i === 2
                          const active = isRejected ? (i <= 1) : (i <= stepIdx)
                          const current = isRejected ? (i === 1) : (i === stepIdx)
                          return (
                            <div key={step.key} className="flex w-1/4 flex-col items-center">
                              <div className={cn(
                                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                                current ? (isRejected ? 'border-danger-400 bg-danger-500 text-white shadow-md shadow-danger-200'
                                                  : 'border-primary-400 bg-primary-500 text-white shadow-md shadow-primary-200') :
                                active ? 'border-emerald-400 bg-emerald-500 text-white' :
                                'border-zinc-200 bg-white text-zinc-300',
                                isManual && current ? 'animate-pulse' : ''
                              )}>
                                {isRejected && current ? <XCircle size={14} /> :
                                 active ? <CheckCircle2 size={14} /> : step.icon}
                              </div>
                              <div className={cn(
                                'mt-1.5 text-[11px] font-medium',
                                active && !isRejected ? 'text-zinc-900' :
                                current && isRejected ? 'text-danger-600' :
                                current ? 'text-primary-600' : 'text-zinc-400'
                              )}>
                                {isManual && wd.status === 'manual_review' ? '人工复核中…' : step.label}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">身份认证</h2>
          {currentWorker.realNameVerified ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>
              <div>
                <div className="font-medium text-zinc-900">已认证</div>
                <div className="text-sm text-zinc-500">{currentWorker.phone}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100">
                  <ShieldCheck size={20} className="text-zinc-400" />
                </div>
                <div>
                  <div className="font-medium text-zinc-900">未认证</div>
                  <div className="text-sm text-zinc-500">完成实名认证后可提现</div>
                </div>
              </div>
              <button className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100">
                去认证 <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowLimitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle size={22} className="text-amber-600" />
                </div>
                <button onClick={() => setShowLimitModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <h3 className="mb-2 font-serif text-lg font-bold text-zinc-900">超过单日提现限额</h3>
              <p className="mb-4 text-sm text-zinc-600">
                您本次提现金额已超过单日 ¥{DAILY_LIMIT.toLocaleString()} 限额，需进入人工复核流程，预计 <span className="font-semibold text-zinc-900">1-2 个工作日</span>内到账，请耐心等待。
              </p>
              <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                <div className="font-semibold">复核说明</div>
                <ul className="mt-1 list-disc pl-5 text-xs">
                  <li>大额提现需风控部门人工审核</li>
                  <li>审核通过后资金将转出至您绑定的银行卡</li>
                  <li>如有疑问请联系客服</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  取消
                </button>
                <button
                  onClick={() => { setShowLimitModal(false); setWithdrawAmount(''); }}
                  className="flex-1 rounded-lg bg-primary-400 py-2.5 text-sm font-semibold text-white hover:bg-primary-500"
                >
                  确认提交复核
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-6"
              onClick={() => setShowSuccessModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 size={26} className="text-emerald-600" />
                  </div>
                  <button onClick={() => setShowSuccessModal(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X size={20} />
                  </button>
                </div>
                <h3 className="mb-1 font-serif text-xl font-bold text-zinc-900">提现申请已提交</h3>
                <p className="mb-4 text-sm text-zinc-500">系统正在处理，请耐心等待到账</p>

                <div className="mb-4 space-y-2 rounded-xl bg-zinc-50 p-4 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">处理模式</span><span className="font-medium text-emerald-600">系统自动处理</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">预计到账</span><span className="font-medium text-zinc-900">2 小时内</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">到账账户</span><span className="font-medium text-zinc-900">工行 ****6789</span></div>
                </div>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full rounded-lg bg-primary-400 py-3 text-sm font-semibold text-white hover:bg-primary-500"
                >
                  查看提现进度
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDetailModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-6"
              onClick={() => setShowDetailModal(null)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-zinc-900">提现详情</h3>
                    <div className="mt-0.5 text-xs text-zinc-400">单号：{showDetailModal.id}</div>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="text-zinc-400 hover:text-zinc-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-5 rounded-xl bg-zinc-50 p-4">
                  <div className="text-3xl font-bold text-zinc-900">{formatPrice(showDetailModal.amount)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      showDetailModal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      showDetailModal.status === 'rejected' ? 'bg-danger-100 text-danger-700' :
                      showDetailModal.status === 'manual_review' ? 'bg-amber-100 text-amber-700' :
                      'bg-sky-100 text-sky-700'
                    )}>
                      {showDetailModal.status === 'completed' ? '已到账' :
                       showDetailModal.status === 'rejected' ? '已驳回' :
                       showDetailModal.status === 'manual_review' ? '人工复核中' :
                       showDetailModal.status === 'review_passed' ? '复核通过·到账中' : '处理中'}
                    </span>
                    {showDetailModal.exceedLimit && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
                        超¥5,000 · 触发人工复核
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-400">提交时间</div>
                    <div className="mt-1 font-medium text-zinc-900">{formatDateTime(showDetailModal.submittedAt)}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-400">收款银行</div>
                    <div className="mt-1 font-medium text-zinc-900">{showDetailModal.bankName}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-400">卡号末尾</div>
                    <div className="mt-1 font-medium text-zinc-900">****{showDetailModal.bankCardTail}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-400">实际到账时间</div>
                    <div className="mt-1 font-medium text-zinc-900">{showDetailModal.actualArrival ? formatDateTime(showDetailModal.actualArrival) : '—'}</div>
                  </div>
                </div>

                {showDetailModal.rejectReason && (
                  <div className="mb-5 rounded-xl border border-danger-200 bg-danger-50 p-4">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-danger-700">
                      <XCircle size={16} /> 驳回详情
                    </div>
                    <div className="text-sm text-danger-600 mb-2">{showDetailModal.rejectReason}</div>
                    {showDetailModal.reviewBy && (
                      <div className="text-xs text-zinc-500">处理人：{showDetailModal.reviewBy}</div>
                    )}
                  </div>
                )}

                {showDetailModal.reviewBy && showDetailModal.status !== 'rejected' && (
                  <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4">
                    <div className="flex items-center gap-2 font-semibold text-sky-700 text-sm">
                      <UserCheck size={16} /> 人工复核信息
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">审核人：{showDetailModal.reviewBy}</div>
                  </div>
                )}

                <div>
                  <h4 className="mb-3 text-sm font-semibold text-zinc-700">完整时间轴</h4>
                  <div className="space-y-3 pl-2">
                    {[
                      { label: '提交提现申请', time: showDetailModal.step1At, icon: CheckCircle2, color: 'text-primary-500' },
                      { label: '系统校验通过', time: showDetailModal.step2At, icon: Landmark, color: 'text-sky-500' },
                      { label: showDetailModal.exceedLimit ? '人工复核完成' : '银行通道处理', time: showDetailModal.step3At, icon: UserCheck, color: showDetailModal.status === 'rejected' ? 'text-danger-500' : 'text-amber-500' },
                      { label: '资金到账完成', time: showDetailModal.step4At, icon: Wallet, color: 'text-emerald-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-white border-2',
                            item.time ? `border-${item.color.split('-')[1]}-200` : 'border-zinc-200')}>
                            <item.icon size={14} className={item.time ? item.color : 'text-zinc-300'} />
                          </div>
                          {i < 3 && (
                            <div className={cn('w-0.5 h-5',
                              item.time ? 'bg-emerald-300' : 'bg-zinc-200')} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className={cn('text-sm font-medium', item.time ? 'text-zinc-900' : 'text-zinc-400')}>{item.label}</div>
                          <div className="text-xs text-zinc-400">{item.time ? formatDateTime(item.time) : '待处理'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    关闭
                  </button>
                  {showDetailModal.status === 'rejected' && (
                    <button className="flex-1 rounded-lg bg-primary-400 py-2.5 text-sm font-semibold text-white hover:bg-primary-500">
                      修正后重新提现
                    </button>
                  )}
                  {showDetailModal.status === 'manual_review' && (
                    <button className="flex-1 rounded-lg bg-primary-400 py-2.5 text-sm font-semibold text-white hover:bg-primary-500">
                      联系客服催审
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  )
}
