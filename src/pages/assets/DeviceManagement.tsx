import { useState } from 'react';
import {
  Search,
  Filter,
  Cpu,
  Monitor,
  Thermometer,
  Gauge,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  WifiOff,
  Building2,
  Hotel,
  Gamepad2,
  ArrowRight,
  MapPin,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Link2,
  Layers,
} from 'lucide-react';
import { devices, seats, rooms, stores, roomDeviceMaps, seatMapDataList } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { Device } from '@/types';

const statusMap = {
  normal: { label: '正常', color: 'bg-neon-green/20 text-neon-green', icon: CheckCircle },
  warning: { label: '警告', color: 'bg-neon-orange/20 text-neon-orange', icon: AlertTriangle },
  fault: { label: '故障', color: 'bg-neon-red/20 text-neon-red', icon: XCircle },
  offline: { label: '离线', color: 'bg-dark-600 text-dark-300', icon: WifiOff },
};

const typeLabels: Record<string, string> = {
  pc: '电竞主机',
  monitor: '显示器',
  keyboard: '键盘',
  mouse: '鼠标',
  headset: '耳机',
  network: '网络设备',
};

const typeOptions = ['全部类型', '电竞主机', '显示器', '键盘', '鼠标', '耳机', '网络设备'];
const statusOptions = ['全部状态', '正常', '警告', '故障', '离线'];
const storeTypeOptions = [
  { value: 'all', label: '全部门店', icon: Building2 },
  { value: 'esports', label: '电竞馆', icon: Gamepad2 },
  { value: 'hotel', label: '电竞酒店', icon: Hotel },
  { value: 'both', label: '综合店', icon: Layers },
];

export default function DeviceManagement() {
  const { currentStoreId } = useAppStore();
  const [selectedType, setSelectedType] = useState('全部类型');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');
  const [selectedStoreType, setSelectedStoreType] = useState('all');
  const [activeTab, setActiveTab] = useState<'list' | 'mapping'>('list');
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  const getStoreType = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.type || 'both';
  };

  const filteredByStoreType = devices.filter(d => {
    if (selectedStoreType === 'all') return true;
    return getStoreType(d.storeId) === selectedStoreType;
  });

  const storeDevices = filteredByStoreType.filter((d) => d.storeId === currentStoreId || currentStoreId === 'all');

  const getLinkedSeat = (deviceId: string) => {
    return seatMapDataList.find(s => s.deviceId === deviceId);
  };

  const getLinkedRoom = (deviceId: string) => {
    return roomDeviceMaps.find(r => r.deviceIds.includes(deviceId));
  };

  const filteredDevices = storeDevices.filter((device) => {
    const typeKey = selectedType === '全部类型' ? '' :
      Object.entries(typeLabels).find(([, v]) => v === selectedType)?.[0] || '';
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';

    const matchType = !typeKey || device.type === typeKey;
    const matchStatus = !statusKey || device.status === statusKey;
    const matchSearch = !searchText ||
      device.name.toLowerCase().includes(searchText.toLowerCase()) ||
      device.model.toLowerCase().includes(searchText.toLowerCase());

    return matchType && matchStatus && matchSearch;
  });

  const stats = {
    total: storeDevices.length,
    normal: storeDevices.filter((d) => d.status === 'normal').length,
    warning: storeDevices.filter((d) => d.status === 'warning').length,
    fault: storeDevices.filter((d) => d.status === 'fault').length,
  };

  const pcDevices = storeDevices.filter((d) => d.type === 'pc');
  const avgTemp = pcDevices.length > 0
    ? Math.round(pcDevices.reduce((sum, d) => sum + (d.temperature || 0), 0) / pcDevices.length)
    : 0;
  const avgFps = pcDevices.length > 0
    ? Math.round(pcDevices.reduce((sum, d) => sum + (d.frameRate || 0), 0) / pcDevices.length)
    : 0;
  const avgLatency = pcDevices.length > 0
    ? Math.round(pcDevices.reduce((sum, d) => sum + (d.networkLatency || 0), 0) / pcDevices.length)
    : 0;

  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || '未知门店';

  const toggleDeviceExpand = (deviceId: string) => {
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
  };

  const esportsCount = devices.filter(d => getStoreType(d.storeId) === 'esports').length;
  const hotelCount = devices.filter(d => getStoreType(d.storeId) === 'hotel').length;
  const bothCount = devices.filter(d => getStoreType(d.storeId) === 'both').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">设备管理</h1>
          <p className="text-dark-400 mt-1">监控设备状态与座位/包间双向映射</p>
        </div>
      </div>

      {/* 资源类型分布卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyber-500/20">
              <Gamepad2 className="w-6 h-6 text-cyber-400" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">电竞馆设备</p>
              <p className="text-2xl font-bold text-cyber-400 font-orbitron">{esportsCount}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-neon-purple/20">
              <Hotel className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">电竞酒店设备</p>
              <p className="text-2xl font-bold text-neon-purple font-orbitron">{hotelCount}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-neon-green/20">
              <Layers className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">综合店设备</p>
              <p className="text-2xl font-bold text-neon-green font-orbitron">{bothCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs 导航 */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-dark-800/50 border border-cyber-800/50 w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'list'
              ? 'bg-gradient-to-r from-cyber-600 to-neon-purple text-white shadow-lg shadow-cyber-500/20'
              : 'text-dark-400 hover:text-white'
          )}
        >
          <Cpu className="w-4 h-4" />
          设备列表
        </button>
        <button
          onClick={() => setActiveTab('mapping')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'mapping'
              ? 'bg-gradient-to-r from-cyber-600 to-neon-purple text-white shadow-lg shadow-cyber-500/20'
              : 'text-dark-400 hover:text-white'
          )}
        >
          <Link2 className="w-4 h-4" />
          资源映射
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Cpu className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">设备总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <CheckCircle className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">正常运行</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">{stats.normal}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <AlertTriangle className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">警告状态</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.warning}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/20">
              <XCircle className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">故障设备</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.fault}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-purple/20">
              <Gauge className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-dark-400 text-sm">平均帧率</p>
          </div>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">{avgFps} FPS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-300 text-sm">平均温度</span>
            <Thermometer className={cn(
              'w-5 h-5',
              avgTemp < 60 ? 'text-neon-green' : avgTemp < 75 ? 'text-neon-orange' : 'text-neon-red'
            )} />
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className={cn(
              'text-3xl font-bold font-orbitron',
              avgTemp < 60 ? 'text-neon-green' : avgTemp < 75 ? 'text-neon-orange' : 'text-neon-red'
            )}>
              {avgTemp}
            </span>
            <span className="text-dark-400 text-sm mb-1">°C</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                avgTemp < 60 ? 'bg-neon-green' : avgTemp < 75 ? 'bg-neon-orange' : 'bg-neon-red'
              )}
              style={{ width: `${Math.min((avgTemp / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-300 text-sm">平均帧率</span>
            <Monitor className="text-cyber-400 w-5 h-5" />
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-cyber-400 font-orbitron">{avgFps}</span>
            <span className="text-dark-400 text-sm mb-1">FPS</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-cyber-500 transition-all duration-500"
              style={{ width: `${Math.min((avgFps / 240) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-dark-300 text-sm">平均网络延迟</span>
            <Wifi className={cn(
              'w-5 h-5',
              avgLatency < 20 ? 'text-neon-green' : avgLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
            )} />
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className={cn(
              'text-3xl font-bold font-orbitron',
              avgLatency < 20 ? 'text-neon-green' : avgLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
            )}>
              {avgLatency}
            </span>
            <span className="text-dark-400 text-sm mb-1">ms</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                avgLatency < 20 ? 'bg-neon-green' : avgLatency < 50 ? 'bg-neon-orange' : 'bg-neon-red'
              )}
              style={{ width: `${Math.min((avgLatency / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 门店类型筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        {storeTypeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setSelectedStoreType(option.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                selectedStoreType === option.value
                  ? 'bg-gradient-to-r from-cyber-600/20 to-neon-purple/20 border-cyber-500/50 text-cyber-400 shadow-lg shadow-cyber-500/10'
                  : 'bg-dark-800/50 border-dark-700 text-dark-400 hover:text-white hover:border-dark-600'
              )}
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'list' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索设备名称/型号..."
                  className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
              高级筛选
            </button>
          </div>

          <div className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="w-10 px-4 py-4"></th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    设备名称
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    门店
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    配置
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                    实时数据
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredDevices.map((device: Device) => {
                  const statusInfo = statusMap[device.status];
                  const StatusIcon = statusInfo.icon;
                  const isExpanded = expandedDeviceId === device.id;
                  const linkedSeat = getLinkedSeat(device.id);
                  const linkedRoom = getLinkedRoom(device.id);

                  return (
                    <>
                      <tr
                        key={device.id}
                        className="hover:bg-dark-700/30 transition-colors cursor-pointer"
                        onClick={() => toggleDeviceExpand(device.id)}
                      >
                        <td className="px-4 py-4">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-dark-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-dark-400" />
                          )}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-dark-700/50">
                        {device.type === 'pc' || device.type === 'monitor' ? (
                          <Monitor className="w-5 h-5 text-cyber-400" />
                        ) : (
                          <Cpu className="w-5 h-5 text-cyber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{device.name}</p>
                        <p className="text-xs text-dark-400">{device.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-300">{getStoreName(device.storeId)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-300">{typeLabels[device.type]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {device.specs.cpu && (
                        <p className="text-xs text-dark-400">CPU: {device.specs.cpu}</p>
                      )}
                      {device.specs.gpu && (
                        <p className="text-xs text-dark-400">GPU: {device.specs.gpu}</p>
                      )}
                      {device.specs.ram && (
                        <p className="text-xs text-dark-400">内存: {device.specs.ram}</p>
                      )}
                      {device.specs.refreshRate && (
                        <p className="text-xs text-dark-400">刷新率: {device.specs.refreshRate}Hz</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full', statusInfo.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {device.type === 'pc' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Thermometer className={cn(
                            'w-3.5 h-3.5',
                            (device.temperature || 0) < 60 ? 'text-neon-green' : (device.temperature || 0) < 75 ? 'text-neon-orange' : 'text-neon-red'
                          )} />
                          <span className="text-xs text-dark-300">{device.temperature?.toFixed(0)}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-3.5 h-3.5 text-cyber-400" />
                          <span className="text-xs text-dark-300">{device.frameRate?.toFixed(0)} FPS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className={cn(
                            'w-3.5 h-3.5',
                            (device.networkLatency || 0) < 20 ? 'text-neon-green' : (device.networkLatency || 0) < 50 ? 'text-neon-orange' : 'text-neon-red'
                          )} />
                          <span className="text-xs text-dark-300">{device.networkLatency?.toFixed(0)}ms</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-dark-500">-</span>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-dark-900/50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-dark-800/80 border border-cyber-800/30">
                          <h4 className="text-sm font-semibold text-cyber-400 mb-3 flex items-center gap-2">
                            <Link2 className="w-4 h-4" />
                            资源关联映射
                          </h4>
                          <div className="space-y-3">
                            {linkedSeat && (
                              <div className="flex items-center justify-between p-3 rounded-lg bg-cyber-500/10 border border-cyber-500/20">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-cyber-500/20">
                                    <Gamepad2 className="w-5 h-5 text-cyber-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">电竞馆座位</p>
                                    <p className="text-xs text-dark-400">座位号: {linkedSeat.seatNumber} · {linkedSeat.area}</p>
                                    <p className="text-xs text-dark-500 mt-1">配置: {linkedSeat.deviceSpec}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={cn(
                                    'text-xs px-2 py-1 rounded-full',
                                    linkedSeat.status === 'available' ? 'bg-neon-green/20 text-neon-green' :
                                    linkedSeat.status === 'occupied' ? 'bg-neon-red/20 text-neon-red' :
                                    linkedSeat.status === 'reserved' ? 'bg-neon-orange/20 text-neon-orange' :
                                    'bg-dark-600 text-dark-300'
                                  )}>
                                    {linkedSeat.status === 'available' ? '空闲' :
                                     linkedSeat.status === 'occupied' ? '使用中' :
                                     linkedSeat.status === 'reserved' ? '已预订' : '维护中'}
                                  </span>
                                  {linkedSeat.currentUserName && (
                                    <p className="text-xs text-dark-400 mt-1 flex items-center gap-1 justify-end">
                                      <User className="w-3 h-3" />
                                      {linkedSeat.currentUserName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {linkedRoom && (
                              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-neon-purple/20">
                                    <Hotel className="w-5 h-5 text-neon-purple" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {linkedRoom.isHotel ? '电竞酒店房型' : '电竞馆包间'}
                                    </p>
                                    <p className="text-xs text-dark-400">{linkedRoom.roomName} · 容纳{linkedRoom.capacity}人</p>
                                    <p className="text-xs text-dark-500 mt-1">门店: {linkedRoom.storeName}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={cn(
                                    'text-xs px-2 py-1 rounded-full',
                                    linkedRoom.status === 'available' ? 'bg-neon-green/20 text-neon-green' :
                                    linkedRoom.status === 'occupied' ? 'bg-neon-red/20 text-neon-red' :
                                    linkedRoom.status === 'reserved' ? 'bg-neon-orange/20 text-neon-orange' :
                                    'bg-dark-600 text-dark-300'
                                  )}>
                                    {linkedRoom.status === 'available' ? '空闲' :
                                     linkedRoom.status === 'occupied' ? '使用中' :
                                     linkedRoom.status === 'reserved' ? '已预订' : '维护中'}
                                  </span>
                                  <p className="text-xs text-dark-500 mt-1">
                                    共 {linkedRoom.deviceIds.length} 台设备
                                  </p>
                                </div>
                              </div>
                            )}
                            {!linkedSeat && !linkedRoom && (
                              <div className="text-center py-6 text-dark-500">
                                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">该设备暂未关联座位或包间</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-dark-800/80 border border-cyber-800/30">
                          <h4 className="text-sm font-semibold text-neon-green mb-3 flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            设备配置详情
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-dark-400">设备型号</span>
                              <span className="text-white">{device.model}</span>
                            </div>
                            {device.specs.cpu && (
                              <div className="flex justify-between">
                                <span className="text-dark-400">处理器</span>
                                <span className="text-white">{device.specs.cpu}</span>
                              </div>
                            )}
                            {device.specs.gpu && (
                              <div className="flex justify-between">
                                <span className="text-dark-400">显卡</span>
                                <span className="text-white">{device.specs.gpu}</span>
                              </div>
                            )}
                            {device.specs.ram && (
                              <div className="flex justify-between">
                                <span className="text-dark-400">内存</span>
                                <span className="text-white">{device.specs.ram}</span>
                              </div>
                            )}
                            {device.specs.storage && (
                              <div className="flex justify-between">
                                <span className="text-dark-400">存储</span>
                                <span className="text-white">{device.specs.storage}</span>
                              </div>
                            )}
                            {device.specs.refreshRate && (
                              <div className="flex justify-between">
                                <span className="text-dark-400">刷新率</span>
                                <span className="text-white">{device.specs.refreshRate}Hz</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-dark-400">放置位置</span>
                              <span className="text-white">{device.location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-dark-400">上次维护</span>
                              <span className="text-white">{new Date(device.lastMaintenance).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
              </tbody>
            </table>

            {filteredDevices.length === 0 && (
              <div className="py-12 text-center text-dark-400">
                <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>没有找到符合条件的设备</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'mapping' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyber-400" />
              座位-设备映射 (电竞馆)
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {seatMapDataList.slice(0, 20).map((seat) => (
                <div key={seat.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50 hover:bg-dark-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                      seat.status === 'available' ? 'bg-neon-green/20 text-neon-green' :
                      seat.status === 'occupied' ? 'bg-neon-red/20 text-neon-red' :
                      seat.status === 'reserved' ? 'bg-neon-orange/20 text-neon-orange' :
                      'bg-dark-700 text-dark-400'
                    )}>
                      {seat.seatNumber.split('-').pop()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{seat.seatNumber}</p>
                      <p className="text-xs text-dark-400">{seat.area} · {seat.deviceSpec}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-dark-600" />
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      seat.networkLatency < 10 ? 'bg-neon-green/20 text-neon-green' :
                      seat.networkLatency < 30 ? 'bg-cyber-500/20 text-cyber-400' :
                      'bg-neon-orange/20 text-neon-orange'
                    )}>
                      {seat.networkLatency}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-xl bg-dark-800/50 border border-neon-purple/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-neon-purple" />
              包间/房型-设备映射 (电竞酒店)
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {roomDeviceMaps.slice(0, 15).map((room) => (
                <div key={room.roomId} className="p-3 rounded-lg bg-dark-900/50 hover:bg-dark-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        room.isHotel ? 'bg-neon-purple/20' : 'bg-cyber-500/20'
                      )}>
                        {room.isHotel ? (
                          <Hotel className={cn('w-4 h-4', room.isHotel ? 'text-neon-purple' : 'text-cyber-400')} />
                        ) : (
                          <Gamepad2 className="w-4 h-4 text-cyber-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{room.roomName}</p>
                        <p className="text-xs text-dark-400">
                          {room.isHotel ? '电竞酒店' : '电竞馆'} · {room.storeName}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      room.status === 'available' ? 'bg-neon-green/20 text-neon-green' :
                      room.status === 'occupied' ? 'bg-neon-red/20 text-neon-red' :
                      'bg-neon-orange/20 text-neon-orange'
                    )}>
                      {room.status === 'available' ? '空闲' :
                       room.status === 'occupied' ? '使用中' : '维护中'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-11">
                    {room.devices.map((dev, idx) => (
                      <span key={idx} className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        dev.status === 'normal' ? 'bg-dark-700 text-dark-300' :
                        dev.status === 'warning' ? 'bg-neon-orange/20 text-neon-orange' :
                        'bg-neon-red/20 text-neon-red'
                      )}>
                        {dev.model}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
