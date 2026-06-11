import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import {
  Home, UtensilsCrossed, Bike, ShoppingBag, Clock, Truck,
  MessageCircle, BookOpen, Briefcase, Settings, Building2,
  MapPin, ShieldCheck, BarChart3, Activity, Search, Bell,
  Menu, X, LogOut,
} from 'lucide-react'
import { useStore } from '@/store'

const navConfig = [
  {
    label: '首页',
    items: [{ path: '/', icon: Home, label: '首页概览', end: true }],
  },
  {
    label: '餐饮',
    items: [
      { path: '/dining', icon: UtensilsCrossed, label: '餐饮首页', end: true },
      { path: '/dining/rider', icon: Bike, label: '骑手中心', end: false },
    ],
  },
  {
    label: '超市',
    items: [
      { path: '/store', icon: ShoppingBag, label: '超市首页', end: true },
      { path: '/store/expiring', icon: Clock, label: '临期专区', end: false },
      { path: '/store/deliverer', icon: Truck, label: '配送员', end: false },
    ],
  },
  {
    label: '社交',
    items: [
      { path: '/social', icon: MessageCircle, label: '社交首页', end: true },
      { path: '/social/trade', icon: BookOpen, label: '二手交易', end: false },
      { path: '/social/intern', icon: Briefcase, label: '实习内推', end: false },
    ],
  },
  {
    label: '管理控制台',
    items: [
      { path: '/admin', icon: Settings, label: '管理总览', end: true },
      { path: '/admin/org', icon: Building2, label: '组织架构', end: false },
      { path: '/admin/geofence', icon: MapPin, label: '地理围栏', end: false },
      { path: '/admin/verify', icon: ShieldCheck, label: '认证审核', end: false },
      { path: '/admin/analytics', icon: BarChart3, label: '数据分析', end: false },
      { path: '/admin/sentiment', icon: Activity, label: '舆情监控', end: false },
    ],
  },
]

const groupIcons: Record<string, string> = {
  '餐饮': '🍜',
  '超市': '🛒',
  '社交': '💬',
  '管理控制台': '⚙️',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const notifBtnRef = useRef<HTMLButtonElement>(null)
  const user = useStore((s) => s.user)
  const notifications = useStore((s) => s.notifications)
  const unreadCount = useStore((s) => s.unreadCount())
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        notifRef.current && !notifRef.current.contains(e.target as Node) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
          bg-gradient-to-b from-primary-indigo via-primary-indigo to-primary-indigo/95
          text-white shadow-soft-lg
          transform transition-transform duration-300 ease-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-5 shrink-0 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mr-3 shadow-brand">
            <span className="text-white font-bold text-sm">校</span>
          </div>
          <div>
            <span className="font-display text-lg font-bold text-primary-orange">校园生活</span>
            <span className="ml-1.5 text-xs text-white/50">Campus Hub</span>
          </div>
          <button className="ml-auto lg:hidden p-1 rounded-md hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navConfig.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <span>{groupIcons[group.label] || ''}</span>
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 mb-0.5
                    ${isActive
                      ? 'bg-primary-orange text-white shadow-brand font-medium'
                      : 'text-white/65 hover:text-white hover:bg-white/8'}`
                  }
                >
                  <item.icon size={17} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 shrink-0 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full gradient-warm flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-white/40">余额 ¥{user.balance.toFixed(2)}</div>
            </div>
            <button className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-3 shrink-0 shadow-soft">
          <button
            className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-primary-indigo" />
          </button>

          <div className="flex-1 max-w-lg relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="搜索食堂、商品、帖子..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50/80 border border-gray-100 text-sm
                placeholder:text-gray-300 focus:outline-none focus:border-primary-orange/40
                focus:ring-2 focus:ring-primary-orange/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              ref={notifBtnRef}
              className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell size={19} className="text-primary-indigo/70" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-secondary-coralRed text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-brand animate-pulse-brand">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-gray-100">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-brand">
                {user.name[0]}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-primary-indigo leading-tight">{user.name}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{user.department}</div>
              </div>
            </div>
          </div>
        </header>

        {notifOpen && (
          <div
            ref={notifRef}
            className="absolute top-14 right-4 lg:right-6 w-80 bg-white rounded-2xl shadow-brand-lg border border-gray-100/80 z-50 animate-slide-down overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-indigo/5 to-primary-orange/5">
              <span className="font-semibold text-sm text-primary-indigo">通知中心</span>
              <button
                className="text-xs text-primary-orange hover:underline font-medium"
                onClick={markAllNotificationsRead}
              >
                全部已读
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 transition-colors ${n.read ? 'bg-white' : 'bg-primary-orange/3'}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.type === 'success' ? 'bg-secondary-mintGreen' :
                      n.type === 'warning' ? 'bg-secondary-warmYellow' :
                      n.type === 'error' ? 'bg-secondary-coralRed' : 'bg-primary-orange'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary-indigo">{n.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
