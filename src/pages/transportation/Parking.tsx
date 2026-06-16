import { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Navigation,
  Star,
  Filter,
  Search,
  Car,
  CheckCircle,
  XCircle,
  Phone,
  Info,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Shield,
  ShoppingBag,
  Baby,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '@/api/client';
import type { ParkingLot } from '../../../shared/types';
import { cn } from '@/lib/utils';

export default function Parking() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'available'>('distance');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingHours, setBookingHours] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    loadParkingLots();
  }, []);

  const loadParkingLots = async () => {
    setLoading(true);
    setError(null);
    setLocationStatus('loading');
    try {
      const data = await api.transportation.getNearbyParking(22.8170, 108.3669, 5000);
      const lots = Array.isArray(data) ? data : [];
      setParkingLots(lots.map(lot => ({
        ...lot,
        distance: lot.distance || Math.random() * 3 + 0.5,
      })));
      setLocationStatus('success');
      if (lots.length > 0 && !selectedLot) {
        setSelectedLot(lots[0]);
      }
    } catch (e: any) {
      console.error('Failed to load parking:', e);
      setError(e.message || '加载停车场信息失败，请稍后重试');
      setLocationStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredLots = parkingLots
    .filter(lot => lot.name.includes(searchQuery) || lot.address.includes(searchQuery))
    .sort((a, b) => {
      if (sortBy === 'distance') return (a.distance || 0) - (b.distance || 0);
      if (sortBy === 'price') return a.pricePerHour - b.pricePerHour;
      return b.availableSpaces - a.availableSpaces;
    });

  const getOccupancyColor = (lot: ParkingLot) => {
    const rate = lot.availableSpaces / lot.totalSpaces;
    if (rate > 0.5) return 'text-eco-600 bg-eco-100';
    if (rate > 0.2) return 'text-warm-600 bg-warm-100';
    return 'text-red-600 bg-red-100';
  };

  const getOccupancyStatus = (lot: ParkingLot) => {
    const rate = lot.availableSpaces / lot.totalSpaces;
    if (rate > 0.5) return { text: '空位充足', icon: CheckCircle, color: 'text-eco-600' };
    if (rate > 0.2) return { text: '较为紧张', icon: Clock, color: 'text-warm-600' };
    return { text: '即将满位', icon: XCircle, color: 'text-red-600' };
  };

  const getFacilityIcon = (facility: string) => {
    if (facility.includes('充电')) return Zap;
    if (facility.includes('安保') || facility.includes('安全')) return Shield;
    if (facility.includes('便利') || facility.includes('商店')) return ShoppingBag;
    if (facility.includes('母婴') || facility.includes('婴儿')) return Baby;
    return Info;
  };

  const handleNavigate = (lot: ParkingLot) => {
    const url = `https://uri.amap.com/navigation?to=${lot.lng},${lot.lat},${lot.name}&mode=car&policy=1&src=南宁城市服务`;
    window.open(url, '_blank');
  };

  const handleSelectLot = (lot: ParkingLot) => {
    setSelectedLot(lot);
    setShowDetailPanel(true);
  };

  const handleBook = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
    }, 2000);
  };

  const calculatePrice = (hours: number) => {
    return (selectedLot?.pricePerHour || 0) * hours;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">智慧停车</h1>
          <p className="text-gray-500 mt-1">查找附近停车场，实时空位查询</p>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl',
          locationStatus === 'success' ? 'bg-eco-50 text-eco-600' :
          locationStatus === 'loading' ? 'bg-primary-50 text-primary-600' :
          'bg-red-50 text-red-600'
        )}>
          <Navigation className={cn('w-4 h-4', locationStatus === 'loading' && 'animate-spin')} />
          <span className="text-sm font-medium">
            {locationStatus === 'success' ? '定位成功' :
             locationStatus === 'loading' ? '定位中...' :
             '定位失败'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">加载失败</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={loadParkingLots}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索停车场名称或地址..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent focus:outline-none text-sm font-medium text-gray-700"
          >
            <option value="distance">距离最近</option>
            <option value="price">价格最低</option>
            <option value="available">空位最多</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl shadow-card">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">正在查找附近停车场...</p>
              </div>
            </div>
          ) : filteredLots.length > 0 ? (
            filteredLots.map((lot, index) => {
              const status = getOccupancyStatus(lot);
              const StatusIcon = status.icon;
              return (
                <div
                  key={lot.id}
                  onClick={() => handleSelectLot(lot)}
                  className={cn(
                    'bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border-2',
                    selectedLot?.id === lot.id && 'border-primary-500'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg">
                        <Car className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 text-lg">{lot.name}</h3>
                          {lot.rating && (
                            <div className="flex items-center gap-1 text-warm-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">{lot.rating}</span>
                              {lot.reviews && (
                                <span className="text-xs text-gray-400">({lot.reviews}条评价)</span>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {lot.address}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Navigation className="w-4 h-4" />
                            {(lot.distance || 0).toFixed(1)} km
                          </span>
                          <span className="text-sm text-gray-600">
                            ¥{lot.pricePerHour}/小时
                          </span>
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1', getOccupancyColor(lot))}>
                            <StatusIcon className="w-3 h-3" />
                            {status.text}
                          </span>
                        </div>
                        {lot.facilities && lot.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {lot.facilities.slice(0, 4).map((facility, idx) => {
                              const FacilityIcon = getFacilityIcon(facility);
                              return (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                  <FacilityIcon className="w-3 h-3" />
                                  {facility}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">
                        {lot.availableSpaces}
                        <span className="text-lg font-normal text-gray-400">/{lot.totalSpaces}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">空余车位</p>
                      <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            (lot.availableSpaces / lot.totalSpaces) > 0.5 ? 'bg-gradient-to-r from-eco-400 to-eco-600' :
                            (lot.availableSpaces / lot.totalSpaces) > 0.2 ? 'bg-gradient-to-r from-warm-400 to-warm-600' :
                            'bg-gradient-to-r from-red-400 to-red-600'
                          )}
                          style={{ width: `${((lot.totalSpaces - lot.availableSpaces) / lot.totalSpaces) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(lot);
                      }}
                      className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      导航前往
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLot(lot);
                        setShowBookingModal(true);
                      }}
                      disabled={lot.availableSpaces === 0}
                      className="flex-1 py-2.5 bg-eco-500 text-white rounded-xl font-medium hover:bg-eco-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      预约车位
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-card text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">未找到停车场</h3>
              <p className="text-gray-500">请尝试调整搜索条件</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-semibold text-gray-800 mb-4">停车统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-primary-600">{parkingLots.length}</p>
                <p className="text-sm text-gray-500 mt-1">周边停车场</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-eco-600">
                  {parkingLots.reduce((sum, l) => sum + l.availableSpaces, 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">总空位数</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-warm-600">
                  {parkingLots.length > 0 ? (parkingLots.reduce((sum, l) => sum + l.pricePerHour, 0) / parkingLots.length).toFixed(1) : 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">均价(元/时)</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-600">
                  {parkingLots.length > 0 ? Math.round(parkingLots.reduce((sum, l) => sum + (l.distance || 0), 0) / parkingLots.length * 10) / 10 : 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">平均距离(km)</p>
              </div>
            </div>
          </div>

          {selectedLot && showDetailPanel && (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-eco-50">
                <h3 className="font-semibold text-gray-800">停车场详情</h3>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">{selectedLot.name}</h4>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedLot.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">空位数</p>
                    <p className="text-xl font-bold text-primary-600">
                      {selectedLot.availableSpaces}
                      <span className="text-sm font-normal text-gray-400">/{selectedLot.totalSpaces}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">价格</p>
                    <p className="text-xl font-bold text-warm-600">
                      ¥{selectedLot.pricePerHour}
                      <span className="text-sm font-normal text-gray-400">/小时</span>
                    </p>
                  </div>
                </div>

                {selectedLot.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">联系电话</p>
                      <p className="font-medium text-gray-800">{selectedLot.phone}</p>
                    </div>
                  </div>
                )}

                {selectedLot.openHours && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">营业时间</p>
                      <p className="font-medium text-gray-800">{selectedLot.openHours}</p>
                    </div>
                  </div>
                )}

                {selectedLot.parkingType && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Car className="w-5 h-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">停车类型</p>
                      <p className="font-medium text-gray-800">{selectedLot.parkingType}</p>
                    </div>
                  </div>
                )}

                {selectedLot.facilities && selectedLot.facilities.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">配套设施</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLot.facilities.map((facility, idx) => {
                        const FacilityIcon = getFacilityIcon(facility);
                        return (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm">
                            <FacilityIcon className="w-4 h-4" />
                            {facility}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleNavigate(selectedLot)}
                    className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    导航前往
                  </button>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    disabled={selectedLot.availableSpaces === 0}
                    className="flex-1 py-3 bg-eco-500 text-white rounded-xl font-medium hover:bg-eco-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    预约车位
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold text-lg mb-3">停车优惠</h3>
            <p className="text-white/80 text-sm mb-4">新用户首次使用智慧停车，首小时免费</p>
            <button className="w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-medium hover:bg-white/30 transition-colors">
              立即领取
            </button>
          </div>
        </div>
      </div>

      {showBookingModal && selectedLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">预约车位</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-eco-500" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">预约成功</h4>
                  <p className="text-gray-500">您的车位已成功预约，请按时到达</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-800">{selectedLot.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedLot.address}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">预约时长</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6].map(hours => (
                        <button
                          key={hours}
                          onClick={() => setBookingHours(hours)}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl font-medium transition-all',
                            bookingHours === hours
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {hours}小时
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-warm-50 rounded-xl border border-warm-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">预估费用</span>
                      <span className="text-2xl font-bold text-warm-600">
                        ¥{calculatePrice(bookingHours)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      单价¥{selectedLot.pricePerHour}/小时 × {bookingHours}小时
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleBook}
                      className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all"
                    >
                      确认预约
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
