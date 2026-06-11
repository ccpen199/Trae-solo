import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Gift,
  CreditCard,
  Plane,
  Heart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  User as UserIcon,
  Package,
  ClipboardCheck,
  BarChart3,
  Sliders,
} from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: { label: string; icon: React.ElementType; path: string }[];
}

const navItems: NavItem[] = [
  { label: "首页", icon: LayoutDashboard, path: "/" },
  { label: "组织管理", icon: Building2, path: "/organization" },
  { label: "福利中心", icon: Gift, path: "/benefits" },
  { label: "便捷支付", icon: CreditCard, path: "/payment" },
  { label: "出行服务", icon: Plane, path: "/travel" },
  { label: "品质生活", icon: Heart, path: "/life" },
  {
    label: "后台运营",
    icon: Settings,
    path: "/admin",
    children: [
      { label: "供应商管理", icon: Package, path: "/admin/suppliers" },
      { label: "审批管理", icon: ClipboardCheck, path: "/admin/approval" },
      { label: "数据分析", icon: BarChart3, path: "/admin/analytics" },
      { label: "推荐配置", icon: Sliders, path: "/admin/recommend" },
    ],
  },
];

function getBreadcrumb(pathname: string): string[] {
  const map: Record<string, string> = {
    "/": "首页",
    "/organization": "组织管理",
    "/benefits": "福利中心",
    "/payment": "便捷支付",
    "/travel": "出行服务",
    "/life": "品质生活",
    "/admin": "后台运营",
    "/admin/suppliers": "供应商管理",
    "/admin/approval": "审批管理",
    "/admin/analytics": "数据分析",
    "/admin/recommend": "推荐配置",
  };
  const crumbs: string[] = ["首页"];
  if (pathname !== "/") {
    if (pathname.startsWith("/admin/")) {
      crumbs.push("后台运营");
      const child = map[pathname];
      if (child) crumbs.push(child);
    } else {
      const name = map[pathname];
      if (name) crumbs.push(name);
    }
  }
  return crumbs;
}

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar, user, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(
    location.pathname.startsWith("/admin")
  );

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const breadcrumbs = getBreadcrumb(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "flex flex-col bg-[#1F2937] transition-all duration-300 shrink-0",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-700 shrink-0">
          <div className="w-8 h-8 bg-union-red rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-serif font-bold text-sm">工</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-serif font-bold text-base whitespace-nowrap">
                职工普惠
              </h1>
              <p className="text-gray-400 text-[10px] whitespace-nowrap">
                服务运营平台
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <div key={item.path}>
                  <button
                    onClick={() => {
                      if (sidebarCollapsed) {
                        navigate(item.children![0].path);
                      } else {
                        setAdminOpen(!adminOpen);
                      }
                    }}
                    className={cn(
                      "sidebar-item w-full",
                      active && "sidebar-item-active"
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm">
                          {item.label}
                        </span>
                        <ChevronRight
                          size={14}
                          className={cn(
                            "transition-transform duration-200",
                            adminOpen && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!sidebarCollapsed && adminOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.path);
                        return (
                          <button
                            key={child.path}
                            onClick={() => navigate(child.path)}
                            className={cn(
                              "sidebar-item w-full",
                              childActive && "sidebar-item-active"
                            )}
                          >
                            <ChildIcon size={16} className="shrink-0" />
                            <span className="text-sm">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "sidebar-item w-full",
                  active && "sidebar-item-active"
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-gray-700 shrink-0">
          <button
            onClick={toggleSidebar}
            className="sidebar-item w-full justify-center"
          >
            {sidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span className="text-sm">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-300">/</span>}
                <span
                  className={cn(
                    i === breadcrumbs.length - 1
                      ? "text-gray-900 font-medium"
                      : ""
                  )}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-union-red transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-union-red rounded-full" />
            </button>

            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-union-red/10 text-union-red rounded-full flex items-center justify-center">
                    <UserIcon size={16} />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.orgName}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-union-red transition-colors"
                  title="退出登录"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
