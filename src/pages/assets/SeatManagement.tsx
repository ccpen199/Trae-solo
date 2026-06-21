import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Monitor, Cpu, Wifi, Clock, User, ChevronDown, ChevronUp, Gauge, Gamepad2 } from 'lucide-react';
import { seats, devices, seatMapDataList } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const statusMap = {
  available: { label: '空闲', color: 'bg-neon-green/20 text-neon-green' },
  occupied: { label: '使用中', color: 'bg-neon-red/20 text-neon-red' },
  reserved: { label: '已预订', color: 'bg-neon-orange/20 text-neon-orange' },
  maintenance: { label: '维护中', color: 'bg-dark-600 text-dark-300' },
};

const areas = ['全部区域', 'A区', 'B区', 'C区'];
const statuses = ['全部状态', '空闲', '使用中', '已预订', '维护中'];

export default function SeatManagement() {
  const { currentStoreId } = useAppStore();
  const [selectedArea, setSelectedArea] = useState('全部区域');
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [expandedSeatId, setExpandedSeatId] = useState<string | null>(null);

  const storeSeats = seats.filter((s) => s.storeId === currentStoreId);
  const storeSeatMapData = seatMapDataList.filter(s => seats.find(seat => seat.id === s.id)?.storeId === currentStoreId);

  const toggleSeatExpand = (seatId: string) => {
    setExpandedSeatId(expandedSeatId === seatId ? null : seatId);
  };

  const getSeatMapData = (seatId: string) => {
    return seatMapDataList.find(s => s.id === seatId);
  };

  const filteredSeats = storeSeats.filter((seat) => {
    const matchArea = selectedArea === '全部区域' || seat.area === selectedArea.replace('区', '') + '区';
    const statusKey = selectedStatus === '全部状态' ? '' : 
      selectedStatus === '空闲' ? 'available' :
      selectedStatus === '使用中' ? 'occupied' :
      selectedStatus === '已预订' ? 'reserved' : 'maintenance';
    const matchStatus = !statusKey || seat.status === statusKey;
    const matchSearch = !searchText || 
      seat.seatNumber.toLowerCase().includes(searchText.toLowerCase());
    return matchArea && matchStatus && matchSearch;
  });

  const getDevice = (deviceId: string) => devices.find((d) => d.id === deviceId);

  // 座位地图模式
  const rows = Math.max(...storeSeats.map((s) => s.row)) || 8;
  const cols = Math.max(...storeSeats.map((s) => s.col)) || 10;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">座位管理</h1>
          <p className="text-dark-400 mt-1">管理门店座位资产与设备配置</p>
        </div>
        <button className="flex items-center gap-2 h-10 px-4 bg-cyber-600 hover:bg-cyber-500 text-white font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          添加座位
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <p className="text-dark-400 text-sm mb-1">总座位数</p>
          <p className="text-2xl font-bold text-white font-orbitron">{storeSeats.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <p className="text-dark-400 text-sm mb-1">空闲座位</p>
          <p className="text-2xl font-bold text-neon-green font-orbitron">
            {storeSeats.filter((s) => s.status === 'available').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-red/30">
          <p className="text-dark-400 text-sm mb-1">使用中</p>
          <p className="text-2xl font-bold text-neon-red font-orbitron">
            {storeSeats.filter((s) => s.status === 'occupied').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <p className="text-dark-400 text-sm mb-1">今日使用率</p>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">
            {Math.round((storeSeats.filter((s) => s.status === 'occupied').length / storeSeats.length) * 100)}%
          </p>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex items-center gap-3">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索座位号..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          {/* 区域筛选 */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          {/* 状态筛选 */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-dark-700 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-cyber-600 text-white'
                  : 'bg-dark-900 text-dark-400 hover:text-white'
              )}
            >
              列表
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                viewMode === 'map'
                  ? 'bg-cyber-600 text-white'
                  : 'bg-dark-900 text-dark-400 hover:text-white'
              )}
            >
              地图
            </button>
          </div>
          <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
        </div>
      </div>

      {/* 座位地图视图 */}
      {viewMode === 'map' && (
        <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">座位分布图</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-neon-green/50 border border-neon-green"></span>
                <span className="text-dark-300">空闲</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-neon-red/50 border border-neon-red"></span>
                <span className="text-dark-300">使用中</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-neon-orange/50 border border-neon-orange"></span>
                <span className="text-dark-300">已预订</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-dark-600/50 border border-dark-600"></span>
                <span className="text-dark-300">维护中</span>
              </span>
              <span className="flex items-center gap-2 text-dark-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neon-green"></span>
                  <span className="text-[10px]">&lt;10ms</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyber-400"></span>
                  <span className="text-[10px]">&lt;30ms</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neon-orange"></span>
                  <span className="text-[10px]">&lt;60ms</span>
                </span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-grid gap-3 min-w-max" style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}>
              {/* 列标题 */}
              <div></div>
              {Array.from({ length: cols }, (_, i) => (
                <div key={i} className="w-20 h-8 flex items-center justify-center text-xs text-dark-400">
                  {i + 1}列
                </div>
              ))}

              {/* 行 */}
              {Array.from({ length: rows }, (_, rowIndex) => (
                <>
                  <div key={`row-${rowIndex}`} className="w-12 h-20 flex items-center justify-center text-xs text-dark-400">
                    {rowIndex + 1}排
                  </div>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const seat = storeSeats.find(
                      (s) => s.row === rowIndex + 1 && s.col === colIndex + 1
                    );
                    if (!seat) {
                      return <div key={`empty-${rowIndex}-${colIndex}`} className="w-20 h-20"></div>;
                    }
                    const device = getDevice(seat.deviceId);
                    const seatMapData = getSeatMapData(seat.id);
                    const statusInfo = statusMap[seat.status];

                    return (
                      <div
                        key={seat.id}
                        className={cn(
                          'w-20 h-20 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border-2 group relative',
                          seat.status === 'available' && 'bg-neon-green/10 border-neon-green/50 hover:bg-neon-green/20 hover:shadow-neon-green/20',
                          seat.status === 'occupied' && 'bg-neon-red/10 border-neon-red/50 hover:bg-neon-red/20',
                          seat.status === 'reserved' && 'bg-neon-orange/10 border-neon-orange/50 hover:bg-neon-orange/20',
                          seat.status === 'maintenance' && 'bg-dark-700/50 border-dark-600 opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Gamepad2 className={cn(
                          'w-6 h-6 mb-1',
                          seat.status === 'available' && 'text-neon-green',
                          seat.status === 'occupied' && 'text-neon-red',
                          seat.status === 'reserved' && 'text-neon-orange',
                          seat.status === 'maintenance' && 'text-dark-500'
                        )} />
                        <span className="text-xs font-medium text-white font-orbitron">{seat.seatNumber}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Wifi className={cn(
                            'w-3 h-3',
                            seat.networkLatency < 10 ? 'text-neon-green' :
                            seat.networkLatency < 30 ? 'text-cyber-400' :
                            seat.networkLatency < 60 ? 'text-neon-orange' : 'text-neon-red'
                          )} />
                          <span className={cn(
                            'text-[10px]',
                            seat.networkLatency < 10 ? 'text-neon-green' :
                            seat.networkLatency < 30 ? 'text-cyber-400' :
                            seat.networkLatency < 60 ? 'text-neon-orange' : 'text-neon-red'
                          )}>
                            {seat.networkLatency}ms
                          </span>
                        </div>
                        {seatMapData && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity z-10 w-56 p-3 rounded-lg bg-dark-900 border border-cyber-700 shadow-xl pointer-events-none">
                            <div className="text-xs font-semibold text-cyber-400 mb-2 font-orbitron">{seatMapData.deviceSpec}</div>
                            <div className="text-xs text-dark-400 space-y-1.5">
                              <div className="flex justify-between">
                                <span>区域:</span>
                                <span className="text-white">{seatMapData.area}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>价格:</span>
                                <span className="text-neon-green">¥{seatMapData.pricePerHour}/小时</span>
                              </div>
                              <div className="flex justify-between">
                                <span>延迟:</span>
                                <span className={cn(
                                  seatMapData.networkLatency < 20 ? 'text-neon-green' : 'text-neon-orange'
                                )}>{seatMapData.networkLatency}ms</span>
                              </div>
                              {seatMapData.currentUserName && (
                                <div className="pt-1 border-t border-dark-700 mt-1">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-neon-purple" />
                                    <span className="text-white">{seatMapData.currentUserName}</span>
                                  </div>
                                </div>
                              )}
                              {seatMapData.bookingEndTime && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-neon-orange" />
                                  <span className="text-neon-orange">预计结束: {new Date(seatMapData.bookingEndTime).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="w-10 px-4 py-4"></th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  座位号
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  区域
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  设备配置
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  网络延迟
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredSeats.map((seat) => {
                const device = getDevice(seat.deviceId);
                const seatMapData = getSeatMapData(seat.id);
                const statusInfo = statusMap[seat.status];
                const isExpanded = expandedSeatId === seat.id;

                return (
                  <>
                    <tr
                      key={seat.id}
                      className="hover:bg-dark-700/30 transition-colors cursor-pointer"
                      onClick={() => toggleSeatExpand(seat.id)}
                    >
                      <td className="px-4 py-4 w-10">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-dark-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-dark-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">{seat.seatNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-dark-300">{seat.area}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-4 h-4 text-cyber-400" />
                          <span className="text-sm text-dark-300">
                            {seatMapData?.deviceSpec || device?.specs.gpu || '未知配置'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Wifi className={cn(
                            'w-4 h-4',
                            seat.networkLatency < 20 ? 'text-neon-green' :
                            seat.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                          )} />
                          <span className={cn(
                            'text-sm',
                            seat.networkLatency < 20 ? 'text-neon-green' :
                            seat.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                          )}>
                            {seat.networkLatency}ms
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white font-medium">
                          ¥{seat.pricePerHour}/小时
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn('inline-flex px-2.5 py-1 text-xs font-medium rounded-full', statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-dark-400 hover:text-cyber-400 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-dark-400 hover:text-neon-red transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-dark-900/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-dark-800/80 border border-cyber-800/30">
                              <h4 className="text-sm font-semibold text-cyber-400 mb-3 flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                设备配置详情
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-dark-400">设备型号</span>
                                  <span className="text-white">{device?.model}</span>
                                </div>
                                {device?.specs.cpu && (
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">处理器</span>
                                    <span className="text-white">{device.specs.cpu}</span>
                                  </div>
                                )}
                                {device?.specs.gpu && (
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">显卡</span>
                                    <span className="text-white">{device.specs.gpu}</span>
                                  </div>
                                )}
                                {device?.specs.ram && (
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">内存</span>
                                    <span className="text-white">{device.specs.ram}</span>
                                  </div>
                                )}
                                {device?.specs.refreshRate && (
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">刷新率</span>
                                    <span className="text-white">{device.specs.refreshRate}Hz</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-dark-800/80 border border-cyber-800/30">
                              <h4 className="text-sm font-semibold text-neon-green mb-3 flex items-center gap-2">
                                <Gauge className="w-4 h-4" />
                                实时状态
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-dark-400">设备状态</span>
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    device?.status === 'normal' ? 'bg-neon-green/20 text-neon-green' :
                                    device?.status === 'warning' ? 'bg-neon-orange/20 text-neon-orange' :
                                    device?.status === 'fault' ? 'bg-neon-red/20 text-neon-red' :
                                    'bg-dark-600 text-dark-300'
                                  )}>
                                    {device?.status === 'normal' ? '正常' :
                                     device?.status === 'warning' ? '警告' :
                                     device?.status === 'fault' ? '故障' : '离线'}
                                  </span>
                                </div>
                                {device?.temperature && (
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">CPU温度</span>
                                    <span className={cn(
                                      device.temperature < 60 ? 'text-neon-green' :
                                      device.temperature < 75 ? 'text-neon-orange' : 'text-neon-red'
                                    )}>{device.temperature.toFixed(0)}°C</span>
                                  </div>
                                )}
                                {device?.frameRate && (
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">帧率</span>
                                    <span className="text-cyber-400">{device.frameRate.toFixed(0)} FPS</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-dark-400">网络延迟</span>
                                  <span className={cn(
                                    seat.networkLatency < 20 ? 'text-neon-green' :
                                    seat.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                                  )}>{seat.networkLatency}ms</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-dark-800/80 border border-cyber-800/30">
                              <h4 className="text-sm font-semibold text-neon-purple mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                使用信息
                              </h4>
                              <div className="space-y-2 text-sm">
                                {seatMapData?.currentUserName ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-dark-400">当前用户</span>
                                      <span className="text-white">{seatMapData.currentUserName}</span>
                                    </div>
                                    {seatMapData.bookingEndTime && (
                                      <div className="flex justify-between">
                                        <span className="text-dark-400">预计结束</span>
                                        <span className="text-neon-orange">
                                          {new Date(seatMapData.bookingEndTime).toLocaleString('zh-CN', {
                                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-4 text-dark-500">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">当前无人使用</p>
                                  </div>
                                )}
                                <div className="pt-2 border-t border-dark-700 mt-2">
                                  <div className="flex justify-between">
                                    <span className="text-dark-400">位置</span>
                                    <span className="text-white">{seat.area}区 {seat.row}排{seat.col}座</span>
                                  </div>
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

          {filteredSeats.length === 0 && (
            <div className="py-12 text-center text-dark-400">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>没有找到符合条件的座位</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
