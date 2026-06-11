import { useNavigate } from 'react-router-dom'
import {
  Search, ArrowRightLeft, Briefcase, Calculator,
  ShieldCheck, Scale, Award, CreditCard, BarChart3,
  Bell, AlertTriangle, CheckCircle2, XCircle, Info,
  ChevronRight, Clock,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { mockTransferApplications, mockTodoItems, mockNotifications } from '@/mock/data'
import { ROLE_LABELS } from '@/types'
import type { UserRole, TransferApplication, TodoItem, Notification } from '@/types'

const serviceCards: { name: string; icon: React.ElementType; bg: string; route: string }[] = [
  { name: '社保查询', icon: Search, bg: 'bg-gov-blue', route: '/social-insurance' },
  { name: '关系转移', icon: ArrowRightLeft, bg: 'bg-teal-600', route: '/transfer' },
  { name: '失业登记/申领', icon: Briefcase, bg: 'bg-orange-500', route: '/unemployment' },
  { name: '养老金测算', icon: Calculator, bg: 'bg-purple-600', route: '/pension' },
  { name: '待遇资格认证', icon: ShieldCheck, bg: 'bg-green-600', route: '/certification' },
  { name: '劳动争议调解', icon: Scale, bg: 'bg-red-600', route: '/mediation' },
  { name: '职业资格核验', icon: Award, bg: 'bg-indigo-600', route: '/qualification' },
  { name: '电子凭证', icon: CreditCard, bg: 'bg-cyan-600', route: '/e-voucher' },
  { name: '数据看板', icon: BarChart3, bg: 'bg-gov-gold', route: '/data-board' },
]

const transferStatusMap: Record<TransferApplication['status'], { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-gray-100 text-gray-600' },
  reviewing: { label: '审核中', cls: 'bg-blue-100 text-blue-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  transferring: { label: '划转中', cls: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

const transferTypeLabel: Record<string, string> = { pension: '养老保险', medical: '医疗保险' }

const priorityDot: Record<TodoItem['priority'], string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-gray-400',
}

const priorityLabel: Record<TodoItem['priority'], string> = {
  high: '紧急',
  medium: '一般',
  low: '低',
}

const notifIcon: Record<Notification['type'], React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: XCircle,
}

const notifColor: Record<Notification['type'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}

const notifIconColor: Record<Notification['type'], string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  success: 'text-green-500',
  error: 'text-red-500',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, currentRole } = useAppStore()

  const today = new Date()
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  return (
    <div className="min-h-screen bg-surface-primary p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">
            欢迎回来，{user?.name ?? '用户'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
        </div>
        <span className="gov-badge bg-gov-blue/10 text-gov-blue border border-gov-blue/20">
          {ROLE_LABELS[currentRole as UserRole] ?? currentRole}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 lg:grid-cols-3 md:grid-cols-3">
        {serviceCards.map((card) => (
          <button
            key={card.name}
            onClick={() => navigate(card.route)}
            className="gov-card gov-card-hover flex flex-col items-center gap-3 p-5 cursor-pointer
                       border border-transparent hover:border-gov-gold/50
                       hover:shadow-[0_4px_20px_rgba(201,168,76,0.2)]
                       hover:-translate-y-1 transition-all duration-200"
          >
            <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{card.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="gov-section-title">跨省通办专区</h2>
            <button
              onClick={() => navigate('/transfer')}
              className="text-sm text-gov-gold hover:text-gov-gold-dark flex items-center gap-1 transition-colors"
            >
              查看更多 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {mockTransferApplications.map((app) => {
              const st = transferStatusMap[app.status]
              return (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary/60 hover:bg-surface-hover transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {transferTypeLabel[app.transferType]} · {app.fromProvince} → {app.toProvince}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{app.id} · {app.createdAt}</p>
                  </div>
                  <span className={`gov-badge ml-3 shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="gov-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="gov-section-title">待办事项</h2>
            <span className="text-xs text-gray-400">共 {mockTodoItems.length} 项</span>
          </div>
          <div className="space-y-3">
            {mockTodoItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary/60 hover:bg-surface-hover transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDot[item.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{item.deadline}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className={`text-xs ${item.priority === 'high' ? 'text-red-500' : item.priority === 'medium' ? 'text-amber-500' : 'text-gray-400'}`}>
                      {priorityLabel[item.priority]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gov-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gov-blue" />
          <h2 className="gov-section-title">通知公告</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {mockNotifications.map((n) => {
            const Icon = notifIcon[n.type]
            return (
              <div
                key={n.id}
                className={`shrink-0 w-72 p-4 rounded-lg border ${notifColor[n.type]} transition-shadow hover:shadow-md`}
              >
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${notifIconColor[n.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    <p className="text-xs mt-1 opacity-80 line-clamp-2">{n.content}</p>
                    <p className="text-xs mt-2 opacity-50">{n.time}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
