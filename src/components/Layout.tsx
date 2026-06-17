import {
  LayoutGrid,
  Briefcase,
  FileCheck,
  ShieldCheck,
  Wallet,
  Settings,
  Bell,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "任务大厅", icon: LayoutGrid },
  { path: "/enterprise", label: "企业工作台", icon: Briefcase },
  { path: "/executor", label: "执行工作台", icon: FileCheck },
  { path: "/risk-control", label: "风控审核中心", icon: ShieldCheck, badge: "4" },
  { path: "/wallet", label: "结算钱包", icon: Wallet },
  { path: "/admin", label: "管理后台", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentExecutor = useAppStore((s) => s.currentExecutor);
  const riskAlerts = useAppStore((s) => s.riskAlerts);
  const unreadCount = riskAlerts.filter((a) => !a.resolved).length;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-deep-space-900/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-50">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-cyan-400 to-cyber-cyan-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-deep-space-900" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white">众包云</h1>
            <p className="text-xs text-gray-500">CrowdTask Cloud</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
          功能导航
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn("nav-item w-full", isActive && "nav-item-active")}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-danger-500/20 text-danger-400 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="glass-card p-3 cursor-pointer hover:border-cyber-cyan-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center">
              <User className="w-5 h-5 text-deep-space-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentExecutor.name}
              </p>
              <p className="text-xs text-gray-500">
                ¥{currentExecutor.availableBalance.toFixed(2)} 可提现
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const unreadAlerts = useAppStore((s) => s.riskAlerts.filter((a) => !a.resolved).length);

  return (
    <header className="sticky top-0 z-40 bg-deep-space-900/60 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索任务、用户..."
              className="input-field pl-9 w-72 text-sm"
            />
          </div>

          <button className="relative p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function MainLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-deep-space-950">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
