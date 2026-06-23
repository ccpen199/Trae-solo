import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Flame, Coins, ShieldCheck, Clock, CheckCircle2, TrendingUp,
  Zap, Award, Target, Camera, UserCheck, Wallet, FileCheck, ChevronRight,
  ListTodo, AlertTriangle, Search, BarChart3, Building2, Landmark, Check,
  Plus, Eye, RefreshCw
} from 'lucide-react'
import { useStore } from '@/store'
import { heatPredictions } from '@/data/heatPredictions'
import { earningsBroadcasts, currentWorker, currentEmployer } from '@/data/users'
import { tasks } from '@/data/tasks'
import { DIFFICULTY_CONFIG, type DifficultyLevel } from '@/types'
import { formatPrice, formatDate } from '@/utils'
import DifficultyBadge from '@/components/common/DifficultyBadge'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

const allBroadcasts = [
  ...earningsBroadcasts,
  { id: 'EB11', userName: '朱**', amount: 5.0, taskTitle: '社区满意度问卷填写', time: '35分钟前' },
  { id: 'EB12', userName: '胡**', amount: 1200.0, taskTitle: '移动应用功能测试报告', time: '40分钟前' },
  { id: 'EB13', userName: '郭**', amount: 200.0, taskTitle: '市场竞品分析报告', time: '45分钟前' },
  { id: 'EB14', userName: '何**', amount: 600.0, taskTitle: '产品宣传短视频剪辑', time: '50分钟前' },
  { id: 'EB15', userName: '高**', amount: 34.5, taskTitle: '社交媒体文案编写', time: '55分钟前' },
  { id: 'EB16', userName: '林**', amount: 350.0, taskTitle: '英文产品说明书翻译校对', time: '1小时前' },
  { id: 'EB17', userName: '罗**', amount: 28.75, taskTitle: '商品信息录入校验', time: '1.2小时前' },
  { id: 'EB18', userName: '马**', amount: 8000.0, taskTitle: '微信小程序开发', time: '1.5小时前' },
  { id: 'EB19', userName: '蒋**', amount: 1500.0, taskTitle: '日语游戏文本翻译', time: '2小时前' },
  { id: 'EB20', userName: '沈**', amount: 250.0, taskTitle: '智能家居App用户体验测试', time: '2.5小时前' },
]

const difficultyDescriptions = [
  { level: 'L1' as DifficultyLevel, example: '问卷填写/简单录入', time: '5-15分钟', icon: <Zap size={14} /> },
  { level: 'L2' as DifficultyLevel, example: '数据标注/内容体验', time: '15-30分钟', icon: <Target size={14} /> },
  { level: 'L3' as DifficultyLevel, example: '审核/文案撰写/评测', time: '30-60分钟', icon: <CheckCircle2 size={14} /> },
  { level: 'L4' as DifficultyLevel, example: '设计/翻译/视频剪辑', time: '2-4小时', icon: <Award size={14} /> },
  { level: 'L5' as DifficultyLevel, example: '专业开发/专家翻译', time: '1-7天', icon: <ShieldCheck size={14} /> },
]

function HeatCircle({ score }: { score: number }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 90 ? '#10B981' : score >= 80 ? '#FF6B35' : '#FFD166'
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="3" />
        <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const currentRole = useStore((s) => s.currentRole)
  const storeTasks = useStore((s) => s.tasks)
  const acceptTask = useStore((s) => s.acceptTask)
  const acceptedTaskIds = useStore((s) => s.acceptedTaskIds)
  const submissions = useStore((s) => s.submissions)
  const openTaskCount = storeTasks.filter((t) => t.status === 'open' && t.complianceStatus === 'approved').length
  const [toast, setToast] = useState<{ id: string; title: string; body: string; type: 'success' | 'info' } | null>(null)

  const mySubmissions = submissions.filter((s) => s.workerId === currentWorker.id)
  const signedUpCount = acceptedTaskIds.filter((id) => !mySubmissions.some((s) => s.taskId === id)).length
  const inProgressCount = signedUpCount + mySubmissions.filter((s) => s.status === 'submitted' || s.status === 'pending_review').length
  const settledCount = mySubmissions.filter((s) => s.status === 'approved').length

  const isEmployer = currentRole === 'employer'
  const isWorker = currentRole === 'worker'

  const employerGates = [
    { title: '企业认证', desc: '营业执照+银行实名', icon: Building2, path: '/employer/certify', passed: currentEmployer.certificationStatus === 'approved' },
    { title: '银行实名', desc: '对公账户核实', icon: Landmark, passed: currentEmployer.bankAccountVerified },
    { title: '保证金托管', desc: `余额 ${formatPrice(currentEmployer.depositBalance)}`, icon: Wallet, path: '/employer', passed: currentEmployer.depositBalance >= 2000 },
    { title: '合规审核', desc: '发布后自动预审', icon: ShieldCheck, path: '/employer', passed: true },
  ]

  const handleQuickAccept = (taskId: string, taskTitle: string) => {
    if (acceptedTaskIds.includes(taskId)) {
      navigate('/my-tasks')
      return
    }
    acceptTask(taskId)
    setToast({
      id: taskId,
      title: '报名成功 🎉',
      body: `《${taskTitle.length > 14 ? taskTitle.slice(0, 14) + '…' : taskTitle}》已加入我的任务，快去完成并上传交付证明吧`,
      type: 'success',
    })
    setTimeout(() => setToast(null), 4500)
  }

  const recommended = useMemo(() => {
    return heatPredictions.filter((p) => p.recommended).slice(0, 8).map((pred) => {
      const task = [...storeTasks, ...tasks].find((t) => t.id === pred.taskId)
      return { ...pred, task }
    })
  }, [storeTasks])

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-6 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 px-4"
          >
            <div className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-zinc-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={22} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-900">{toast.title}</div>
                <div className="mt-1 text-xs text-zinc-600 leading-relaxed">{toast.body}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => { setToast(null); navigate('/my-tasks'); }}
                    className="rounded-lg bg-primary-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500"
                  >
                    <ListTodo size={12} className="mr-1 inline" /> 去我的任务
                  </button>
                  <button
                    onClick={() => { setToast(null); navigate(`/tasks/${toast.id}`); }}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    查看任务详情
                  </button>
                </div>
              </div>
              <button onClick={() => setToast(null)} className="text-zinc-400 hover:text-zinc-600">
                <ChevronRight size={18} className="rotate-45" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-6 pb-14 pt-10 text-white">
        <div className="absolute left-[10%] top-[15%] h-10 w-10 rounded-full bg-gold-300/30 animate-float" />
        <div className="absolute right-[15%] top-[25%] h-6 w-6 rounded-full bg-gold-300/20 animate-float [animation-delay:1s]" />
        <div className="absolute left-[60%] top-[60%] h-8 w-8 rounded-full bg-gold-300/25 animate-float [animation-delay:2s]" />
        <div className="absolute left-[30%] top-[70%] h-5 w-5 rounded-full bg-gold-300/15 animate-float [animation-delay:0.5s]" />
        <div className="absolute right-[8%] top-[65%] h-7 w-7 rounded-full bg-white/10 animate-float [animation-delay:1.5s]" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 font-serif text-4xl font-bold tracking-wide"
          >
            灵活用工 · 价值共创
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mb-6 text-lg text-white/85"
          >
            面向学生、宝妈、退休人员等非全日制群体，连接合规任务与技能
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-6 flex flex-wrap gap-3 text-xs"
          >
            {isEmployer ? (
              <>
                {employerGates.map((g, i) => (
                  <Link key={i} to={g.path || '/employer'}
                    className={cn('rounded-full px-3 py-1 flex items-center gap-1 transition-colors',
                      g.passed ? 'bg-emerald-500/20 text-white' : 'bg-amber-400/20 text-amber-100 hover:bg-amber-400/30')}>
                    <g.icon size={12} />
                    {g.title}
                    {g.passed ? <Check size={10} /> : <AlertTriangle size={10} />}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <span className="rounded-full bg-white/15 px-3 py-1 flex items-center gap-1">
                  <ShieldCheck size={12} /> 企业认证雇主
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 flex items-center gap-1">
                  <Coins size={12} /> 保证金托管
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 flex items-center gap-1">
                  <FileCheck size={12} /> 合规审核保障
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 flex items-center gap-1">
                  <Wallet size={12} /> 完成10单佣金上浮15%
                </span>
              </>
            )}
          </motion.div>

          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3">
              <div className="text-xs text-white/70">在线任务</div>
              <div className="mt-1 text-2xl font-bold">{openTaskCount}</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3">
              <div className="text-xs text-white/70">今日发放佣金</div>
              <div className="mt-1 text-2xl font-bold">¥12,860</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3">
              <div className="text-xs text-white/70">雇主认证率</div>
              <div className="mt-1 text-2xl font-bold">98.2%</div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3">
              <div className="text-xs text-white/70">24h结算率</div>
              <div className="mt-1 text-2xl font-bold">95.7%</div>
            </motion.div>
          </div>

          <AnimatePresence>
            {isWorker && inProgressCount > 0 && (
              <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-2xl bg-gradient-to-r from-gold-300 via-gold-200/90 to-gold-300 px-5 py-4 shadow-lg shadow-gold-900/10"
              onClick={() => navigate('/my-tasks')}
              role="button"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
                  <ListTodo size={22} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-zinc-900">
                    您有 {inProgressCount} 个任务待处理
                    {signedUpCount > 0 && <span className="ml-1 text-xs font-medium text-sky-600">（{signedUpCount}个待上传截图）</span>}
                    {settledCount > 0 && <span className="ml-1 text-xs font-medium text-emerald-600">（{settledCount}个已结算）</span>}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-700">
                    上传交付证明 · 查看验收倒计时 · 追踪结算到账
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-primary-600">
                  查看进度 <ChevronRight size={16} />
                </div>
              </div>
              </motion.div>
            )}
            {isEmployer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-2xl bg-gradient-to-r from-teal-600/90 via-teal-500/90 to-teal-600/90 px-5 py-4 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <Building2 size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">
                      雇主工作台 · {employerGates.filter(g => g.passed).length}/{employerGates.length} 项门槛已通过
                    </div>
                    <div className="mt-0.5 text-xs text-teal-100">
                      企业认证 · 银行实名 · 保证金托管 · 合规审核
                    </div>
                  </div>
                  <Link to="/employer"
                    className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50">
                    进入工作台 <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-3">
            {isEmployer ? (
              <>
                <Link to="/employer">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-primary-600 shadow-lg hover:bg-gold-50 transition-colors">
                    <Building2 size={18} /> 发包方工作台 <ArrowRight size={16} />
                  </motion.button>
                </Link>
                <Link to="/employer/certify">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-7 py-3 font-semibold text-white hover:bg-white/25 transition-colors">
                    <ShieldCheck size={18} /> 企业认证与保证金
                  </motion.button>
                </Link>
                <Link to="/employer">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-7 py-3 font-semibold text-white hover:bg-white/25 transition-colors">
                    <Plus size={18} /> 发布新任务
                  </motion.button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/tasks">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-primary-600 shadow-lg hover:bg-gold-50 transition-colors">
                    <Flame size={18} /> 浏览任务大厅 <ArrowRight size={16} />
                  </motion.button>
                </Link>
                <Link to="/profile">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-7 py-3 font-semibold text-white hover:bg-white/25 transition-colors">
                    <UserCheck size={18} /> 查看接单权益
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-8 border-b border-zinc-100">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-primary-400 to-primary-600" />
            <h2 className="font-serif text-xl font-bold text-zinc-900">任务难度分级标准</h2>
            <span className="ml-2 text-xs text-zinc-500">每级对应明确交付要求与佣金阶梯</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {difficultyDescriptions.map((d, i) => (
              <motion.div key={d.level}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`rounded-xl border-2 p-4 ${DIFFICULTY_CONFIG[d.level].bgColor} ${DIFFICULTY_CONFIG[d.level].borderColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <DifficultyBadge level={d.level} />
                  <span className={`${DIFFICULTY_CONFIG[d.level].color}`}>{d.icon}</span>
                </div>
                <div className={`text-sm font-medium mb-1 ${DIFFICULTY_CONFIG[d.level].color}`}>
                  {DIFFICULTY_CONFIG[d.level].description}
                </div>
                <div className="text-xs text-zinc-600 mb-1">{d.example}</div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                  <Clock size={12} /> 预计{d.time}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-6 py-10 border-b border-zinc-100">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-sky-400 to-sky-600" />
            <h2 className="font-serif text-xl font-bold text-zinc-900">任务全生命周期 · 状态追踪链</h2>
            <span className="ml-2 text-xs text-zinc-500">从报名到到账，每一步可追踪可验证</span>
          </div>

          <div className="relative mb-6">
            <div className="absolute left-0 right-0 top-[28px] h-1 rounded-full bg-zinc-200" />
            <div className="absolute left-0 top-[28px] h-1 rounded-full bg-gradient-to-r from-sky-400 via-primary-400 via-emerald-400 to-gold-400" style={{ width: '100%' }} />
            <div className="relative grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                { step: 1, title: '立即报名', desc: '选择任务一键报名', icon: <ListTodo size={18} />, color: 'text-sky-600', bg: 'bg-sky-100', ring: 'ring-sky-300' },
                { step: 2, title: '上传交付证明', desc: '按标准提交截图', icon: <Camera size={18} />, color: 'text-primary-600', bg: 'bg-primary-100', ring: 'ring-primary-300' },
                { step: 3, title: '验收倒计时', desc: '24h/72h/7天', icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-300' },
                { step: 4, title: '验收结果', desc: '通过/驳回+原因', icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-300' },
                { step: 5, title: '结算到账', desc: '佣金到银行卡', icon: <Wallet size={18} />, color: 'text-teal-600', bg: 'bg-teal-100', ring: 'ring-teal-300' },
                { step: 6, title: '佣金上浮', desc: '10单后+15%', icon: <TrendingUp size={18} />, color: 'text-gold-600', bg: 'bg-gold-100', ring: 'ring-gold-300' },
              ].map((s, i) => (
                <motion.div key={s.step} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center text-center">
                  <div className={cn('relative z-10 flex h-14 w-14 items-center justify-center rounded-full ring-2 shadow-md', s.bg, s.ring)}>
                    <span className={s.color}>{s.icon}</span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-zinc-900">{s.title}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500 leading-snug">{s.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { title: '交付证明标准', desc: '每级任务需按交付标准截图，L1需确认页面截图，L3需20字以上审核意见，L5需完整测试报告', icon: <FileCheck size={16} />, color: 'bg-primary-50 border-primary-200 text-primary-700' },
              { title: '验收时效规则', desc: 'L1-L2任务24小时验收，L3任务72小时验收，L4-L5任务7天验收，超时自动通过', icon: <Clock size={16} />, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { title: '驳回与结算', desc: '驳回附具体原因可修正重提，通过后佣金2小时内到账，超5000元人工复核1-2工作日', icon: <Wallet size={16} />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ].map((c, i) => (
              <div key={i} className={cn('rounded-xl border p-4', c.color)}>
                <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-sm">{c.icon} {c.title}</div>
                <div className="text-xs leading-relaxed opacity-80">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10 border-b border-zinc-100">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
            <h2 className="font-serif text-xl font-bold text-zinc-900">雇主服务 · 可办理业务</h2>
            <span className="ml-2 text-xs text-zinc-500">企业认证、保证金、合规审核一站式办理</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: '企业认证', desc: '营业执照+银行账户实名双重核验，4步审核流程', status: currentEmployer.certificationStatus === 'approved' ? '已通过' : '待认证', statusColor: currentEmployer.certificationStatus === 'approved' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50', path: '/employer/certify', icon: <Building2 size={22} /> },
              { title: '银行实名核实', desc: '对公账户开户行核实，确保结算路径合规', status: currentEmployer.bankAccountVerified ? '已核实' : '待核实', statusColor: currentEmployer.bankAccountVerified ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50', path: '/employer/certify', icon: <Landmark size={22} /> },
              { title: '保证金托管', desc: `余额${formatPrice(currentEmployer.depositBalance)}，任务结算从保证金自动代扣`, status: currentEmployer.depositBalance >= 2000 ? '充足' : '不足', statusColor: currentEmployer.depositBalance >= 2000 ? 'text-emerald-600 bg-emerald-50' : 'text-danger-600 bg-danger-50', path: '/employer', icon: <Wallet size={22} /> },
              { title: '任务合规审核', desc: '发布前平台自动预审，排除刷单/传销/非法集资', status: '平台保障', statusColor: 'text-sky-600 bg-sky-50', path: '/employer', icon: <ShieldCheck size={22} /> },
            ].map((item, i) => (
              <Link key={i} to={item.path}>
                <motion.div whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                  className="rounded-xl border border-zinc-100 bg-white p-5 h-full shadow-sm transition-all">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      {item.icon}
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', item.statusColor)}>
                      {item.status}
                    </span>
                  </div>
                  <div className="font-semibold text-zinc-900 mb-1">{item.title}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed">{item.desc}</div>
                  <div className="mt-3 flex items-center gap-0.5 text-xs font-medium text-primary-500">
                    立即办理 <ChevronRight size={12} />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-gold-50 to-amber-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-6 w-1 rounded-full bg-gradient-to-b from-gold-400 to-gold-600" />
                <h2 className="font-serif text-xl font-bold text-zinc-900">明日推荐任务池</h2>
                <span className="rounded-full bg-gold-300/40 px-2 py-0.5 text-xs text-gold-700 font-medium">
                  <TrendingUp size={12} className="inline mr-1" />AI智能推荐
                </span>
              </div>
              <p className="text-sm text-zinc-600 ml-3">基于历史完成率 / 弃单率 / 佣金综合评分排序</p>
            </div>
            <Link to="/tasks" className="text-sm text-primary-500 font-medium flex items-center hover:text-primary-600">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>

          <div className="mb-5 rounded-xl border border-gold-200/60 bg-white/80 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-[280px]">
                <div className="mb-2 text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <BarChart3 size={13} className="text-gold-600" /> 推荐筛选依据与排序规则
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="rounded-lg bg-emerald-50 px-2.5 py-2">
                    <div className="font-semibold text-emerald-700">完成率 × 0.4</div>
                    <div className="text-zinc-500 mt-0.5">近30天历史完成率，权重最高</div>
                  </div>
                  <div className="rounded-lg bg-sky-50 px-2.5 py-2">
                    <div className="font-semibold text-sky-700">(1-弃单率) × 0.3</div>
                    <div className="text-zinc-500 mt-0.5">低弃单率任务优先推荐</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2.5 py-2">
                    <div className="font-semibold text-amber-700">佣金吸引力 × 0.2</div>
                    <div className="text-zinc-500 mt-0.5">单价/工时比综合评估</div>
                  </div>
                  <div className="rounded-lg bg-rose-50 px-2.5 py-2">
                    <div className="font-semibold text-rose-700">供需比 × 0.1</div>
                    <div className="text-zinc-500 mt-0.5">剩余名额/总名额比</div>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed">
                  综合评分 = 完成率×0.4 + (1-弃单率)×0.3 + 佣金吸引力×0.2 + 供需比×0.1，得分≥75分且完成率≥70%方可入选推荐池，按得分降序排列
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="mb-1 text-[11px] text-zinc-400">数据更新时间</div>
                <div className="text-sm font-semibold text-zinc-700">2026-06-19 08:00</div>
                <div className="mt-1 text-[11px] text-zinc-400">周期：每日 08:00 / 20:00</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    <Check size={9} /> 推荐池 {recommended.length} 个任务
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                    <Eye size={9} /> 可接名额 {recommended.reduce((s, r) => s + ((r.task?.totalSlots ?? 0) - (r.task?.takenSlots ?? 0)), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map((pred, i) => (
              <motion.div key={pred.taskId}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-white border border-gold-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className={`h-1.5 w-full ${
                  pred.difficulty === 'L1' ? 'bg-emerald-400' :
                  pred.difficulty === 'L2' ? 'bg-sky-400' :
                  pred.difficulty === 'L3' ? 'bg-amber-400' :
                  pred.difficulty === 'L4' ? 'bg-orange-400' : 'bg-rose-400'
                }`} />
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-zinc-900">
                      {pred.taskTitle}
                    </h3>
                    <DifficultyBadge level={pred.difficulty} />
                  </div>
                  <div className="mb-3 text-xl font-bold text-primary-500">
                    {formatPrice(pred.basePrice)}
                    <span className="ml-1 text-xs font-medium text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded">
                      10单后+15%
                    </span>
                  </div>
                  {pred.task && (
                    <>
                      <div className="mb-2 text-xs text-zinc-600 flex items-start gap-1">
                        <CheckCircle2 size={12} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                        <span className="line-clamp-2">{pred.task.deliveryStandards[0]}</span>
                      </div>
                      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> 验收{
                          pred.task.acceptancePeriod === '24h' ? '24小时' :
                          pred.task.acceptancePeriod === '72h' ? '72小时' : '7天'
                        }</span>
                        <span className="flex items-center gap-1">
                          <Target size={12} /> 剩{pred.task.totalSlots - pred.task.takenSlots}名
                        </span>
                      </div>
                      <div className="mb-3 rounded-lg bg-emerald-50/60 border border-emerald-100 px-3 py-2">
                        <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <BarChart3 size={11} /> 历史数据依据 · 近30天
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">完成率</span>
                            <span className="font-bold text-emerald-600">{(pred.completionRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">弃单率</span>
                            <span className={cn(
                              'font-bold',
                              pred.abandonRate < 0.05 ? 'text-emerald-600' :
                              pred.abandonRate < 0.1 ? 'text-amber-600' : 'text-danger-500'
                            )}>{(pred.abandonRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">已完成</span>
                            <span className="font-medium text-zinc-700">{pred.historicalCompleted}单</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500">供需比</span>
                            <span className="font-medium text-zinc-700">{pred.supplyDemandRatio.toFixed(2)}x</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-400">AI热度评分</div>
                      <HeatCircle score={pred.predictedHeat} />
                    </div>
                    {(() => {
                      const accepted = acceptedTaskIds.includes(pred.taskId)
                      const submitted = submissions.some((s) => s.workerId === 'W001' && s.taskId === pred.taskId)
                      if (submitted) {
                        return (
                          <button
                            onClick={() => navigate('/my-tasks')}
                            className="rounded-full bg-sky-500/10 border border-sky-200 px-4 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-500/20"
                          >
                            验收中·查看进度
                          </button>
                        )
                      }
                      if (accepted) {
                        return (
                          <button
                            onClick={() => navigate('/my-tasks')}
                            className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-4 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            <Camera size={12} /> 上传截图
                          </button>
                        )
                      }
                      return (
                        <button
                          onClick={() => handleQuickAccept(pred.taskId, pred.taskTitle)}
                          className="rounded-full bg-gradient-to-r from-primary-400 to-primary-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:shadow-md transition"
                        >
                          立即报名
                        </button>
                      )
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-gold-200/60 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Eye size={15} className="text-gold-600" /> 推荐池审计视图 · 未入池任务
                </h3>
                <div className="mt-0.5 text-[11px] text-zinc-500">以下任务未达到推荐入池门槛，淘汰原因可复查</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-zinc-400">缓存版本 v2026.06.19.0800</div>
                <div className="text-[11px] text-zinc-400">上一版 v2026.06.18.2000</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="pb-2 font-medium">任务</th>
                    <th className="pb-2 font-medium">难度</th>
                    <th className="pb-2 font-medium">综合评分</th>
                    <th className="pb-2 font-medium">完成率</th>
                    <th className="pb-2 font-medium">弃单率</th>
                    <th className="pb-2 font-medium">可接</th>
                    <th className="pb-2 font-medium">淘汰原因</th>
                  </tr>
                </thead>
                <tbody>
                  {heatPredictions.filter(p => !p.recommended).slice(0, 6).map(p => {
                    const t = tasks.find(t => t.id === p.taskId)
                    const available = t ? t.totalSlots - t.takenSlots : 0
                    const reason = p.historicalCompletionRate < 0.7 ? '完成率<70%' :
                                   p.predictedHeat < 75 ? '评分<75' :
                                   p.abandonmentRate > 0.2 ? '弃单率>20%' : '供需比不足'
                    return (
                      <tr key={p.taskId} className="border-b border-zinc-50">
                        <td className="py-2 font-medium text-zinc-800 max-w-[160px] truncate">{p.taskTitle}</td>
                        <td className="py-2"><DifficultyBadge level={p.difficulty} /></td>
                        <td className="py-2 font-bold text-zinc-600">{p.predictedHeat}</td>
                        <td className="py-2 text-zinc-600">{(p.historicalCompletionRate * 100).toFixed(1)}%</td>
                        <td className="py-2 text-zinc-600">{(p.abandonmentRate * 100).toFixed(1)}%</td>
                        <td className="py-2">
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                            available > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>
                            {available > 0 ? `${available}名` : '已满'}
                          </span>
                        </td>
                        <td className="py-2 text-rose-600 font-medium">{reason}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
              <span>入池标准：综合评分≥75 且 完成率≥70% 且 弃单率≤20%</span>
              <span>数据来源：近30天历史行为 · 更新周期：每日08:00/20:00</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-teal-400 to-teal-600" />
            <h2 className="font-serif text-xl font-bold text-zinc-900">佣金阶梯规则</h2>
            <span className="ml-2 text-xs text-zinc-500">累计接单越多，单价上浮越高</span>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-gradient-to-r from-teal-50 via-white to-primary-50 p-6">
            <div className="relative mb-8 mt-4">
              <div className="h-2 rounded-full bg-zinc-100">
                <div className="h-2 w-[58%] rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-primary-400" />
              </div>
              <div className="absolute top-0 left-0 w-full flex justify-between -mt-1">
                {[{ s: 0, b: '100%', t: '新手期' }, { s: 5, b: '+8%', t: '5单' }, { s: 10, b: '+15%', t: '10单' }, { s: 20, b: '+20%', t: '20单' }, { s: 50, b: '+30%', t: '50单' }].map((m, i) => (
                  <div key={m.s} className="flex flex-col items-center" style={{ transform: `translateX(0)` }}>
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md mb-2 ${
                      i < 3 ? 'bg-primary-500' : 'bg-zinc-200'
                    }`} />
                    <div className="text-xs font-bold text-zinc-900">{m.t}</div>
                    <div className={`text-sm font-bold mt-0.5 ${
                      i < 3 ? 'text-primary-500' : 'text-zinc-400'
                    }`}>{m.b}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center gap-2 mb-2">
                  <Camera size={16} className="text-primary-500" />
                  <div className="text-sm font-semibold text-zinc-900">明确交付标准</div>
                </div>
                <div className="text-xs text-zinc-600 leading-relaxed">
                  每个任务都标注详细交付要求（如「完整作答+截图证明」），避免模糊不清导致返工
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-teal-500" />
                  <div className="text-sm font-semibold text-zinc-900">确定验收时效</div>
                </div>
                <div className="text-xs text-zinc-600 leading-relaxed">
                  24h / 72h / 7天 三档明确时效，超时自动验收，保障接单者权益
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm border border-zinc-100">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} className="text-gold-500" />
                  <div className="text-sm font-semibold text-zinc-900">阶梯佣金上浮</div>
                </div>
                <div className="text-xs text-zinc-600 leading-relaxed">
                  完成5单上浮8%、10单上浮15%、20单上浮20%、50单上浮30%，长期接单更划算
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-2">
            <Coins size={20} className="text-gold-500" />
            <h2 className="font-serif text-lg font-bold text-zinc-900">实时佣金播报</h2>
            <span className="text-xs text-zinc-500">· 刚刚完成的真实结算记录</span>
          </div>
          <div className="h-12 overflow-hidden rounded-xl bg-gold-50 border border-gold-100">
            <div className="flex h-12 items-center animate-scroll-left whitespace-nowrap">
              {[...allBroadcasts, ...allBroadcasts].map((b, i) => (
                <span key={`${b.id}-${i}`} className="mx-6 inline-flex items-center gap-1.5 text-sm text-zinc-600 flex-shrink-0">
                  <span className="font-medium text-gold-600">{b.userName}</span>
                  <span className="text-zinc-400">完成</span>
                  <span className="max-w-[140px] truncate font-medium text-zinc-800">{b.taskTitle}</span>
                  <span className="text-zinc-400">获得</span>
                  <span className="font-bold text-primary-500 whitespace-nowrap">+{formatPrice(b.amount)}</span>
                  <span className="ml-1 text-xs text-zinc-400">{b.time}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10 border-t border-zinc-100">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-teal-600" />
              <h2 className="font-serif text-lg font-bold text-zinc-900">平台安全与风控保障</h2>
              <span className="text-xs text-zinc-500">· 平台行为审计透明公示</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Check size={12} /> 风控系统在线运转
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '今日拦截同设备多账号', value: '14', desc: '台设备', color: 'text-danger-500', bg: 'bg-danger-50' },
              { label: '今日超过¥5,000人工复核', value: '23', desc: '笔提现', color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: '近7日高危任务驳回', value: '37', desc: '刷单/传销', color: 'text-rose-500', bg: 'bg-rose-50' },
              { label: '近30日企业认证驳回', value: '9', desc: '材料不合格', color: 'text-sky-600', bg: 'bg-sky-50' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-zinc-100 p-4">
                <div className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-medium', s.bg, s.color)}>{s.desc}</div>
                <div className={cn('mt-2 text-2xl font-bold', s.color)}>{s.value}</div>
                <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-100 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500" />
                  近期设备拦截公示
                </h3>
                <span className="text-[11px] text-zinc-400">保护隐私·匿名展示</span>
              </div>
              <div className="space-y-2">
                {[
                  { city: '上海', time: '今日 09:22', type: '同设备登录 5 个账号', result: '已拦截注册+提现申请', sev: 'high' },
                  { city: '广州', time: '今日 08:05', type: '同设备批量注册 12 账号', result: '设备加入风控黑名单', sev: 'high' },
                  { city: '成都', time: '昨日 21:17', type: '频繁切换账号 3 账号', result: '触发二次验证', sev: 'medium' },
                  { city: '深圳', time: '昨日 16:44', type: '同 IP 异常操作 4 账号', result: '临时冻结提现功能', sev: 'medium' },
                  { city: '杭州', time: '昨日 11:30', type: '登录地频繁跨城切换', result: '账号风控提醒', sev: 'low' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-800">{r.city}</span>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-semibold',
                          r.sev === 'high' ? 'bg-danger-100 text-danger-700' :
                          r.sev === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700')}>
                          {r.sev === 'high' ? '高危' : r.sev === 'medium' ? '中危' : '低危'}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-zinc-500">{r.type}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium text-zinc-700">{r.result}</div>
                      <div className="mt-0.5 text-[10px] text-zinc-400">{r.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <FileCheck size={15} className="text-emerald-500" />
                  风控保障与您的权益
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <Building2 size={16} />, title: '雇主企业认证 100%', desc: '营业执照+对公账户双重核验，身份真实可追溯' },
                  { icon: <Landmark size={16} />, title: '保证金托管保障', desc: '任务佣金从保证金预托管，完成后自动结算到账' },
                  { icon: <AlertTriangle size={16} />, title: '高危任务拦截', desc: '刷单返利、非法集资等违规任务直接拦截不上架' },
                  { icon: <Wallet size={16} />, title: '大额提现人工复核', desc: '单日超¥5,000双人复核，防止盗号和资金风险' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      {f.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-800">{f.title}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
