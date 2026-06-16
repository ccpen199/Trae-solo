import { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Home, BookOpen, ShoppingBag, User as UserIcon, LogOut, Settings, Bell, ChevronDown, Menu, X, ShieldCheck, Briefcase, FileText, ClipboardCheck, DollarSign, LayoutDashboard, History, BookMarked, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import Button from './Button';
import Badge from './Badge';
import type { User } from '../../shared/types';

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  creator: '创作者',
  requester: '需求方',
  user: '学习者',
};

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-xl shadow-lg">
      <AlertCircle className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-zinc-400 hover:text-white">
        ×
      </button>
    </div>
  </div>
);

function getRoleLabel(role?: string): string {
  return ROLE_LABELS[role || 'user'] || '学习者';
}

interface NavLinkItem {
  to: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
}

function getNavLinks(role: string | undefined, isAuthenticated: boolean): NavLinkItem[] {
  const baseLinks: NavLinkItem[] = [
    { to: '/', label: '首页', icon: Home },
    { to: '/feed', label: '内容社区', icon: BookOpen },
    { to: '/courses', label: '课程市场', icon: ShoppingBag },
    { to: '/guarantee', label: '平台保障', icon: ShieldCheck },
  ];

  if (!isAuthenticated) {
    return baseLinks;
  }

  const r = role || 'user';
  const links: NavLinkItem[] = [...baseLinks];

  if (r === 'admin' || r === 'creator') {
    links.splice(2, 0, { to: '/workspace', label: '创作者工作台', icon: Briefcase });
  }

  if (r === 'requester' || r === 'user') {
    const insertIndex = links.findIndex(l => l.to === '/courses') + 1;
    links.splice(insertIndex, 0, { to: '/orders/my', label: '我的订单', icon: FileText });
  }

  if (r === 'admin') {
    links.push({ to: '/admin/review', label: '审核中心', icon: ClipboardCheck, adminOnly: true });
    links.push({ to: '/admin/finance', label: '财务管理', icon: DollarSign, adminOnly: true });
  }

  return links;
}

interface UserMenuItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  adminOnly?: boolean;
}

function getUserMenuItems(
  role: string | undefined,
  isAuthenticated: boolean,
  navigate: (to: string) => void,
  user: User | null,
  closeMenu: () => void,
  showToast: (msg: string) => void
): UserMenuItem[] {
  if (!isAuthenticated) {
    return [
      {
        label: '登录',
        icon: UserIcon,
        onClick: () => {
          navigate('/login');
          closeMenu();
        },
      },
      {
        label: '注册',
        icon: UserIcon,
        onClick: () => {
          navigate('/register');
          closeMenu();
        },
      },
    ];
  }

  const items: UserMenuItem[] = [];
  const r = role || 'user';

  if (r === 'admin') {
    items.push({
      label: '管理后台',
      icon: LayoutDashboard,
      onClick: () => {
        navigate('/admin/dashboard');
        closeMenu();
      },
      adminOnly: true,
    });
    items.push({
      label: '审核中心',
      icon: ClipboardCheck,
      onClick: () => {
        navigate('/admin/review');
        closeMenu();
      },
      adminOnly: true,
    });
    items.push({
      label: '财务管理',
      icon: DollarSign,
      onClick: () => {
        navigate('/admin/finance');
        closeMenu();
      },
      adminOnly: true,
    });
  }

  if (r === 'creator') {
    items.push({
      label: '工作台',
      icon: Briefcase,
      onClick: () => {
        navigate('/workspace');
        closeMenu();
      },
    });
    items.push({
      label: '我的课程',
      icon: BookMarked,
      onClick: () => {
        navigate('/courses/my');
        closeMenu();
      },
    });
    items.push({
      label: '财务结算',
      icon: DollarSign,
      onClick: () => {
        navigate('/finance');
        closeMenu();
      },
    });
    items.push({
      label: '账号设置',
      icon: Settings,
      onClick: () => {
        navigate('/settings');
        closeMenu();
      },
    });
  }

  if (r === 'requester') {
    items.push({
      label: '我的需求',
      icon: FileText,
      onClick: () => {
        navigate('/orders/my');
        closeMenu();
      },
    });
    items.push({
      label: '账号设置',
      icon: Settings,
      onClick: () => {
        navigate('/settings');
        closeMenu();
      },
    });
  }

  if (r === 'user') {
    items.push({
      label: '我的课程',
      icon: BookMarked,
      onClick: () => {
        navigate('/courses/my');
        closeMenu();
      },
    });
    items.push({
      label: '学习记录',
      icon: History,
      onClick: () => {
        navigate('/study/history');
        closeMenu();
      },
    });
    items.push({
      label: '账号设置',
      icon: Settings,
      onClick: () => {
        navigate('/settings');
        closeMenu();
      },
    });
  }

  items.push({
    label: '退出登录',
    icon: LogOut,
    onClick: () => {},
    danger: true,
  });

  return items;
}

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const userRole = user?.role;
  const isAdmin = userRole === 'admin';

  const navLinks = useMemo(() => getNavLinks(userRole, isAuthenticated), [userRole, isAuthenticated]);
  const userMenuItems = useMemo(
    () => getUserMenuItems(userRole, isAuthenticated, navigate, user, () => setShowUserMenu(false), showToast),
    [userRole, isAuthenticated, navigate, user]
  );

  const roleLabel = useMemo(() => getRoleLabel(userRole), [userRole]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleNavLinkClick = (link: NavLinkItem) => {
    if (link.adminOnly && !isAdmin) {
      showToast('您没有管理员权限');
      return false;
    }
    return true;
  };

  const handleUserMenuClick = (item: UserMenuItem) => {
    if (item.label === '退出登录') {
      handleLogout();
      return;
    }
    if (item.adminOnly && !isAdmin) {
      showToast('您没有管理员权限');
      return;
    }
    item.onClick();
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold font-display text-lg">S</span>
              </div>
              <span className="font-display text-xl font-bold text-zinc-900 hidden sm:block">
                SkillVerse
              </span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-zinc-600 hover:text-primary-600 hover:bg-primary-50'
                  )
                }
                onClick={(e) => {
                  if (!handleNavLinkClick(link)) {
                    e.preventDefault();
                  }
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {link.adminOnly && (
                  <Badge variant="error" size="sm" className="absolute -top-1 -right-1">
                    管
                  </Badge>
                )}
              </NavLink>
            ))}
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="搜索课程、创作者、服务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-100 rounded-xl border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all duration-200"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-xl text-zinc-500 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform duration-200', showUserMenu && 'rotate-180')} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-card border border-zinc-100 py-2 animate-fade-in z-50">
                        <div className="px-4 py-3 border-b border-zinc-100">
                          <p className="font-medium text-zinc-900">{user?.username}</p>
                          <p className="text-xs text-zinc-500">
                            {roleLabel}
                          </p>
                        </div>
                        {userMenuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleUserMenuClick(item)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative',
                              item.danger
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-zinc-700 hover:bg-zinc-50'
                            )}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                            {item.adminOnly && (
                              <Badge variant="error" size="sm" className="ml-auto">
                                管理员
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  登录
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  注册
                </Button>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-xl text-zinc-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-zinc-100 animate-fade-in">
            <div className="mb-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="搜索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 rounded-xl border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
              </form>
            </div>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  onClick={(e) => {
                    if (!handleNavLinkClick(link)) {
                      e.preventDefault();
                    } else {
                      setShowMobileMenu(false);
                    }
                  }}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors relative',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    )
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                  {link.adminOnly && (
                    <Badge variant="error" size="sm">
                      管理员
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
