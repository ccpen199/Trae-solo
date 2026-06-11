import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  Circle,
} from 'lucide-react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { cn } from '@/lib/utils';
import type { Notification, UserInfo } from '@/types';

const breadcrumbMap: Record<string, string> = {
  '/': '仪表盘',
  '/orders': '订单管理',
  '/riders': '骑手管理',
  '/waybills': '运单管理',
  '/compensation': '理赔管理',
  '/pricing': '定价配置',
};

const mockUser: UserInfo = {
  id: '1',
  name: '管理员',
  role: 'admin',
  email: 'admin@example.com',
};

const roleLabelMap: Record<string, { label: string; style: string }> = {
  admin: { label: '管理员', style: 'bg-amber-accent-500/20 text-amber-accent-400 border-amber-accent-500/30' },
  dispatcher: { label: '运营', style: 'bg-info-500/20 text-info-400 border-info-500/30' },
  merchant: { label: '商家', style: 'bg-success-500/20 text-success-400 border-success-500/30' },
  rider: { label: '骑手', style: 'bg-warning-500/20 text-warning-400 border-warning-500/30' },
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { alerts, markAlertRead, clearAlerts } = useDashboardStore();

  const roleInfo = roleLabelMap[mockUser.role] || { label: mockUser.role, style: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

  const currentPage = breadcrumbMap[location.pathname] || '未知页面';
  const unreadCount = alerts.filter((a) => !a.read).length;

  const getNotificationTypeStyles = (type: string) => {
    const styles: Record<string, string> = {
      info: 'bg-info-500/20 text-info-400 border-info-500/30',
      warning: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      danger: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      success: 'bg-success-500/20 text-success-400 border-success-500/30',
      exception: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
      delay: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      urgent: 'bg-danger-500/20 text-danger-400 border-danger-500/30',
    };
    return styles[type] || styles.info;
  };

  return (
    <header className="h-16 bg-space-blue-800/80 backdrop-blur-md border-b border-space-blue-600 flex items-center px-4 sticky top-0 z-40">
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 mr-2 text-gray-400 hover:text-gray-100 hover:bg-space-blue-700 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>物流管理系统</span>
        <ChevronDown className="w-4 h-4" />
        <span className="text-gray-100">{currentPage}</span>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索订单、骑手..."
            className="w-full pl-10 pr-4 py-2 bg-space-blue-700 border border-space-blue-600 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-accent-500/50 focus:ring-1 focus:ring-amber-accent-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-100 hover:bg-space-blue-700 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-xs flex items-center justify-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-space-blue-800 border border-space-blue-600 rounded-lg shadow-xl z-50 animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-space-blue-600">
                  <span className="font-medium text-gray-100">通知</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => clearAlerts()}
                      className="text-xs text-gray-400 hover:text-amber-accent-400 transition-colors"
                    >
                      全部已读
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      暂无通知
                    </div>
                  ) : (
                    alerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => markAlertRead(alert.id)}
                        className={cn(
                          'px-4 py-3 border-b border-space-blue-700 cursor-pointer hover:bg-space-blue-700/50 transition-colors',
                          !alert.read && 'bg-space-blue-700/30'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-2 h-2 mt-1.5 rounded-full border animate-status-pulse',
                              getNotificationTypeStyles(alert.type)
                            )}
                          >
                            <Circle className="w-full h-full fill-current" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-100 truncate">
                              {alert.message}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {new Date(alert.timestamp).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-2 hover:bg-space-blue-700 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-accent-400 to-amber-accent-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-space-blue-900" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-100">{mockUser.name}</span>
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 text-xs font-medium border rounded-full',
                  roleInfo.style
                )}>
                  {roleInfo.label}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {mockUser.email}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-space-blue-800 border border-space-blue-600 rounded-lg shadow-xl z-50 animate-slide-up py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-space-blue-700 hover:text-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  个人设置
                </button>
                <div className="my-1 border-t border-space-blue-600" />
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-400 hover:bg-danger-500/10 hover:text-danger-300 transition-colors">
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
