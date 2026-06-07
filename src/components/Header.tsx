import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Store, Truck, Settings, Menu, X, Flower2 } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';

const navItems = [
  { role: 'customer', label: '消费者', path: '/' },
  { role: 'shop', label: '花店', path: '/shop' },
  { role: 'dispatcher', label: '调度', path: '/dispatch/center' },
  { role: 'admin', label: '管理', path: '/admin/dashboard' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { getTotalCount } = useCartStore();
  const { user, logout } = useUserStore();
  const cartCount = getTotalCount();

  const handleLogout = () => {
    logout();
    navigate('/');
    setRoleMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <Flower2 className="h-8 w-8 text-rose" />
            <span className="text-xl font-serif font-bold text-gray-800">花时达</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.role}
                to={item.path}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className="p-2 text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors"
              title="我的订单"
            >
              <Store className="h-5 w-5" />
            </Link>

            <Link
              to="/checkout"
              className="p-2 text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors relative"
              title="购物车"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <div className="relative hidden md:block">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="p-2 text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors"
              >
                <User className="h-5 w-5" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-card shadow-lg border border-gray-100 py-2">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800">{user.nickname}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-rose transition-colors"
                      >
                        退出登录
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigate('/login');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-rose transition-colors"
                    >
                      登录 / 注册
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-rose rounded-btn transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.role}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors flex items-center gap-3"
                >
                  {item.role === 'customer' && <Flower2 className="h-4 w-4" />}
                  {item.role === 'shop' && <Store className="h-4 w-4" />}
                  {item.role === 'dispatcher' && <Truck className="h-4 w-4" />}
                  {item.role === 'admin' && <Settings className="h-4 w-4" />}
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-100">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors flex items-center gap-3"
                  >
                    <User className="h-4 w-4" />
                    退出登录
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-rose hover:bg-rose-50 rounded-btn transition-colors flex items-center gap-3"
                  >
                    <User className="h-4 w-4" />
                    登录 / 注册
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
