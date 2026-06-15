import { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, Star, Filter, Search, Car, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/api/client';
import type { ParkingLot } from '../../../shared/types';
import { cn } from '@/lib/utils';

export default function Parking() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'available'>('distance');
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);

  useEffect(() => {
    loadParkingLots();
  }, []);

  const loadParkingLots = async () => {
    setLoading(true);
    try {
      const data = await api.transportation.getNearbyParking(22.8170, 108.3669, 5000);
      const lots = Array.isArray(data) ? data : [];
      setParkingLots(lots.map(lot => ({
        ...lot,
        distance: lot.distance || Math.random() * 3 + 0.5,
      })));
    } catch (e) {
      console.error('Failed to load parking:', e);
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
    if (rate > 0.5) return { text: '空位充足', icon: CheckCircle };
    if (rate > 0.2) return { text: '较为紧张', icon: Clock };
    return { text: '即将满位', icon: XCircle };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">智慧停车</h1>
          <p className="text-gray-500 mt-1">查找附近停车场，实时空位查询</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl">
          <Navigation className="w-4 h-4" />
          <span className="text-sm font-medium">定位中...</span>
        </div>
      </div>

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
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                  onClick={() => setSelectedLot(lot)}
                  className={cn(
                    'bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border-2',
                    selectedLot?.id === lot.id ? 'border-primary-500' : 'border-transparent'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg">
                        <Car className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{lot.name}</h3>
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
                    <button className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                      <Navigation className="w-4 h-4" />
                      导航前往
                    </button>
                    <button className="flex-1 py-2.5 bg-eco-500 text-white rounded-xl font-medium hover:bg-eco-600 transition-colors flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" />
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

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold text-lg mb-3">停车优惠</h3>
            <p className="text-white/80 text-sm mb-4">新用户首次使用智慧停车，首小时免费</p>
            <button className="w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-medium hover:bg-white/30 transition-colors">
              立即领取
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
