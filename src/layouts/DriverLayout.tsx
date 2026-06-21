import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Fuel,
  Wallet,
  User,
  Car,
  type LucideIcon,
} from "lucide-react";
import { useAppStore, getRoleLabel } from "@/store/appStore";

interface TabItem {
  path: string;
  label: string;
  icon: LucideIcon;
  activeIcon?: LucideIcon;
}

const tabs: TabItem[] = [
  { path: "/driver/home", label: "首页", icon: Home },
  { path: "/driver/orders", label: "运单", icon: ClipboardList },
  { path: "/driver/stations", label: "油站", icon: Fuel },
  { path: "/driver/wallet", label: "钱包", icon: Wallet },
  { path: "/driver/profile", label: "我的", icon: User },
];

export default function DriverLayout() {
  const location = useLocation();
  const { user } = useAppStore();

  const isActive = (path: string) => {
    if (path === "/driver/home") {
      return location.pathname === "/driver/home";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-orange-50 to-blue-50 py-6 px-4">
      <div className="max-w-sm mx-auto mb-4 text-center animate-fade-in-down">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-orange-100">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-primary text-white">
            <Car size={16} />
          </span>
          <span className="text-sm font-medium text-deep-blue-900">
            {getRoleLabel("driver")} · {user?.nickname || "未登录"}
          </span>
        </div>
      </div>

      <div className="phone-frame">
        <div className="phone-notch" />

        <div className="phone-screen flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <Outlet />
            </div>
          </div>

          <div className="relative shrink-0 border-t border-gray-100 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-200/60 to-transparent" />

            <nav className="grid grid-cols-5 px-2 pt-1.5 pb-2">
              {tabs.map((tab) => {
                const active = isActive(tab.path);
                const Icon = tab.icon;

                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={`group relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all duration-200 ${
                      active
                        ? "scale-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {active && (
                      <span className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-gradient-primary" />
                    )}

                    <div
                      className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                        active
                          ? "bg-gradient-primary text-white shadow-soft-orange"
                          : "text-gray-500 group-hover:text-primary-orange"
                      }`}
                    >
                      <Icon size={20} />
                      {active && tab.path === "/driver/orders" && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-danger border-2 border-white animate-pulse" />
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-medium transition-colors ${
                        active
                          ? "text-primary-orange"
                          : "text-gray-500"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
