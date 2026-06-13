import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Printer,
  Users,
  ClipboardList,
  MapPin,
  BarChart3,
  Coins,
  Settings,
  Package,
  LogOut,
  ChevronLeft,
  Truck,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const navGroups = [
  {
    title: "作业中心",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "工作台" },
      { to: "/print-center", icon: Printer, label: "云打印中心" },
      { to: "/order-entry", icon: ClipboardList, label: "智能录单" },
      { to: "/tracking", icon: MapPin, label: "轨迹查询" },
    ],
  },
  {
    title: "客户与运营",
    items: [
      { to: "/customers", icon: Users, label: "客户关系" },
      { to: "/analytics", icon: BarChart3, label: "经营看板" },
      { to: "/finance", icon: Coins, label: "分账对账" },
    ],
  },
  {
    title: "系统",
    items: [{ to: "/settings", icon: Settings, label: "系统设置" }],
  },
];

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "relative h-screen flex flex-col bg-ink-800 text-white transition-all duration-300 flex-shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center shadow-glow flex-shrink-0">
            <Truck size={20} />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-display font-bold text-[17px] tracking-tight">速驿通</span>
              <span className="text-[11px] text-ink-300">物流协同工作台</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3 space-y-5">
        {navGroups.map((g) => (
          <div key={g.title}>
            {!collapsed && (
              <div className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-400">
                {g.title}
              </div>
            )}
            <div className="space-y-1">
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    cn("nav-item", isActive && "nav-item-active", collapsed && "justify-center px-0")
                  }
                >
                  <it.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{it.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center font-semibold text-sm">
              {user?.realName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.realName}</div>
              <div className="text-[11px] text-ink-300 truncate">
                {user?.role === "courier" && "快递员"}
                {user?.role === "branch_admin" && "网点管理员"}
                {user?.role === "regional_supervisor" && "区域主管"}
              </div>
            </div>
            <button onClick={handleLogout} className="text-ink-300 hover:text-white transition-colors" title="退出登录">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 text-ink-300 hover:text-white"
            title="退出登录"
          >
            <LogOut size={18} />
          </button>
        )}
        <button
          onClick={onToggle}
          className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-lg text-ink-300 hover:bg-white/5 hover:text-white text-xs"
        >
          <ChevronLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>收起菜单</span>}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-grid-ink bg-grid opacity-[0.06] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
    </aside>
  );
}
