import { useState, useEffect } from 'react';
import { MapPin, Navigation, Zap, Clock, DollarSign, Car, Search, Filter } from 'lucide-react';
import api from '../lib/api';
import { setCurrentPage } from '../lib/appState';

export default function Home() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadStations();
  }, [filterStatus]);

  const loadStations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      const data = await api.stations.list(params);
      setStations(data.stations);
    } catch (err) {
      console.error('Load stations failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter(s => 
    s.name.includes(searchText) || s.address.includes(searchText)
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      maintenance: 'bg-yellow-100 text-yellow-700',
    };
    const labels: Record<string, string> = {
      open: '营业中',
      closed: '已关闭',
      maintenance: '维护中',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.open}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getGunStatusBadge = (available: number, total: number) => {
    const ratio = available / total;
    let color = 'bg-green-500';
    if (ratio === 0) color = 'bg-red-500';
    else if (ratio < 0.3) color = 'bg-yellow-500';
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
        <span className="text-sm text-gray-600">
          空闲 <span className="font-semibold text-green-600">{available}</span> / {total} 枪
        </span>
      </div>
    );
  };

  const handleStationClick = (station: any) => {
    localStorage.setItem('selectedStation', JSON.stringify(station));
    window.dispatchEvent(new CustomEvent('stationchange', { detail: station }));
    setCurrentPage('station-detail');
  };

  const handleNavigate = (station: any) => {
    const url = `https://uri.amap.com/navigation?to=${station.longitude},${station.latitude},${station.name}&mode=car`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 pt-12 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">附近充电站</h1>
          <p className="text-green-100 mb-6">找到 {stations.length} 个站点，为您的爱车补充能量</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索站点名称或地址..."
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-lg focus:ring-2 focus:ring-green-300 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white rounded-xl shadow-lg focus:ring-2 focus:ring-green-300 outline-none appearance-none pr-10"
              >
                <option value="">全部状态</option>
                <option value="open">营业中</option>
                <option value="closed">已关闭</option>
                <option value="maintenance">维护中</option>
              </select>
              <button
                onClick={loadStations}
                className="px-6 py-3 bg-white text-green-600 font-medium rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.map((station) => (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-600 transition-colors">
                      {station.name}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">{station.address}</span>
                    </div>
                  </div>
                  {getStatusBadge(station.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs">电价</span>
                    </div>
                    <div className="text-xl font-bold text-green-700">
                      ¥{station.price_per_kwh}
                      <span className="text-xs font-normal text-green-500">/度</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs">停车费</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">
                      ¥{station.parking_fee}
                      <span className="text-xs font-normal text-blue-500">/小时</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  {getGunStatusBadge(station.available_guns, station.total_guns)}
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{station.business_hours}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(station);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4" />
                    导航
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStationClick(station);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-colors text-sm font-medium"
                  >
                    <Car className="w-4 h-4" />
                    去充电
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStations.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">没有找到符合条件的充电站</p>
          </div>
        )}
      </div>
    </div>
  );
}
