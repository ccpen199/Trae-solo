import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Clock, Coins, Wallet, Plus, Trash2, ChevronRight, ChevronLeft, Check,
  ShieldCheck, AlertTriangle, RefreshCw, RotateCcw, AlertCircle, DollarSign, Landmark,
  Building2, UserCheck, X, ListChecks
} from 'lucide-react'
import { useStore } from '@/store'
import { currentEmployer } from '@/data/users'
import { formatPrice, formatDateTime, formatDate } from '@/utils'
import { ACCEPTANCE_PERIOD_LABEL, DIFFICULTY_CONFIG, type DifficultyLevel, type AcceptancePeriod } from '@/types'
import { categories } from '@/data/categories'
import { tasks as allTasks } from '@/data/tasks'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const STEPS = ['基本信息', '交付与佣金', '确认发布']

const HIGH_RISK_REJECTION: Record<string, { label: string; reason: string }> = {
  T021: { label: '刷单返利', reason: '涉嫌刷单返利' },
  T022: { label: '非法集资', reason: '涉嫌非法集资' },
}

const depositRechargeRecords = [
  { id: 'DR001', amount: 20000, date: '2026-06-01T10:00:00Z', method: '银行转账', status: 'success' },
  { id: 'DR002', amount: 15000, date: '2026-05-15T14:00:00Z', method: '银行转账', status: 'success' },
  { id: 'DR003', amount: 15000, date: '2026-05-01T09:00:00Z', method: '支付宝', status: 'success' },
  { id: 'DR004', amount: 10000, date: '2026-04-20T11:30:00Z', method: '银行转账', status: 'success' },
  { id: 'DR005', amount: 5000, date: '2026-04-08T16:20:00Z', method: '微信支付', status: 'success' },
]

const depositConsumeRecords = [
  { id: 'DC001', taskTitle: '电商平台用户满意度问卷填写', amount: 1600, date: '2026-06-10T14:00:00Z', type: '任务结算扣减' },
  { id: 'DC002', taskTitle: '企业品牌LOGO设计方案', amount: 1500, date: '2026-06-08T10:00:00Z', type: '任务结算扣减' },
  { id: 'DC003', taskTitle: '市场竞品分析报告', amount: 1000, date: '2026-06-05T16:00:00Z', type: '任务结算扣减' },
  { id: 'DC004', taskTitle: '公众号文章撰写', amount: 1050, date: '2026-06-02T11:00:00Z', type: '任务结算扣减' },
  { id: 'DC005', taskTitle: '短视频内容合规审核', amount: 1800, date: '2026-05-28T09:00:00Z', type: '任务结算扣减' },
]

const DEPOSIT_WARN_THRESHOLD = 10000
const MIN_DEPOSIT_TO_PUBLISH = 2000

export default function Employer() {
  const navigate = useNavigate()
  const { tasks, submissions, approveSubmission, rejectSubmission } = useStore()
  const inProgressCount = submissions.filter((s) => s.status === 'submitted' || s.status === 'pending_review').length
  const pendingSubmissions = submissions.filter((s) => s.status === 'submitted')

  const employerTasks = allTasks.filter((t) => t.employerId === currentEmployer.id)
  const complianceTasks = allTasks.map((t) => {
    if (t.id === 'T021' || t.id === 'T022') {
      return { ...t, complianceStatus: 'rejected' as const }
    }
    return t
  })

  const pendingCount = complianceTasks.filter((t) => t.complianceStatus === 'pending').length
  const approvedCount = complianceTasks.filter((t) => t.complianceStatus === 'approved').length
  const rejectedCount = complianceTasks.filter((t) => t.complianceStatus === 'rejected').length

  const gate1_passed = currentEmployer.certificationStatus === 'approved'
  const gate2_passed = currentEmployer.bankAccountVerified
  const gate3_passed = currentEmployer.depositBalance >= MIN_DEPOSIT_TO_PUBLISH
  const gate4_passed = true

  const allGatesPassed = gate1_passed && gate2_passed && gate3_passed && gate4_passed

  const firstFailedGate = (() => {
    if (!gate1_passed) return 1
    if (!gate2_passed) return 2
    if (!gate3_passed) return 3
    return 0
  })()

  const GATES = [
    { idx: 1, title: '企业认证', desc: '营业执照审核', icon: Building2, passed: gate1_passed, cta: '前往认证', target: '/employer/certify' },
    { idx: 2, title: '银行实名', desc: '对公账户核实', icon: Landmark, passed: gate2_passed, cta: '核实账户' },
    { idx: 3, title: '保证金托管', desc: `最低¥${MIN_DEPOSIT_TO_PUBLISH.toLocaleString()}`, icon: Wallet, passed: gate3_passed, cta: '立即充值' },
    { idx: 4, title: '合规审核', desc: '发布后平台自动预审', icon: ShieldCheck, passed: gate4_passed, cta: '了解规则' },
  ]

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [standards, setStandards] = useState([''])
  const [acceptancePeriod, setAcceptancePeriod] = useState<AcceptancePeriod>('72h')
  const [basePrice, setBasePrice] = useState('')
  const [totalSlots, setTotalSlots] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const addStandard = () => setStandards([...standards, ''])
  const removeStandard = (i: number) => setStandards(standards.filter((_, idx) => idx !== i))
  const updateStandard = (i: number, v: string) => {
    const next = [...standards]
    next[i] = v
    setStandards(next)
  }

  const canNext = () => {
    if (step === 0) return title && description && difficulty && categoryId
    if (step === 1) return standards.some((s) => s.trim()) && basePrice && totalSlots
    return false
  }

  const handleReject = (id: string) => {
    if (rejectReason.trim()) {
      rejectSubmission(id, rejectReason)
      setRejectingId(null)
      setRejectReason('')
    }
  }

  const isDepositLow = currentEmployer.depositBalance < DEPOSIT_WARN_THRESHOLD

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">雇主工作台</h1>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: '已发布任务', value: currentEmployer.publishedTasks, icon: FileText, color: 'text-primary-400 bg-primary-50' },
            { label: '进行中任务', value: inProgressCount, icon: Clock, color: 'text-teal-500 bg-teal-50' },
            { label: '总发放佣金', value: formatPrice(currentEmployer.totalDisbursed), icon: Coins, color: 'text-gold-500 bg-gold-50' },
            { label: '保证金余额', value: formatPrice(currentEmployer.depositBalance), icon: Wallet, color: isDepositLow ? 'text-danger-400 bg-danger-50' : 'text-sky-500 bg-sky-50', action: '充值' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={cn('rounded-lg p-2', s.color.split(' ')[1])}>
                  <s.icon size={20} className={s.color.split(' ')[0]} />
                </span>
                {s.action && (
                  <button className="rounded-lg bg-primary-400 px-3 py-1 text-xs font-medium text-white hover:bg-primary-500">
                    {s.action}
                  </button>
                )}
              </div>
              <div className="mt-3 text-2xl font-bold text-zinc-900">{s.value}</div>
              <div className="mt-1 text-sm text-zinc-500">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="mb-8 rounded-2xl border border-primary-100 bg-gradient-to-br from-teal-50/60 via-white to-primary-50/60 p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-zinc-900">
                <ListChecks size={18} className="mr-2 inline text-teal-600" />
                任务发布前置门槛
              </h2>
              <p className="mt-1 text-xs text-zinc-500">为保障接单者权益，必须完成以下 4 项门槛方可发布任务</p>
            </div>
            {allGatesPassed ? (
              <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Check size={14} /> 全部通过
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                <AlertCircle size={14} /> 第 {firstFailedGate} 项未完成
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-6 right-6 top-[42px] h-1 rounded-full bg-zinc-200" />
            <div
              className="absolute left-6 top-[42px] h-1 rounded-full bg-gradient-to-r from-teal-400 via-primary-400 to-gold-400"
              style={{ width: `calc(${(((gate1_passed ? 1 : 0) + (gate2_passed ? 1 : 0) + (gate3_passed ? 1 : 0) + (gate4_passed ? 1 : 0)) / GATES.length) * 100}% - 48px * (${(((gate1_passed ? 1 : 0) + (gate2_passed ? 1 : 0) + (gate3_passed ? 1 : 0) + (gate4_passed ? 1 : 0)))} / ${GATES.length}))` }}
            />
            <div className="relative grid grid-cols-4 gap-3">
              {GATES.map((g) => (
                <div key={g.idx} className="flex flex-col items-center">
                  <div className={cn(
                    'relative z-10 flex h-[84px] w-[84px] flex-col items-center justify-center rounded-2xl border-2 transition-all',
                    g.passed ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-100'
                             : g.idx === firstFailedGate ? 'border-primary-400 bg-white shadow-md shadow-primary-200 animate-pulse'
                             : 'border-zinc-200 bg-white text-zinc-400'
                  )}>
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full',
                      g.passed ? 'bg-emerald-500 text-white'
                               : g.idx === firstFailedGate ? 'bg-primary-500 text-white'
                               : 'bg-zinc-100 text-zinc-400'
                    )}>
                      {g.passed ? <Check size={18} /> : <g.icon size={18} />}
                    </div>
                    <div className={cn(
                      'mt-1.5 text-[10px] font-semibold',
                      g.passed ? 'text-emerald-700' : g.idx === firstFailedGate ? 'text-primary-700' : 'text-zinc-400'
                    )}>
                      第{g.idx}步
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-sm font-semibold text-zinc-900">{g.title}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">{g.desc}</div>
                    {!g.passed && g.idx === firstFailedGate && (
                      <button
                        onClick={() => g.target && navigate(g.target)}
                        className="mt-2 inline-flex items-center gap-0.5 rounded-lg bg-primary-500 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-primary-600"
                      >
                        {g.cta} <ChevronRight size={10} />
                      </button>
                    )}
                    {g.passed && (
                      <div className="mt-2 inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <Check size={10} /> 已完成
                      </div>
                    )}
                    {!g.passed && g.idx !== firstFailedGate && (
                      <div className="mt-2 text-[11px] text-zinc-400">请先完成前序</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isDepositLow && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4">
            <AlertTriangle size={22} className="mt-0.5 shrink-0 text-danger-500" />
            <div>
              <div className="font-semibold text-danger-700">保证金不足预警</div>
              <div className="mt-0.5 text-sm text-danger-600">
                当前保证金余额低于 ¥{DEPOSIT_WARN_THRESHOLD.toLocaleString()}，将无法发布高佣金任务。请及时充值以确保业务正常进行。
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-zinc-900">
              <ShieldCheck size={18} className="mr-2 inline text-primary-500" />
              合规审核状态追踪
            </h2>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock size={16} />
                <span className="text-sm font-medium">待审核</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-800">{pendingCount}</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Check size={16} />
                <span className="text-sm font-medium">已通过</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-800">{approvedCount}</div>
            </div>
            <div className="rounded-xl bg-danger-50 p-4">
              <div className="flex items-center gap-2 text-danger-700">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">已驳回</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-danger-800">{rejectedCount}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500">
                  <th className="pb-3 font-medium">任务标题</th>
                  <th className="pb-3 font-medium">提交时间</th>
                  <th className="pb-3 font-medium">审核状态</th>
                  <th className="pb-3 font-medium">风险标签</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {complianceTasks.map((t) => {
                  const highRisk = HIGH_RISK_REJECTION[t.id]
                  const isRejected = t.complianceStatus === 'rejected'
                  const isPending = t.complianceStatus === 'pending'
                  return (
                    <tr key={t.id} className="border-b border-zinc-50">
                      <td className="py-3 font-medium text-zinc-900">{t.title}</td>
                      <td className="py-3 text-zinc-500">{formatDate(t.createdAt)}</td>
                      <td className="py-3">
                        {highRisk ? (
                          <span className="inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-700">
                            已驳回：{highRisk.reason}
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center rounded-full bg-danger-100 px-2.5 py-0.5 text-xs font-medium text-danger-700">已驳回</span>
                        ) : isPending ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">待审核</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">已通过</span>
                        )}
                      </td>
                      <td className="py-3">
                        {highRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-danger-50 px-2 py-0.5 text-xs font-semibold text-danger-600 ring-1 ring-inset ring-danger-200">
                            <AlertCircle size={11} />
                            {highRisk.label}高危
                          </span>
                        ) : t.id === 'T017' || t.id === 'T020' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-200">
                            <AlertCircle size={11} />
                            常规排查
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-200">
                            低风险
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {highRisk ? (
                          <button className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100">
                            <RefreshCw size={12} />
                            申请复查
                          </button>
                        ) : isRejected ? (
                          <button className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                            <RotateCcw size={12} />
                            再次申诉
                          </button>
                        ) : isPending ? (
                          <span className="text-xs text-zinc-400">请耐心等待</span>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">
              <Landmark size={18} className="mr-2 inline text-teal-500" />
              保证金充值明细
            </h2>
            <div className="space-y-2">
              {depositRechargeRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                      <Plus size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">{r.method}</div>
                      <div className="text-xs text-zinc-400">{formatDate(r.date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600">+{formatPrice(r.amount)}</div>
                    <div className="text-xs text-emerald-500">充值成功</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">
              <DollarSign size={18} className="mr-2 inline text-gold-500" />
              保证金消费记录
            </h2>
            <div className="space-y-2">
              {depositConsumeRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-zinc-100 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50">
                      <Wallet size={16} className="text-gold-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-900">{r.taskTitle}</div>
                      <div className="text-xs text-zinc-400">{formatDate(r.date)} · {r.type}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-danger-600">-{formatPrice(r.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">发布新任务</h2>

          <AnimatePresence mode="wait">
            {!allGatesPassed ? (
              <motion.div key="gate-block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-4">
                    <AlertTriangle size={40} className="text-amber-500" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-zinc-900">请先完成发布门槛
                    {firstFailedGate === 1 ? ' 第1步：企业认证' :
                    firstFailedGate === 2 ? ' 第2步：银行实名核实' :
                    ' 第3步：保证金充值'}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-500 max-w-md text-center">
                    {firstFailedGate === 1 ? '为防止违规和接单者权益，未完成企业认证的雇主无法发布任务。请先提交营业执照并通过平台合规审核。' :
                    firstFailedGate === 2 ? '请完成对公账户银行实名核实，确保结算资金路径合规，方可发起任务。' :
                    `平台要求托管最低保证金 ¥${MIN_DEPOSIT_TO_PUBLISH.toLocaleString()}元，任务完成结算时将从保证金自动代扣任务佣金。`
                    }
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {GATES.filter(g => !g.passed === false).map(g => (
                      <button
                        key={g.idx}
                        onClick={() => g.target && navigate(g.target)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm',
                          g.idx === firstFailedGate
                            ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white hover:shadow-md'
                            : 'bg-zinc-100 text-zinc-400'
                        )}
                      >
                        <g.icon size={15} /> {g.cta}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  i <= step ? 'bg-primary-400 text-white' : 'bg-zinc-100 text-zinc-400')}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={cn('ml-2 text-sm', i <= step ? 'text-zinc-900 font-medium' : 'text-zinc-400')}>{s}</span>
                {i < STEPS.length - 1 && <div className="mx-3 h-px w-8 bg-zinc-200" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">任务标题</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="输入任务标题" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">任务描述</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="详细描述任务内容和要求" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">难度等级</label>
                  <div className="flex gap-3">
                    {(Object.keys(DIFFICULTY_CONFIG) as DifficultyLevel[]).map((l) => (
                      <button key={l} onClick={() => setDifficulty(l)}
                        className={cn('flex flex-col items-center rounded-lg border-2 px-4 py-3 transition-all',
                          difficulty === l ? `${DIFFICULTY_CONFIG[l].borderColor} ${DIFFICULTY_CONFIG[l].bgColor}` : 'border-zinc-200 hover:border-zinc-300')}>
                        <span className={cn('text-sm font-bold', DIFFICULTY_CONFIG[l].color)}>{l}</span>
                        <span className="mt-1 text-xs text-zinc-500">{DIFFICULTY_CONFIG[l].description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">任务分类</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none">
                    <option value="">选择分类</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">交付标准</label>
                  {standards.map((s, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <input value={s} onChange={(e) => updateStandard(i, e.target.value)} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder={`交付标准 ${i + 1}`} />
                      {standards.length > 1 && (
                        <button onClick={() => removeStandard(i)} className="rounded-lg border border-zinc-200 p-2.5 text-zinc-400 hover:text-danger-400"><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={addStandard} className="mt-1 flex items-center gap-1 text-sm text-primary-400 hover:text-primary-500"><Plus size={14} />添加标准</button>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">验收时效</label>
                  <div className="flex gap-3">
                    {(['24h', '72h', '7d'] as AcceptancePeriod[]).map((p) => (
                      <button key={p} onClick={() => setAcceptancePeriod(p)}
                        className={cn('rounded-lg border-2 px-5 py-2.5 text-sm font-medium transition-all',
                          acceptancePeriod === p ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300')}>
                        {ACCEPTANCE_PERIOD_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">单价 (元)</label>
                    <input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">名额</label>
                    <input type="number" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="0" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <h3 className="font-serif text-base font-semibold text-zinc-900">发布信息确认</h3>
                {[
                  ['任务标题', title],
                  ['任务描述', description],
                  ['难度等级', difficulty ? DIFFICULTY_CONFIG[difficulty].label : ''],
                  ['任务分类', categories.find((c) => c.id === categoryId)?.name ?? ''],
                  ['交付标准', standards.filter((s) => s.trim()).join('；')],
                  ['验收时效', ACCEPTANCE_PERIOD_LABEL[acceptancePeriod]],
                  ['单价', basePrice ? `¥${basePrice}` : ''],
                  ['名额', totalSlots],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-4 border-b border-zinc-100 pb-2">
                    <span className="w-20 shrink-0 text-sm text-zinc-500">{label}</span>
                    <span className="text-sm font-medium text-zinc-900">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"><ChevronLeft size={16} />上一步</button>
            ) : <div />}
            {step < 2 ? (
              <button disabled={!canNext()} onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-lg bg-primary-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed">下一步<ChevronRight size={16} /></button>
            ) : (
              <button className="flex items-center gap-1 rounded-lg bg-primary-400 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-500"><Check size={16} />确认发布</button>
            )}
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-serif text-lg font-bold text-zinc-900">待审核提交</h2>
          {pendingSubmissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">暂无待审核的提交</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="pb-3 font-medium">任务标题</th>
                    <th className="pb-3 font-medium">接单者</th>
                    <th className="pb-3 font-medium">提交时间</th>
                    <th className="pb-3 font-medium">佣金</th>
                    <th className="pb-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSubmissions.map((sub) => (
                    <tr key={sub.id} className="border-b border-zinc-50">
                      <td className="py-3 font-medium text-zinc-900">{sub.taskTitle}</td>
                      <td className="py-3 text-zinc-600">{sub.workerName}</td>
                      <td className="py-3 text-zinc-500">{formatDateTime(sub.submittedAt)}</td>
                      <td className="py-3 font-medium text-primary-400">{formatPrice(sub.price)}</td>
                      <td className="py-3 text-right">
                        {rejectingId === sub.id ? (
                          <div className="flex flex-col items-end gap-2">
                            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} className="w-48 rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-danger-400 focus:outline-none" placeholder="驳回原因" />
                            <div className="flex gap-2">
                              <button onClick={() => setRejectingId(null)} className="rounded px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50">取消</button>
                              <button onClick={() => handleReject(sub.id)} className="rounded bg-danger-400 px-3 py-1 text-xs text-white hover:bg-danger-500">确认驳回</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => approveSubmission(sub.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100">通过</button>
                            <button onClick={() => setRejectingId(sub.id)} className="rounded-lg bg-danger-50 px-3 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-100">驳回</button>
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
      </div>
    </div>
  )
}
