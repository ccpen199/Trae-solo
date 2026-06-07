import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Home,
  BookOpen,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/hooks/useTheme';

interface NavChild {
  label: string;
  path: string;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavChild[];
  adminOnly?: boolean;
}

const navGroups: NavGroup[] = [
  { label: '首页总览', icon: <LayoutDashboard size={20} />, path: '/' },
  {
    label: '用电服务',
    icon: <Zap size={20} />,
    children: [
      { label: '电费查询', path: '/electricity/bills' },
      { label: '电费缴纳', path: '/electricity/payment' },
      { label: '账单分析', path: '/electricity/analysis' },
      { label: '停电通知', path: '/electricity/outage' },
    ],
  },
  {
    label: '综合能源',
    icon: <BarChart3 size={20} />,
    children: [
      { label: '能效诊断', path: '/energy/efficiency' },
      { label: '光伏方案', path: '/energy/pv' },
      { label: '碳足迹', path: '/energy/carbon' },
    ],
  },
  {
    label: '智慧生活',
    icon: <Home size={20} />,
    children: [
      { label: '智能设备', path: '/smartlife/devices' },
      { label: '节能建议', path: '/smartlife/tips' },
      { label: '积分商城', path: '/smartlife/points' },
    ],
  },
  {
    label: '资讯知识',
    icon: <BookOpen size={20} />,
    children: [
      { label: '政策原文', path: '/knowledge/policy' },
      { label: '安全百科', path: '/knowledge/safety' },
      { label: '专家直播', path: '/knowledge/expert' },
    ],
  },
  {
    label: '合规审计',
    icon: <ShieldCheck size={20} />,
    children: [
      { label: '审计记录', path: '/compliance/audit' },
      { label: '补贴管理', path: '/compliance/subsidy' },
      { label: '绿色权益', path: '/compliance/green' },
    ],
  },
  {
    label: '系统设置',
    icon: <Settings size={20} />,
    path: '/admin',
    adminOnly: true,
  },
];

export default function Layout() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const filteredNav = navGroups.filter((g) => !g.adminOnly || isAdmin);

  const sidebarContent = (
    <>
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-csg-green flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">南方电网</div>
          <div className="text-blue-200 text-[10px] leading-tight">能源服务数字生态平台</div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {filteredNav.map((group) => {
          if (group.children) {
            const isExpanded = expandedGroups[group.label];
            const isChildActive = group.children.some((c) => location.pathname === c.path);

            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors',
                    isChildActive
                      ? 'text-csg-green bg-white/5'
                      : 'text-blue-100 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {group.icon}
                  <span className="flex-1 text-left">{group.label}</span>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {isExpanded && (
                  <div className="ml-8 mr-2 space-y-0.5 pb-1">
                    {group.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive
                              ? 'bg-csg-green/20 text-csg-green font-medium'
                              : 'text-blue-200 hover:bg-white/5 hover:text-white'
                          )
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={group.label}
              to={group.path!}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'text-csg-green bg-white/5 font-medium'
                    : 'text-blue-100 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {group.icon}
              <span>{group.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-csg-green/20 flex items-center justify-center">
            <User size={16} className="text-csg-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm truncate">{user?.realName || '用户'}</div>
            <div className="text-blue-300 text-xs truncate">
              {user?.customerType === 'enterprise' ? '企业用户' : user?.customerType === 'park' ? '园区用户' : user?.customerType === 'family' ? '家庭用户' : '个人用户'}
            </div>
          </div>
          <button onClick={handleLogout} className="text-blue-300 hover:text-white" title="退出登录">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-csg-navy-dark flex flex-col transition-transform duration-300 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDark ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-csg-red rounded-full" />
            </button>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-csg-navy flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.realName || '用户'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
