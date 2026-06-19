import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useAlertStore } from '../../stores/alertStore';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

export function Header() {
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount, alerts, fetchAlerts, markAsRead } = useAlertStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (showAlerts) {
      fetchAlerts({ page: 1, pageSize: 5, read: false });
    }
  }, [showAlerts, fetchAlerts]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索优惠券、商户、订单..."
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">告警通知</h3>
                <Link
                  to="/alerts"
                  className="text-sm text-primary-600 hover:text-primary-700"
                  onClick={() => setShowAlerts(false)}
                >
                  查看全部
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    暂无未读告警
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            alert.level === 'critical'
                              ? 'bg-danger-500'
                              : alert.level === 'warning'
                              ? 'bg-warning-500'
                              : 'bg-primary-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {alert.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {dayjs(alert.createdAt).format('MM-DD HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin'
                  ? '管理员'
                  : user?.role === 'merchant'
                  ? '商户管理员'
                  : user?.role === 'cashier'
                  ? '收银员'
                  : '风控专员'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.username}</p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  设置
                </button>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
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
}
