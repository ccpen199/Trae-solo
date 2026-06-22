import { HomeOutlined, UnorderedListOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <HomeOutlined />, label: '首页' },
    { path: '/orders', icon: <UnorderedListOutlined />, label: '订单' },
    { path: '/credit', icon: <BarChartOutlined />, label: '信用' },
    { path: '/profile', icon: <UserOutlined />, label: '我的' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-14 z-50">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isActive(item.path) ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
