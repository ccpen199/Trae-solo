import { useState } from 'react';
import {
  Monitor,
  Wifi,
  DollarSign,
  Clock,
  Check,
  X,
  Cpu,
  Zap,
  ChevronRight,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Gauge,
  MonitorPlay,
  History,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { seats, devices, bookingTracks, seatMapDataList, bookingOrders } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const durationOptions = [1, 2, 3, 4, 5, 6, 8, 12];

const timeSlotOptions = [
  { value: 'all', label: '全部时段', icon: Clock },
  { value: 'morning', label: '早 08-12', icon: Coffee },
  { value: 'afternoon', label: '中 12-18', icon: Sun },
  { value: 'evening', label: '晚 18-22', icon: Sunset },
  { value: 'night', label: '包夜 22-08', icon: Moon },
];

const gpuOptions = [
  { value: 'all', label: '全部' },
  { value: '4090', label: 'RTX 4090' },
  { value: '4080', label: 'RTX 4080' },
  { value: '4070', label: 'RTX 4070' },
  { value: '4060Ti', label: 'RTX 4060Ti' },
];

const cpuOptions = [
  { value: 'all', label: '全部' },
  { value: 'i9', label: 'Intel i9' },
  { value: 'i7', label: 'Intel i7' },
  { value: 'i5', label: 'Intel i5' },
  { value: 'r9', label: 'AMD R9' },
  { value: 'r7', label: 'AMD R7' },
  { value: 'r5', label: 'AMD R5' },
];

const refreshRateOptions = [
  { value: 'all', label: '全部' },
  { value: '240', label: '240Hz+' },
  { value: '165', label: '165Hz+' },
  { value: '144', label: '144Hz+' },
];

const latencyOptions = [
  { value: 'all', label: '全部', min: 0, max: 999, color: 'text-dark-300' },
  { value: 'ultra-low', label: '超低 <10ms', min: 0, max: 10, color: 'text-neon-green' },
  { value: 'low', label: '低 10-30ms', min: 10, max: 30, color: 'text-cyber-400' },
  { value: 'medium', label: '中 30-60ms', min: 30, max: 60, color: 'text-neon-orange' },
  { value: 'high', label: '高 >60ms', min: 60, max: 999, color: 'text-neon-red' },
];

const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-neon-orange/20 text-neon-orange' },
  confirmed: { label: '已确认', color: 'bg-cyber-500/20 text-cyber-400' },
  in_progress: { label: '进行中', color: 'bg-neon-green/20 text-neon-green' },
  completed: { label: '已完成', color: 'bg-dark-600 text-dark-300' },
  cancelled: { label: '已取消', color: 'bg-neon-red/20 text-neon-red' },
};

const trackStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  created: { label: '已创建', color: 'text-cyber-400 border-cyber-500/50 bg-cyber-500/10', icon: Clock },
  confirmed: { label: '已确认', color: 'text-cyber-400 border-cyber-500/50 bg-cyber-500/10', icon: Check },
  checked_in: { label: '已签到', color: 'text-neon-green border-neon-green/50 bg-neon-green/10', icon: User },
  in_progress: { label: '使用中', color: 'text-neon-green border-neon-green/50 bg-neon-green/10', icon: MonitorPlay },
  extended: { label: '已续时', color: 'text-neon-purple border-neon-purple/50 bg-neon-purple/10', icon: Clock },
  completed: { label: '已完成', color: 'text-dark-300 border-dark-600 bg-dark-700/50', icon: Check },
  cancelled: { label: '已取消', color: 'text-neon-red border-neon-red/50 bg-neon-red/10', icon: X },
  paused: { label: '已暂停', color: 'text-neon-orange border-neon-orange/50 bg-neon-orange/10', icon: Clock },
  no_show: { label: '未到店', color: 'text-neon-red border-neon-red/50 bg-neon-red/10', icon: X },
};

export default function BookingPage() {
  const { currentStoreId } = useAppStore();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [duration, setDuration] = useState(2);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedGpu, setSelectedGpu] = useState('all');
  const [selectedCpu, setSelectedCpu] = useState('all');
  const [selectedRefreshRate, setSelectedRefreshRate] = useState('all');
  const [selectedLatency, setSelectedLatency] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'seats' | 'orders'>('seats');

  const storeSeats = seats.filter((s) => s.storeId === currentStoreId);
  const storeBookingOrders = bookingOrders.filter((o) => o.storeId === currentStoreId);

  const getDevice = (deviceId: string) => devices.find((d) => d.id === deviceId);
  const getMonitorDevice = (pcDeviceId: string) => {
    const pcDevice = getDevice(pcDeviceId);
    if (!pcDevice) return undefined;
    const monitorId = pcDevice.id.replace('-pc-', '-mon-');
    return devices.find((d) => d.id === monitorId);
  };

  const filteredSeats = storeSeats.filter((seat) => {
    const device = getDevice(seat.deviceId);
    const monitor = getMonitorDevice(seat.deviceId);
    const matchPrice = seat.pricePerHour >= minPrice && seat.pricePerHour <= maxPrice;

    const latencyOpt = latencyOptions.find((l) => l.value === selectedLatency);
    const matchLatency = !latencyOpt || selectedLatency === 'all'
      ? true
      : seat.networkLatency >= latencyOpt.min && seat.networkLatency < latencyOpt.max;

    let matchGpu = true;
    if (selectedGpu !== 'all' && device?.specs.gpu) {
      const gpu = device.specs.gpu.toLowerCase();
      if (selectedGpu === '4090') matchGpu = gpu.includes('4090');
      else if (selectedGpu === '4080') matchGpu = gpu.includes('4080');
      else if (selectedGpu === '4070') matchGpu = gpu.includes('4070');
      else if (selectedGpu === '4060Ti') matchGpu = gpu.includes('4060') && gpu.includes('ti');
    }

    let matchCpu = true;
    if (selectedCpu !== 'all' && device?.specs.cpu) {
      const cpu = device.specs.cpu.toLowerCase();
      if (selectedCpu === 'i9') matchCpu = cpu.includes('i9');
      else if (selectedCpu === 'i7') matchCpu = cpu.includes('i7');
      else if (selectedCpu === 'i5') matchCpu = cpu.includes('i5');
      else if (selectedCpu === 'r9') matchCpu = cpu.includes('ryzen 9') || cpu.includes('r9');
      else if (selectedCpu === 'r7') matchCpu = cpu.includes('ryzen 7') || cpu.includes('r7');
      else if (selectedCpu === 'r5') matchCpu = cpu.includes('ryzen 5') || cpu.includes('r5');
    }

    let matchRefresh = true;
    if (selectedRefreshRate !== 'all' && monitor?.specs.refreshRate) {
      const rate = monitor.specs.refreshRate;
      matchRefresh = rate >= Number(selectedRefreshRate);
    }

    return matchPrice && matchLatency && matchGpu && matchCpu && matchRefresh && seat.status !== 'maintenance';
  });

  const rows = Math.max(...storeSeats.map((s) => s.row)) || 8;
  const cols = Math.max(...storeSeats.map((s) => s.col)) || 10;

  const toggleSeatSelection = (seatId: string) => {
    const seat = storeSeats.find((s) => s.id === seatId);
    if (seat?.status !== 'available') return;

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const selectedSeatData = storeSeats.filter((s) => selectedSeats.includes(s.id));
  const totalPrice = selectedSeatData.reduce(
    (sum, seat) => sum + seat.pricePerHour * duration,
    0
  );

  const handleConfirmBooking = () => {
    setShowConfirmModal(true);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getOrderTracks = (bookingId: string) => {
    return bookingTracks
      .filter((t) => t.bookingId === bookingId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 10) return 'text-neon-green';
    if (latency < 30) return 'text-cyber-400';
    if (latency < 60) return 'text-neon-orange';
    return 'text-neon-red';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">智能订座</h1>
          <p className="text-dark-400 mt-1">快速选择心仪的电竞座位</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-dark-700">
        <button
          onClick={() => setActiveTab('seats')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'seats'
              ? 'border-cyber-500 text-cyber-400'
              : 'border-transparent text-dark-400 hover:text-white'
          )}
        >
          <span className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            座位预订
          </span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'orders'
              ? 'border-cyber-500 text-cyber-400'
              : 'border-transparent text-dark-400 hover:text-white'
          )}
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4" />
            订单追踪
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-cyber-500/20 text-cyber-400">
              {storeBookingOrders.length}
            </span>
          </span>
        </button>
      </div>

      {activeTab === 'seats' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyber-400" />
                筛选条件
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-dark-300 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    预订日期
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    空闲时段
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlotOptions.map((slot) => {
                      const Icon = slot.icon;
                      return (
                        <button
                          key={slot.value}
                          onClick={() => setSelectedTimeSlot(slot.value)}
                          className={cn(
                            'h-10 text-xs rounded-lg transition-colors flex items-center justify-center gap-1',
                            selectedTimeSlot === slot.value
                              ? 'bg-cyber-600 text-white'
                              : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2 flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    GPU 型号
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {gpuOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedGpu(opt.value)}
                        className={cn(
                          'h-9 text-xs rounded-lg transition-colors',
                          selectedGpu === opt.value
                            ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                            : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2 flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    CPU 型号
                  </label>
                  <select
                    value={selectedCpu}
                    onChange={(e) => setSelectedCpu(e.target.value)}
                    className="w-full h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
                  >
                    {cpuOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2 flex items-center gap-1">
                    <MonitorPlay className="w-4 h-4" />
                    刷新率
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {refreshRateOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedRefreshRate(opt.value)}
                        className={cn(
                          'h-9 text-xs rounded-lg transition-colors',
                          selectedRefreshRate === opt.value
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                            : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2 flex items-center gap-1">
                    <Gauge className="w-4 h-4" />
                    网络延迟
                  </label>
                  <div className="space-y-1.5">
                    {latencyOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedLatency(opt.value)}
                        className={cn(
                          'w-full h-8 px-3 text-xs rounded-lg transition-colors flex items-center justify-between',
                          selectedLatency === opt.value
                            ? 'bg-dark-700 border border-cyber-500/50'
                            : 'bg-dark-700/30 hover:bg-dark-700/50 border border-transparent'
                        )}
                      >
                        <span className={cn(selectedLatency === opt.value ? opt.color : 'text-dark-300')}>
                          {opt.label}
                        </span>
                        {selectedLatency === opt.value && (
                          <Check className="w-3 h-3 text-cyber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2">
                    价格区间: ¥{minPrice} - ¥{maxPrice}/小时
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
                    />
                    <span className="text-dark-500">-</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-dark-300 mb-2">预订时长</label>
                  <div className="grid grid-cols-4 gap-2">
                    {durationOptions.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={cn(
                          'h-9 text-sm rounded-lg transition-colors',
                          duration === d
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                            : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                        )}
                      >
                        {d}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedSeats.length > 0 && (
              <div className="p-5 rounded-xl bg-dark-800/50 border border-neon-green/30">
                <h3 className="text-lg font-semibold text-white mb-3">已选座位</h3>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedSeatData.map((seat) => {
                    const device = getDevice(seat.deviceId);
                    return (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-dark-700/50"
                      >
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-cyber-400" />
                          <div>
                            <span className="text-sm text-white">{seat.seatNumber}</span>
                            {device?.specs.gpu && (
                              <p className="text-xs text-dark-400">{device.specs.gpu.split(' ').slice(-2).join(' ')}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSeatSelection(seat.id)}
                          className="p-1 hover:bg-dark-600 rounded"
                        >
                          <X className="w-4 h-4 text-dark-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-dark-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">时长</span>
                    <span className="text-white">{duration} 小时</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-400">合计</span>
                    <span className="text-xl font-bold text-neon-green font-orbitron">
                      ¥{totalPrice}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full mt-4 h-10 bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white font-medium rounded-lg transition-all glow-blue btn-neon"
                >
                  确认预订
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="p-6 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">座位地图</h3>
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
                    <span className="w-4 h-4 rounded bg-cyber-500 border border-cyber-400 shadow-neon-blue"></span>
                    <span className="text-dark-300">已选</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}>
                  <div></div>
                  {Array.from({ length: cols }, (_, i) => (
                    <div key={i} className="w-14 h-6 flex items-center justify-center text-xs text-dark-400">
                      {i + 1}列
                    </div>
                  ))}

                  {Array.from({ length: rows }, (_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="contents">
                      <div className="w-10 h-14 flex items-center justify-center text-xs text-dark-400">
                        {rowIndex + 1}排
                      </div>
                      {Array.from({ length: cols }, (_, colIndex) => {
                        const seat = storeSeats.find(
                          (s) => s.row === rowIndex + 1 && s.col === colIndex + 1
                        );
                        if (!seat) {
                          return <div key={`empty-${rowIndex}-${colIndex}`} className="w-14 h-14"></div>;
                        }

                        const isSelected = selectedSeats.includes(seat.id);
                        const device = getDevice(seat.deviceId);
                        const monitor = getMonitorDevice(seat.deviceId);

                        return (
                          <div
                            key={seat.id}
                            onClick={() => toggleSeatSelection(seat.id)}
                            className={cn(
                              'w-14 h-14 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border-2 group relative',
                              seat.status === 'available' && !isSelected && 'bg-neon-green/10 border-neon-green/30 hover:bg-neon-green/20 hover:border-neon-green/60',
                              seat.status === 'occupied' && 'bg-neon-red/10 border-neon-red/30 cursor-not-allowed opacity-60',
                              seat.status === 'reserved' && 'bg-neon-orange/10 border-neon-orange/30 cursor-not-allowed opacity-60',
                              seat.status === 'maintenance' && 'bg-dark-700/50 border-dark-600 cursor-not-allowed opacity-40',
                              isSelected && 'bg-cyber-500/30 border-cyber-400 shadow-neon-blue'
                            )}
                            title={`${seat.seatNumber}\n价格: ¥${seat.pricePerHour}/小时\n延迟: ${seat.networkLatency}ms\n${device?.specs.gpu || ''}\n${monitor?.specs.refreshRate ? monitor.specs.refreshRate + 'Hz' : ''}`}
                          >
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-green rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <Monitor className={cn(
                              'w-4 h-4 mb-0.5',
                              seat.status === 'available' && !isSelected && 'text-neon-green/60 group-hover:text-neon-green',
                              seat.status === 'occupied' && 'text-neon-red/60',
                              seat.status === 'reserved' && 'text-neon-orange/60',
                              seat.status === 'maintenance' && 'text-dark-500',
                              isSelected && 'text-cyber-300'
                            )} />
                            <span className="text-xs font-medium text-white/80">{seat.seatNumber}</span>
                            <span className={cn('text-[10px] font-medium', getLatencyColor(seat.networkLatency))}>
                              {seat.networkLatency.toFixed(0)}ms
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-dark-700">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-neon-green font-orbitron">
                      {filteredSeats.filter((s) => s.status === 'available').length}
                    </p>
                    <p className="text-xs text-dark-400">可预订座位</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neon-red font-orbitron">
                      {filteredSeats.filter((s) => s.status === 'occupied').length}
                    </p>
                    <p className="text-xs text-dark-400">使用中</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neon-orange font-orbitron">
                      {filteredSeats.filter((s) => s.status === 'reserved').length}
                    </p>
                    <p className="text-xs text-dark-400">已预订</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyber-400 font-orbitron">
                      {selectedSeats.length}
                    </p>
                    <p className="text-xs text-dark-400">已选择</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {storeBookingOrders.map((order) => {
            const statusInfo = bookingStatusMap[order.status];
            const isExpanded = expandedOrderId === order.id;
            const tracks = getOrderTracks(order.id);

            return (
              <div
                key={order.id}
                className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-600/50"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleOrderExpand(order.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyber-500/20 to-neon-purple/20 flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-cyber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-medium">{order.seatNumber}</h3>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-dark-400">
                          <span>订单号: {order.id}</span>
                          <span>用户: {order.userName}</span>
                          <span>{order.duration} 小时</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-neon-green font-orbitron">
                          ¥{order.totalAmount}
                        </p>
                        <p className="text-xs text-dark-500">
                          {formatDateTime(order.startTime)} 开始
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
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-dark-300 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        状态流转记录
                      </h4>
                      {tracks.length > 0 ? (
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-dark-700"></div>
                          {tracks.map((track, idx) => {
                            const trackInfo = trackStatusMap[track.status] || trackStatusMap.created;
                            const TrackIcon = trackInfo.icon;
                            const isLast = idx === tracks.length - 1;
                            return (
                              <div key={track.id} className="relative pb-4 last:pb-0">
                                <div className={cn(
                                  'absolute -left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                  trackInfo.color
                                )}>
                                  <TrackIcon className="w-3 h-3" />
                                </div>
                                <div className="ml-2">
                                  <div className="flex items-center gap-2">
                                    <span className={cn('text-sm font-medium', trackInfo.color.split(' ')[0])}>
                                      {trackInfo.label}
                                    </span>
                                    {track.operatorName && (
                                      <span className="text-xs text-dark-500">
                                        操作人: {track.operatorName}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-dark-400 mt-1">{track.description}</p>
                                  {track.note && (
                                    <p className="text-xs text-cyber-400 mt-1 bg-cyber-500/10 px-2 py-1 rounded inline-block">
                                      {track.note}
                                    </p>
                                  )}
                                  <p className="text-xs text-dark-500 mt-1">
                                    {formatDateTime(track.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-dark-500">暂无流转记录</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {storeBookingOrders.length === 0 && (
            <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无订座订单</p>
            </div>
          )}
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4 rounded-xl bg-dark-800 border border-cyber-600/50 shadow-neon-blue/30 overflow-hidden">
            <div className="p-5 border-b border-dark-700">
              <h3 className="text-xl font-bold text-white font-orbitron">确认预订</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">已选座位</span>
                <span className="text-white font-medium">
                  {selectedSeatData.map((s) => s.seatNumber).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">预订日期</span>
                <span className="text-white font-medium">{selectedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">预订时长</span>
                <span className="text-white font-medium">{duration} 小时</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">座位单价</span>
                <span className="text-white">
                  ¥{selectedSeatData[0]?.pricePerHour || 0}/小时 × {selectedSeats.length}座
                </span>
              </div>

              <div className="pt-4 border-t border-dark-700">
                <div className="flex items-end justify-between">
                  <span className="text-dark-300">应付总额</span>
                  <span className="text-3xl font-bold text-neon-green font-orbitron">
                    ¥{totalPrice}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-dark-900/50 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-10 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedSeats([]);
                }}
                className="flex-1 h-10 bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                确认支付
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
