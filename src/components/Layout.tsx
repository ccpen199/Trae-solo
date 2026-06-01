import { NavLink, Outlet, useLocation } from "react-router-dom"
import { ClipboardList, Route, MapPin, HeadphonesIcon, Calculator, LayoutDashboard, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "工作台" },
  { to: "/orders", icon: ClipboardList, label: "安装订单" },
  { to: "/dispatches", icon: Route, label: "派工管理" },
  { to: "/on-site", icon: MapPin, label: "上门记录" },
  { to: "/service-tickets", icon: HeadphonesIcon, label: "客服工单" },
  { to: "/settlements", icon: Calculator, label: "结算管理" },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
          <Wrench className="h-6 w-6 text-blue-600" />
          <span className="text-base font-bold text-gray-900">家电售后履约平台</span>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
