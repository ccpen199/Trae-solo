import { useLocation, useNavigate } from "react-router-dom";
import { NAV_GROUPS, NAV_ITEMS } from "@/config/nav";
import { useAppStore } from "@/store/app";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`relative h-full bg-hero-gradient text-white flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-gold-gradient flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-brand-700" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm">全域缴费</span>
            <span className="text-[10px] text-brand-100/70">普惠金融融合平台</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            {!sidebarCollapsed && (
              <div className="nav-sub-title">{group}</div>
            )}
            {NAV_ITEMS.filter((i) => i.group === group).map((item) => {
              const Icon = item.icon;
              const active =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`nav-item mx-2 ${active ? "nav-item-active" : ""}`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white shadow-md text-brand-500 flex items-center justify-center hover:bg-brand-50 z-10"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
