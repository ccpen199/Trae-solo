import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ClipboardList,
  Wrench,
  User,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import { useAppStore } from '../store'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, online, setOnline, switchRole, technicians } = useAppStore()

  const isTechnician = currentUser?.role === 'technician'

  const userNavItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/my-tasks', label: '我的订单', icon: ClipboardList },
    { path: '/profile', label: '个人中心', icon: User },
  ]

  const techNavItems = [
    { path: '/tech', label: '接单大厅', icon: Home },
    { path: '/tech/tasks', label: '我的任务', icon: ClipboardList },
    { path: '/tech/profile', label: '师傅档案', icon: Wrench },
  ]

  const navItems = isTechnician ? techNavItems : userNavItems

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
            <h1 className="font-bold text-lg">修匠·去中心化</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnline(!online)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {online ? '在线' : '离线'}
            </button>
            <select
              value={isTechnician ? (currentUser?.id || '') : 'user'}
              onChange={async (e) => {
                if (e.target.value === 'user') {
                  await switchRole('user')
                  navigate('/')
                } else {
                  await switchRole('technician', e.target.value)
                  navigate('/tech')
                }
              }}
              className="text-sm border rounded-lg px-2 py-1 bg-white"
            >
              <option value="user">用户模式</option>
              {technicians.filter(t => !t.frozen).map(t => (
                <option key={t.id} value={t.id}>{t.name}（师傅）</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around h-16">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
