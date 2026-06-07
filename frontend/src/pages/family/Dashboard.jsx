import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function FamilyDashboard() {
  const [stats, setStats] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [recentDevices, setRecentDevices] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, scenesRes, devicesRes] = await Promise.all([
        api.get('/energy/summary'),
        api.get('/scenes/templates'),
        api.get('/devices'),
      ]);
      setStats(statsRes.data);
      setScenes(scenesRes.data.templates?.slice(0, 4) || []);
      setRecentDevices(devicesRes.data.devices?.slice(0, 6) || []);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const triggerScene = async (sceneId) => {
    try {
      await api.post(`/scenes/${sceneId}/trigger`);
      alert('场景执行成功！');
    } catch (err) {
      alert('场景执行失败');
    }
  };

  const toggleDevice = async (device) => {
    try {
      const newStatus = device.status === 'online' ? 'offline' : 'online';
      await api.post(`/devices/${device.id}/control`, {
        power: newStatus === 'online' ? 'on' : 'off'
      });
      setRecentDevices(prev => prev.map(d =>
        d.id === device.id ? { ...d, status: newStatus } : d
      ));
    } catch (err) {
      alert('控制失败');
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
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">绑定设备</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_devices || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
              📱
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">在线 {stats.online_devices || 0} 台</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">本月能耗</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.monthly_kwh || 0}<span className="text-sm font-normal"> kWh</span></p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl">
              ⚡
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">较上月 -12%</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">碳减排</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.carbon_reduced || 0}<span className="text-sm font-normal"> kg</span></p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
              🌿
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">相当于植树 {(stats.carbon_reduced / 10).toFixed(1)} 棵</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">我的积分</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_points || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
              ⭐
            </div>
          </div>
          <Link to="/family/points" className="text-xs text-blue-600 mt-2 hover:underline">
            查看详情 →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">快捷场景</h2>
          <Link to="/family/scenes" className="text-sm text-blue-600 hover:underline">
            管理场景
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => triggerScene(scene.id)}
              className="p-4 bg-gray-50 hover:bg-blue-50 rounded-xl text-center transition-colors group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {scene.icon}
              </div>
              <div className="font-medium text-gray-900">{scene.name}</div>
              <div className="text-xs text-gray-500 mt-1">{scene.device_count || 0} 个设备</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">我的设备</h2>
          <Link to="/family/devices" className="text-sm text-blue-600 hover:underline">
            查看全部
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {recentDevices.length ? recentDevices.map((device) => (
            <div key={device.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{device.icon || '📱'}</div>
                <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <div className="mt-3">
                <div className="font-medium text-gray-900">{device.name}</div>
                <div className="text-xs text-gray-500">{device.room || '客厅'}</div>
              </div>
              <button
                onClick={() => toggleDevice(device)}
                className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  device.status === 'online'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {device.status === 'online' ? '关闭' : '开启'}
              </button>
            </div>
          )) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📱</div>
              <p>暂无绑定设备</p>
              <Link to="/family/devices" className="text-blue-600 text-sm hover:underline">
                去发现设备
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
