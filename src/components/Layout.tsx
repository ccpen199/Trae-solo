import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  LayoutDashboard,
  Users,
  Flame,
  Accessibility,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { useAccessibilityStore } from '@/stores/useAccessibilityStore';
import CitySwitcher from './CitySwitcher';

const CITY_NAMES: Record<string, string> = {
  chengdu: '成都',
  deyang: '德阳',
  meishan: '眉山',
  ziyang: '资阳',
};

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/services', label: '服务大厅', icon: Building2 },
  { to: '/dashboard', label: '服务看板', icon: LayoutDashboard },
  { to: '/family', label: '家庭空间', icon: Users },
  { to: '/heatmap', label: '热力图', icon: Flame },
  { to: '/accessibility', label: '无障碍', icon: Accessibility },
];

const friendLinks = [
  { name: '四川省人民政府', url: '#' },
  { name: '成都市人民政府', url: '#' },
  { name: '德阳市人民政府', url: '#' },
  { name: '眉山市人民政府', url: '#' },
  { name: '资阳市人民政府', url: '#' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUserStore();
  const { voiceNavigation, highContrast, fontSize, screenReader, speak } = useAccessibilityStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const authChecked = useRef(false);

  const a11yEnabled = voiceNavigation || screenReader || highContrast || fontSize !== 'normal';

  useEffect(() => {
    if (!authChecked.current) {
      authChecked.current = true;
      if (!isAuthenticated && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, []);

  useEffect(() => {
    if (authChecked.current && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNavClick = (label: string) => {
    if (voiceNavigation) {
      speak(label);
    }
  };

  const cityName = user?.city ? CITY_NAMES[user.city] : '成都';

  if (location.pathname === '/login') {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gov-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500">正在验证身份...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gov-gradient shadow-gov">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1
                  className="text-lg font-bold text-slate-900 leading-tight"
                  aria-label={a11yEnabled ? '成都都市圈政务服务平台' : undefined}
                >
                  成都都市圈政务服务平台
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Building className="w-3 h-3" />
                  <span>Chengdu Metropolitan Circle Government Service</span>
                </div>
              </div>
            </div>

            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label={a11yEnabled ? '主导航' : undefined}
              role="navigation"
            >
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => handleNavClick(label)}
                  aria-label={a11yEnabled ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-gov-50 text-gov-700 shadow-inner'
                        : 'text-slate-600 hover:text-gov-700 hover:bg-gov-50/60'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden md:block" aria-label={a11yEnabled ? '城市切换' : undefined}>
                <CitySwitcher compact />
              </div>

              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gov-50 text-gov-700 text-xs font-medium">
                <Building2 className="w-3.5 h-3.5" />
                <span>{cityName}市</span>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label={a11yEnabled ? '用户菜单' : undefined}
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gov-gradient flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-800 leading-tight">
                      {user?.name || '用户'}
                    </span>
                    <span className="text-xs text-slate-500 leading-tight">已认证</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-400 transition-transform duration-200',
                      dropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-2 animate-fade-in z-50"
                    role="menu"
                  >
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-700 transition-colors duration-150"
                      aria-label={a11yEnabled ? '个人中心' : undefined}
                    >
                      <User className="w-4 h-4" />
                      <span>个人中心</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/accessibility');
                      }}
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-700 transition-colors duration-150"
                      aria-label={a11yEnabled ? '无障碍设置' : undefined}
                    >
                      <Settings className="w-4 h-4" />
                      <span>无障碍设置</span>
                    </button>
                    <div className="my-1 mx-4 border-t border-slate-100" />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors duration-150"
                      aria-label={a11yEnabled ? '退出登录' : undefined}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto scrollbar-thin"
        aria-label={a11yEnabled ? '移动端导航' : undefined}
      >
        <div className="container flex items-center gap-1 py-2 min-w-max">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => handleNavClick(label)}
              aria-label={a11yEnabled ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shrink-0',
                  isActive
                    ? 'bg-gov-50 text-gov-700'
                    : 'text-slate-600 hover:text-gov-700 hover:bg-gov-50/60'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 container py-6">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-300 mt-auto">
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gov-gradient">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold">成都都市圈政务服务平台</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                集成成都、德阳、眉山、资阳四市政务服务资源，打造一体化便民服务平台，让数据多跑路，群众少跑腿。
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">四城协同</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CITY_NAMES).map(([code, name]) => (
                  <div
                    key={code}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-gov-400" />
                    <span>{name}市</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">友情链接</h4>
              <div className="flex flex-col gap-2">
                {friendLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    className="text-sm text-slate-400 hover:text-gov-400 transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2025 成都都市圈政务服务平台 版权所有 | 蜀ICP备XXXXXXXX号
            </p>
            <p className="text-xs text-slate-500">
              技术支持：成都都市圈政务服务大数据中心
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
