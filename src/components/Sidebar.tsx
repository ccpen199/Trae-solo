import { NavLink, useLocation } from "react-router-dom"
import { Home, LayoutGrid, MessageCircle, User, MessageSquare, Search } from "lucide-react"
import { motion } from "framer-motion"

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/services", label: "服务大厅", icon: LayoutGrid },
  { path: "/search", label: "搜索办事", icon: Search },
  { path: "/assistant", label: "智能问答", icon: MessageCircle },
  { path: "/profile", label: "个人中心", icon: User },
  { path: "/feedback", label: "服务反馈", icon: MessageSquare },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col shadow-2xl">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-lg">郑</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">掌上办事中枢</h1>
            <p className="text-blue-300 text-[10px] mt-0.5">郑州市政务服务</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-blue-500/20 rounded-xl border border-blue-400/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span
                className={`relative z-10 transition-colors ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="px-4 pb-6">
        <div className="rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/10 p-4">
          <p className="text-white/80 text-xs leading-relaxed">
            📞 24小时政务服务热线
          </p>
          <p className="text-white font-bold text-lg mt-1">12345</p>
        </div>
      </div>
    </aside>
  )
}
