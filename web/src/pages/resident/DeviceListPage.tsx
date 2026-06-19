import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { deviceApi } from '../../api';
import type { Device } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  idle: { label: '空闲', color: 'text-green-600', bg: 'bg-green-50' },
  in_use: { label: '使用中', color: 'text-blue-600', bg: 'bg-blue-50' },
  reserved: { label: '已预约', color: 'text-orange-600', bg: 'bg-orange-50' },
  maintenance: { label: '维护中', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  offline: { label: '离线', color: 'text-gray-500', bg: 'bg-gray-100' }
};

const typeLabelMap: Record<string, string> = {
  washing_machine: '洗衣机',
  dryer: '烘干机',
  air_purifier: '空气净化器',
  water_purifier: '净水器',
  fitness_equipment: '健身器材'
};

const typeIconMap: Record<string, string> = {
  washing_machine: '🧺',
  dryer: '💨',
  air_purifier: '🌬️',
  water_purifier: '💧',
  fitness_equipment: '🏋️'
};

const DeviceListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const state = location.state as { type?: string } | null;
    if (state?.type) {
      setFilterType(state.type);
    }
    loadDevices();
  }, [location.state]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getList({
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        pageSize: 50
      });
      setDevices(res.items);
    } catch (error) {
      console.error('加载设备列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (type: string) => {
    setFilterType(type);
    setTimeout(loadDevices, 0);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">设备列表</h2>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { value: 'all', label: '全部' },
          { value: 'washing_machine', label: '洗衣机' },
          { value: 'dryer', label: '烘干机' },
          { value: 'air_purifier', label: '净化器' },
          { value: 'water_purifier', label: '净水器' },
          { value: 'fitness_equipment', label: '健身' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => handleFilter(item.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filterType === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: '全部状态' },
          { value: 'idle', label: '空闲' },
          { value: 'in_use', label: '使用中' },
          { value: 'maintenance', label: '维护中' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => {
              setFilterStatus(item.value);
              setTimeout(loadDevices, 0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filterStatus === item.value
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-400">暂无设备</p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => {
            const status = statusMap[device.status];
            return (
              <div
                key={device.id}
                onClick={() => navigate(`/devices/${device.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-3xl">{typeIconMap[device.type] || '📱'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 truncate">{device.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {typeLabelMap[device.type] || device.type}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {device.location}</p>
                  </div>
                  <span className="text-gray-300 ml-2">›</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeviceListPage;
