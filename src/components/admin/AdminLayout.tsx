import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Shield, LayoutDashboard, Store, Newspaper, LayoutGrid,
  ClipboardCheck, ClipboardList, MapPin, HeartHandshake,
  UserRound, Truck, LogOut, Bell, ChevronRight, Menu, X
} from 'lucide-react'

type MenuItem = {
  label: string
  to: string
  icon: LucideIcon
}

type NavSection = {
  label: string
  items: MenuItem[]
}

const navSections: NavSection[] = [
  {
    label: '概览',
    items: [
      { label: '运营看板', to: '/admin/overview', icon: LayoutDashboard },
    ],
  },
  {
    label: '信息管理',
    items: [
      { label: '商户管理', to: '/admin/merchants', icon: Store },
      { label: '资讯栏目', to: '/admin/news', icon: Newspaper },
      { label: '分类信息', to: '/admin/posts', icon: LayoutGrid },
    ],
  },
  {
    label: '内容审核',
    items: [
      { label: '审核管理', to: '/admin/audit', icon: ClipboardCheck },
    ],
  },
  {
    label: '订单分发',
    items: [
      { label: '订单管理', to: '/admin/orders', icon: ClipboardList },
      { label: '乡镇分发', to: '/admin/distribution', icon: MapPin },
    ],
  },
  {
    label: '服务对接',
    items: [
      { label: '民生服务', to: '/admin/services', icon: HeartHandshake },
    ],
  },
  {
    label: '骑手配送',
    items: [
      { label: '骑手管理', to: '/admin/riders', icon: UserRound },
      { label: '配送订单', to: '/admin/delivery', icon: Truck },
    ],
  },
]

const breadcrumbMap: Record<string, string[]> = {
  '/admin/overview': ['运营管理', '运营看板'],
  '/admin/merchants': ['信息管理', '商户管理'],
  '/admin/news': ['信息管理', '资讯栏目'],
  '/admin/posts': ['信息管理', '分类信息'],
  '/admin/audit': ['内容审核', '审核管理'],
  '/admin/orders': ['订单分发', '订单管理'],
  '/admin/distribution': ['订单分发', '乡镇分发'],
  '/admin/services': ['服务对接', '民生服务'],
  '/admin/riders': ['骑手配送', '骑手管理'],
  '/admin/delivery': ['骑手配送', '配送订单'],
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const breadcrumbs = breadcrumbMap[location.pathname] || ['运营管理']

  return (
    <div className="flex h-screen bg-rock-50 overflow-hidden">
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-lg bg-rock-900 text-white flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-rock-900 text-white flex flex-col md:translate-x-0 transition-transform duration-300`}
      >
        <div className="flex items-center justify-between p-5 border-b border-rock-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-jade-500/20 flex items-center justify-center">
              <Shield size={22} className="text-jade-400" />
            </div>
            <div>
              <h1 className="font-serif text-jade-400 font-bold text-base leading-tight">
                镇雄本地通
              </h1>
              <p className="text-rock-400 text-xs">运营后台</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-rock-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <h2 className="px-3 mb-2 text-xs font-semibold text-rock-500 uppercase tracking-wider">
                {section.label}
              </h2>
              <div className="space-y-1">
                {section.items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border-l-2 ${
                        isActive
                          ? 'bg-jade-500/20 text-jade-400 border-l-jade-400'
                          : 'text-rock-300 hover:bg-rock-800 hover:text-white border-l-transparent'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-rock-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center font-semibold">
              管
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">平台管理员</p>
              <p className="text-xs text-rock-500">超级管理员</p>
            </div>
            <button className="text-rock-400 hover:text-white transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-rock-200 flex items-center justify-between px-4 md:px-6 md:pl-6">
          <div className="ml-12 md:ml-0 flex items-center gap-2 text-sm text-rock-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight size={14} className="text-rock-300" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-rock-900 font-medium' : ''}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-lg hover:bg-rock-100 flex items-center justify-center text-rock-500 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-ember-500" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white font-semibold cursor-pointer">
              管
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
