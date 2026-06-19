import { useState, useEffect } from 'react';
import { deviceApi } from '../../api';
import type { Device } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  idle: { label: '空闲', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  in_use: { label: '使用中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  reserved: { label: '已预约', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  maintenance: { label: '维护中', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
  offline: { label: '离线', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' }
};

const typeIconMap: Record<string, string> = {
  washing_machine: '🧺',
  dryer: '💨',
  air_purifier: '🌬️',
  water_purifier: '💧',
  fitness_equipment: '🏋️'
};

const DeviceMonitorPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDevices();
  }, [filterStatus]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getList({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        pageSize: 100
      });
      setDevices(res.items);
    } catch (error) {
      console.error('加载设备列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = async (deviceId: string, command: string) => {
    if (!confirm(`确认向设备发送 ${command} 命令？`)) return;
    try {
      await deviceApi.sendCommand({ deviceId, command: command as any });
      alert('命令发送成功');
    } catch (error) {
      alert('命令发送失败');
    }
  };

  const filteredDevices = devices.filter(
    (d) =>
      search === '' ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">设备监控</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="搜索设备名称或位置..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-64"
          />
          <button
            onClick={loadDevices}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: '全部' },
          { value: 'idle', label: '空闲' },
          { value: 'in_use', label: '使用中' },
          { value: 'maintenance', label: '维护中' },
          { value: 'offline', label: '离线' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterStatus(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">设备</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">位置</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">当前用户</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const status = statusMap[device.status];
                  return (
                    <tr key={device.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-xl">{typeIconMap[device.type] || '📱'}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{device.name}</p>
                            <p className="text-xs text-gray-400">{device.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{device.location}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <span className={`w-1.5 h-1.5 ${status.dot} rounded-full mr-1.5`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {device.currentUser || '-' }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendCommand(device.id, 'restart')}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            重启
                          </button>
                          <button
                            onClick={() => handleSendCommand(device.id, device.status === 'maintenance' ? 'unlock' : 'lock')}
                            className="px-3 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
                          >
                            {device.status === 'maintenance' ? '解锁' : '维护'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredDevices.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无设备数据</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceMonitorPage;
