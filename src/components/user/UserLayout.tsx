import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Calculator, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/user", icon: Home, label: "首页" },
  { to: "/user/estimate", icon: Calculator, label: "估价" },
  { to: "/user/orders", icon: ClipboardList, label: "订单" },
  { to: "/user/profile", icon: User, label: "我的" },
];

export default function UserLayout() {
  const location = useLocation();
  const showTabBar = tabs.some((t) =>
    location.pathname === t.to ||
    (t.to !== "/user" && location.pathname.startsWith(t.to)) ||
    (t.to === "/user" && location.pathname === "/user")
  );

  const pageTitle = (() => {
    if (location.pathname === "/user") return "绿回收";
    if (location.pathname.startsWith("/user/estimate")) return "智能估价";
    if (location.pathname.startsWith("/user/booking")) return "预约下单";
    if (location.pathname.startsWith("/user/orders")) return "我的订单";
    if (location.pathname.startsWith("/user/profile")) return "个人中心";
    if (location.pathname.startsWith("/user/donation")) return "公益追溯";
    return "绿回收";
  })();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wide">{pageTitle}</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
        <Outlet />
      </main>

      {showTabBar && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
            {tabs.map(({ to, icon: Icon, label }) => {
              const isActive =
                (to === "/user" && location.pathname === "/user") ||
                (to !== "/user" && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200",
                    isActive
                      ? "text-eco-600"
                      : "text-neutral-400 hover:text-neutral-600"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-eco-600" : "text-neutral-500"
                    )}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0.5 w-6 h-0.5 bg-eco-500 rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
