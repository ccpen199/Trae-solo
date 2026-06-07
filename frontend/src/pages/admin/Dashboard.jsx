import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">数据概览</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">家庭用户</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.users_by_role?.family || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🏠</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">维修人员</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.users_by_role?.maintenance || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🔧</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">渠道商</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.users_by_role?.channel || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">🏪</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">平台设备</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_devices || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📱</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">服务工单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_service_orders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
          </div>
          <p className="text-xs text-yellow-600 mt-3">待处理：{stats.pending_service_orders || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">商城订单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_mall_orders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">🛒</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">销售总额</p>
              <p className="text-2xl font-bold text-green-600 mt-1">¥{stats.total_sales?.toFixed(2) || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">快捷管理</h3>
        <div className="grid grid-cols-6 gap-4">
          <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center cursor-pointer transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium text-gray-700">用户管理</div>
          </div>
          <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center cursor-pointer transition-colors">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-sm font-medium text-gray-700">设备管理</div>
          </div>
          <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center cursor-pointer transition-colors">
            <div className="text-2xl mb-2">🔧</div>
            <div className="text-sm font-medium text-gray-700">工单管理</div>
          </div>
          <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center cursor-pointer transition-colors">
            <div className="text-2xl mb-2">💾</div>
            <div className="text-sm font-medium text-gray-700">固件管理</div>
          </div>
          <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center cursor-pointer transition-colors">
            <div className="text-2xl mb-2">🏪</div>
            <div className="text-sm font-medium text-gray-700">渠道管理</div>
          </div>
          <div className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-center cursor-pointer transition-colors">
            <div className="text-2xl mb-2">🛒</div>
            <div className="text-sm font-medium text-gray-700">商城管理</div>
          </div>
        </div>
      </div>
    </div>
  );
}
