import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, Users, Shield, Megaphone } from "lucide-react";

const links = [
  { to: "/admin", icon: BarChart3, label: "数据看板", end: true },
  { to: "/admin/tasks", icon: ClipboardList, label: "任务管理" },
  { to: "/admin/users", icon: Users, label: "用户管理" },
  { to: "/admin/risk", icon: Shield, label: "风控中心" },
  { to: "/admin/ads", icon: Megaphone, label: "广告管理" },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-white/5 bg-night-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
            <BarChart3 className="h-4 w-4 text-night-900" />
          </div>
          <span className="font-display text-sm font-semibold text-white/90">激励中台</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-gold-400/10 text-gold-400"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                }`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/5 px-5 py-4">
          <p className="text-xs text-white/25">激励中台 v1.0.0</p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
