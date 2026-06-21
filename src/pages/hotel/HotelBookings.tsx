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
  Monitor,
  Cpu,
  History,
  RefreshCw,
  ShieldAlert,
  Clock,
  UserCheck,
} from 'lucide-react';
import { hotelBookings, deviceLockRecords, rooms, devices } from '@/data/mockData';
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

const actionMap: Record<string, { label: string; color: string; icon: any }> = {
  lock: { label: '锁定', color: 'text-neon-red border-neon-red/50 bg-neon-red/10', icon: Lock },
  unlock: { label: '解锁', color: 'text-neon-green border-neon-green/50 bg-neon-green/10', icon: Unlock },
  extend: { label: '续住', color: 'text-cyber-400 border-cyber-500/50 bg-cyber-500/10', icon: RefreshCw },
  force_unlock: { label: '强制解锁', color: 'text-neon-orange border-neon-orange/50 bg-neon-orange/10', icon: ShieldAlert },
};

const deviceStatusMap: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'text-neon-green' },
  warning: { label: '告警', color: 'text-neon-orange' },
  fault: { label: '故障', color: 'text-neon-red' },
  offline: { label: '离线', color: 'text-dark-400' },
};

export default function HotelBookings() {
  const { currentStoreId } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'deviceRecords'>('bookings');

  const storeBookings = hotelBookings.filter((b) => b.storeId === currentStoreId);
  const storeLockRecords = deviceLockRecords.filter((r) => {
    const booking = hotelBookings.find((b) => b.id === r.hotelBookingId);
    return booking?.storeId === currentStoreId;
  });

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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRoomDevices = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return [];
    return room.deviceIds
      .map((id) => devices.find((d) => d.id === id))
      .filter(Boolean)
      .slice(0, 6);
  };

  const getBookingLockRecords = (bookingId: string) => {
    return deviceLockRecords
      .filter((r) => r.hotelBookingId === bookingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getUniqueDevicesFromRecords = (records: typeof deviceLockRecords) => {
    const seen = new Set<string>();
    return records.filter((r) => {
      if (seen.has(r.deviceId)) return false;
      seen.add(r.deviceId);
      return true;
    });
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

      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('bookings')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'bookings'
              ? 'border-cyber-500 text-cyber-400'
              : 'border-transparent text-dark-400 hover:text-white'
          )}
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            预订列表
          </span>
        </button>
        <button
          onClick={() => setActiveTab('deviceRecords')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'deviceRecords'
              ? 'border-cyber-500 text-cyber-400'
              : 'border-transparent text-dark-400 hover:text-white'
          )}
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4" />
            设备联动记录
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-neon-purple/20 text-neon-purple">
              {storeLockRecords.length}
            </span>
          </span>
        </button>
      </div>

      {activeTab === 'bookings' ? (
        <>
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
              const lockRecords = getBookingLockRecords(booking.id);
              const roomDevices = getRoomDevices(booking.roomId);
              const uniqueLockedDevices = getUniqueDevicesFromRecords(lockRecords);

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
                            {lockRecords.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple">
                                {lockRecords.length} 条联动记录
                              </span>
                            )}
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
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            客人信息
                          </h4>
                          <div className="flex items-center gap-2 text-sm">
                            <UserCheck className="w-4 h-4 text-dark-500" />
                            <span className="text-white">{booking.guestName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-dark-500" />
                            <span className="text-white">{booking.guestPhone}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            入住信息
                          </h4>
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
                          <h4 className="text-sm font-medium text-dark-300 flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            设备联动状态
                          </h4>
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
                          {uniqueLockedDevices.length > 0 && (
                            <p className="text-xs text-dark-400">
                              已联动 {uniqueLockedDevices.length} 台设备
                            </p>
                          )}
                        </div>
                      </div>

                      {roomDevices.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-dark-700">
                          <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            联动设备清单 ({roomDevices.length}台)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {roomDevices.map((device) => {
                              if (!device) return null;
                              const statusInfo = deviceStatusMap[device.status] || deviceStatusMap.normal;
                              const lockRecord = lockRecords.find((r) => r.deviceId === device.id);
                              return (
                                <div
                                  key={device.id}
                                  className="p-3 rounded-lg bg-dark-700/50 border border-dark-600"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Monitor className="w-4 h-4 text-cyber-400" />
                                      <span className="text-sm text-white">{device.name}</span>
                                    </div>
                                    <span className={cn('text-xs', statusInfo.color)}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  {device.specs.gpu && (
                                    <p className="text-xs text-dark-400">
                                      GPU: {device.specs.gpu.split(' ').slice(-2).join(' ')}
                                    </p>
                                  )}
                                  {device.specs.cpu && (
                                    <p className="text-xs text-dark-400">
                                      CPU: {device.specs.cpu.split(' ').slice(-2).join(' ')}
                                    </p>
                                  )}
                                  {lockRecord && (
                                    <div className="mt-2 pt-2 border-t border-dark-600 space-y-1">
                                      <div className="flex items-center gap-1 text-xs">
                                        <Lock className="w-3 h-3 text-neon-red" />
                                        <span className="text-dark-300">锁定时间:</span>
                                        <span className="text-white">
                                          {lockRecord.lockedAt ? formatDateTime(lockRecord.lockedAt) : '-'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <Clock className="w-3 h-3 text-cyber-400" />
                                        <span className="text-dark-300">预计解锁:</span>
                                        <span className="text-white">
                                          {formatDateTime(booking.checkOut)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {lockRecords.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-dark-700">
                          <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            操作历史记录
                          </h4>
                          <div className="space-y-2">
                            {lockRecords.map((record) => {
                              const actionInfo = actionMap[record.action] || actionMap.lock;
                              const ActionIcon = actionInfo.icon;
                              return (
                                <div
                                  key={record.id}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-dark-700/30 border border-dark-600/50"
                                >
                                  <div className={cn(
                                    'w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0',
                                    actionInfo.color
                                  )}>
                                    <ActionIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={cn('text-sm font-medium', actionInfo.color.split(' ')[0])}>
                                        {actionInfo.label}
                                      </span>
                                      <span className="text-xs text-dark-400">
                                        {record.deviceName}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">
                                        {record.roomName}
                                      </span>
                                    </div>
                                    {record.reason && (
                                      <p className="text-xs text-dark-300 mt-1">{record.reason}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-1.5 text-xs text-dark-500">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {record.operatorName}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDateTime(record.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-dark-700 flex gap-3 flex-wrap">
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
                            <button className="flex items-center gap-2 h-9 px-4 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple text-sm font-medium rounded-lg transition-colors border border-neon-purple/30">
                              <RefreshCw className="w-4 h-4" />
                              续住
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
        </>
      ) : (
        <div className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden">
          <div className="p-4 border-b border-dark-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-cyber-400" />
              房型-设备联动记录
              <span className="text-sm font-normal text-dark-400">
                （锁定/解锁/续住/强制解锁）
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">房型</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">设备</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">操作人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">原因</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {storeLockRecords
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((record) => {
                    const actionInfo = actionMap[record.action] || actionMap.lock;
                    const ActionIcon = actionInfo.icon;
                    return (
                      <tr key={record.id} className="hover:bg-dark-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">{record.roomName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-cyber-400" />
                            <span className="text-sm text-white">{record.deviceName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border',
                            actionInfo.color
                          )}>
                            <ActionIcon className="w-3 h-3" />
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-dark-300">{record.operatorName}</span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-sm text-dark-400 line-clamp-1">{record.reason || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-dark-400">{formatDateTime(record.createdAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {storeLockRecords.length === 0 && (
            <div className="py-12 text-center text-dark-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无设备联动记录</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
