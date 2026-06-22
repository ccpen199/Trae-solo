import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Camera,
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronDown,
  Heart,
  Settings,
  LogOut,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';

const navItems = [
  { label: '首页', path: '/' },
  { label: '产品', path: '/products' },
  { label: 'AI处理', path: '/ai-enhance' },
  { label: '社区', path: '/community' },
  { label: '我的', path: '/user' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const { totalCount } = useCartStore();
  const { user, isLoggedIn, logout } = useUserStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Camera
                className={cn(
                  'w-8 h-8 transition-colors duration-300',
                  isScrolled ? 'text-brand-500' : 'text-brand-500'
                )}
              />
              <div className="absolute -inset-1 bg-brand-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-sm" />
            </div>
            <span
              className={cn(
                'font-display font-semibold text-xl md:text-2xl transition-colors duration-300',
                isScrolled ? 'text-paper-900' : 'text-paper-900'
              )}
            >
              光影印记
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-brand-500'
                      : isScrolled
                      ? 'text-paper-700 hover:text-brand-500'
                      : 'text-paper-800 hover:text-brand-500'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <div
              className={cn(
                'hidden sm:flex items-center relative transition-all duration-300',
                searchFocused ? 'w-48 md:w-64' : 'w-36 md:w-48'
              )}
            >
              <Search className="absolute left-3 w-4 h-4 text-paper-400" />
              <input
                type="text"
                placeholder="搜索..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  'w-full pl-9 pr-3 py-2 text-sm rounded-full border transition-all duration-300 outline-none',
                  isScrolled
                    ? 'bg-paper-50 border-paper-200 focus:border-brand-300 focus:bg-white'
                    : 'bg-white/60 border-white/40 focus:bg-white/90 focus:border-brand-300'
                )}
              />
            </div>

            <Link
              to="/cart"
              className={cn(
                'relative p-2 rounded-full transition-colors duration-200',
                isScrolled
                  ? 'text-paper-700 hover:text-brand-500 hover:bg-brand-50'
                  : 'text-paper-800 hover:text-brand-500 hover:bg-white/60'
              )}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-brand-500 rounded-full">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </Link>

            <div className="relative hidden sm:block">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                      'flex items-center gap-1.5 p-1 rounded-full transition-all duration-200',
                      isScrolled
                        ? 'hover:bg-paper-100'
                        : 'hover:bg-white/60'
                    )}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.nickname}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        isUserMenuOpen ? 'rotate-180' : '',
                        isScrolled ? 'text-paper-600' : 'text-paper-700'
                      )}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-paper-100 py-2 animate-fade-in">
                      <Link
                        to="/user"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 hover:text-brand-500"
                      >
                        <User className="w-4 h-4" />
                        个人中心
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 hover:text-brand-500"
                      >
                        <Package className="w-4 h-4" />
                        我的订单
                      </Link>
                      <Link
                        to="/favorites"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 hover:text-brand-500"
                      >
                        <Heart className="w-4 h-4" />
                        我的收藏
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 hover:text-brand-500"
                      >
                        <Settings className="w-4 h-4" />
                        设置
                      </Link>
                      <div className="border-t border-paper-100 my-1" />
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-darkroom-500 hover:bg-darkroom-50"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary text-sm px-4 py-2"
                >
                  登录
                </Link>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                'md:hidden p-2 rounded-lg transition-colors',
                isScrolled
                  ? 'text-paper-700 hover:bg-paper-100'
                  : 'text-paper-800 hover:bg-white/60'
              )}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-paper-100 shadow-lg animate-slide-in-right">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-500'
                      : 'text-paper-700 hover:bg-paper-50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-paper-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paper-400" />
              <input
                type="text"
                placeholder="搜索..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-paper-200 bg-paper-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white"
              />
            </div>
            {isLoggedIn ? (
              <div className="space-y-1">
                <Link
                  to="/user"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 rounded-lg"
                >
                  <User className="w-4 h-4" />
                  个人中心
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 rounded-lg"
                >
                  <Package className="w-4 h-4" />
                  我的订单
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-paper-700 hover:bg-paper-50 rounded-lg"
                >
                  <ShoppingCart className="w-4 h-4" />
                  购物车
                  {totalCount > 0 && (
                    <span className="ml-auto text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full">
                      {totalCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-darkroom-500 hover:bg-darkroom-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary w-full">
                登录 / 注册
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
