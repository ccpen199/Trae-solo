import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Box,
  Calculator,
  Palette,
  Building2,
  GitCompare,
  Wrench,
  ShieldAlert,
  MessageCircleQuestion,
  ShoppingCart,
  LayoutDashboard,
  FileCheck,
  CalendarClock,
  FolderKanban,
  ClipboardList,
  Building,
  BarChart3,
  FileSearch,
  GanttChart,
  Link2,
  Package,
  FileWarning,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppStore, type UserRole } from '@/stores';
import { clsx } from 'clsx';

type MenuItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ownerMenus: MenuItem[] = [
  { label: '首页', path: '/owner', icon: Home },
  { label: '3D效果图', path: '/owner/3d-generator', icon: Box },
  { label: '装修计算器', path: '/owner/calculator', icon: Calculator },
  { label: '灵感库', path: '/owner/inspiration', icon: Palette },
  { label: '找装修公司', path: '/owner/companies', icon: Building2 },
  { label: '方案比价', path: '/owner/compare', icon: GitCompare },
  { label: '施工工艺', path: '/owner/knowledge/process', icon: Wrench },
  { label: '避坑指南', path: '/owner/knowledge/pitfalls', icon: ShieldAlert },
  { label: '问答社区', path: '/owner/community', icon: MessageCircleQuestion },
  { label: '我的订单', path: '/owner/appointments', icon: ShoppingCart },
];

const providerMenus: MenuItem[] = [
  { label: '工作台', path: '/provider', icon: LayoutDashboard },
  { label: '资质审核', path: '/provider/audit', icon: FileCheck },
  { label: '量房调度', path: '/provider/appointments', icon: CalendarClock },
  { label: '方案管理', path: '/provider/plans', icon: FolderKanban },
  { label: '工地管理', path: '/provider/sites', icon: ClipboardList },
  { label: '公司信息', path: '/provider/profile', icon: Building },
];

const adminMenus: MenuItem[] = [
  { label: '数据总览', path: '/admin', icon: BarChart3 },
  { label: '公司审核', path: '/admin/company-audit', icon: FileSearch },
  { label: '进度甘特图', path: '/admin/gantt', icon: GanttChart },
  { label: '供应链对接', path: '/admin/supply-chain', icon: Link2 },
  { label: '建材SKU', path: '/admin/materials', icon: Package },
  { label: '纠纷工单', path: '/admin/disputes', icon: FileWarning },
];

const roleTabs: { key: UserRole; label: string }[] = [
  { key: 'owner', label: '业主' },
  { key: 'provider', label: '服务商' },
  { key: 'admin', label: '管理后台' },
];

export default function AppLayout() {
  const { role, setRole, theme, toggleTheme, sidebarOpen, toggleSidebar, user } =
    useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const getMenus = () => {
    switch (role) {
      case 'owner':
        return ownerMenus;
      case 'provider':
        return providerMenus;
      case 'admin':
        return adminMenus;
      default:
        return ownerMenus;
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const defaultPath =
      newRole === 'owner'
        ? '/owner'
        : newRole === 'provider'
          ? '/provider'
          : '/admin';
    navigate(defaultPath);
  };

  const isHome = location.pathname === '/';
  const menus = getMenus();

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-ivory-300 h-16 flex items-center px-4 md:px-6">
        <div className="flex items-center gap-4 w-full">
          <NavLink
            to="/"
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wood-400 to-terracotta-500 flex items-center justify-center shadow-glow-wood">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-carbon-800 tracking-wide">
              居智通
            </span>
          </NavLink>

          {!isHome && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-ivory-200 text-carbon-600 transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}

          <div className="hidden md:flex items-center bg-ivory-100 border border-ivory-300 rounded-btn px-3 py-2 gap-2 flex-1 max-w-md mx-6">
            <Search className="w-4 h-4 text-ivory-500 shrink-0" />
            <input
              type="text"
              placeholder="搜索装修灵感、公司、工艺..."
              className="bg-transparent outline-none flex-1 text-sm text-carbon-800 placeholder-ivory-500"
            />
            <kbd className="hidden lg:inline-flex text-[10px] px-1.5 py-0.5 rounded border border-ivory-300 bg-white text-ivory-600 font-mono">
              Ctrl K
            </kbd>
          </div>

          {isHome && (
            <nav className="hidden lg:flex items-center gap-1 shrink-0" aria-label="首页快捷导航">
              <NavLink
                to="/owner/profile"
                onClick={() => setRole('owner')}
                className="px-3 py-2 rounded-lg text-sm font-medium text-carbon-600 hover:bg-ivory-100 hover:text-terracotta-700 transition-colors"
              >
                个人中心
              </NavLink>
              <NavLink
                to="/owner/companies/company-1"
                onClick={() => setRole('owner')}
                className="px-3 py-2 rounded-lg text-sm font-medium text-carbon-600 hover:bg-ivory-100 hover:text-terracotta-700 transition-colors"
              >
                查看详情
              </NavLink>
              <NavLink
                to="/admin"
                onClick={() => setRole('admin')}
                className="px-3 py-2 rounded-lg text-sm font-medium text-carbon-600 hover:bg-ivory-100 hover:text-terracotta-700 transition-colors"
              >
                管理后台
              </NavLink>
            </nav>
          )}

          {!isHome && (
            <div className="hidden md:flex items-center bg-ivory-100 rounded-btn p-1 ml-auto shrink-0">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleRoleChange(tab.key)}
                  className={clsx(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                    role === tab.key
                      ? 'bg-white text-terracotta-600 shadow-sm'
                      : 'text-carbon-600 hover:text-carbon-800',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto md:ml-0 md:ml-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-ivory-200 text-carbon-600 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <button className="relative p-2 rounded-lg hover:bg-ivory-200 text-carbon-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-terracotta-500 ring-2 ring-white" />
            </button>

            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-ivory-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wood-300 to-haze-400 flex items-center justify-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="hidden sm:block text-sm font-medium text-carbon-700 max-w-[80px] truncate">
                {user?.nickname ?? '未登录'}
              </span>
              <ChevronDown className="hidden sm:block w-4 h-4 text-ivory-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {!isHome && (
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.aside
                key="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 248, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="hidden lg:block shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-hidden border-r border-ivory-300 bg-white"
              >
                <div className="h-full overflow-y-auto scrollbar-thin py-4 px-3">
                  {roleTabs
                    .filter((t) => t.key === role)
                    .map((t) => (
                      <div
                        key={t.key}
                        className="px-3 mb-2 text-[11px] uppercase tracking-wider font-semibold text-ivory-500"
                      >
                        {t.label}端
                      </div>
                    ))}

                  <nav className="flex flex-col gap-1">
                    {menus.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === `/${role}`}
                          className={({ isActive }) =>
                            clsx(
                              'group flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-all duration-200',
                              isActive
                                ? 'bg-gradient-to-r from-terracotta-50 to-wood-50 text-terracotta-700 border border-terracotta-200/60 shadow-sm'
                                : 'text-carbon-600 hover:bg-ivory-100 hover:text-carbon-800 border border-transparent',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <Icon
                                className={clsx(
                                  'w-4 h-4 shrink-0 transition-colors',
                                  isActive
                                    ? 'text-terracotta-500'
                                    : 'text-ivory-600 group-hover:text-carbon-700',
                                )}
                              />
                              <span>{item.label}</span>
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active-dot"
                                  className="ml-auto w-1.5 h-1.5 rounded-full bg-terracotta-500"
                                />
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {!isHome && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 top-16 z-40 bg-black/30 lg:hidden backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {!isHome && sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed lg:hidden top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-white border-r border-ivory-300 overflow-y-auto scrollbar-thin py-4 px-3"
          >
            <nav className="flex flex-col gap-1">
              {menus.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === `/${role}`}
                    onClick={toggleSidebar}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-terracotta-50 to-wood-50 text-terracotta-700 border border-terracotta-200/60'
                          : 'text-carbon-600 hover:bg-ivory-100 border border-transparent',
                      )
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </motion.aside>
        )}

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className={isHome ? '' : 'p-4 md:p-6 lg:p-8'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
