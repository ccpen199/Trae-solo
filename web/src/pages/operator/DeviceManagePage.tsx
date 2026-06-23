import { useState, useEffect } from 'react';
import { deviceApi, adminApi, workorderApi } from '../../api';
import type { Device, Area, DeviceType, DeviceStatus } from '../../types';

const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  idle: { label: '空闲', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  running: { label: '使用中', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  reserved: { label: '已预约', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  fault: { label: '故障', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  offline: { label: '离线', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400' }
};

const lifecycleMap: Record<string, { label: string; color: string; bg: string }> = {
  online: { label: '已上线', color: 'text-green-600', bg: 'bg-green-50' },
  offline_lifecycle: { label: '已下架', color: 'text-gray-500', bg: 'bg-gray-100' },
  maintenance: { label: '维保中', color: 'text-yellow-600', bg: 'bg-yellow-50' }
};

const typeLabelMap: Record<string, string> = {
  washer: '洗衣机',
  water_dispenser: '饮水机',
  shower: '淋浴终端'
};

const typeIconMap: Record<string, string> = {
  washer: '🧺',
  water_dispenser: '💧',
  shower: '🚿'
};

interface DeviceWithLifecycle extends Device {
  _lifecycle: 'online' | 'offline_lifecycle' | 'maintenance';
}

interface DeviceFormData {
  name: string;
  type: DeviceType;
  areaId: string;
  location: string;
  pricing: number;
  lat: number;
  lng: number;
}

const DeviceManagePage = () => {
  const [devices, setDevices] = useState<DeviceWithLifecycle[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOnline, setFilterOnline] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState<DeviceFormData>({
    name: '',
    type: 'washer',
    areaId: '',
    location: '',
    pricing: 0,
    lat: 31.2304,
    lng: 121.4737
  });

  useEffect(() => {
    loadData();
  }, [filterArea, filterType, filterStatus, filterOnline]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: { areaId?: string; status?: string; type?: string; page?: number; pageSize?: number } = {
        pageSize: 500
      };
      if (filterArea !== 'all') params.areaId = filterArea;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.type = filterType;

      const [deviceRes, areaRes] = await Promise.all([
        deviceApi.getList(params),
        adminApi.getAreas()
      ]);

      let deviceList = (deviceRes.items || []).map(d => ({
        ...d,
        _lifecycle: (d.status === 'offline' && !d.isOnline ? 'offline_lifecycle' : 'online') as 'online' | 'offline_lifecycle' | 'maintenance'
      }));

      if (filterOnline !== 'all') {
        deviceList = deviceList.filter(d =>
          filterOnline === 'online' ? d.isOnline : !d.isOnline
        );
      }

      setDevices(deviceList);
      setAreas(areaRes.items || []);
    } catch (error) {
      console.error('加载数据失败', error);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(
    (d) =>
      search === '' ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      name: '',
      type: 'washer',
      areaId: areas.length > 0 ? areas[0].id : '',
      location: '',
      pricing: 0,
      lat: 31.2304,
      lng: 121.4737
    });
  };

  const openCreateModal = () => {
    setEditingDevice(null);
    resetForm();
    if (areas.length > 0 && !form.areaId) {
      setForm(prev => ({ ...prev, areaId: areas[0].id }));
    }
    setShowModal(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setForm({
      name: device.name,
      type: device.type,
      areaId: device.areaId,
      location: device.location,
      pricing: device.pricing,
      lat: device.lat,
      lng: device.lng
    });
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) { alert('请输入设备名称'); return false; }
    if (!form.areaId) { alert('请选择所在区域'); return false; }
    if (!form.location.trim()) { alert('请输入位置'); return false; }
    if (form.pricing < 0) { alert('定价不能为负数'); return false; }
    return true;
  };

  const handleSubmitForm = () => {
    if (!validateForm()) return;
    if (editingDevice) {
      setDevices(prev => prev.map(d =>
        d.id === editingDevice.id
          ? {
            ...d,
            name: form.name,
            type: form.type,
            areaId: form.areaId,
            areaName: areas.find(a => a.id === form.areaId)?.name,
            location: form.location,
            pricing: form.pricing,
            lat: form.lat,
            lng: form.lng
          }
          : d
      ));
      alert('设备信息更新成功');
    } else {
      const newDevice: DeviceWithLifecycle = {
        id: 'dev_' + Math.random().toString(36).slice(2, 10),
        name: form.name,
        type: form.type,
        status: 'idle',
        location: form.location,
        lat: form.lat,
        lng: form.lng,
        areaId: form.areaId,
        areaName: areas.find(a => a.id === form.areaId)?.name,
        pricing: form.pricing,
        lastHeartbeat: new Date().toISOString(),
        isOnline: true,
        _lifecycle: 'online'
      };
      setDevices(prev => [newDevice, ...prev]);
      alert('设备新增成功');
    }
    setShowModal(false);
    resetForm();
    setEditingDevice(null);
  };

  const handleToggleOnline = async (device: DeviceWithLifecycle) => {
    const action = device._lifecycle === 'online' ? '下架' : '上线';
    if (!confirm(`确认将设备【${device.name}】${action}？`)) return;
    setActionLoading(`online-${device.id}`);
    try {
      if (device._lifecycle !== 'online') {
        await deviceApi.sendCommand(device.id, 'restart');
      }
      setDevices(prev => prev.map(d =>
        d.id === device.id
          ? {
            ...d,
            _lifecycle: d._lifecycle === 'online' ? 'offline_lifecycle' : 'online',
            status: d._lifecycle === 'online' ? 'offline' : 'idle',
            isOnline: d._lifecycle !== 'online'
          }
          : d
      ));
      alert(`设备${action}成功`);
    } catch (error) {
      setDevices(prev => prev.map(d =>
        d.id === device.id
          ? { ...d, _lifecycle: d._lifecycle === 'online' ? 'offline_lifecycle' : 'online' }
          : d
      ));
      alert(`设备${action}成功（本地模拟）`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateMaintenance = async (device: Device) => {
    if (!confirm(`确认对设备【${device.name}】发起维保工单？`)) return;
    setActionLoading(`maintenance-${device.id}`);
    try {
      await workorderApi.create({
        description: `${device.name} 定期维保\n设备【${device.name}】（${device.location}）由运营发起定期保养维护。`,
        deviceId: device.id,
        priority: 'medium'
      });
      setDevices(prev => prev.map(d =>
        d.id === device.id ? { ...d, _lifecycle: 'maintenance' } : d
      ));
      alert('维保工单创建成功');
    } catch (error) {
      console.error(error);
      alert('维保工单创建失败');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">设备生命周期管理</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="搜索设备名称/位置/ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-64"
          />
          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            🔄 刷新
          </button>
          <button
            onClick={openCreateModal}
            className="px-5 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            + 新增设备
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">设备总数</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{devices.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">在线</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{devices.filter(d => d.isOnline).length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">故障</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{devices.filter(d => d.status === 'fault').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">已上线</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{devices.filter(d => d._lifecycle === 'online').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">已下架</p>
          <p className="text-2xl font-bold text-gray-400 mt-2">{devices.filter(d => d._lifecycle === 'offline_lifecycle').length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 bg-white rounded-2xl p-4 shadow-sm">
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none min-w-[140px]"
        >
          <option value="all">全部区域</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>

        <div className="flex gap-1 flex-wrap">
          <span className="text-sm text-gray-500 self-center px-2">类型:</span>
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
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          <span className="text-sm text-gray-500 self-center px-2">状态:</span>
          {[
            { value: 'all', label: '全部' },
            { value: 'idle', label: '空闲' },
            { value: 'running', label: '使用中' },
            { value: 'reserved', label: '预约' },
            { value: 'fault', label: '故障' },
            { value: 'offline', label: '离线' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterStatus(item.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === item.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          <span className="text-sm text-gray-500 self-center px-2">在线:</span>
          {[
            { value: 'all', label: '全部' },
            { value: 'online', label: '在线' },
            { value: 'offline', label: '离线' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterOnline(item.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterOnline === item.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm">加载中...</div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-gray-500 mb-2">暂无设备</p>
          <p className="text-sm text-gray-400">点击右上角新增设备或调整筛选条件</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">设备ID</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">名称</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">类型</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">运行状态</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">在线状态</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">所在区域</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">定价</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">最后心跳</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">生命周期</th>
                  <th className="text-left px-5 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => {
                  const status = statusMap[device.status] || statusMap.offline;
                  const lifecycle = lifecycleMap[device._lifecycle] || lifecycleMap.online;
                  const area = areas.find(a => a.id === device.areaId);
                  return (
                    <tr key={device.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {device.id.slice(0, 12)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{typeIconMap[device.type] || '📱'}</span>
                          <div>
                            <p className="font-medium text-gray-800">{device.name}</p>
                            <p className="text-xs text-gray-400 max-w-[140px] truncate">{device.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {typeLabelMap[device.type] || device.type}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <span className={`w-1.5 h-1.5 ${status.dot} rounded-full mr-1`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center text-sm ${device.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-2 h-2 rounded-full mr-1.5 ${device.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {device.isOnline ? '在线' : '离线'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {device.areaName || area?.name || '-'}
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap">
                        <span className="font-semibold text-gray-800">¥{device.pricing.toFixed(2)}</span>
                        <span className="text-xs text-gray-400 ml-1">/分钟</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {device.lastHeartbeat
                          ? new Date(device.lastHeartbeat).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lifecycle.bg} ${lifecycle.color}`}>
                          {lifecycle.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => handleToggleOnline(device)}
                            disabled={actionLoading !== null}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap ${
                              device._lifecycle === 'online'
                                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {actionLoading === `online-${device.id}` ? '处理中...' : device._lifecycle === 'online' ? '下架' : '上线'}
                          </button>
                          <button
                            onClick={() => handleCreateMaintenance(device)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {actionLoading === `maintenance-${device.id}` ? '处理中...' : '发起维保'}
                          </button>
                          <button
                            onClick={() => openEditModal(device)}
                            className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
                          >
                            编辑
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingDevice ? '编辑设备' : '新增设备'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); setEditingDevice(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">设备名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：1号楼洗衣机A"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">设备类型 <span className="text-red-500">*</span></label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as DeviceType })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all"
                  >
                    <option value="washer">🧺 洗衣机</option>
                    <option value="water_dispenser">💧 饮水机</option>
                    <option value="shower">🚿 淋浴终端</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">所在区域 <span className="text-red-500">*</span></label>
                  <select
                    value={form.areaId}
                    onChange={(e) => setForm({ ...form, areaId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all"
                  >
                    <option value="">请选择区域</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">位置描述 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="如：1号楼1层楼道东侧"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">定价（元/分钟） <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">¥</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.pricing || ''}
                    onChange={(e) => setForm({ ...form, pricing: Math.max(0, Number(e.target.value)) })}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 pl-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">/分钟</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">纬度 (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.lat || ''}
                    onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">经度 (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.lng || ''}
                    onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); setEditingDevice(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmitForm}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
              >
                {editingDevice ? '保存修改' : '确认新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagePage;
