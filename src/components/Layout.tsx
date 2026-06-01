import { useState } from "react"
import { NavLink, useLocation, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  Ship,
  FileText,
  Radar,
  AlertTriangle,
  BarChart3,
  Bell,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore, type UserRole } from "@/store/app"
import { useTheme } from "@/hooks/useTheme"

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/vessels", label: "渔船档案", icon: Ship },
  { path: "/declarations", label: "出海申报", icon: FileText },
  { path: "/monitor", label: "实时监管", icon: Radar },
  { path: "/events", label: "事件处置", icon: AlertTriangle },
  { path: "/reports", label: "统计报表", icon: BarChart3 },
]

const roles: UserRole[] = ["渔政监管", "船东", "港口人员", "值班人员"]

const breadcrumbMap: Record<string, string> = {
  "/": "仪表盘",
  "/vessels": "渔船档案",
  "/declarations": "出海申报",
  "/monitor": "实时监管",
  "/events": "事件处置",
  "/reports": "统计报表",
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  const crumbs: { label: string; path: string }[] = [{ label: "首页", path: "/" }]
  let current = ""
  for (const part of parts) {
    current += "/" + part
    const label = breadcrumbMap[current]
    if (label) {
      crumbs.push({ label, path: current })
    } else {
      const subMap: Record<string, string> = {
        new: "新建",
        detail: "详情",
      }
      crumbs.push({ label: subMap[part] || part, path: current })
    }
  }
  return crumbs
}

export default function Layout() {
  const [roleOpen, setRoleOpen] = useState(false)
  const { currentRole, setCurrentRole, getRoleConfig } = useAppStore()
  const { theme, toggleTheme, isDark } = useTheme()
  const location = useLocation()
  const breadcrumbs = getBreadcrumbs(location.pathname)
  const roleConfig = getRoleConfig()
  const visibleNavs = navItems.filter(item => roleConfig.visibleNavs.includes(item.path))

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-slate-900 text-white z-40 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-slate-700/50">
          <span className="text-xl">🐟</span>
          <span className="ml-2 text-lg font-bold tracking-wide">渔船监管</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleNavs.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => {
                const base = "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors"
                if (isActive) {
                  return `${base} bg-sky-900/50 text-sky-300 hover:bg-sky-900/50`
                }
                return `${base} text-slate-300 hover:bg-slate-800 hover:text-white`
              }}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 relative">
          <button
            onClick={() => setRoleOpen(!roleOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-800 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <span>角色: {currentRole}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", roleOpen && "rotate-180")} />
          </button>
          {roleOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => { setCurrentRole(role); setRoleOpen(false) }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors",
                    role === currentRole ? "text-sky-300" : "text-slate-300"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="ml-60">
        <header className="fixed top-0 right-0 left-60 h-14 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.path} className="flex items-center gap-2">
                {idx > 0 && <span className="text-slate-400">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-slate-900 font-medium">{crumb.label}</span>
                ) : (
                  <span className="text-slate-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{currentRole}</span>
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-slate-600" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </header>

        <main className="mt-14 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
