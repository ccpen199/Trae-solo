import { useNavigate, NavLink } from 'react-router-dom'
import { Home, ShoppingCart, Target, MapPin, FileText, Newspaper, User, LogOut, Shield } from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/market', label: '供需大厅', icon: ShoppingCart },
  { to: '/match', label: '智能匹配', icon: Target },
  { to: '/map', label: '产业地图', icon: MapPin },
  { to: '/orders', label: '订单中心', icon: FileText },
  { to: '/news', label: '资讯报告', icon: Newspaper },
]

const roleLabels: Record<string, string> = {
  buyer: '采购商',
  factory: '加工厂',
  supplier: '辅料供应商',
  designer: '设计师',
  admin: '管理员',
}

export default function Sidebar() {
  const currentUser = useStore((s) => s.currentUser)
  const logout = useStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-navy-700 flex flex-col shrink-0">
      <div className="px-6 pt-6 pb-4">
        <h1 className="font-serif text-2xl font-bold text-gradient-gold">织链</h1>
        <p className="text-navy-300 text-xs mt-1">产业链撮合平台</p>
        <div className="mt-3 h-0.5 bg-gradient-to-r from-amber-400 to-transparent" />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-navy-600">
        {currentUser && (
          <div className="mb-3">
            {currentUser.verified ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Shield size={14} />
                <span>已认证</span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Shield size={14} />
                <span>资质未认证，点击验证</span>
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy-500 flex items-center justify-center">
            <User size={16} className="text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-navy-300">{currentUser ? roleLabels[currentUser.role] : ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-navy-600 transition-colors text-navy-300 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
