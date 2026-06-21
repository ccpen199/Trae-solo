import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    setLastUpdateTime(new Date());
    window.location.reload();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const notifications = [
    { id: 1, title: '价格预警', message: '废铜价格已超过您设置的预警阈值60000元/吨', type: 'warning', time: '5分钟前' },
    { id: 2, title: '新的询价', message: '您发布的废铝货源收到3条新询价', type: 'info', time: '30分钟前' },
    { id: 3, title: '交易提醒', message: '您的订单已完成交易，款项已到账', type: 'success', time: '2小时前' },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 transition-all duration-300">
      <div className="h-full flex items-center justify-between px-4 lg:pl-20 xl:pl-68">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>最后更新: {formatTime(lastUpdateTime)}</span>
            <button 
              onClick={handleRefresh}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-green-600 hover:text-green-700"
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索货源、回收站、品类..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-semibold text-slate-800">消息通知</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant={notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'}>
                          {notification.title}
                        </Badge>
                        <span className="text-xs text-slate-400 ml-auto">{notification.time}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-slate-100">
                  <Button variant="ghost" size="sm" className="w-full text-sm text-green-600">
                    查看全部通知
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-700">{user?.companyName || '用户'}</p>
                  <p className="text-xs text-slate-500">
                    {user?.role === 'supplier' ? '货源方' : user?.role === 'buyer' ? '采购方' : '运营方'}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">个人中心</span>
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">消息中心</span>
                  </Link>
                  <Link
                    to="/profile/settings"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">账户设置</span>
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">退出登录</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
