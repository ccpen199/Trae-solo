import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import {
  LayoutDashboard, Building2, Home, Users, CreditCard,
  KeyRound, Wrench, FileCheck, HandCoins, MessageSquare,
  Settings, ChevronLeft, ChevronRight, Bell
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

const menuItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "社区数据看板" },
  { to: "/communities", icon: Building2, label: "小区管理" },
  { to: "/properties", icon: Home, label: "房源搜索筛选" },
  { to: "/agents", icon: Users, label: "经纪人管理" },
  { to: "/ai-cards", icon: CreditCard, label: "AI房卡" },
  { to: "/mortgage", icon: HandCoins, label: "房贷计算器" },
  { to: "/delegations", icon: FileCheck, label: "业主委托中心" },
  { to: "/xiangyu", icon: KeyRound, label: "相寓管家" },
  { to: "/collaboration", icon: MessageSquare, label: "经纪人协作" },
  { to: "/verification", icon: Wrench, label: "房源核验流水线" },
  { to: "/admin", icon: Settings, label: "后台管理" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, currentUser } = useAppStore();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex items-center h-16 px-4 border-b border-slate-700">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white">
            房
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 font-semibold text-lg">社区房产服务</span>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center h-12 mx-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-400 pl-3"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white pl-4"
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleSidebar}
          className="h-12 border-t border-slate-700 flex items-center justify-center hover:bg-slate-700/50 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="text-gray-600 text-sm">
            {location.pathname === "/dashboard" && "社区深度运营 · 数据看板"}
            {location.pathname.startsWith("/communities") && "小区管理 · 全景视图"}
            {location.pathname.startsWith("/properties") && "房源管理 · VR/实勘/价格趋势"}
            {location.pathname.startsWith("/agents") && "经纪人管理 · 我爱我家认证"}
            {location.pathname.startsWith("/ai-cards") && "AI房卡 · 智能匹配推送"}
            {location.pathname.startsWith("/mortgage") && "房贷计算器 · 组合贷/公积金试算"}
            {location.pathname.startsWith("/delegations") && "业主委托中心 · 专属经纪人绑定"}
            {location.pathname.startsWith("/xiangyu") && "相寓管家 · 智能门锁/保洁/报修"}
            {location.pathname.startsWith("/collaboration") && "经纪人协作 · 客户共享/带看归集"}
            {location.pathname.startsWith("/verification") && "房源真实性核验 · AI比对流水线"}
            {location.pathname.startsWith("/admin") && "后台管理 · 业务配置/审核/报表"}
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {currentUser?.name}
                </div>
                <div className="text-xs text-gray-500">
                  {currentUser?.role === "admin" ? "系统管理员" : currentUser?.role}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
