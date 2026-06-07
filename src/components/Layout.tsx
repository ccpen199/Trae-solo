import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  Home,
  Heart,
  Bus,
  Landmark,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react';

const navLinks = [
  { to: '/', label: '首页', icon: Home },
  { to: '/health', label: '挂号', icon: Heart },
  { to: '/transport', label: '交通', icon: Bus },
  { to: '/tourism', label: '文旅', icon: Landmark },
  { to: '/social-security', label: '社保', icon: Shield },
  { to: '/police', label: '公安', icon: ShieldCheck },
];

const adminNavLinks = [
  { to: '/admin/services', label: '管理', icon: Settings },
];

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-50">
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Landmark className="w-7 h-7" />
            <span className="font-serif-cn text-lg font-bold tracking-wide">
              南京市公共服务聚合平台
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && adminNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-accent/20 hover:bg-accent/30 transition-colors border border-accent/30"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-primary-light transition-colors text-sm"
                >
                  <User className="w-4 h-4" />
                  {user?.name || '用户'}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 text-warm-800 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm hover:bg-warm-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      个人中心
                    </Link>
                    <Link
                      to="/verify"
                      className="block px-4 py-2 text-sm hover:bg-warm-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      实名认证
                    </Link>
                    <Link
                      to="/subscriptions"
                      className="block px-4 py-2 text-sm hover:bg-warm-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      消息订阅
                    </Link>
                    <Link
                      to="/applications"
                      className="block px-4 py-2 text-sm hover:bg-warm-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      我的申办
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm hover:bg-warm-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        管理后台
                      </Link>
                    )}
                    <Link
                      to="/complaints"
                      className="block px-4 py-2 text-sm hover:bg-warm-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      诉求通道
                    </Link>
                    <hr className="my-1 border-warm-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-accent hover:bg-warm-100 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm rounded-md hover:bg-primary-light transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm bg-accent rounded-md hover:bg-accent-light transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-primary border-t border-primary-light px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary-light rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && adminNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary-light rounded-md bg-accent/20 mt-1"
                onClick={() => setMobileOpen(false)}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-primary-light" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="block px-3 py-2.5 text-sm hover:bg-primary-light rounded-md"
                  onClick={() => setMobileOpen(false)}
                >
                  个人中心
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2.5 text-sm hover:bg-primary-light rounded-md"
                    onClick={() => setMobileOpen(false)}
                  >
                    管理控制台
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 text-sm text-accent-100 hover:bg-primary-light rounded-md"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2.5 text-sm hover:bg-primary-light rounded-md"
                  onClick={() => setMobileOpen(false)}
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2.5 text-sm hover:bg-primary-light rounded-md"
                  onClick={() => setMobileOpen(false)}
                >
                  注册
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-primary text-warm-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p className="font-serif-cn text-white text-base mb-2">
            南京市公共服务聚合平台
          </p>
          <p>主办：南京市人民政府 &nbsp;|&nbsp; 承办：南京市数据局</p>
          <p className="mt-1">
            苏ICP备XXXXXXXX号 &nbsp;|&nbsp; 网站标识码：32010000XX
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-white">
            <Link to="/profile" className="hover:text-accent-100 transition-colors">
              个人中心
            </Link>
            <Link to="/admin" className="hover:text-accent-100 transition-colors">
              管理后台
            </Link>
            <Link to="/register" className="hover:text-accent-100 transition-colors">
              注册账号
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
