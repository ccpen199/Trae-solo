import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const menuItems = [
  { label: '我的订单', icon: '📋', path: '/orders' },
  { label: '我的预约', icon: '📅', action: 'reservation' },
  { label: '我的报修', icon: '🔧', action: 'repair' },
  { label: '收货地址', icon: '📍', action: 'address' },
  { label: '消息通知', icon: '🔔', action: 'notification' },
  { label: '帮助中心', icon: '❓', action: 'help' },
  { label: '关于我们', icon: 'ℹ️', action: 'about' }
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm('确认退出登录？')) {
      logout();
      navigate('/login');
    }
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.path) {
      navigate(item.path);
    } else {
      alert(`${item.label} 功能开发中`);
    }
  };

  return (
    <div className="pb-6">
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-4 pt-8 pb-16 text-white">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
            👤
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold">{user?.nickname || '社区居民'}</h2>
            <p className="text-primary-100 text-sm mt-1">{user?.phone || '未登录'}</p>
            {user?.unitNumber && (
              <p className="text-primary-100 text-xs mt-0.5">🏢 {user.unitNumber}</p>
            )}
          </div>
          <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            ⚙️
          </button>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            <div className="py-4 text-center">
              <p className="text-xl font-bold text-gray-800">5</p>
              <p className="text-xs text-gray-400 mt-0.5">订单</p>
            </div>
            <div className="py-4 text-center">
              <p className="text-xl font-bold text-gray-800">2</p>
              <p className="text-xs text-gray-400 mt-0.5">预约</p>
            </div>
            <div className="py-4 text-center">
              <p className="text-xl font-bold text-orange-500">156</p>
              <p className="text-xs text-gray-400 mt-0.5">积分</p>
            </div>
            <div className="py-4 text-center">
              <p className="text-xl font-bold text-gray-800">3</p>
              <p className="text-xs text-gray-400 mt-0.5">优惠券</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center px-5 py-4 hover:bg-gray-50 transition-colors ${
                idx !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <span className="text-xl mr-4">{item.icon}</span>
              <span className="flex-1 text-left text-gray-700">{item.label}</span>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>
      </div>

      {user?.role === 'resident' && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/property/dashboard')}
              className="w-full flex items-center px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl mr-4">🏢</span>
              <span className="flex-1 text-left text-gray-700">切换到物业管理端</span>
              <span className="text-gray-300">›</span>
            </button>
            <button
              onClick={() => navigate('/operator/dashboard')}
              className="w-full flex items-center px-5 py-4 hover:bg-gray-50 transition-colors border-t border-gray-50"
            >
              <span className="text-xl mr-4">📊</span>
              <span className="flex-1 text-left text-gray-700">切换到运营管理端</span>
              <span className="text-gray-300">›</span>
            </button>
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white text-red-500 rounded-2xl font-medium shadow-sm hover:bg-red-50 transition-colors"
        >
          退出登录
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
