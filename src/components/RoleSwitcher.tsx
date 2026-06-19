import { useState } from 'react'
import { useAuthStore, useAuthStore as authStore, UserRole } from '@/store/auth'
import { useBusinessStore } from '@/store/business'
import { Users, Building2, Shield, ChevronRight, RefreshCw } from 'lucide-react'

interface Props {
  onClose?: () => void
}

const roleOptions: {
  role: UserRole
  title: string
  subtitle: string
  icon: typeof Users
  gradient: string
}[] = [
  { role: 'direct_seller', title: '直销员视角', subtitle: '个人展业 · 客户管理 · 业绩追踪', icon: Users, gradient: 'from-emerald-500 to-teal-600' },
  { role: 'store_owner', title: '生活馆店主视角', subtitle: '门店运营 · 预约管理 · 服务记录', icon: Building2, gradient: 'from-amber-500 to-orange-600' },
  { role: 'hq_admin', title: '总部运营视角', subtitle: '全局管控 · 数据看板 · 合规风控', icon: Shield, gradient: 'from-sky-500 to-blue-600' },
]

export default function RoleSwitcher({ onClose }: Props) {
  const { user, login } = useAuthStore()
  const { addToast, setCurrentViewRole } = useBusinessStore()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)

  const handleSwitch = async (role: UserRole) => {
    setLoadingRole(role)
    try {
      await login(role, user?.phone || '138****8888')
      setCurrentViewRole(role)
      addToast({
        type: 'success',
        title: `已切换至${roleOptions.find((r) => r.role === role)?.title}`,
        description: '菜单和业务数据已同步更新',
      })
    } finally {
      setLoadingRole(null)
      onClose?.()
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-500 mb-4">
        切换工作台视角，体验不同角色的业务流程（数据会自动适配角色）
      </div>
      {roleOptions.map((item) => {
        const Icon = item.icon
        const isCurrent = user?.role === item.role
        const isLoading = loadingRole === item.role
        return (
          <button
            key={item.role}
            onClick={() => handleSwitch(item.role)}
            disabled={isLoading || isCurrent}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 group ${
              isCurrent
                ? `border-transparent bg-gradient-to-r ${item.gradient} text-white shadow-lg cursor-default`
                : isLoading
                ? 'border-slate-200 bg-slate-50 opacity-70 cursor-wait'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md cursor-pointer'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isCurrent ? 'bg-white/20' : `bg-gradient-to-br ${item.gradient}`
              }`}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-white'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold ${isCurrent ? 'text-white' : 'text-slate-800'}`}>
                {item.title}
                {isCurrent && <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">当前</span>}
              </div>
              <div className={`text-sm mt-0.5 ${isCurrent ? 'text-white/80' : 'text-slate-500'}`}>
                {item.subtitle}
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 ${isCurrent ? 'text-white/70' : 'text-slate-300 group-hover:text-slate-500'} transition`}
            />
          </button>
        )
      })}
    </div>
  )
}
