import { NavLink, Outlet } from 'react-router-dom'
import { Compass, Target, Briefcase, BookOpen, Users, Home } from 'lucide-react'

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/competency', label: '能力图谱', icon: Compass },
  { path: '/gap-diagnosis', label: '差距诊断', icon: Target },
  { path: '/job-match', label: '职位匹配', icon: Briefcase },
  { path: '/encyclopedia', label: '职业百科', icon: BookOpen },
  { path: '/hr-tools', label: 'HR工具', icon: Users },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">CareerPath</h1>
              <p className="text-xs text-gray-400">职业发展导向匹配</p>
            </div>
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-bold">
              张
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">张明</p>
              <p className="text-xs text-gray-400">初级前端工程师</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="ml-64 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
