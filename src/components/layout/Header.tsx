import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, loginRole } = useAuthStore();
  const { toggleSidebar, notifications, breadcrumbs } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gov-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gov-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gov-gray-600" />
        </button>
        
        <div className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronDown className="w-4 h-4 text-gov-gray-400 -rotate-90" />}
              <span className={index === breadcrumbs.length - 1 ? 'text-gov-gray-700 font-medium' : 'text-gov-gray-400'}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-gray-400" />
          <input
            type="text"
            placeholder="搜索办事事项、政策法规..."
            className="w-full pl-10 pr-4 py-2 bg-gov-gray-50 border border-transparent rounded-lg focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gov-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gov-gray-600" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-gov-red text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-dropdown border border-gov-gray-100 animate-slide-down">
              <div className="p-4 border-b border-gov-gray-100">
                <h4 className="font-medium">消息通知</h4>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[
                  { title: '社保卡申领审核通过', time: '5分钟前', type: 'success' },
                  { title: '公积金提取需补充材料', time: '1小时前', type: 'warning' },
                  { title: '您有新的政策可享受', time: '2小时前', type: 'info' },
                ].map((item, index) => (
                  <div key={index} className="p-4 hover:bg-gov-gray-50 border-b border-gov-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        item.type === 'success' ? 'bg-gov-green' :
                        item.type === 'warning' ? 'bg-gov-orange' : 'bg-primary-500'
                      }`} />
                      <div>
                        <p className="text-sm text-gov-gray-700">{item.title}</p>
                        <p className="text-xs text-gov-gray-400 mt-1">{item.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gov-gray-100 text-center">
                <button className="text-sm text-primary-500 hover:text-primary-600">查看全部</button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gov-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gov-gray-700">{user?.name}</p>
              <p className="text-xs text-gov-gray-400">
                {user?.userType === 'citizen' ? '个人用户' :
                 user?.userType === 'enterprise' ? '企业用户' :
                 user?.userType === 'staff' ? '政务人员' : '管理员'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gov-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-lg shadow-dropdown border border-gov-gray-100 animate-slide-down">
              <div className="p-4 border-b border-gov-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gov-gray-700">{user?.name}</p>
                    <p className="text-sm text-gov-gray-400">{user?.phone}</p>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <Link to="/my-applications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gov-gray-600 hover:bg-gov-gray-50 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  我的办件
                </Link>
                <Link to="/certificates" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gov-gray-600 hover:bg-gov-gray-50 transition-colors">
                  <Shield className="w-4 h-4" />
                  我的证照
                </Link>
                {(loginRole === 'admin' || loginRole === 'staff' || loginRole === 'platform' || loginRole === 'ops') && (
                  <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gov-gray-600 hover:bg-gov-gray-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    后台管理
                  </Link>
                )}
              </div>
              <div className="border-t border-gov-gray-100 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gov-red hover:bg-red-50 w-full transition-colors"
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
