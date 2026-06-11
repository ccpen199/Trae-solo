import {
  LayoutDashboard,
  Watch,
  Activity,
  Moon,
  HeartPulse,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  User,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useHealthStore } from "../store/useHealthStore";

const navItems = [
  { path: "/", label: "数据总览", icon: LayoutDashboard },
  { path: "/devices", label: "设备管理", icon: Watch },
  { path: "/fitness", label: "运动健康", icon: Activity },
  { path: "/sleep", label: "睡眠分析", icon: Moon },
  { path: "/vitals", label: "生理监测", icon: HeartPulse },
  { path: "/alerts", label: "预警中心", icon: AlertTriangle },
  { path: "/records", label: "健康档案", icon: FileText },
];

export function Sidebar() {
  const { activeAlerts, connected } = useHealthStore();
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-deep-sea-700 border-r border-vital-green-500/20 flex flex-col z-50">
      <div className="p-6 border-b border-vital-green-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vital-green-400 to-vital-green-600 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-deep-sea-900" />
          </div>
          <div>
            <h1 className="font-din text-lg font-bold text-vital-green-400 glow-text">
              健康中台
            </h1>
            <p className="text-xs text-deep-sea-200/60">Health Data Platform</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-vital-green-500 status-connected" : "bg-alert-red-500 status-disconnected"
            }`}
          />
          <span className="text-xs text-deep-sea-200/80">
            {connected ? "数据实时同步中" : "连接已断开"}
          </span>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 mx-2 rounded-lg mb-1 transition-all duration-200 group relative ${
                isActive
                  ? "bg-vital-green-500/20 text-vital-green-400 glow-border"
                  : "text-deep-sea-100/70 hover:bg-vital-green-500/10 hover:text-vital-green-400"
              }`
            }
          >
            {item.path === "/alerts" && criticalCount > 0 && (
              <span className="absolute right-4 bg-alert-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                {criticalCount}
              </span>
            )}
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-vital-green-500/20">
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-vital-green-500/10 cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-vital-green-400/20 to-vital-green-600/20 flex items-center justify-center border border-vital-green-500/30">
            <User className="w-5 h-5 text-vital-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-deep-sea-100">张三</p>
            <p className="text-xs text-deep-sea-200/60">普通用户</p>
          </div>
          <Bell className="w-5 h-5 text-deep-sea-200/60 hover:text-vital-green-400 cursor-pointer transition-colors" />
          <Settings className="w-5 h-5 text-deep-sea-200/60 hover:text-vital-green-400 cursor-pointer transition-colors" />
        </div>
      </div>
    </aside>
  );
}
