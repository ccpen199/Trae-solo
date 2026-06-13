import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Handshake,
  Shield,
  ChevronLeft,
  ChevronRight,
  Hexagon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const navItems: NavItem[] = [
  {
    label: "仪表盘",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "房源管理",
    path: "/properties",
    icon: Building2,
    badge: "128",
  },
  {
    label: "装修工单",
    path: "/orders",
    icon: Wrench,
    badge: "36",
  },
  {
    label: "供需匹配",
    path: "/matching",
    icon: Handshake,
  },
  {
    label: "管理后台",
    path: "/admin",
    icon: Shield,
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  return (
    <aside
      className={cn(
        "relative h-screen flex flex-col transition-all duration-300 ease-in-out border-r",
        collapsed ? "w-[76px]" : "w-[256px]",
        "border-gold-500/20"
      )}
    >
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #0F1E31 0%, #162C48 40%, #1E3A5F 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40 tech-grid-bg"
          style={{ backgroundSize: "24px 24px" }}
        />
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 animate-float-slow"
          style={{
            background:
              "radial-gradient(circle, rgba(212,168,83,0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/3 -left-20 w-56 h-56 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgba(61,93,151,0.6) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div
          className={cn(
            "flex items-center gap-3 px-5 py-5 border-b border-gold-500/15",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="relative">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center animate-glow-pulse"
              style={{
                background:
                  "linear-gradient(135deg, #D4A853 0%, #B88F3E 100%)",
                boxShadow:
                  "0 4px 16px rgba(212, 168, 83, 0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <Hexagon className="w-6 h-6 text-primary-900" strokeWidth={2.5} />
            </div>
            <div
              className="absolute -inset-1 rounded-xl animate-rotate-slow pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, rgba(212,168,83,0.5) 25%, transparent 50%)",
                mask: "radial-gradient(closest-side, transparent 70%, #000 72%)",
                WebkitMask:
                  "radial-gradient(closest-side, transparent 70%, #000 72%)",
                opacity: 0.5,
              }}
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span
                className="text-base font-bold tracking-wide animate-shimmer-gold whitespace-nowrap"
                style={{ fontWeight: 700 }}
              >
                PropTech OS
              </span>
              <span className="text-[11px] text-neutral-400 mt-0.5 whitespace-nowrap">
                商业地产智能装修平台
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-5 px-3">
          {!collapsed && (
            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
              主导航
            </p>
          )}
          <ul className="space-y-1.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li
                  key={item.path}
                  className="animate-slide-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <NavLink
                    to={item.path}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                      collapsed && "justify-center px-2",
                      active
                        ? cn(
                            "text-white",
                            "before:absolute before:inset-0 before:rounded-lg before:-z-0",
                            "after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-6 after:rounded-r-full after:bg-gold-400"
                          )
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5"
                    )}
                    style={
                      active
                        ? {
                            background:
                              "linear-gradient(90deg, rgba(212,168,83,0.18) 0%, rgba(212,168,83,0.05) 50%, transparent 100%)",
                            boxShadow:
                              "inset 0 0 0 1px rgba(212, 168, 83, 0.25)",
                          }
                        : undefined
                    }
                  >
                    <span className="relative z-10 shrink-0">
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-all duration-200",
                          active
                            ? "text-gold-400 drop-shadow-[0_0_8px_rgba(212,168,83,0.5)]"
                            : "group-hover:text-gold-300"
                        )}
                      />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="relative z-10 flex-1 whitespace-nowrap">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "relative z-10 inline-flex items-center justify-center h-5 min-w-[22px] px-1.5 rounded-full text-[10px] font-bold",
                              active
                                ? "bg-gold-400/25 text-gold-300 border border-gold-400/40"
                                : "bg-primary-700/60 text-neutral-300 border border-neutral-500/20"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <span
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-glow-pulse"
                            style={{ background: "#D4A853" }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 px-3">
            {!collapsed && (
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
                快捷入口
              </p>
            )}
            <div
              className={cn(
                "relative rounded-xl p-4 overflow-hidden border",
                collapsed && "p-2",
                "border-gold-500/20"
              )}
              style={{
                background:
                  "linear-gradient(135deg, rgba(212,168,83,0.08) 0%, rgba(30,58,95,0.4) 100%)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background:
                    "radial-gradient(circle at 80% 0%, rgba(212,168,83,0.25) 0%, transparent 50%)",
                }}
              />
              <div className="relative flex flex-col gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    collapsed && "justify-center"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #D4A853, #B88F3E)",
                    }}
                  >
                    <Building2 className="w-4 h-4 text-primary-900" />
                  </div>
                  {!collapsed && (
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-gold-300 whitespace-nowrap">
                        新房源上线
                      </span>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                        本周新增 24 套
                      </span>
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <button
                    className="mt-1 w-full py-1.5 rounded-md text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background:
                        "linear-gradient(135deg, #D4A853 0%, #DCB75F 100%)",
                      color: "#1E3A5F",
                      boxShadow: "0 2px 8px rgba(212,168,83,0.3)",
                    }}
                  >
                    立即查看
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div
          className={cn(
            "relative z-10 border-t border-gold-500/15 px-3 py-3",
            collapsed && "px-2"
          )}
        >
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg py-2.5 text-xs text-neutral-400 transition-all duration-200 hover:text-neutral-100 hover:bg-white/5",
              collapsed && "justify-center"
            )}
            title={collapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-neutral-500/30"
              style={{ background: "rgba(15,30,49,0.5)" }}
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </div>
            {!collapsed && <span>收起导航</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
