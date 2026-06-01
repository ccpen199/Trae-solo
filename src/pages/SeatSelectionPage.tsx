import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar,
  Ticket,
  Shield,
  CreditCard,
  ChevronRight,
  Users,
  RefreshCw,
  FileText,
  Lock,
  Gift,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { mockData } from '../services/api';
import SeatSelector from '../components/SeatSelector';
import type { Seat } from '../types';

export default function SeatSelectionPage() {
  const { 
    currentMovieId, 
    currentShowtimeId,
    getMovieById, 
    setCurrentPage,
    selectedSeats,
    clearSeatSelection,
    isLoggedIn,
    toggleSeatSelection
  } = useAppStore();

  const [seats, setSeats] = useState<Seat[]>(mockData.generateSeats(currentShowtimeId || 'st1'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContractInfo, setShowContractInfo] = useState(false);

  const movie = currentMovieId ? getMovieById(currentMovieId) : undefined;
  const showtime = mockData.showtimes.find(s => s.id === currentShowtimeId);
  const cinema = showtime ? mockData.cinemas.find(c => c.id === showtime.cinemaId) : undefined;
  const hall = cinema && showtime ? cinema.halls.find(h => h.id === showtime.hallId) : undefined;

  useEffect(() => {
    clearSeatSelection();
  }, [currentShowtimeId, clearSeatSelection]);

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const recommendedSeats = useMemo(() => {
    const result: Seat[][] = [];
    const rows = 10;
    const cols = 14;
    
    for (let row = 4; row <= rows; row++) {
      for (let col = 3; col <= cols - 3; col++) {
        const consecutiveSeats = [2, 3, 4, 5].map(count => {
          const group: Seat[] = [];
          for (let i = 0; i < count; i++) {
            const seat = seats.find(s => s.row === row && s.col === col + i);
            if (seat && seat.status === 'available') {
              group.push(seat);
            }
          }
          return group;
        }).filter(g => g.length > 1 && g.every(s => s.status === 'available'));
        
        consecutiveSeats.forEach(group => {
          if (group.length >= 2 && !result.some(r => r.some(s => group.some(gs => gs.id === s.id)))) {
            result.push(group);
          }
        });
      }
    }
    
    return result.slice(0, 5);
  }, [seats]);

  const handleSelectRecommended = (seatGroup: Seat[]) => {
    clearSeatSelection();
    seatGroup.forEach(seat => toggleSeatSelection(seat));
  };

  const handleSubmitOrder = async () => {
    if (!isLoggedIn) {
      setCurrentPage('login');
      return;
    }

    if (selectedSeats.length === 0) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setCurrentPage('ticket-detail');
  };

  if (!movie || !showtime || !cinema) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cinema-text-secondary">请先选择影片和场次</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-cinema-bg-light border-b border-cinema-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage('movie')}
              className="p-2 hover:bg-cinema-bg rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cinema-text-secondary" />
            </button>
            
            <div className="flex items-center gap-4">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-cinema-text">{movie.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-cinema-text-secondary">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-cinema-red" />
                    <span>{cinema.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-cinema-red" />
                    <span>{showtime.startTime.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-cinema-red" />
                    <span>{showtime.startTime.slice(11, 16)} - {showtime.endTime.slice(11, 16)}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-cinema-bg rounded text-xs">
                    {showtime.format}
                  </span>
                  <span className="px-2 py-0.5 bg-cinema-bg rounded text-xs">
                    {showtime.language}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-cinema-bg-light rounded-2xl border border-cinema-border p-6 md:p-8">
              <h2 className="text-xl font-bold text-cinema-text mb-6 text-center">
                {hall?.name || '影厅'} - 请选择座位
              </h2>
              
              <SeatSelector seats={seats} showtimeId={currentShowtimeId || ''} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-cinema-bg-light rounded-2xl border border-cinema-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-cinema-gold" />
                <h3 className="font-bold text-cinema-text">连座推荐</h3>
              </div>
              
              {recommendedSeats.length > 0 ? (
                <div className="space-y-3">
                  {recommendedSeats.map((group, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectRecommended(group)}
                      className="w-full p-3 bg-cinema-bg rounded-xl border border-cinema-border hover:border-cinema-red hover:bg-cinema-red/5 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-cinema-text">
                            {group[0].row}排{group[0].col}-{group[group.length - 1].col}座
                          </p>
                          <p className="text-sm text-cinema-text-muted">
                            {group.length}个连座 · 视线角 {Math.round(group.reduce((sum, s) => sum + s.viewAngleScore, 0) / group.length)}分
                          </p>
                        </div>
                        <span className="text-cinema-gold font-bold">
                          ¥{group.reduce((sum, s) => sum + s.price, 0)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-cinema-text-muted text-sm text-center py-4">暂无合适连座</p>
              )}

              <button
                onClick={() => setSeats(mockData.generateSeats(currentShowtimeId || 'st1'))}
                className="w-full mt-4 py-2 border border-cinema-border rounded-lg text-sm text-cinema-text-secondary hover:border-cinema-red hover:text-cinema-red transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新推荐
              </button>
            </div>

            <div className="bg-cinema-bg-light rounded-2xl border border-cinema-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cinema-gold" />
                  <h3 className="font-bold text-cinema-text">票务合约</h3>
                </div>
                <button 
                  onClick={() => setShowContractInfo(!showContractInfo)}
                  className="text-cinema-red text-sm hover:underline"
                >
                  {showContractInfo ? '收起' : '查看详情'}
                </button>
              </div>

              {showContractInfo && (
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-cinema-bg rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-cinema-text">座位存证</span>
                    </div>
                    <p className="text-cinema-text-secondary text-xs">
                      订单完成后，座位信息将通过区块链存证，确保票券真实性和唯一性。
                    </p>
                  </div>

                  <div className="p-3 bg-cinema-bg rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-yellow-400" />
                      <span className="font-medium text-cinema-text">转赠限制</span>
                    </div>
                    <p className="text-cinema-text-secondary text-xs">
                      本票券仅限本人使用，不可转赠他人。如需转让，请通过官方渠道办理。
                    </p>
                  </div>

                  <div className="p-3 bg-cinema-bg rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-cinema-text">退改政策</span>
                    </div>
                    <p className="text-cinema-text-secondary text-xs">
                      开场前2小时可免费退票，24小时内退票收取10%手续费，超过24小时不予退票。
                    </p>
                  </div>

                  <div className="p-3 bg-cinema-bg rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-purple-400" />
                      <span className="font-medium text-cinema-text">防伪电子票</span>
                    </div>
                    <p className="text-cinema-text-secondary text-xs">
                      电子票采用动态水印技术，二维码每分钟自动刷新，确保无法复制伪造。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-cinema-bg-light rounded-2xl border border-cinema-border p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-cinema-text">订单信息</h3>
                {selectedSeats.length > 0 && (
                  <button
                    onClick={clearSeatSelection}
                    className="text-cinema-text-muted text-sm hover:text-cinema-red transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    清空选择
                  </button>
                )}
              </div>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSeats.map((seat) => (
                    <span
                      key={seat.id}
                      className="px-3 py-1 bg-cinema-red/20 text-cinema-red rounded-lg text-sm"
                    >
                      {seat.row}排{seat.col}座 ¥{seat.price}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-cinema-text-muted text-sm mt-2">请选择座位或使用连座推荐</p>
              )}

              {selectedSeats.some(s => s.type === 'wheelchair') && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm">已选择无障碍座位，我们将为您提供贴心服务</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-4">
              <div className="text-right">
                <p className="text-sm text-cinema-text-muted">共 {selectedSeats.length} 张票</p>
                <p className="text-3xl font-bold text-cinema-red">
                  ¥{totalPrice}
                </p>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={selectedSeats.length === 0 || isSubmitting}
                className={`btn-primary flex items-center gap-2 py-3 px-8 text-lg ${
                  selectedSeats.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    确认选座 ¥{totalPrice}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              icon: Shield,
              title: '正品保证',
              desc: '官方授权，正规渠道'
            },
            {
              icon: Ticket,
              title: '极速出票',
              desc: '下单后立即出票'
            },
            {
              icon: Clock,
              title: '随时退改',
              desc: '开场前可免费退改'
            }
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-cinema-bg-light rounded-xl border border-cinema-border"
            >
              <div className="p-3 bg-cinema-red/10 rounded-lg">
                <item.icon className="w-6 h-6 text-cinema-red" />
              </div>
              <div>
                <p className="font-medium text-cinema-text">{item.title}</p>
                <p className="text-sm text-cinema-text-muted">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
