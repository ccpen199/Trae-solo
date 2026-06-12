import { Link, Outlet, useLocation } from 'react-router-dom'
import { Building2, ClipboardCheck, ShieldCheck, BarChart3, Stethoscope, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store'
import { useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/admin/dashboard', label: '统计看板', icon: BarChart3 },
  { path: '/admin/institutions', label: '机构年审', icon: Building2 },
  { path: '/admin/jobs-review', label: '岗位审核', icon: ClipboardCheck },
  { path: '/admin/data-masking', label: '数据脱敏', icon: ShieldCheck },
]

export default function AdminLayout() {
  const location = useLocation()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-60 bg-teal-800 text-white flex flex-col shrink-0">
        <div className="p-4 flex items-center gap-2 border-b border-teal-700">
          <Stethoscope className="w-6 h-6" />
          <span className="font-heading text-lg font-bold">医聘通管理</span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                  active ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-teal-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-teal-200 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出管理后台
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
