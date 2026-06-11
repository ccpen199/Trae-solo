import { NavLink } from "react-router-dom";
import { Home, Gamepad2, ArrowLeftRight, Search, Recycle, Shield, Box, Monitor } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const navItems = [
  { to: "/", label: "首页大厅", icon: Home },
  { to: "/rent", label: "租号中心", icon: Gamepad2 },
  { to: "/trade", label: "买卖市场", icon: ArrowLeftRight },
  { to: "/valuation", label: "估值系统", icon: Search },
  { to: "/recycle", label: "回收竞价", icon: Recycle },
  { to: "/insurance", label: "保险理赔", icon: Shield },
  { to: "/preview/demo", label: "VR预览", icon: Box },
  { to: "/admin", label: "运营后台", icon: Monitor },
];

export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col glass-panel rounded-none border-r border-cyber-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between px-3 h-14 border-b border-cyber-border">
        {!collapsed && (
          <span className="font-orbitron text-lg font-bold neon-text tracking-wider">
            GameVault
          </span>
        )}
        <button
          onClick={toggle}
          className={`p-1.5 rounded-md text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-hover transition-colors ${
            collapsed ? "mx-auto" : ""
          }`}
        >
          {collapsed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-cyber-cyan/10 text-cyber-cyan shadow-[0_0_12px_rgba(0,240,255,0.15)] border border-cyber-cyan/30"
                  : "text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-hover border border-transparent"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-cyber-border">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
          <div className="w-8 h-8 rounded-md bg-cyber-cyan/10 flex items-center justify-center">
            <Gamepad2 size={16} className="text-cyber-cyan" />
          </div>
          {!collapsed && (
            <span className="font-orbitron text-xs font-semibold text-cyber-cyan tracking-widest">
              GameVault
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
