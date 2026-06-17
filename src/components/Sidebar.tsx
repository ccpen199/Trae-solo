import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MicVocal,
  Image,
  Users,
  PawPrint,
  LineChart,
  Shield,
  Cpu,
  BarChart3,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const location = useLocation();
  const { currentUser } = useAppStore();

  const userNavItems = [
    { to: "/", icon: LayoutDashboard, label: "首页仪表盘", end: true },
    { to: "/translate", icon: MicVocal, label: "实时翻译" },
    { to: "/album", icon: Image, label: "萌宠相册" },
    { to: "/community", icon: Users, label: "发现分类" },
    { to: "/pets", icon: PawPrint, label: "宠物档案" },
    { to: "/training", icon: LineChart, label: "训练追踪" },
  ];

  const adminNavItems = [
    { to: "/admin/voiceprint", icon: Cpu, label: "声纹迭代中心" },
    { to: "/admin/content-safety", icon: Shield, label: "内容安全审核" },
    { to: "/admin/analytics", icon: BarChart3, label: "训练效果分析" },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;
  const isActive = (to: string, end = false) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; end?: boolean };

  if (isAdmin) {
    return (
      <aside className="w-64 min-h-screen bg-gradient-to-b from-warm-brown to-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-mint to-brand-orange flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-lg">宠物AI后台</h1>
              <p className="text-xs text-gray-400">运营管理系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-4 mb-3 mt-2">
            管理模块
          </p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={adminNavLinkClass(isActive(to))}>
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <NavLink to="/" className="admin-nav-link">
            <LayoutDashboard className="w-5 h-5" />
            <span>返回前台</span>
          </NavLink>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 min-h-screen bg-white/60 backdrop-blur-xl border-r border-cream-200 flex flex-col sticky top-0 h-screen">
      <div className="p-6 border-b border-cream-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-brand-orange to-brand-mint flex items-center justify-center shadow-soft animate-float">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-warm-brown">喵汪心语</h1>
            <p className="text-xs text-warm-gray">懂你的毛孩子</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="text-xs text-warm-gray uppercase tracking-wider px-4 mb-3 mt-2">
          功能中心
        </p>
        {(navItems as NavItem[]).map(({ to, icon: Icon, label, end = false }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={userNavLinkClass(isActive(to, end))}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
            {to === "/translate" && (
              <span className="ml-auto badge bg-brand-orange/15 text-brand-orange-dark text-[10px]">
                AI
              </span>
            )}
            {to === "/album" && (
              <span className="ml-auto badge bg-brand-mint/15 text-brand-mint-dark text-[10px]">
                新
              </span>
            )}
          </NavLink>
        ))}

        <p className="text-xs text-warm-gray uppercase tracking-wider px-4 mb-3 mt-8 pt-4 border-t border-cream-100">
          管理入口
        </p>
        <NavLink to="/admin/voiceprint" className="nav-link">
          <Shield className="w-5 h-5" />
          <span>运营后台</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-cream-200">
        <div className="card !p-4 !rounded-2xl">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-2xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-warm-brown truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-warm-gray truncate">{currentUser.email}</p>
            </div>
            <button className="p-2 rounded-xl hover:bg-cream-100 text-warm-gray transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function userNavLinkClass(active: boolean) {
  return `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 cursor-pointer ${
    active
      ? "bg-gradient-to-r from-brand-orange/10 to-brand-mint/10 text-brand-orange-dark shadow-soft"
      : "text-warm-gray hover:bg-cream-100 hover:text-warm-brown"
  }`;
}

function adminNavLinkClass(active: boolean) {
  return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
    active
      ? "bg-brand-mint/20 text-brand-mint"
      : "text-gray-300 hover:bg-white/10 hover:text-white"
  }`;
}
