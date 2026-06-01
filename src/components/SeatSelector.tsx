import { useMemo } from 'react';
import { User, Crown, Eye, Info } from 'lucide-react';
import type { Seat } from '../types';
import { useAppStore } from '../stores/appStore';

interface SeatSelectorProps {
  seats: Seat[];
  showtimeId?: string;
}

export default function SeatSelector({ seats }: SeatSelectorProps) {
  const { selectedSeats, toggleSeatSelection, maxSeats } = useAppStore();

  const seatsByRow = useMemo(() => {
    const grouped: Record<number, Seat[]> = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, rowSeats]) =>
        rowSeats.sort((a, b) => a.col - b.col)
      );
  }, [seats]);

  const getViewAngleColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 border-green-500';
    if (score >= 70) return 'bg-yellow-500/20 border-yellow-500';
    if (score >= 55) return 'bg-orange-500/20 border-orange-500';
    return 'bg-red-500/20 border-red-500';
  };

  const getViewAngleLabel = (score: number) => {
    if (score >= 85) return '极佳';
    if (score >= 70) return '良好';
    if (score >= 55) return '一般';
    return '较差';
  };

  const getSeatClasses = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    const baseClasses = 'w-8 h-8 md:w-10 md:h-10 rounded-t-lg text-xs font-medium flex items-center justify-center transition-all duration-200 border-2';

    if (seat.status === 'occupied') {
      return `${baseClasses} seat-occupied`;
    }

    if (isSelected) {
      return `${baseClasses} seat-selected animate-pulse`;
    }

    let typeClasses = '';
    if (seat.type === 'wheelchair') {
      typeClasses = 'seat-wheelchair';
    } else if (seat.type === 'vip') {
      typeClasses = 'seat-vip';
    }

    const viewAngleClasses = getViewAngleColor(seat.viewAngleScore);

    return `${baseClasses} seat-available ${typeClasses} ${viewAngleClasses}`;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') return;
    toggleSeatSelection(seat);
  };

  return (
    <div className="w-full">
      <div className="relative mb-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cinema-red to-transparent opacity-50" />
        <div className="relative bg-gradient-to-b from-cinema-red/20 to-transparent py-6 text-center rounded-b-[100%]">
          <p className="text-cinema-text-secondary text-sm font-medium">银 幕</p>
          <p className="text-cinema-text-muted text-xs mt-1">Screen</p>
        </div>
        <div className="absolute inset-x-0 -bottom-1 h-1 bg-gradient-to-r from-transparent via-cinema-red to-transparent opacity-30" />
      </div>

      <div className="space-y-2 overflow-x-auto pb-4">
        {seatsByRow.map((rowSeats, rowIndex) => (
          <div key={rowIndex} className="flex items-center justify-center gap-1 md:gap-2">
            <div className="w-6 md:w-8 text-center text-xs text-cinema-text-muted">
              {rowSeats[0]?.row}排
            </div>
            
            <div className="flex gap-1 md:gap-1.5">
              {rowSeats.map((seat, colIndex) => {
                const gapBefore = colIndex > 0 && seat.col - rowSeats[colIndex - 1].col > 1;
                return (
                  <div key={seat.id} className="relative group">
                    {gapBefore && <div className="w-4 md:w-6" />}
                    <button
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status === 'occupied'}
                      className={getSeatClasses(seat)}
                    >
                      {seat.type === 'wheelchair' ? (
                        <User className="w-4 h-4" />
                      ) : seat.type === 'vip' ? (
                        <Crown className="w-3 h-3" />
                      ) : (
                        seat.col
                      )}
                    </button>
                    
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-cinema-bg-light border border-cinema-border rounded-lg p-2 whitespace-nowrap text-xs shadow-xl">
                        <p className="font-medium text-cinema-text">
                          {seat.row}排{seat.col}座
                        </p>
                        <p className="text-cinema-gold font-bold">¥{seat.price}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Eye className="w-3 h-3 text-cinema-text-muted" />
                          <span className={`text-xs ${
                            seat.viewAngleScore >= 85 ? 'text-green-400' :
                            seat.viewAngleScore >= 70 ? 'text-yellow-400' :
                            seat.viewAngleScore >= 55 ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {getViewAngleLabel(seat.viewAngleScore)} ({seat.viewAngleScore}分)
                          </span>
                        </div>
                        {seat.type === 'wheelchair' && (
                          <p className="text-cinema-gold mt-1">♿ 无障碍座位</p>
                        )}
                        {seat.type === 'vip' && (
                          <p className="text-cinema-gold mt-1">👑 VIP座位</p>
                        )}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cinema-border" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-6 md:w-8 text-center text-xs text-cinema-text-muted">
              {rowSeats[0]?.row}排
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t border-2 border-cinema-border bg-cinema-bg-light" />
          <span className="text-cinema-text-secondary">可选</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-cinema-red border-cinema-red border-2" />
          <span className="text-cinema-text-secondary">已选</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t bg-cinema-border opacity-50 border-cinema-border border-2" />
          <span className="text-cinema-text-secondary">已售</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t border-cinema-gold border-2 bg-cinema-gold/10 flex items-center justify-center">
            <User className="w-3 h-3 text-cinema-gold" />
          </div>
          <span className="text-cinema-text-secondary">无障碍</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-t border-cinema-gold border-2 bg-cinema-gold/10 flex items-center justify-center">
            <Crown className="w-3 h-3 text-cinema-gold" />
          </div>
          <span className="text-cinema-text-secondary">VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cinema-text-muted" />
          <span className="text-cinema-text-muted">最多可选 {maxSeats} 个座位</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-cinema-bg-light rounded-xl border border-cinema-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-cinema-text-secondary">
              已选座位 ({selectedSeats.length}/{maxSeats})
            </p>
            {selectedSeats.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className="px-2 py-1 bg-cinema-red/20 text-cinema-red rounded text-sm"
                  >
                    {seat.row}排{seat.col}座 ¥{seat.price}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-cinema-text-muted text-sm mt-2">请点击座位进行选择</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-cinema-text-secondary">总价</p>
            <p className="text-2xl font-bold text-cinema-red">
              ¥{selectedSeats.reduce((sum, s) => sum + s.price, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-xl border border-green-500/30">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-green-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-400">视线角热区提示</p>
            <p className="text-xs text-cinema-text-secondary mt-1">
              绿色边框为最佳观影位置（85分以上），黄色为良好位置（70-84分），
              橙色为一般位置（55-69分），红色为较差位置（55分以下）。
              建议选择中间靠后的位置以获得最佳观影体验。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
