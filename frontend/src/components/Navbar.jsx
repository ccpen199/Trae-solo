import { Link, useLocation } from 'react-router-dom';

function Navbar({ unreadAlerts = 0 }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/hot-products', label: '爆款商品', icon: '🔥', highlight: true },
    { path: '/competitors', label: '竞品管理', icon: '🏪' },
    { path: '/products', label: '产品监控', icon: '📦' },
    { path: '/alerts', label: '告警中心', icon: '🔔' },
  ];
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl mr-2">🛒</span>
              <span className="text-xl font-bold text-gray-800">竞品监控系统</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                  {item.path === '/alerts' && unreadAlerts > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadAlerts}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-sm text-gray-500">
              <span className="mr-2">👤</span>
              <span>跨境购物用户</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
