import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deviceApi } from '../../services/api';
import { useToastStore } from '../../store';
import { Watch, Plus, RefreshCw, Trash2, Settings, Database, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const deviceTypeLabels: Record<string, string> = {
    band: '手环',
    watch: '手表',
    web: 'Web',
    other: '其他'
  };

  const statusLabels: Record<string, string> = {
    active: '在线',
    disconnected: '离线',
    revoked: '已撤销',
    suspended: '已暂停'
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    disconnected: 'bg-gray-100 text-gray-700',
    revoked: 'bg-red-100 text-red-700',
    suspended: 'bg-yellow-100 text-yellow-700'
  };

  const statusDotColors: Record<string, string> = {
    active: 'bg-green-500',
    disconnected: 'bg-gray-400',
    revoked: 'bg-red-500',
    suspended: 'bg-yellow-500'
  };

  useEffect(() => {
    loadDevices();
  }, [statusFilter]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : undefined;
      const response = await deviceApi.getDevices(params);
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (deviceId: number, newStatus: string) => {
    try {
      const response = await deviceApi.updateDeviceStatus(deviceId, { status: newStatus });
      if (response.data.success) {
        addToast('success', '设备状态更新成功');
        loadDevices();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '更新状态失败');
    }
    setOpenStatusMenu(null);
  };

  const handleUnbind = async (deviceId: number) => {
    if (!window.confirm('确定要解绑此设备吗？解绑后相关数据将不再同步。')) {
      return;
    }
    try {
      const response = await deviceApi.unbindDevice(deviceId);
      if (response.data.success) {
        addToast('success', '设备解绑成功');
        loadDevices();
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.message || '解绑失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">设备管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理您已绑定的健康设备</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">全部状态</option>
            <option value="active">在线</option>
            <option value="disconnected">离线</option>
            <option value="suspended">已暂停</option>
            <option value="revoked">已撤销</option>
          </select>
          <button
            onClick={loadDevices}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <Link
            to="/devices/bind"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            绑定新设备
          </Link>
          <button
            onClick={() => navigate('/devices/sync')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Database className="w-4 h-4" />
            数据同步
          </button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Watch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无绑定设备</h3>
          <p className="text-gray-500 text-sm mb-4">绑定设备后即可自动同步健康数据</p>
          <Link
            to="/devices/bind"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            立即绑定
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Watch className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{device.device_name}</h3>
                    <span className="inline-flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${statusDotColors[device.status]}`}></span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[device.status]}`}>
                        {statusLabels[device.status]}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenStatusMenu(openStatusMenu === device.id ? null : device.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                  </button>
                  {openStatusMenu === device.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                      {['active', 'disconnected', 'suspended', 'revoked'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(device.id, status)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                            device.status === status ? 'text-primary-600 bg-primary-50' : 'text-gray-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusDotColors[status]}`}></span>
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">设备类型</span>
                  <span className="text-gray-800 font-medium">
                    {deviceTypeLabels[device.device_type] || device.device_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">设备UUID</span>
                  <span className="text-gray-800 font-mono text-xs">{device.device_uuid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">绑定时间</span>
                  <span className="text-gray-800">{dayjs(device.bind_at).format('YYYY-MM-DD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最后同步</span>
                  <span className="text-gray-800">
                    {device.last_sync_at ? dayjs(device.last_sync_at).fromNow() : '未同步'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => navigate(`/devices/sync?deviceId=${device.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Database className="w-4 h-4" />
                  同步数据
                </button>
                <button
                  onClick={() => handleUnbind(device.id)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  解绑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
