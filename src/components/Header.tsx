import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Thermometer, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface HeaderProps {
  communityTemp?: number;
}

const Header: React.FC<HeaderProps> = ({ communityTemp = 26 }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: '新工单提醒', message: '您有1条新的待处理工单', time: '5分钟前', read: false },
    { id: 2, title: '缴费提醒', message: '本月物业费待缴纳', time: '1小时前', read: false },
    { id: 3, title: '活动通知', message: '社区周末将举办亲子活动', time: '2小时前', read: true },
  ];

  const getTempColor = (temp: number) => {
    if (temp >= 28) return 'text-red-500';
    if (temp >= 24) return 'text-accent-yellow-500';
    if (temp >= 20) return 'text-accent-green-500';
    return 'text-blue-500';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900 font-serif">
          欢迎回来，{user?.name}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
          <Thermometer className={`w-5 h-5 ${getTempColor(communityTemp)}`} />
          <div>
            <p className="text-xs text-gray-500">社区温度指数</p>
            <p className={`text-lg font-bold ${getTempColor(communityTemp)}`}>
              {communityTemp}°C
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">通知中心</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt={user?.name}
              className="w-9 h-9 rounded-full border-2 border-primary-100"
            />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down">
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <div className="py-2">
                <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4" />
                  个人中心
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4" />
                  账号设置
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { logout(); navigate('/login', { replace: true }); }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
