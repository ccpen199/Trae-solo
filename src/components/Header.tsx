import { Menu, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '@/store'

const breadcrumbMap: Record<string, string> = {
  '/': '首页',
  '/pickup': '预约取件',
  '/scan': '面单识别',
  '/waybill': '运单管理',
  '/tracking': '物流追踪',
  '/contraband': '违禁品识别',
  '/freight': '运费计算',
  '/complaint': '投诉工单',
  '/invoice': '电子发票',
  '/membership': '会员中心',
}

export default function Header() {
  const { currentUser, toggleMobileSidebar } = useAppStore()
  const location = useLocation()

  const breadcrumb = breadcrumbMap[location.pathname] || '页面'

  const initials = currentUser.name.slice(0, 1)

  return (
    <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <nav className="text-sm text-slate-400">
          <span className="text-slate-600">控制台</span>
          <span className="mx-2 text-slate-700">/</span>
          <span className="text-slate-200">{breadcrumb}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-medium">
            {initials}
          </div>
          <span className="text-sm text-slate-300 hidden sm:inline">{currentUser.name}</span>
        </div>
      </div>
    </header>
  )
}
