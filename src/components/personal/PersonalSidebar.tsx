import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Shield,
  Wallet,
  FileText,
  Paperclip,
  Clock,
  Bell,
  Settings,
} from 'lucide-react'

const menuItems = [
  { path: '/personal', label: '我的概览', icon: LayoutDashboard, end: true },
  { path: '/personal/insurance', label: '我的参保', icon: Shield },
  { path: '/personal/benefits', label: '我的待遇', icon: Wallet },
  { path: '/personal/applications', label: '我的申请', icon: FileText },
  { path: '/personal/documents', label: '我的材料', icon: Paperclip },
  { path: '/personal/progress', label: '办理进度', icon: Clock },
  { path: '/personal/notifications', label: '消息通知', icon: Bell },
  { path: '/personal/settings', label: '账号设置', icon: Settings },
]

export default function PersonalSidebar() {
  return (
    <div className="w-56 flex-shrink-0 bg-white border border-gray-100 rounded-xl p-3">
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
