import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MapPin,
  CreditCard,
  Truck,
  MessageSquare,
  Gift,
  BarChart3,
  DollarSign,
  ShieldAlert,
  Trophy,
  AlertTriangle,
  LogOut,
  Bell,
  ChevronRight,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store";
import type { UserRole } from "@shared/types";

const shipperMenu = [
  { path: "/shipper/dashboard", label: "工作台", icon: LayoutDashboard },
  { path: "/shipper/cargo/publish", label: "发布货源", icon: Package },
  { path: "/shipper/cargo/list", label: "货源管理", icon: BarChart3 },
  { path: "/shipper/waybill/track", label: "在途追踪", icon: MapPin },
  { path: "/shipper/credit", label: "信用中心", icon: CreditCard },
];

const driverMenu = [
  { path: "/driver/dashboard", label: "工作台", icon: LayoutDashboard },
  { path: "/driver/empty-report", label: "空车上报", icon: Truck },
  { path: "/driver/cargo-hall", label: "货源大厅", icon: Package },
  { path: "/driver/negotiation", label: "议价中心", icon: MessageSquare },
  { path: "/driver/points-mall", label: "积分商城", icon: Gift },
];

const adminMenu = [
  { path: "/admin/dashboard", label: "数据看板", icon: LayoutDashboard },
  { path: "/admin/pricing-model", label: "运价模型", icon: DollarSign },
  { path: "/admin/risk-monitor", label: "风控监控", icon: ShieldAlert },
  { path: "/admin/driver-growth", label: "司机成长", icon: Trophy },
  { path: "/admin/traffic-control", label: "交通管制", icon: AlertTriangle },
];

const roleTitles: Record<UserRole, string> = {
  shipper: "货主端",
  driver: "司机端",
  admin: "管理后台",
};

const roleColors: Record<UserRole, string> = {
  shipper: "from-orange-500 to-amber-600",
  driver: "from-blue-500 to-cyan-600",
  admin: "from-slate-700 to-slate-900",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user, driverProfile, logout } = useAuthStore();
  const role = user?.role || "shipper";
  const menu =
    role === "shipper"
      ? shipperMenu
      : role === "driver"
      ? driverMenu
      : adminMenu;

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 flex-col bg-white border-r border-slate-100">
        <div
          className={`h-16 flex items-center gap-3 px-5 bg-gradient-to-r ${roleColors[role]}`}
        >
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">智运匹配</h1>
            <p className="text-white/70 text-xs">{roleTitles[role]}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "sidebar-item-active" : ""}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user.name}
              </p>
              {role === "driver" && driverProfile && (
                <p className="text-xs text-slate-500">
                  {driverProfile.vehiclePlate} · Lv.{driverProfile.level}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <User className="w-4 h-4" />
            <span>欢迎回来，</span>
            <span className="font-medium text-slate-800">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
