import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  ShoppingCart,
  Settings,
  Building2,
} from 'lucide-react';
import { useAppStore } from '@/store';

const navLinks = [
  { label: '首页', path: '/', icon: Home },
  { label: '案例库', path: '/cases', icon: Building2 },
  { label: '发现分类', path: '/cases?category=discover', icon: Search },
  { label: '户型匹配', path: '/floorplan-match' },
  { label: '采购清单', path: '/purchase-list', icon: ShoppingCart },
  { label: '设计师入驻', path: '/designer/register' },
  { label: '管理后台', path: '/admin/dashboard', icon: Settings },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, clearUser, setSearchFilters } = useAppStore();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      const keyword = searchValue.trim();
      setSearchFilters({ keyword });
      navigate(`/cases?keyword=${encodeURIComponent(keyword)}`);
    }
  };

  const handleLogout = () => {
    clearUser();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 text-white font-bold text-xl font-heading"
            >
              <Home className="w-6 h-6" />
              <span>筑家数据</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-1 ml-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-4 py-2 text-white/90 hover:text-white hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2"
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索案例、风格、城市..."
                className="w-64 pl-10 pr-4 py-2 bg-primary-600 border border-primary-500 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            </form>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-white hover:bg-primary-600 rounded-lg transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.nickname}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{user.nickname}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fade-in-down">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user.nickname}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                    {user.role === 'user' && (
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/purchase-list'); }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        我的采购清单
                      </button>
                    )}
                    {user.role === 'designer' && (
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/designer/dashboard'); }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        设计师后台
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate('/admin/dashboard'); }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        管理后台
                      </button>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-primary-600 rounded-lg transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-600 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-primary-600 rounded-lg transition-colors ml-auto"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-primary-600 animate-fade-in-down">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="搜索案例、风格、城市..."
                className="w-full pl-10 pr-4 py-2 bg-primary-600 border border-primary-500 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            </form>

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-white/90 hover:text-white hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-3"
                >
                  {link.icon && <link.icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-primary-600">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{user.nickname}</p>
                      <p className="text-sm text-white/70">{user.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-center text-white/90 hover:text-white hover:bg-primary-600 rounded-lg transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-600 transition-colors text-center"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
