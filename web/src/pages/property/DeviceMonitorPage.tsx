import { useState, useEffect } from 'react';
import { deviceApi, workorderApi } from '../../api';
import type { Device } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  idle: { label: '空闲', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  running: { label: '使用中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  reserved: { label: '已预约', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  fault: { label: '故障', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  offline: { label: '离线', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' }
};

const typeIconMap: Record<string, string> = {
  washer: '🧺',
  water_dispenser: '💧',
  shower: '🚿'
};

const typeLabelMap: Record<string, string> = {
  washer: '洗衣机',
  water_dispenser: '饮水机',
  shower: '淋浴'
};

const DeviceMonitorPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, [filterStatus, filterType]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getList({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        pageSize: 200
      });
      setDevices(res.items || []);
    } catch (error) {
      console.error('加载设备列表失败', error);
      alert('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = async (deviceId: string, command: 'start' | 'stop' | 'restart') => {
    const commandLabel = command === 'start' ? '启动' : command === 'stop' ? '停止' : '重启';
    if (!confirm(`确认向设备发送【${commandLabel}】命令？`)) return;
    setActionLoading(`${deviceId}-${command}`);
    try {
      await deviceApi.sendCommand(deviceId, command);
      alert(`【${commandLabel}】命令发送成功`);
      loadDevices();
    } catch (error) {
      alert(`【${commandLabel}】命令发送失败`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkFault = async (device: Device) => {
    if (!confirm(`确认将设备【${device.name}】标记为故障并创建报修工单？`)) return;
    setActionLoading(`${device.id}-fault`);
    try {
      await workorderApi.create({
        description: `${device.name} 故障报修\n设备【${device.name}】（${device.location}）被物业标记为故障，需要维修。`,
        deviceId: device.id,
        priority: 'high'
      });
      alert('故障标记成功，已创建报修工单');
      loadDevices();
    } catch (error) {
      alert('故障标记失败');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = (device: Device) => {
    alert(`设备详情：\n名称：${device.name}\n类型：${typeLabelMap[device.type] || device.type}\n位置：${device.location}\n状态：${statusMap[device.status]?.label || device.status}\n最后心跳：${device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString('zh-CN') : '无记录'}`);
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

      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-sm text-gray-500 self-center mr-2">状态：</span>
        {[
          { value: 'all', label: '全部' },
          { value: 'idle', label: '空闲' },
          { value: 'running', label: '使用中' },
          { value: 'reserved', label: '已预约' },
          { value: 'fault', label: '故障' },
          { value: 'offline', label: '离线' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterStatus(item.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <span className="text-sm text-gray-500 self-center mr-2">类型：</span>
        {[
          { value: 'all', label: '全部' },
          { value: 'washer', label: '洗衣机' },
          { value: 'water_dispenser', label: '饮水机' },
          { value: 'shower', label: '淋浴' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterType(item.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === item.value
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
      ) : filteredDevices.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-3">📱</div>
          <p className="text-gray-400">暂无设备数据</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">设备</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">在线状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">运行状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">位置</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">最后心跳</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const status = statusMap[device.status] || statusMap.offline;
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {typeLabelMap[device.type] || device.type}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-sm ${device.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${device.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                          {device.isOnline ? '在线' : '离线'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <span className={`w-1.5 h-1.5 ${status.dot} rounded-full mr-1.5`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{device.location}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString('zh-CN') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleSendCommand(device.id, 'start')}
                            disabled={actionLoading !== null}
                            className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `${device.id}-start` ? '发送中...' : '启动'}
                          </button>
                          <button
                            onClick={() => handleSendCommand(device.id, 'stop')}
                            disabled={actionLoading !== null}
                            className="px-3 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `${device.id}-stop` ? '发送中...' : '停止'}
                          </button>
                          <button
                            onClick={() => handleSendCommand(device.id, 'restart')}
                            disabled={actionLoading !== null}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `${device.id}-restart` ? '发送中...' : '重启'}
                          </button>
                          <button
                            onClick={() => handleMarkFault(device)}
                            disabled={actionLoading !== null || device.status === 'fault'}
                            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `${device.id}-fault` ? '处理中...' : '标记故障'}
                          </button>
                          <button
                            onClick={() => handleViewDetail(device)}
                            className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                          >
                            详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceMonitorPage;
