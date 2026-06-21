import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Monitor, Cpu, Wifi } from 'lucide-react';
import { seats, devices } from '@/data/mockData';
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

  const storeSeats = seats.filter((s) => s.storeId === currentStoreId);

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
            <div className="flex items-center gap-4 text-sm">
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-grid gap-2 min-w-max" style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}>
              {/* 列标题 */}
              <div></div>
              {Array.from({ length: cols }, (_, i) => (
                <div key={i} className="w-14 h-8 flex items-center justify-center text-xs text-dark-400">
                  {i + 1}列
                </div>
              ))}

              {/* 行 */}
              {Array.from({ length: rows }, (_, rowIndex) => (
                <>
                  <div key={`row-${rowIndex}`} className="w-12 h-14 flex items-center justify-center text-xs text-dark-400">
                    {rowIndex + 1}排
                  </div>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const seat = storeSeats.find(
                      (s) => s.row === rowIndex + 1 && s.col === colIndex + 1
                    );
                    if (!seat) {
                      return <div key={`empty-${rowIndex}-${colIndex}`} className="w-14 h-14"></div>;
                    }
                    const device = getDevice(seat.deviceId);
                    const statusInfo = statusMap[seat.status];

                    return (
                      <div
                        key={seat.id}
                        className={cn(
                          'w-14 h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border-2',
                          seat.status === 'available' && 'bg-neon-green/10 border-neon-green/50 hover:bg-neon-green/20 hover:shadow-neon-green',
                          seat.status === 'occupied' && 'bg-neon-red/10 border-neon-red/50 hover:bg-neon-red/20',
                          seat.status === 'reserved' && 'bg-neon-orange/10 border-neon-orange/50 hover:bg-neon-orange/20',
                          seat.status === 'maintenance' && 'bg-dark-700/50 border-dark-600 opacity-50 cursor-not-allowed'
                        )}
                        title={`${seat.seatNumber} - ${statusInfo.label}\n设备: ${device?.model || '-'}`}
                      >
                        <Monitor className={cn(
                          'w-5 h-5 mb-0.5',
                          seat.status === 'available' && 'text-neon-green',
                          seat.status === 'occupied' && 'text-neon-red',
                          seat.status === 'reserved' && 'text-neon-orange',
                          seat.status === 'maintenance' && 'text-dark-500'
                        )} />
                        <span className="text-xs font-medium text-white">{seat.seatNumber}</span>
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
                const statusInfo = statusMap[seat.status];

                return (
                  <tr key={seat.id} className="hover:bg-dark-700/30 transition-colors">
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
                          {device?.specs.gpu || '未知配置'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Wifi className={`w-4 h-4 ${
                          seat.networkLatency < 20 ? 'text-neon-green' :
                          seat.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                        }`} />
                        <span className={`text-sm ${
                          seat.networkLatency < 20 ? 'text-neon-green' :
                          seat.networkLatency < 50 ? 'text-neon-orange' : 'text-neon-red'
                        }`}>
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
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
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
