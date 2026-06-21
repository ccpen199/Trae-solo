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
} from 'lucide-react';
import { seats, devices } from '@/data/mockData';
import { useAppStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const durationOptions = [1, 2, 3, 4, 5, 6, 8, 12];

export default function BookingPage() {
  const { currentStoreId } = useAppStore();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [duration, setDuration] = useState(2);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [maxLatency, setMaxLatency] = useState(100);
  const [gpuLevel, setGpuLevel] = useState('全部');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const storeSeats = seats.filter((s) => s.storeId === currentStoreId);

  const getDevice = (deviceId: string) => devices.find((d) => d.id === deviceId);

  const filteredSeats = storeSeats.filter((seat) => {
    const device = getDevice(seat.deviceId);
    const matchPrice = seat.pricePerHour >= minPrice && seat.pricePerHour <= maxPrice;
    const matchLatency = seat.networkLatency <= maxLatency;

    let matchGpu = true;
    if (gpuLevel !== '全部' && device?.specs.gpu) {
      const gpu = device.specs.gpu;
      if (gpuLevel === '高端') matchGpu = gpu.includes('4090') || gpu.includes('4080');
      else if (gpuLevel === '中端') matchGpu = gpu.includes('4070') || gpu.includes('4060 Ti');
      else if (gpuLevel === '入门') matchGpu = gpu.includes('4060');
    }

    return matchPrice && matchLatency && matchGpu && seat.status !== 'maintenance';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">智能订座</h1>
          <p className="text-dark-400 mt-1">快速选择心仪的电竞座位</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-xl bg-dark-800/50 border border-cyber-800/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyber-400" />
              筛选条件
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-dark-300 mb-2">设备配置</label>
                <div className="grid grid-cols-2 gap-2">
                  {['全部', '高端', '中端', '入门'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setGpuLevel(level)}
                      className={cn(
                        'h-9 text-sm rounded-lg transition-colors',
                        gpuLevel === level
                          ? 'bg-cyber-600 text-white'
                          : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  网络延迟: ≤{maxLatency}ms
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={maxLatency}
                  onChange={(e) => setMaxLatency(Number(e.target.value))}
                  className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-cyber-500"
                />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>10ms</span>
                  <span>100ms</span>
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
                {selectedSeatData.map((seat) => (
                  <div
                    key={seat.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-dark-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-cyber-400" />
                      <span className="text-sm text-white">{seat.seatNumber}</span>
                    </div>
                    <button
                      onClick={() => toggleSeatSelection(seat.id)}
                      className="p-1 hover:bg-dark-600 rounded"
                    >
                      <X className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                ))}
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
                  <span className="w-4 h-4 rounded bg-cyber-500 border border-cyber-400 shadow-neon-blue"></span>
                  <span className="text-dark-300">已选</span>
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}>
                <div></div>
                {Array.from({ length: cols }, (_, i) => (
                  <div key={i} className="w-12 h-6 flex items-center justify-center text-xs text-dark-400">
                    {i + 1}列
                  </div>
                ))}

                {Array.from({ length: rows }, (_, rowIndex) => (
                  <div key={`row-${rowIndex}`} className="contents">
                    <div className="w-10 h-12 flex items-center justify-center text-xs text-dark-400">
                      {rowIndex + 1}排
                    </div>
                    {Array.from({ length: cols }, (_, colIndex) => {
                      const seat = storeSeats.find(
                        (s) => s.row === rowIndex + 1 && s.col === colIndex + 1
                      );
                      if (!seat) {
                        return <div key={`empty-${rowIndex}-${colIndex}`} className="w-12 h-12"></div>;
                      }

                      const isSelected = selectedSeats.includes(seat.id);
                      const device = getDevice(seat.deviceId);

                      return (
                        <div
                          key={seat.id}
                          onClick={() => toggleSeatSelection(seat.id)}
                          className={cn(
                            'w-12 h-12 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border-2 group relative',
                            seat.status === 'available' && !isSelected && 'bg-neon-green/10 border-neon-green/30 hover:bg-neon-green/20 hover:border-neon-green/60',
                            seat.status === 'occupied' && 'bg-neon-red/10 border-neon-red/30 cursor-not-allowed opacity-60',
                            seat.status === 'reserved' && 'bg-neon-orange/10 border-neon-orange/30 cursor-not-allowed opacity-60',
                            seat.status === 'maintenance' && 'bg-dark-700/50 border-dark-600 cursor-not-allowed opacity-40',
                            isSelected && 'bg-cyber-500/30 border-cyber-400 shadow-neon-blue'
                          )}
                          title={`${seat.seatNumber}\n价格: ¥${seat.pricePerHour}/小时\n延迟: ${seat.networkLatency}ms\n${device?.specs.gpu || ''}`}
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
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-dark-700">
              <div className="grid grid-cols-3 gap-4 text-center">
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
