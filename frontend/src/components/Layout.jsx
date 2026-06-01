import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Home, FileText, Hotel, ShoppingBag, Users, User } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/articles', icon: FileText, label: '资讯' },
  { path: '/hotels', icon: Hotel, label: '酒店' },
  { path: '/products', icon: ShoppingBag, label: '商城' },
  { path: '/community', icon: Users, label: '社区' },
  { path: '/profile', icon: User, label: '我的' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen pb-16">
      <main className="max-w-md mx-auto bg-white min-h-screen">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2 safe-bottom">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
