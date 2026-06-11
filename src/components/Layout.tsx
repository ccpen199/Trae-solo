import { useState } from "react"
import { useLocation, Link, Outlet } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  Droplets,
  Thermometer,
  Receipt,
  Wallet,
  Monitor,
  AlertTriangle,
  Upload,
  LayoutDashboard,
  MapPin,
  Activity,
  TrendingUp,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useStore } from "@/store"
import type { UserRole } from "@/types"

interface NavItem {
  label: string
  icon: React.ElementType
  path: string
}

const navMap: Record<UserRole, NavItem[]> = {
  student: [
    { label: "首页", icon: Droplets, path: "/student" },
    { label: "取水", icon: Thermometer, path: "/student/dispense" },
    { label: "账单", icon: Receipt, path: "/student/bills" },
    { label: "充值", icon: Wallet, path: "/student/recharge" },
  ],
  operator: [
    { label: "设备监控", icon: Monitor, path: "/operator" },
    { label: "告警中心", icon: AlertTriangle, path: "/operator/alerts" },
    { label: "固件管理", icon: Upload, path: "/operator/firmware" },
  ],
  investor: [
    { label: "总览", icon: LayoutDashboard, path: "/investor" },
    { label: "设备地图", icon: MapPin, path: "/investor/map" },
    { label: "设备分析", icon: Activity, path: "/investor/analysis" },
    { label: "ROI", icon: TrendingUp, path: "/investor/roi" },
  ],
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const currentUser = useStore((s) => s.currentUser)
  const notifications = useStore((s) => s.notifications)
  const logout = useStore((s) => s.logout)
  const clearNotifications = useStore((s) => s.clearNotifications)
  const role = currentUser?.role ?? "student"
  const navItems = navMap[role]

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-30 flex h-full w-64 flex-col bg-[#0A2E3C] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Droplets className="h-7 w-7 text-[#FF6B35]" />
            <div>
              <span className="font-display text-lg font-bold tracking-tight">
                WaterIoT
              </span>
              <p className="text-[10px] text-white/45">
                {role === "student" ? "学生取水服务" : role === "operator" ? "校园设备管理后台" : "投资商数据概览"}
              </p>
            </div>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#FF6B35] text-white"
                    : "text-gray-300 hover:bg-[#0D3D4F] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-xs text-gray-400">{role === "student" ? "学生端" : role === "operator" ? "运维管理端 · 运营后台" : "投资商管理端"}</p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button
              className="relative"
              onClick={clearNotifications}
            >
              <Bell className="h-5 w-5 text-gray-500" />
              {notifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white">
                  {notifications}
                </span>
              )}
            </button>

            {currentUser && (
              <span className="hidden text-sm text-gray-600 sm:block">
                {currentUser.phone}
              </span>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
