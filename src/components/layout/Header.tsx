import React, { useEffect, useState, useRef } from 'react';
import { Bell, Search, Settings, ChevronDown, LogOut, Users, UserCheck, Building2, ShoppingBag, User } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authApi, riskApi } from '@/api';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '@shared/types';

const roleNames: Record<UserRole, string> = {
  owner: '业主',
  tenant: '租户',
  visitor: '访客',
  property: '物业员工',
  merchant: '商户',
};

const roleIcons: Record<UserRole, any> = {
  owner: UserCheck,
  tenant: Users,
  visitor: User,
  property: Building2,
  merchant: ShoppingBag,
};

const roleColors: Record<UserRole, string> = {
  owner: 'text-blue-600 bg-blue-50',
  tenant: 'text-green-600 bg-green-50',
  visitor: 'text-purple-600 bg-purple-50',
  property: 'text-red-600 bg-red-50',
  merchant: 'text-orange-600 bg-orange-50',
};

const demoAccounts = [
  { username: 'owner1', password: '123456', role: 'owner' as UserRole, name: '张先生' },
  { username: 'tenant1', password: '123456', role: 'tenant' as UserRole, name: '王先生' },
  { username: 'visitor1', password: '123456', role: 'visitor' as UserRole, name: '李访客' },
  { username: 'property1', password: '123456', role: 'property' as UserRole, name: '物业管理员' },
  { username: 'merchant1', password: '123456', role: 'merchant' as UserRole, name: '商户管理员' },
];

const Header: React.FC = () => {
  const { user, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === 'property') {
      fetchAlerts();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSwitchRoleEvent = (e: CustomEvent) => {
      const targetRole = e.detail;
      const account = demoAccounts.find(a => a.role === targetRole);
      if (account && account.username !== user?.username) {
        handleRoleSwitch(account);
      }
    };
    window.addEventListener('switchRole', handleSwitchRoleEvent as EventListener);
    return () => window.removeEventListener('switchRole', handleSwitchRoleEvent as EventListener);
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const res = await riskApi.getAlerts({ status: 'pending' });
      if (res.success && res.data) {
        setUnreadAlerts(res.data.alerts?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleRoleSwitch = async (account: typeof demoAccounts[0]) => {
    setSwitchingRole(account.username);
    try {
      const res = await authApi.login({ username: account.username, password: account.password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        setShowRoleMenu(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('角色切换失败:', err);
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const RoleIcon = user ? roleIcons[user.role as UserRole] : User;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user?.role === 'property' && (
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-6 h-6" />
            {unreadAlerts > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>
        )}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings className="w-6 h-6" />
        </button>
        
        <div className="relative pl-4 border-l border-gray-200" ref={dropdownRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt={user?.name}
              className="w-10 h-10 rounded-full bg-gray-200"
            />
            <div className="hidden md:block text-left">
              <p className="font-medium text-gray-800">{user?.name}</p>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${user ? roleColors[user.role as UserRole] : 'bg-gray-100 text-gray-600'}`}>
                  {user ? roleNames[user.role as UserRole] : '用户'}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">快速切换角色</p>
                <p className="text-xs text-gray-500">体验不同身份的工作台视图</p>
              </div>
              <div className="py-1">
                {demoAccounts.map((account) => {
                  const Icon = roleIcons[account.role];
                  const isCurrent = user?.username === account.username;
                  return (
                    <button
                      key={account.username}
                      onClick={() => !isCurrent && handleRoleSwitch(account)}
                      disabled={isCurrent || switchingRole === account.username}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isCurrent ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`p-2 rounded-lg ${roleColors[account.role]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-800">{account.name}</p>
                        <p className="text-xs text-gray-500">{roleNames[account.role]} · {account.username}</p>
                      </div>
                      {isCurrent ? (
                        <span className="text-xs text-blue-600 font-medium">当前</span>
                      ) : switchingRole === account.username ? (
                        <span className="text-xs text-gray-400">切换中...</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">退出登录</span>
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
