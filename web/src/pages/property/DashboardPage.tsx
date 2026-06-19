import { useState, useEffect } from 'react';
import { deviceApi, adminApi } from '../../api';
import type { Device, WorkOrderSummary } from '../../types';

const DashboardPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [workorderSummary, setWorkorderSummary] = useState<WorkOrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deviceRes, workorderRes] = await Promise.all([
        deviceApi.getList({ pageSize: 100 }),
        adminApi.getWorkorderSummary()
      ]);
      setDevices(deviceRes.items);
      setWorkorderSummary(workorderRes);
    } catch (error) {
      console.error('加载看板数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: '设备总数', value: devices.length, icon: '📱', color: 'bg-blue-500' },
    {
      label: '在线设备',
      value: devices.filter((d) => d.status !== 'offline').length,
      icon: '✅',
      color: 'bg-green-500'
    },
    {
      label: '使用中',
      value: devices.filter((d) => d.status === 'in_use').length,
      icon: '🔄',
      color: 'bg-orange-500'
    },
    {
      label: '维护中',
      value: devices.filter((d) => d.status === 'maintenance').length,
      icon: '🔧',
      color: 'bg-red-500'
    }
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">设备管理看板</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">工单概览</h2>
          {workorderSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">{workorderSummary.total}</p>
                  <p className="text-xs text-gray-500 mt-1">总工单</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{workorderSummary.open}</p>
                  <p className="text-xs text-gray-500 mt-1">待处理</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{workorderSummary.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">处理中</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{workorderSummary.resolved}</p>
                  <p className="text-xs text-gray-500 mt-1">已解决</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">按优先级分布</p>
                <div className="flex gap-2">
                  {Object.entries(workorderSummary.byPriority).map(([key, value]) => (
                    <div
                      key={key}
                      className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                        key === 'high'
                          ? 'bg-red-100 text-red-600'
                          : key === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {key === 'high' ? '高' : key === 'medium' ? '中' : '低'}: {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">设备状态分布</h2>
          <div className="space-y-3">
            {[
              { status: 'idle', label: '空闲', count: devices.filter((d) => d.status === 'idle').length, color: 'bg-green-500' },
              { status: 'in_use', label: '使用中', count: devices.filter((d) => d.status === 'in_use').length, color: 'bg-blue-500' },
              { status: 'reserved', label: '已预约', count: devices.filter((d) => d.status === 'reserved').length, color: 'bg-orange-500' },
              { status: 'maintenance', label: '维护中', count: devices.filter((d) => d.status === 'maintenance').length, color: 'bg-yellow-500' },
              { status: 'offline', label: '离线', count: devices.filter((d) => d.status === 'offline').length, color: 'bg-gray-400' }
            ].map((item) => {
              const percent = devices.length > 0 ? (item.count / devices.length) * 100 : 0;
              return (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="text-gray-800 font-medium">{item.count} 台</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
