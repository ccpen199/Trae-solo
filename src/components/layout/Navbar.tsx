import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Radar,
  Users,
  Send,
  Wrench,
  ChevronDown,
  LogOut,
  User,
  Building2,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/auth';
import Button from '@/components/ui/Button';

const navItems = [
  { label: '首页', path: '/', icon: Home },
  { label: '岗位', path: '/jobs', icon: Briefcase },
  { label: '公司雷达', path: '/radar', icon: Radar },
  { label: '社区', path: '/community', icon: Users },
  { label: '内推', path: '/referral', icon: Send },
  { label: '工具箱', path: '/tools', icon: Wrench },
];

const roleLabels: Record<UserRole, string> = {
  student: '学生',
  enterprise: '企业',
  mentor: '导师',
  officer: '学工老师',
  admin: '管理员',
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/me';
    switch (user.role) {
      case 'enterprise':
        return '/enterprise/dashboard';
      case 'student':
        return '/student/profile';
      default:
        return '/me';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/85 backdrop-blur-xl border-b border-ink-100 shadow-soft">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-float transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-lg font-num">Z</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-ink-900 font-semibold text-[15px]">展翅实习</span>
            <span className="text-ink-400 text-[11px]">大专生实习就业赋能平台</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-ink-500 hover:text-ink-800 hover:bg-cream-100'
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.25 : 2} />
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                注册
              </Button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-cream-100 transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-semibold">
                    {user?.nickname?.charAt(0) || user?.phone.slice(-4) || 'U'}
                  </div>
                )}
                <span className="text-sm text-ink-600">
                  {user?.nickname || user?.role === 'student' ? '学生用户' : '企业用户'}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-ink-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-card border border-ink-100 py-1.5 animate-scale-in">
                  <div className="px-3 py-2.5 border-b border-ink-100">
                    <div className="text-sm font-medium text-ink-800">
                      {user?.nickname || '未命名用户'}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      {user?.phone} · {roleLabels[user?.role || 'student']}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigate(getDashboardPath());
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-ink-600 hover:bg-cream-100 flex items-center gap-2"
                  >
                    {user?.role === 'enterprise' ? (
                      <Building2 size={15} className="text-teal-500" />
                    ) : (
                      <User size={15} className="text-brand-500" />
                    )}
                    {user?.role === 'enterprise' ? '企业工作台' : '实习档案'}
                  </button>
                  <button
                    onClick={() => {
                      navigate('/me');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-ink-600 hover:bg-cream-100 flex items-center gap-2"
                  >
                    <LayoutDashboard size={15} className="text-ink-500" />
                    个人中心
                  </button>
                  <div className="border-t border-ink-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm text-danger-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={15} />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-cream-100 text-ink-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-ink-100 bg-white animate-fade-in-up">
          <div className="container py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-sm text-ink-600 hover:bg-cream-100"
                >
                  <Icon size={17} className="text-brand-500" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-ink-100 my-2" />
            {!isAuthenticated ? (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  登录
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  注册
                </Button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="px-3 py-2.5 rounded-lg text-sm text-danger-500 hover:bg-red-50 flex items-center gap-2.5"
              >
                <LogOut size={17} />
                退出登录
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
