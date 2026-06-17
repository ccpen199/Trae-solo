import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Grid3X3, ClipboardList, LayoutDashboard, User } from 'lucide-react'

const tabs = [
  { path: '/', label: '首页', icon: Home },
  { path: '/category/food', label: '分类', icon: Grid3X3 },
  { path: '/orders', label: '订单', icon: ClipboardList },
  { path: '/admin', label: '运营', icon: LayoutDashboard },
  { path: '/orders', label: '我的', icon: User },
].filter((t, i, arr) => arr.findIndex((x) => x.path === t.path) === i)

export default function BottomTab() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    if (path === '/admin') return location.pathname.startsWith('/admin')
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-border)] md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors relative ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span>{tab.label}</span>
              {tab.path === '/admin' && (
                <span className="absolute -top-0.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" title="运营后台入口" />
              )}
              {tab.path === '/orders' && (
                <span className="absolute -top-0.5 right-1.5 px-1 rounded-full bg-danger text-[9px] text-white leading-3" title="我的订单">3</span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
