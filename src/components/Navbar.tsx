import { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Home, BookOpen, ShoppingBag, User as UserIcon, LogOut, Settings, Bell, ChevronDown, Menu, X, ShieldCheck, Briefcase, FileText, ClipboardCheck, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import Button from './Button';
import type { User } from '../../shared/types';

const ROLE_LABELS: Record<string, string> = {
  admin: '管理员',
  creator: '创作者',
  requester: '需求方',
  user: '学习者',
};

function getRoleLabel(role?: string): string {
  return ROLE_LABELS[role || 'user'] || '学习者';
}

function getNavLinks(role?: string) {
  const baseLinks = [
    { to: '/', label: '首页', icon: Home },
    { to: '/feed', label: '内容社区', icon: BookOpen },
    { to: '/orders', label: '订单广场', icon: ShoppingBag },
    { to: '/guarantee', label: '保障中心', icon: ShieldCheck },
  ];

  const r = role || 'user';

  if (r === 'admin') {
    return [
      ...baseLinks.slice(0, 3),
      { to: '/workspace', label: '工作台', icon: Briefcase },
      { to: '/orders/my', label: '我的需求', icon: FileText },
      ...baseLinks.slice(3),
      { to: '/admin/review', label: '审核中心', icon: ClipboardCheck },
      { to: '/admin/finance', label: '财务管理', icon: DollarSign },
    ];
  }

  if (r === 'creator') {
    return [
      ...baseLinks.slice(0, 2),
      { to: '/workspace', label: '工作台入口', icon: Briefcase },
      ...baseLinks.slice(2),
    ];
  }

  if (r === 'requester') {
    return [
      ...baseLinks.slice(0, 3),
      { to: '/orders/my', label: '我的需求', icon: FileText },
      ...baseLinks.slice(3),
    ];
  }

  return baseLinks;
}

function getUserMenuItems(role: string | undefined, navigate: (to: string) => void, user: User | null, closeMenu: () => void) {
  const items: { label: string; icon: any; onClick: () => void; danger?: boolean }[] = [
    {
      label: '个人主页',
      icon: UserIcon,
      onClick: () => {
        navigate(`/users/${user?.id}`);
        closeMenu();
      },
    },
  ];

  const r = role || 'user';

  if (r === 'creator' || r === 'admin') {
    items.push({
      label: '创作者工作台',
      icon: Briefcase,
      onClick: () => {
        navigate('/workspace');
        closeMenu();
      },
    });
  }

  if (r === 'admin') {
    items.push({
      label: '审核中心',
      icon: ClipboardCheck,
      onClick: () => {
        navigate('/admin/review');
        closeMenu();
      },
    });
    items.push({
      label: '财务管理',
      icon: DollarSign,
      onClick: () => {
        navigate('/admin/finance');
        closeMenu();
      },
    });
  }

  if (r === 'requester' || r === 'admin') {
    items.push({
      label: '我的需求',
      icon: FileText,
      onClick: () => {
        navigate('/orders/my');
        closeMenu();
      },
    });
  }

  items.push({
    label: '设置',
    icon: Settings,
    onClick: () => {
      navigate('/settings');
      closeMenu();
    },
  });

  return items;
}

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navLinks = useMemo(() => getNavLinks(user?.role), [user?.role]);
  const userMenuItems = useMemo(
    () => getUserMenuItems(user?.role, navigate, user, () => setShowUserMenu(false)),
    [user?.role, user, navigate]
  );

  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role]);

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

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold font-display text-lg">S</span>
              </div>
              <span className="font-display text-xl font-bold text-zinc-900 hidden sm:block">
                SkillHub
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
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-zinc-600 hover:text-primary-600 hover:bg-primary-50'
                    )
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
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
                            onClick={item.onClick}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                        <div className="border-t border-zinc-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            退出登录
                          </button>
                        </div>
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
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    )
                  }
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
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
