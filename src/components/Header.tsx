import { useAppStore } from '@/stores/useAppStore'
import { Bell, Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { currentRole } = useAppStore()
  const [showNotifications, setShowNotifications] = useState(false)

  const roleLabels: Record<string, string> = {
    user: '用户端',
    engineer: '工程师端',
    supplier: '供应商端',
    admin: '管理后台',
  }

  return (
    <header className="sticky top-0 z-40 h-14 bg-navy-800/80 backdrop-blur-xl border-b border-cyber-400/10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <span className="tag-cyber">{roleLabels[currentRole]}</span>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-md mx-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-200" />
          <input
            type="text"
            placeholder="搜索服务、工程师、配件..."
            className="w-full pl-10 pr-4 py-1.5 rounded-lg bg-navy-700/50 border border-cyber-400/10 text-sm text-white placeholder-navy-200 focus:outline-none focus:border-cyber-400/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg hover:bg-navy-700/50 text-navy-200 hover:text-white transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-warm-500" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-navy-700/50 rounded-lg px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-xs font-bold text-navy-900">
            {currentRole === 'user' ? '刘' : currentRole === 'engineer' ? '张' : currentRole === 'admin' ? '管' : '供'}
          </div>
          <span className="text-sm text-navy-100">
            {currentRole === 'user' ? '刘女士' : currentRole === 'engineer' ? '张明辉' : currentRole === 'admin' ? '管理员' : '供应商A'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-navy-200" />
        </div>
      </div>
    </header>
  )
}
