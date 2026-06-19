import { useState, useEffect } from 'react';
import { deviceApi, adminApi } from '../../api';
import type { Device, Area } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  idle: { label: '空闲', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  in_use: { label: '使用中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  reserved: { label: '已预约', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  maintenance: { label: '维护中', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
  offline: { label: '离线', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' }
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

const DeviceManagePage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filterArea, filterType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deviceRes, areaRes] = await Promise.all([
        deviceApi.getList({
          areaId: filterArea !== 'all' ? filterArea : undefined,
          type: filterType !== 'all' ? filterType : undefined,
          pageSize: 200
        }),
        adminApi.getAreas({ pageSize: 100 })
      ]);
      setDevices(deviceRes.items);
      setAreas(areaRes.items);
    } catch (error) {
      console.error('加载数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(
    (d) =>
      search === '' ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase())
  );

  const statsByStatus = {
    total: devices.length,
    idle: devices.filter((d) => d.status === 'idle').length,
    inUse: devices.filter((d) => d.status === 'in_use').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
    offline: devices.filter((d) => d.status === 'offline').length
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">设备生命周期管理</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="搜索设备..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-56"
          />
          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">设备总数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{statsByStatus.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">空闲</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statsByStatus.idle}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">使用中</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statsByStatus.inUse}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">维护中</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{statsByStatus.maintenance}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">离线</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{statsByStatus.offline}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="all">全部区域</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        {[
          { value: 'all', label: '全部类型' },
          { value: 'washing_machine', label: '洗衣机' },
          { value: 'dryer', label: '烘干机' },
          { value: 'air_purifier', label: '净化器' },
          { value: 'water_purifier', label: '净水器' },
          { value: 'fitness_equipment', label: '健身器材' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterType(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">设备信息</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">区域</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">位置</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">上线时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const status = statusMap[device.status];
                  const area = areas.find((a) => a.id === device.areaId);
                  return (
                    <tr key={device.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-xl">{typeIconMap[device.type] || '📱'}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{device.name}</p>
                            <p className="text-xs text-gray-400">{device.id.slice(0, 12)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {typeLabelMap[device.type] || device.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{area?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{device.location}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <span className={`w-1.5 h-1.5 ${status.dot} rounded-full mr-1.5`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(device.createdAt).toLocaleDateString('zh-CN')}
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

export default DeviceManagePage;
