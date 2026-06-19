import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/home', label: '首页', icon: '🏠' },
  { to: '/devices', label: '设备', icon: '📱' },
  { to: '/orders', label: '订单', icon: '📋' },
  { to: '/rewards', label: '奖励', icon: '🎁' },
  { to: '/profile', label: '我的', icon: '👤' }
];

const ResidentLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">社区共享设备</h1>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm"
        >
          我
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 text-xs transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default ResidentLayout;
