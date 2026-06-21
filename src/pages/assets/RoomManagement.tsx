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
} from 'lucide-react';
import { rooms } from '@/data/mockData';
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

export default function RoomManagement() {
  const { currentStoreId } = useAppStore();
  const [selectedType, setSelectedType] = useState('全部房型');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');

  const storeRooms = rooms.filter((r) => r.storeId === currentStoreId);

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
          <h1 className="text-2xl font-bold text-white font-orbitron">包间管理</h1>
          <p className="text-dark-400 mt-1">管理电竞酒店房型与包间配置</p>
        </div>
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

          return (
            <div
              key={room.id}
              className={cn(
                'group relative rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1',
                room.status === 'maintenance'
                  ? 'bg-dark-800/50 border-dark-700 opacity-60'
                  : 'bg-dark-800/50 border-cyber-800/50 hover:border-cyber-600/50 hover:shadow-neon-blue/20'
              )}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={room.image}
                  alt={room.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>

                <div className="absolute top-3 left-3">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full', statusInfo.color)}>
                    <span className={cn('w-2 h-2 rounded-full', statusInfo.dot)}></span>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-neon-purple/20 text-neon-purple">
                    {typeLabels[room.type]}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-bold text-white">{room.name}</h3>
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
