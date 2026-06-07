import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  Wallet,
  User,
  ShieldCheck,
  BarChart3,
  Users,
  Package,
  ShieldAlert,
  Map,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Zap,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { auth } from '../api'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const riderNavItems: NavItem[] = [
  { to: '/rider/dashboard', label: '工作台', icon: <LayoutDashboard size={20} /> },
  { to: '/rider/orders', label: '订单管理', icon: <ClipboardList size={20} /> },
  { to: '/rider/orders/nearby', label: '附近订单', icon: <MapPin size={20} /> },
  { to: '/rider/wallet', label: '钱包', icon: <Wallet size={20} /> },
  { to: '/rider/profile', label: '个人中心', icon: <User size={20} /> },
  { to: '/rider/verify', label: '实名认证', icon: <ShieldCheck size={20} /> },
]

const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard', label: '数据看板', icon: <BarChart3 size={20} /> },
  { to: '/admin/riders', label: '骑手管理', icon: <Users size={20} /> },
  { to: '/admin/orders', label: '订单管理', icon: <Package size={20} /> },
  { to: '/admin/risk', label: '风控审核', icon: <ShieldAlert size={20} /> },
  { to: '/admin/capacity', label: '运力看板', icon: <Map size={20} /> },
  { to: '/admin/contracts', label: '合规管理', icon: <FileText size={20} /> },
  { to: '/admin/config', label: '系统配置', icon: <Settings size={20} /> },
]

interface LayoutProps {
  type: 'rider' | 'admin'
}

export default function Layout({ type }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { token, rider, logout, setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      if (!token) {
        navigate('/login', { replace: true })
        return
      }
      if (rider) {
        if (type === 'admin' && rider.role !== 'admin') {
          navigate('/rider/dashboard', { replace: true })
          return
        }
        if (type === 'rider' && rider.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
          return
        }
        if (mounted) setReady(true)
        return
      }
      try {
        const userData = await auth.getMe()
        if (userData) {
          setAuth(token, userData)
          if (type === 'admin' && userData.role !== 'admin') {
            navigate('/rider/dashboard', { replace: true })
            return
          }
          if (type === 'rider' && userData.role === 'admin') {
            navigate('/admin/dashboard', { replace: true })
            return
          }
          if (mounted) setReady(true)
        } else {
          logout()
          navigate('/login', { replace: true })
        }
      } catch {
        logout()
        navigate('/login', { replace: true })
      }
    }
    checkAuth()
    return () => { mounted = false }
  }, [token, rider, type, navigate, logout, setAuth])

  useEffect(() => {
    setSidebarOpen(false)
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-primary">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">加载中...</span>
        </div>
      </div>
    )
  }

  const navItems = type === 'rider' ? riderNavItems : adminNavItems
  const logoText = type === 'rider' ? '闪送平台' : '闪送管理后台'

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-secondary text-white transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Zap size={24} className="text-primary" />
            <span className="font-display font-bold text-lg">{logoText}</span>
          </div>
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/rider/dashboard' || item.to === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            {type === 'rider' && rider && (
              <div className="text-sm text-gray-600">
                余额: <span className="font-bold text-primary">¥{rider.balance?.toFixed(2) || '0.00'}</span>
              </div>
            )}
            <button className="relative text-gray-500 hover:text-gray-700">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full" />
            </button>
            <span className="text-sm font-medium text-gray-700">{rider?.name || '用户'}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-danger transition-colors"
            >
              <LogOut size={16} />
              退出
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F8F9FA] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
