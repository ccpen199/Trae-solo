import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, FileText, DollarSign, Vote } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "监管看板", icon: LayoutDashboard },
  { to: "/assets", label: "资产台账", icon: Building2 },
  { to: "/contracts", label: "经营管理", icon: FileText },
  { to: "/revenues", label: "收益流水", icon: DollarSign },
  { to: "/decisions", label: "民主决策与公示", icon: Vote },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-700 text-white h-14 flex items-center px-6 shrink-0">
        <h1 className="text-lg font-semibold tracking-wide">
          农村集体资产管理系统
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="bg-gray-100 w-56 shrink-0 overflow-y-auto">
          <nav className="flex flex-col py-2">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700 border-l-4 border-blue-700 font-medium"
                      : "text-gray-700 hover:bg-blue-50 border-l-4 border-transparent"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="bg-white flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
