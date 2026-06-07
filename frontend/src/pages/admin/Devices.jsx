import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await api.get('/devices');
      setDevices(res.data.devices || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">设备管理</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">设备总数</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{devices.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">在线设备</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {devices.filter(d => d.status === 'online').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">离线设备</div>
          <div className="text-3xl font-bold text-gray-600 mt-1">
            {devices.filter(d => d.status !== 'online').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-gray-500 text-sm">绑定用户</div>
          <div className="text-3xl font-bold text-purple-600 mt-1">
            {new Set(devices.map(d => d.user_id)).size}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold">设备列表</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {devices.map((device) => (
              <div key={device.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{device.icon || '📱'}</span>
                  <div>
                    <div className="font-medium text-gray-900">{device.name}</div>
                    <div className="text-sm text-gray-500">SN: {device.serial_number}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-sm text-gray-600">
                    用户ID: {device.user_id}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    device.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {device.status === 'online' ? '在线' : '离线'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
