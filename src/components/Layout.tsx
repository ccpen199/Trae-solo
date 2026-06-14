import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, Shield, UserCog, Scale, MessageCircle, Sparkles, MapPin,
  Menu, X, Bell, User, LogOut, ChevronRight, FileText, Award, Building,
  Banknote, GraduationCap, Gavel, CreditCard, Users, Search, MonitorCog,
  BookOpen, ClipboardList, BadgeDollarSign, Landmark, Network, FolderKey
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

interface NavItem {
  to: string;
  label: string;
  icon: any;
}

const mainNavItems: NavItem[] = [
  { to: '/', label: '首页', icon: Home },
  { to: '/employment', label: '就业服务', icon: Briefcase },
  { to: '/social-insurance', label: '社保服务', icon: Shield },
  { to: '/personnel', label: '人事人才', icon: UserCog },
  { to: '/labor-relations', label: '劳动关系', icon: Scale },
  { to: '/smart-qa', label: '智能问答', icon: MessageCircle },
  { to: '/policy-match', label: '免申即享', icon: Sparkles },
  { to: '/service-outlets', label: '网点导航', icon: MapPin },
  { to: '/admin', label: '后台管理', icon: MonitorCog },
];

const subMenus: Record<string, NavItem[]> = {
  '/employment': [
    { to: '/employment/unemployment-register', label: '失业登记', icon: FileText },
    { to: '/employment/entrepreneur-loan', label: '创业担保贷款', icon: Banknote },
    { to: '/employment/skill-certification', label: '技能证书查询', icon: GraduationCap },
  ],
  '/social-insurance': [
    { to: '/social-insurance/cert-blockchain', label: '参保证明(区块链)', icon: Network },
    { to: '/social-insurance/payment-query', label: '社保缴费查询', icon: CreditCard },
  ],
  '/personnel': [
    { to: '/personnel/title-review', label: '职称评审', icon: Award },
  ],
  '/labor-relations': [
    { to: '/labor-relations/arbitration', label: '劳动争议仲裁', icon: Gavel },
  ],
  '/user': [
    { to: '/user/profile', label: '个人信息', icon: User },
    { to: '/user/applications', label: '办件查询', icon: ClipboardList },
    { to: '/user/certificates', label: '我的证照', icon: FolderKey },
  ],
  '/admin': [
    { to: '/admin', label: '后台总览', icon: MonitorCog },
    { to: '/policy-match', label: '政策引擎', icon: BadgeDollarSign },
    { to: '/smart-qa', label: '知识库维护', icon: BookOpen },
    { to: '/service-outlets', label: '网点与VR', icon: MapPin },
  ],
};

const userMenuItems: NavItem[] = [
  { to: '/user/profile', label: '个人中心', icon: User },
  { to: '/user/applications', label: '办件查询', icon: ClipboardList },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const getActiveDomain = (): string | null => {
    for (const prefix of Object.keys(subMenus)) {
      if (location.pathname.startsWith(prefix) && location.pathname !== '/') {
        return prefix;
      }
    }
    return null;
  };

  const activeDomain = getActiveDomain();
  const currentSubMenu = activeDomain ? subMenus[activeDomain] : null;
  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const getMainNavActive = (item: NavItem) => {
    if (item.to === '/') return location.pathname === '/';
    if (['/smart-qa', '/policy-match', '/service-outlets'].includes(item.to)) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <header className="sticky top-0 z-50 shadow-sm">
        <div className="gov-gradient">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-3 shrink-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
                  <Landmark className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-serif text-lg md:text-xl font-bold text-white tracking-tight leading-none">
                    省级人社一体化政务服务平台
                  </h1>
                  <p className="text-[10px] md:text-xs text-gov-100/80 mt-0.5 tracking-widest">
                    HUMAN RESOURCES &amp; SOCIAL SECURITY
                  </p>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = getMainNavActive(item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-white/20 text-white shadow-inner'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 shrink-0">
                <button className="hidden md:flex p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <button className="relative p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-400"></span>
                </button>

                <div className="relative">
                  {user ? (
                    <>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-xs">
                          {user.name?.[0] || user.username?.[0] || 'U'}
                        </div>
                        <span className="hidden sm:inline">{user.name || user.username}</span>
                        <ChevronRight className={cn('w-4 h-4 transition-transform', userMenuOpen && 'rotate-90')} />
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-gov-lg border border-gray-100 py-2 z-50 animate-fade-in-up">
                          {userMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gov-50 hover:text-gov-600 transition-colors"
                              >
                                <Icon className="w-4 h-4" />
                                {item.label}
                              </Link>
                            );
                          })}
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            退出登录
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gov-600 text-sm font-medium hover:bg-gold-50 hover:text-gold-600 transition-colors shadow-sm"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">登录</span>
                    </Link>
                  )}
                </div>

                <button
                  className="lg:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-gov-700">
            <nav className="px-4 py-3 space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = getMainNavActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/90 hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <div className="flex-1 flex">
        {currentSubMenu && !isHome && (
          <aside className="hidden md:block w-56 shrink-0 bg-white border-r border-gray-100">
            <div className="py-6 px-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-gov-500 to-gov-700"></div>
                <h3 className="font-serif text-base font-bold text-gov-700">
                  {activeDomain === '/employment' && '就业服务'}
                  {activeDomain === '/social-insurance' && '社保服务'}
                  {activeDomain === '/personnel' && '人事人才'}
                {activeDomain === '/labor-relations' && '劳动关系'}
                {activeDomain === '/user' && '个人中心'}
                {activeDomain === '/admin' && '后台管理'}
              </h3>
              </div>
              <nav className="space-y-1">
                {currentSubMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                        isActive
                          ? 'bg-gov-50 text-gov-600 shadow-sm border-l-4 border-gov-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gov-600 border-l-4 border-transparent'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', isActive ? 'text-gov-500' : 'text-gray-400 group-hover:text-gov-500')} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        )}

        <main className={cn(
          'flex-1 min-w-0',
          currentSubMenu && !isHome ? 'md:ml-0' : ''
        )}>
          <div className={cn(
            !isHome && 'py-6 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full'
          )}>
            <Outlet />
          </div>
          {isHome && <Outlet />}
        </main>
      </div>

      <footer className="bg-gov-800 text-gray-300 mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">省级人社厅</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                为全省人民提供高效、便捷、智能的人力资源和社会保障政务服务。
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">服务热线</h4>
              <p className="text-gold-400 text-2xl font-bold font-serif">12333</p>
              <p className="text-xs text-gray-400 mt-1">工作日 9:00-17:00</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">快速链接</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/smart-qa" className="hover:text-gold-400 transition-colors">智能问答</Link></li>
                <li><Link to="/policy-match" className="hover:text-gold-400 transition-colors">免申即享</Link></li>
                <li><Link to="/service-outlets" className="hover:text-gold-400 transition-colors">网点导航</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">关注我们</h4>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-gov-700 flex items-center justify-center hover:bg-gov-600 transition-colors cursor-pointer text-xs">
                  微信
                </div>
                <div className="w-10 h-10 rounded-lg bg-gov-700 flex items-center justify-center hover:bg-gov-600 transition-colors cursor-pointer text-xs">
                  微博
                </div>
                <div className="w-10 h-10 rounded-lg bg-gov-700 flex items-center justify-center hover:bg-gov-600 transition-colors cursor-pointer text-xs">
                  APP
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gov-700 mt-8 pt-6 text-center text-xs text-gray-500">
            © 2026 省级人力资源和社会保障厅 版权所有 | 网站标识码：XXXXXXXXX | ICP备案号：XXXXXXXX
          </div>
        </div>
      </footer>
    </div>
  );
}
