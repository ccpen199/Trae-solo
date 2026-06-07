import { useAppStore } from '@/lib/store'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User } from 'lucide-react'

export default function TopBar() {
  const { user, currentTaxpayer, logout } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabels: Record<string, string> = {
    taxpayer: '纳税人',
    admin: '管理员',
    agent: '代理',
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {currentTaxpayer && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
            <User size={14} />
            <span>{currentTaxpayer.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-800">{user?.real_name}</div>
            <div className="text-xs text-gray-500">{roleLabels[user?.role || '']}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
