import { useState, useEffect } from 'react';
import api from '../../utils/api';

const DEVICE_CATEGORIES = [
  { id: 'ac', name: '空调', icon: '❄️' },
  { id: 'fridge', name: '冰箱', icon: '🧊' },
  { id: 'washer', name: '洗衣机', icon: '🧺' },
  { id: 'tv', name: '电视', icon: '📺' },
  { id: 'light', name: '灯具', icon: '💡' },
  { id: 'water', name: '热水器', icon: '🚿' },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showDiscover, setShowDiscover] = useState(false);
  const [category, setCategory] = useState('all');

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

  const startDiscover = async () => {
    setDiscovering(true);
    setShowDiscover(true);
    try {
      const res = await api.post('/devices/discover');
      setDiscoveredDevices(res.data.devices || []);
    } finally {
      setDiscovering(false);
    }
  };

  const bindDevice = async (device) => {
    try {
      await api.post('/devices/bind', { sn: device.sn, name: device.name });
      alert('绑定成功！获得50积分');
      loadDevices();
      setDiscoveredDevices(prev => prev.filter(d => d.sn !== device.sn));
    } catch (err) {
      alert(err.response?.data?.error || '绑定失败');
    }
  };

  const controlDevice = async (deviceId, action, value) => {
    try {
      await api.post(`/devices/${deviceId}/control`, { [action]: value });
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, [action]: value } : d
      ));
    } catch (err) {
      alert('操作失败');
    }
  };

  const filteredDevices = category === 'all'
    ? devices
    : devices.filter(d => d.category === category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            全部
          </button>
          {DEVICE_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                category === c.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={startDiscover}
          disabled={discovering}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
        >
          <span className={discovering ? 'animate-spin' : ''}>🔍</span>
          <span>{discovering ? '发现中...' : '发现设备'}</span>
        </button>
      </div>

      {showDiscover && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">发现的设备</h3>
          {discoveredDevices.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {discoveredDevices.map((device, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl">
                  <div className="text-3xl mb-2">{device.icon}</div>
                  <div className="font-medium text-gray-900">{device.name}</div>
                  <div className="text-xs text-gray-500">SN: {device.sn?.slice(0, 12)}...</div>
                  <button
                    onClick={() => bindDevice(device)}
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    绑定设备
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {discovering ? '正在搜索附近的智能设备...' : '未发现新设备'}
            </div>
          )}
          <button
            onClick={() => setShowDiscover(false)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            关闭
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <div key={device.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{device.icon || '📱'}</div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  device.status === 'online'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {device.status === 'online' ? '在线' : '离线'}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900">{device.name}</h3>
                <p className="text-sm text-gray-500">{device.room || '未分配房间'}</p>
              </div>

              {device.category === 'ac' && device.status === 'online' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">温度</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => controlDevice(device.id, 'temperature', Math.max(16, (device.temperature || 26) - 1))}
                        className="w-7 h-7 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-semibold">{device.temperature || 26}°</span>
                      <button
                        onClick={() => controlDevice(device.id, 'temperature', Math.min(30, (device.temperature || 26) + 1))}
                        className="w-7 h-7 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {device.category === 'light' && device.status === 'online' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">亮度</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={device.brightness || 100}
                      onChange={(e) => controlDevice(device.id, 'brightness', parseInt(e.target.value))}
                      className="w-32"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => controlDevice(device.id, 'power', device.status === 'online' ? 'off' : 'on')}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    device.status === 'online'
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {device.status === 'online' ? '关闭设备' : '开启设备'}
                </button>
              </div>
            </div>
          ))}

          {filteredDevices.length === 0 && (
            <div className="col-span-3 bg-white rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无设备</h3>
              <p className="text-gray-500 mb-4">点击"发现设备"开始绑定您的智能设备</p>
              <button
                onClick={startDiscover}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                发现设备
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
