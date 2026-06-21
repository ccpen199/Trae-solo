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
} from 'lucide-react';
import { devices } from '@/data/mockData';
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

export default function DeviceManagement() {
  const { currentStoreId } = useAppStore();
  const [selectedType, setSelectedType] = useState('全部类型');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');

  const storeDevices = devices.filter((d) => d.storeId === currentStoreId);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">设备管理</h1>
          <p className="text-dark-400 mt-1">监控设备状态与配置信息</p>
        </div>
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
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                设备名称
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                类型
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                配置
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                位置
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

              return (
                <tr key={device.id} className="hover:bg-dark-700/30 transition-colors">
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
                    <span className="text-sm text-dark-300">{device.location}</span>
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
    </div>
  );
}
