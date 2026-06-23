import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Box,
  Battery,
  Users,
  ShoppingCart,
  Bell,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@shared/utils'
import { useAlertStore } from '@shared/stores/alertStore'

const menuItems = [
  { path: '/admin/dashboard', label: '数据总览', icon: LayoutDashboard },
  { path: '/admin/cabinets', label: '换电柜管理', icon: Box },
  { path: '/admin/batteries', label: '电池管理', icon: Battery },
  { path: '/admin/riders', label: '骑士管理', icon: Users },
  { path: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { path: '/admin/alerts', label: '告警中心', icon: Bell },
  { path: '/admin/heatmap', label: '热力分析', icon: MapPin },
  { path: '/admin/settings', label: '系统设置', icon: Settings },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { alerts, unreadCount } = useAlertStore()
  const navigate = useNavigate()

  const pendingAlerts = alerts.filter((a) => a.status === 'pending').slice(0, 5)

  return (
    <div className="flex h-screen bg-cyber-darker text-white overflow-hidden">
      {/* 移动端菜单遮罩 */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 72 : 256,
          x: mobileMenuOpen ? 0 : -256,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed lg:relative z-50 h-full bg-cyber-dark border-r border-cyber-border flex flex-col',
          'lg:translate-x-0'
        )}
      >
        {/* Logo 区域 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyber-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-accent to-cyan-600 flex items-center justify-center glow-border">
              <Battery className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-rajdhani font-bold text-lg text-cyber-accent glow-text">
                  PowerSwap
                </span>
                <span className="text-xs text-cyber-muted">运营管理后台</span>
              </motion.div>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-cyber-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        'hover:bg-cyber-light/50 hover:text-cyber-accent',
                        isActive
                          ? 'bg-cyber-accent/10 text-cyber-accent border-l-2 border-cyber-accent'
                          : 'text-gray-300 border-l-2 border-transparent'
                      )
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-rajdhani text-sm tracking-wide"
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {item.path === '/admin/alerts' && unreadCount > 0 && (
                      <span
                        className={cn(
                          'ml-auto bg-cyber-danger text-white text-xs rounded-full flex items-center justify-center',
                          collapsed ? 'w-5 h-5 text-[10px]' : 'min-w-[20px] h-5 px-1.5'
                        )}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 折叠按钮 */}
        <div className="p-3 border-t border-cyber-border hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-light/30 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="ml-2 text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-cyber-dark/80 backdrop-blur border-b border-cyber-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-cyber-muted hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
              <input
                type="text"
                placeholder="搜索柜体、电池、订单..."
                className="w-64 h-9 pl-10 pr-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* 告警通知 */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-light/30 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-cyber-danger text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
                      <span className="font-rajdhani font-semibold text-cyber-accent">
                        最新告警
                      </span>
                      <button
                        onClick={() => navigate('/admin/alerts')}
                        className="text-xs text-cyber-muted hover:text-cyber-accent"
                      >
                        查看全部
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {pendingAlerts.length > 0 ? (
                        pendingAlerts.map((alert) => (
                          <div
                            key={alert.alert_id}
                            className="px-4 py-3 border-b border-cyber-border/50 hover:bg-cyber-light/30 cursor-pointer transition-colors"
                            onClick={() => {
                              navigate('/admin/alerts')
                              setShowNotifications(false)
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                                  alert.level === 'critical'
                                    ? 'bg-cyber-danger animate-pulse'
                                    : alert.level === 'warning'
                                    ? 'bg-cyber-warning'
                                    : 'bg-cyber-accent'
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {alert.title}
                                </p>
                                <p className="text-xs text-cyber-muted mt-0.5">
                                  {alert.cabinet_name || alert.battery_id}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-cyber-muted text-sm">
                          暂无待处理告警
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 用户信息 */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 lg:gap-3 p-1.5 rounded-lg hover:bg-cyber-light/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-accent to-cyan-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium">管理员</p>
                  <p className="text-xs text-cyber-muted">超级管理员</p>
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-cyber-border">
                      <p className="text-sm font-medium">管理员</p>
                      <p className="text-xs text-cyber-muted">admin@powerswap.com</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/admin/settings')
                          setShowUserMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-cyber-light/30 hover:text-cyber-accent flex items-center gap-2 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>系统设置</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-cyber-danger hover:bg-cyber-danger/10 flex items-center gap-2 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="min-w-[1200px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
