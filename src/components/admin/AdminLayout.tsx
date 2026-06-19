import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardCheck,
  Tag,
  Wallet,
  Truck,
  Factory,
  BarChart3,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "工作台" },
  { to: "/admin/quality", icon: ClipboardCheck, label: "质检管理" },
  { to: "/admin/pricing", icon: Tag, label: "定价管理" },
  { to: "/admin/payout", icon: Wallet, label: "打款管理" },
  { to: "/admin/logistics", icon: Truck, label: "物流管理" },
  { to: "/admin/processors", icon: Factory, label: "处理商管理" },
  { to: "/admin/analytics", icon: BarChart3, label: "数据统计" },
];

export default function AdminLayout() {
  const location = useLocation();

  const pageTitle = (() => {
    if (location.pathname.startsWith("/admin/dashboard")) return "工作台";
    if (location.pathname.startsWith("/admin/quality")) return "质检管理";
    if (location.pathname.startsWith("/admin/pricing")) return "定价管理";
    if (location.pathname.startsWith("/admin/payout")) return "打款管理";
    if (location.pathname.startsWith("/admin/logistics")) return "物流管理";
    if (location.pathname.startsWith("/admin/processors")) return "处理商管理";
    if (location.pathname.startsWith("/admin/analytics")) return "数据统计";
    return "运营后台";
  })();

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-neutral-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-eco-500 to-eco-600 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-800">绿回收</h1>
            <p className="text-xs text-neutral-400">运营管理中台</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "sidebar-link",
                  isActive && "sidebar-link-active"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-eco-100 flex items-center justify-center">
              <span className="text-eco-700 font-semibold">管</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">运营管理员</p>
              <p className="text-xs text-neutral-400">admin@greencycle.com</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-bold text-neutral-800">{pageTitle}</h2>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">系统正常</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
