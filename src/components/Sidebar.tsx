import { useNavigate, useLocation } from "react-router-dom";
import { Home, Shield, Briefcase, MountainSnow, Heart, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore, roleLabels } from "@/store/useAppStore";
import { clsx } from "clsx";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/identity", label: "身份中枢", icon: Shield },
  { path: "/gov", label: "智政办公", icon: Briefcase },
  { path: "/tour", label: "智游八桂", icon: MountainSnow },
  { path: "/livelihood", label: "智惠民生", icon: Heart },
  { path: "/monitor", label: "运营监测", icon: Activity },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside className={clsx(
      "h-screen sticky top-0 flex flex-col border-r border-gray-200/60 bg-white transition-all duration-300 z-30",
      sidebarCollapsed ? "w-[68px]" : "w-[220px]"
    )}>
      <div className={clsx("flex items-center h-16 border-b border-gray-100 px-4", sidebarCollapsed ? "justify-center" : "gap-3")}>
        <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
          <MountainSnow className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display text-sm font-bold text-primary-900 leading-tight">八桂数智</h1>
            <p className="text-[10px] text-gray-400 leading-tight">全域数字生活操作系统</p>
          </div>
        )}
      </div>

      <div className={clsx("px-3 py-3", sidebarCollapsed && "px-2")}>
        <div className={clsx(
          "rounded-lg bg-gradient-to-r from-primary-900 to-primary-700 p-3",
          sidebarCollapsed && "flex justify-center p-2"
        )}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                  {currentRole === "tourist" ? "游" : roleLabels[currentRole][0]}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{roleLabels[currentRole]}</p>
                  <p className="text-primary-200 text-[10px]">当前身份</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/identity")}
                className="w-full text-[10px] text-primary-200 hover:text-white transition-colors"
              >
                切换身份 →
              </button>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              {currentRole === "tourist" ? "游" : roleLabels[currentRole][0]}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "bg-primary-900 text-white shadow-md shadow-primary-900/20"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className={clsx("w-[18px] h-[18px] flex-shrink-0", isActive && "text-white")} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={toggleSidebar}
          className={clsx(
            "w-full flex items-center justify-center gap-2 rounded-lg py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors",
            sidebarCollapsed && "px-0"
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">收起</span></>}
        </button>
      </div>
    </aside>
  );
}
