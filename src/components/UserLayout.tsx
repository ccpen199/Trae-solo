import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Menu, X, ChevronDown, User, Recycle } from 'lucide-react';

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/estimate', label: '智能估价' },
  { path: '/orders', label: '我的订单' },
  { path: '/charity', label: '公益追溯' },
];

export default function UserLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-neutral-bg">
      <header className="sticky top-0 z-50 bg-white shadow-nav">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700">
                <Recycle className="h-5 w-5 text-white" />
              </div>
              <span className="font-serif text-xl font-bold text-forest-700">绿循回收</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-forest-50 text-forest-700'
                    : 'text-neutral-text hover:bg-gray-50 hover:text-forest-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center md:flex">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-text hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100">
                  <User className="h-4 w-4 text-forest-700" />
                </div>
                <span>用户</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white py-2 shadow-card">
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-neutral-text hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    我的订单
                  </Link>
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-neutral-text hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-neutral-text hover:bg-gray-50 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-neutral-border bg-white px-4 pb-4 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                  location.pathname === link.path
                    ? 'bg-forest-50 text-forest-700'
                    : 'text-neutral-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
