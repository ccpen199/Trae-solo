import { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Key,
  LogOut,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { hotelBookings } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const statusMap = {
  pending: { label: '待确认', color: 'bg-neon-orange/20 text-neon-orange' },
  confirmed: { label: '已确认', color: 'bg-cyber-500/20 text-cyber-400' },
  checked_in: { label: '已入住', color: 'bg-neon-green/20 text-neon-green' },
  checked_out: { label: '已退房', color: 'bg-dark-600 text-dark-300' },
  cancelled: { label: '已取消', color: 'bg-neon-red/20 text-neon-red' },
};

const statusOptions = ['全部状态', '待确认', '已确认', '已入住', '已退房', '已取消'];

export default function HotelBookings() {
  const { currentStoreId } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const storeBookings = hotelBookings.filter((b) => b.storeId === currentStoreId);

  const filteredBookings = storeBookings.filter((booking) => {
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';

    const matchStatus = !statusKey || booking.status === statusKey;
    const matchSearch = !searchText ||
      booking.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.roomName.toLowerCase().includes(searchText.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchText.toLowerCase());

    return matchStatus && matchSearch;
  });

  const stats = {
    total: storeBookings.length,
    checkedIn: storeBookings.filter((b) => b.status === 'checked_in').length,
    confirmed: storeBookings.filter((b) => b.status === 'confirmed').length,
    todayRevenue: storeBookings
      .filter((b) => b.status === 'checked_in' || b.status === 'checked_out')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">酒店预订管理</h1>
          <p className="text-dark-400 mt-1">管理酒店预订订单与入住状态</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <p className="text-dark-400 text-sm mb-1">预订总数</p>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <p className="text-dark-400 text-sm mb-1">当前入住</p>
          <p className="text-2xl font-bold text-neon-green font-orbitron">{stats.checkedIn}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-500/30">
          <p className="text-dark-400 text-sm mb-1">待入住</p>
          <p className="text-2xl font-bold text-cyber-400 font-orbitron">{stats.confirmed}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <p className="text-dark-400 text-sm mb-1">今日营收</p>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">¥{stats.todayRevenue}</p>
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
              placeholder="搜索订单/客户/房间..."
              className="w-64 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

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

      <div className="space-y-3">
        {filteredBookings.map((booking) => {
          const statusInfo = statusMap[booking.status];
          const isExpanded = expandedId === booking.id;

          return (
            <div
              key={booking.id}
              className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-600/50"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(booking.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyber-500/20 to-neon-purple/20 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-cyber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-medium">{booking.roomName}</h3>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
                        <span>订单号: {booking.id}</span>
                        <span>客人: {booking.userName}</span>
                        <span>{booking.nights} 晚</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-neon-green font-orbitron">
                        ¥{booking.totalAmount}
                      </p>
                      <p className="text-xs text-dark-500">
                        {formatDate(booking.checkIn)} 入住
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-dark-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-dark-400" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-dark-700">
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">客人信息</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-dark-500" />
                        <span className="text-white">{booking.guestName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-dark-500" />
                        <span className="text-white">{booking.guestPhone}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">入住信息</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Key className="w-4 h-4 text-dark-500" />
                        <span className="text-white">入住: {formatDate(booking.checkIn)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <LogOut className="w-4 h-4 text-dark-500" />
                        <span className="text-white">退房: {formatDate(booking.checkOut)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-dark-300">设备联动</h4>
                      <div className="flex items-center gap-2 text-sm">
                        {booking.deviceLocked ? (
                          <>
                            <Lock className="w-4 h-4 text-neon-red" />
                            <span className="text-neon-red">设备已锁定</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 text-neon-green" />
                            <span className="text-neon-green">设备已解锁</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark-700 flex gap-3">
                    {booking.status === 'confirmed' && (
                      <button className="flex items-center gap-2 h-9 px-4 bg-neon-green hover:bg-neon-green/80 text-white text-sm font-medium rounded-lg transition-colors">
                        <Key className="w-4 h-4" />
                        办理入住
                      </button>
                    )}
                    {booking.status === 'checked_in' && (
                      <>
                        <button className="flex items-center gap-2 h-9 px-4 bg-cyber-600 hover:bg-cyber-500 text-white text-sm font-medium rounded-lg transition-colors">
                          <LogOut className="w-4 h-4" />
                          办理退房
                        </button>
                        <button className="flex items-center gap-2 h-9 px-4 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors">
                          {booking.deviceLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {booking.deviceLocked ? '解锁设备' : '锁定设备'}
                        </button>
                      </>
                    )}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button className="flex items-center gap-2 h-9 px-4 bg-neon-red/20 hover:bg-neon-red/30 text-neon-red text-sm font-medium rounded-lg transition-colors ml-auto">
                        取消订单
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的预订</p>
        </div>
      )}
    </div>
  );
}
