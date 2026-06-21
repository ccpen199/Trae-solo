import { useState } from 'react';
import {
  Search,
  Filter,
  Users,
  Maximize2,
  Monitor,
  Star,
  Wrench,
  CheckCircle,
  Clock,
  XCircle,
  Hotel,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Wifi,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { rooms, stores, roomDeviceMaps, devices } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const statusMap = {
  available: { label: '空闲', color: 'bg-neon-green/20 text-neon-green', dot: 'bg-neon-green' },
  occupied: { label: '使用中', color: 'bg-neon-red/20 text-neon-red', dot: 'bg-neon-red' },
  reserved: { label: '已预订', color: 'bg-neon-orange/20 text-neon-orange', dot: 'bg-neon-orange' },
  maintenance: { label: '维护中', color: 'bg-dark-600 text-dark-300', dot: 'bg-dark-500' },
};

const typeLabels: Record<string, string> = {
  standard: '标准双人房',
  deluxe: '豪华四人房',
  vip: 'VIP六人房',
  presidential: '总统套房',
};

const typeOptions = ['全部房型', '标准双人房', '豪华四人房', 'VIP六人房', '总统套房'];
const statusOptions = ['全部状态', '空闲', '使用中', '已预订', '维护中'];

const storeTypeOptions = [
  { value: 'all', label: '全部类型', icon: Layers },
  { value: 'esports', label: '电竞馆包间', icon: Gamepad2 },
  { value: 'hotel', label: '电竞酒店房型', icon: Hotel },
];

export default function RoomManagement() {
  const { currentStoreId } = useAppStore();
  const [selectedType, setSelectedType] = useState('全部房型');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');
  const [selectedStoreType, setSelectedStoreType] = useState('all');
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  const getStoreType = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.type || 'both';
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || '未知门店';
  };

  const toggleRoomExpand = (roomId: string) => {
    setExpandedRoomId(expandedRoomId === roomId ? null : roomId);
  };

  const getRoomDeviceMap = (roomId: string) => {
    return roomDeviceMaps.find(r => r.roomId === roomId);
  };

  const getDeviceById = (deviceId: string) => {
    return devices.find(d => d.id === deviceId);
  };

  const filteredByStoreType = rooms.filter(r => {
    if (selectedStoreType === 'all') return true;
    const storeType = getStoreType(r.storeId);
    if (selectedStoreType === 'hotel') {
      return storeType === 'hotel' || storeType === 'both';
    }
    if (selectedStoreType === 'esports') {
      return storeType === 'esports' || storeType === 'both';
    }
    return true;
  });

  const storeRooms = filteredByStoreType.filter((r) => r.storeId === currentStoreId || currentStoreId === 'all');

  const hotelCount = storeRooms.filter(r => {
    const t = getStoreType(r.storeId);
    return t === 'hotel' || t === 'both';
  }).length;

  const esportsCount = storeRooms.filter(r => {
    const t = getStoreType(r.storeId);
    return t === 'esports' || t === 'both';
  }).length;

  const filteredRooms = storeRooms.filter((room) => {
    const typeKey = selectedType === '全部房型' ? '' :
      Object.entries(typeLabels).find(([, v]) => v === selectedType)?.[0] || '';
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';

    const matchType = !typeKey || room.type === typeKey;
    const matchStatus = !statusKey || room.status === statusKey;
    const matchSearch = !searchText || room.name.toLowerCase().includes(searchText.toLowerCase());

    return matchType && matchStatus && matchSearch;
  });

  const stats = {
    total: storeRooms.length,
    available: storeRooms.filter((r) => r.status === 'available').length,
    occupied: storeRooms.filter((r) => r.status === 'occupied').length,
    maintenance: storeRooms.filter((r) => r.status === 'maintenance').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">包间/房型管理</h1>
          <p className="text-dark-400 mt-1">管理电竞馆包间与电竞酒店房型资产</p>
        </div>
      </div>

      {/* 资源类型分布卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyber-500/20">
              <Gamepad2 className="w-8 h-8 text-cyber-400" />
            </div>
            <div className="flex-1">
              <p className="text-dark-400 text-sm">电竞馆包间</p>
              <p className="text-3xl font-bold text-cyber-400 font-orbitron">{esportsCount}</p>
            </div>
            <div className="text-right text-xs text-dark-400">
              <p>共 {esportsCount} 个包间</p>
              <p>分布于 {stores.filter(s => s.type === 'esports' || s.type === 'both').length} 家电竞馆</p>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-neon-purple/20">
              <Hotel className="w-8 h-8 text-neon-purple" />
            </div>
            <div className="flex-1">
              <p className="text-dark-400 text-sm">电竞酒店房型</p>
              <p className="text-3xl font-bold text-neon-purple font-orbitron">{hotelCount}</p>
            </div>
            <div className="text-right text-xs text-dark-400">
              <p>共 {hotelCount} 种房型</p>
              <p>分布于 {stores.filter(s => s.type === 'hotel' || s.type === 'both').length} 家电竞酒店</p>
            </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Maximize2 className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">总包间数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <CheckCircle className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">空闲包间</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">{stats.available}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-red/20">
              <Users className="w-5 h-5 text-neon-red" />
            </div>
            <p className="text-dark-400 text-sm">使用中</p>
          </div>
          <p className="text-2xl font-bold text-neon-red font-orbitron">{stats.occupied}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Wrench className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">维护中</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.maintenance}</p>
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
              placeholder="搜索包间名称..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          const statusInfo = statusMap[room.status];
          const isExpanded = expandedRoomId === room.id;
          const storeType = getStoreType(room.storeId);
          const roomMapData = getRoomDeviceMap(room.id);

          return (
            <div
              key={room.id}
              className={cn(
                'group relative rounded-xl overflow-hidden border transition-all duration-300',
                room.status === 'maintenance'
                  ? 'bg-dark-800/50 border-dark-700 opacity-60'
                  : 'bg-dark-800/50 border-cyber-800/50 hover:border-cyber-600/50 hover:shadow-neon-blue/20'
              )}
            >
              <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => toggleRoomExpand(room.id)}>
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>

                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full', statusInfo.color)}>
                    <span className={cn('w-2 h-2 rounded-full', statusInfo.dot)}></span>
                    {statusInfo.label}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                    storeType === 'hotel' ? 'bg-neon-purple/20 text-neon-purple' :
                    storeType === 'esports' ? 'bg-cyber-500/20 text-cyber-400' :
                    'bg-neon-green/20 text-neon-green'
                  )}>
                    {storeType === 'hotel' ? <Hotel className="w-3 h-3" /> :
                     storeType === 'esports' ? <Gamepad2 className="w-3 h-3" /> :
                     <Layers className="w-3 h-3" />}
                    {storeType === 'hotel' ? '电竞酒店' :
                     storeType === 'esports' ? '电竞馆' : '综合店'}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neon-purple/20 text-neon-purple">
                    {typeLabels[room.type]}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{room.name}</h3>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <p className="text-xs text-dark-400">{getStoreName(room.storeId)}</p>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-dark-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">容纳 {room.capacity} 人</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-400">
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-sm">{room.area}㎡</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-dark-400">
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">{room.deviceIds.length} 台电竞设备</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {room.facilities.slice(0, 4).map((facility, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full bg-dark-700/50 text-dark-300"
                    >
                      {facility}
                    </span>
                  ))}
                  {room.facilities.length > 4 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700/50 text-dark-400">
                      +{room.facilities.length - 4}
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between pt-2 border-t border-dark-700">
                  <div>
                    <p className="text-xs text-dark-500">小时价</p>
                    <p className="text-xl font-bold text-neon-green font-orbitron">
                      ¥{room.pricePerHour}
                      <span className="text-sm font-normal text-dark-400">/时</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-500">过夜价</p>
                    <p className="text-lg font-bold text-neon-purple font-orbitron">
                      ¥{room.pricePerNight}
                      <span className="text-sm font-normal text-dark-400">/晚</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 h-9 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors">
                    查看详情
                  </button>
                  <button className="h-9 w-9 flex items-center justify-center bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg transition-colors">
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 展开的设备配置清单 */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-dark-700">
                  <div className="pt-4">
                    <h4 className="text-sm font-semibold text-cyber-400 mb-3 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      房间设备配置清单
                    </h4>
                    <div className="space-y-2">
                      {roomMapData?.devices?.map((dev, idx) => {
                        const fullDevice = getDeviceById(dev.id);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-dark-900/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'p-2 rounded-lg',
                                dev.status === 'normal' ? 'bg-neon-green/10' :
                                dev.status === 'warning' ? 'bg-neon-orange/10' :
                                'bg-neon-red/10'
                              )}>
                                {dev.type === 'pc' ? (
                                  <Cpu className={cn(
                                    'w-4 h-4',
                                    dev.status === 'normal' ? 'text-neon-green' :
                                    dev.status === 'warning' ? 'text-neon-orange' : 'text-neon-red'
                                  )} />
                                ) : dev.type === 'monitor' ? (
                                  <Monitor className="w-4 h-4 text-cyber-400" />
                                ) : (
                                  <Gamepad2 className="w-4 h-4 text-neon-purple" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{dev.name}</p>
                                <p className="text-xs text-dark-400">{dev.model}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {fullDevice?.networkLatency && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Wifi className={cn(
                                    'w-3 h-3',
                                    fullDevice.networkLatency < 20 ? 'text-neon-green' :
                                    fullDevice.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                                  )} />
                                  <span className={cn(
                                    fullDevice.networkLatency < 20 ? 'text-neon-green' :
                                    fullDevice.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                                  )}>
                                    {fullDevice.networkLatency}ms
                                  </span>
                                </div>
                              )}
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                dev.status === 'normal' ? 'bg-neon-green/20 text-neon-green' :
                                dev.status === 'warning' ? 'bg-neon-orange/20 text-neon-orange' :
                                'bg-neon-red/20 text-neon-red'
                              )}>
                                {dev.status === 'normal' ? '正常' :
                                 dev.status === 'warning' ? (
                                   <span className="flex items-center gap-1">
                                     <AlertTriangle className="w-3 h-3" /> 警告
                                   </span>
                                 ) : '故障'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {(!roomMapData?.devices || roomMapData.devices.length === 0) && (
                        <div className="text-center py-4 text-dark-500">
                          <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">暂无设备配置信息</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 主要设备规格 - 展示房间内第一台PC的配置 */}
                  {roomMapData?.devices && roomMapData.devices.length > 0 && (() => {
                    const firstPC = roomMapData.devices.find(d => d.type === 'pc');
                    const firstPCDevice = firstPC ? getDeviceById(firstPC.id) : null;
                    if (!firstPCDevice?.specs) return null;
                    return (
                      <div className="pt-4 mt-4 border-t border-dark-700">
                        <h5 className="text-xs font-medium text-dark-400 mb-2">主要设备规格</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {firstPCDevice.specs.cpu && (
                            <div className="flex justify-between">
                              <span className="text-dark-500">CPU:</span>
                              <span className="text-white">{firstPCDevice.specs.cpu}</span>
                            </div>
                          )}
                          {firstPCDevice.specs.gpu && (
                            <div className="flex justify-between">
                              <span className="text-dark-500">GPU:</span>
                              <span className="text-white">{firstPCDevice.specs.gpu}</span>
                            </div>
                          )}
                          {firstPCDevice.specs.ram && (
                            <div className="flex justify-between">
                              <span className="text-dark-500">内存:</span>
                              <span className="text-white">{firstPCDevice.specs.ram}</span>
                            </div>
                          )}
                          {firstPCDevice.specs.refreshRate && (
                            <div className="flex justify-between">
                              <span className="text-dark-500">刷新率:</span>
                              <span className="text-white">{firstPCDevice.specs.refreshRate}Hz</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的包间</p>
        </div>
      )}
    </div>
  );
}
