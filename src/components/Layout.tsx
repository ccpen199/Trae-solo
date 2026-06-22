import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Newspaper,
  ClipboardList,
  Phone,
  Map,
  Grid3x3,
  BarChart3,
  Settings,
  Menu,
  X,
  AlertTriangle,
  User,
  LogOut,
  Sparkles,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/services', label: '服务大厅', icon: Grid3x3 },
  { path: '/news', label: '新闻资讯', icon: Newspaper },
  { path: '/workorders', label: '工单中心', icon: ClipboardList },
  { path: '/map', label: '服务地图', icon: Map },
  { path: '/emergency', label: '应急预警', icon: Phone },
];

const adminItems = [
  { path: '/admin/content', label: '内容管理', icon: Newspaper },
  { path: '/admin/analytics', label: '数据统计', icon: BarChart3 },
  { path: '/elderly-settings', label: '适老设置', icon: Sparkles },
];

export function SOSButton() {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 300);
    navigate('/emergency');
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'fixed bottom-24 right-5 z-40 w-16 h-16 md:w-20 md:h-20 rounded-full',
        'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-2xl',
        'flex items-center justify-center flex-col gap-0.5',
        'hover:scale-110 transition-all duration-300 active:scale-95',
        'border-4 border-white/30',
        pressed && 'animate-ping',
      )}
      style={{ animation: pressed ? undefined : 'float 3s ease-in-out infinite' }}
    >
      <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
      <span className="text-xs md:text-sm font-bold">SOS</span>
    </button>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, setUser, toggleElderlyMode, toggleHighContrast, elderlyMode, highContrast } = useAppStore();
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white shadow-sm',
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-card group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg md:text-xl font-bold text-gov-800 leading-tight">
                盐城民生云平台
              </h1>
              <p className="text-xs text-gray-500 hidden md:block">融媒体民生服务一体化</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200',
                    active
                      ? 'bg-gov-50 text-gov-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gov-600',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleElderlyMode}
              className={cn(
                'hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                elderlyMode
                  ? 'bg-warm-100 text-warm-600'
                  : 'text-gray-500 hover:bg-gray-100',
              )}
              title="适老模式"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden xl:inline">适老</span>
            </button>
            <button
              onClick={toggleHighContrast}
              className={cn(
                'hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                highContrast
                  ? 'bg-gov-100 text-gov-600'
                  : 'text-gray-500 hover:bg-gray-100',
              )}
              title="高对比度"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden xl:inline">高对比</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                {user ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gov-400 to-gov-600 flex items-center justify-center text-white font-medium text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden md:inline text-sm font-medium text-gray-700">{user.name}</span>
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-card-hover border border-gray-100 py-2 animate-fade-in-up">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
                      </div>
                      <div className="py-1">
                        {adminItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gov-50 hover:text-gov-600 transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-gray-50 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          退出登录
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/elderly-settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gov-50 hover:text-gov-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        适老设置
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="lg:hidden pb-4 pt-2 border-t border-gray-100 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-3 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all',
                      active ? 'bg-gov-50 text-gov-600' : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-3 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={toggleElderlyMode}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all',
                  elderlyMode ? 'bg-warm-100 text-warm-600' : 'bg-gray-100 text-gray-600',
                )}
              >
                <Sparkles className="w-4 h-4" />
                适老模式
              </button>
              <button
                onClick={toggleHighContrast}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all',
                  highContrast ? 'bg-gov-100 text-gov-600' : 'bg-gray-100 text-gray-600',
                )}
              >
                <Eye className="w-4 h-4" />
                高对比度
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-gov-800 text-gray-200 mt-16">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-lg font-bold text-white">盐城民生云平台</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              盐城市级融媒体民生服务一体化平台，致力于为市民提供便捷、高效、贴心的政务服务与生活服务。
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">快速导航</h4>
            <ul className="space-y-2 text-sm">
              {navItems.slice(0, 5).map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="hover:text-warm-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">服务热线</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-warm-400" />
                <span className="text-lg font-bold text-warm-300">12345</span>
                <span className="text-gray-400">政务服务</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-lg font-bold text-red-300">110 / 120</span>
                <span className="text-gray-400">紧急求助</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">联系我们</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>地址：江苏省盐城市行政中心</li>
              <li>邮箱：service@yancheng.gov.cn</li>
              <li>工作时间：周一至周五 9:00-17:30</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© 2025 盐城市融媒体中心 版权所有</p>
          <p>苏ICP备XXXXXXXX号-1 苏公网安备 XXXXXXXXXXXXXX号</p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
