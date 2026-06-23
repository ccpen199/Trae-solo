import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { orderApi, reservationApi, rewardsApi, workorderApi } from '../../api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [stats, setStats] = useState({ orders: 0, reservations: 0, points: 0, coupons: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      loadStats();
    }
  }, [user, isAuthenticated]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, reservationsRes, streakRes, couponsRes] = await Promise.all([
        orderApi.getMyOrders({ pageSize: 1 }).catch(() => ({ items: [], total: 0 } as any)),
        reservationApi.getMyReservations({ pageSize: 1 }).catch(() => ({ items: [], total: 0 } as any)),
        rewardsApi.getStreak().catch(() => ({ totalPoints: 0 } as any)),
        rewardsApi.getCoupons().catch(() => [] as any[])
      ]);
      setStats({
        orders: (ordersRes as any).total || (ordersRes as any).items?.length || 0,
        reservations: (reservationsRes as any).total || (reservationsRes as any).items?.length || 0,
        points: (streakRes as any).totalPoints || 0,
        coupons: Array.isArray(couponsRes) ? couponsRes.filter(c => !(c as any).isUsed).length : 0
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('确认退出登录？')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { label: '我的订单', icon: '📋', path: '/orders' },
    { label: '我的预约', icon: '📅', path: '/orders' },
    { label: '我的报修', icon: '🔧', action: 'myReports' },
    { label: '消息通知', icon: '🔔', action: 'notification' },
    { label: '帮助中心', icon: '❓', action: 'help' }
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.action === 'myReports') {
      workorderApi.getMy().then(() => {
        alert('我的报修：功能开发中');
      }).catch(() => {
        alert('我的报修：功能开发中');
      });
    } else {
      alert(`${item.label} 功能开发中`);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="p-4 pb-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-lg text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            👤
          </div>
          <h2 className="text-xl font-bold mb-2">欢迎使用共享设备</h2>
          <p className="text-primary-100 text-sm mb-6">登录后享受更多服务</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-white text-primary-600 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
          >
            立即登录
          </button>
        </div>

        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">登录后可以</h3>
          <div className="space-y-4">
            {[
              { icon: '🧺', title: '使用共享设备', desc: '扫码使用洗衣机、饮水机、淋浴终端' },
              { icon: '📅', title: '在线预约', desc: '提前预约，避免等待' },
              { icon: '🎁', title: '积分奖励', desc: '使用设备获得积分，兑换优惠券' },
              { icon: '📋', title: '订单管理', desc: '查看使用记录、申请退款' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mr-3">
                  <span className="text-xl">{item.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 px-4 pt-8 pb-16 text-white">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
            {user?.avatar || '👤'}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user?.nickname || '社区居民'}</h2>
            <p className="text-primary-100 text-sm mt-1">{user?.phone || '-'}</p>
            {user?.role && (
              <p className="text-primary-100 text-xs mt-0.5">
                🎭 {{ resident: '居民用户', property: '物业管理员', operator: '运营管理员' }[user.role]}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-100">账户余额</p>
            <p className="text-xl font-bold mt-0.5">¥{(user?.balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-gray-100">
            <button
              onClick={() => navigate('/orders')}
              className="py-4 text-center active:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-bold text-gray-800">
                {loading ? '-' : stats.orders}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">订单</p>
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="py-4 text-center active:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-bold text-gray-800">
                {loading ? '-' : stats.reservations}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">预约</p>
            </button>
            <button
              onClick={() => navigate('/rewards')}
              className="py-4 text-center active:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-bold text-orange-500">
                {loading ? '-' : stats.points}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">积分</p>
            </button>
            <button
              onClick={() => navigate('/rewards')}
              className="py-4 text-center active:bg-gray-50 transition-colors"
            >
              <p className="text-xl font-bold text-gray-800">
                {loading ? '-' : stats.coupons}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">优惠券</p>
            </button>
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

      {user?.role === 'resident' ? (
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
      ) : (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => navigate('/home')}
              className="w-full flex items-center px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl mr-4">🏠</span>
              <span className="flex-1 text-left text-gray-700">切换到居民端</span>
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
