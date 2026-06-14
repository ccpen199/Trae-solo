import React, { useEffect, useState } from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { useAuthStore } from '@/store';
import { riskApi } from '@/api';

const Header: React.FC = () => {
  const { user } = useAuthStore();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (user?.role === 'property') {
      fetchAlerts();
    }
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
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
            alt={user?.name}
            className="w-10 h-10 rounded-full bg-gray-200"
          />
          <div className="hidden md:block">
            <p className="font-medium text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">在线</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
