import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Navigation, Zap, Clock, DollarSign, Car, Info, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { setCurrentPage, getUser, getSelectedStation, setSelectedStation, setSelectedGun, setCurrentOrder } from '../lib/appState';

export default function StationDetail() {
  const [selectedStation, setSelectedStationState] = useState<any>(getSelectedStation());
  const user = getUser();
  const [guns, setGuns] = useState<any[]>([]);
  const [chargers, setChargers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleStationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSelectedStationState(customEvent.detail);
    };
    window.addEventListener('stationchange', handleStationChange);
    return () => window.removeEventListener('stationchange', handleStationChange);
  }, []);

  useEffect(() => {
    if (selectedStation) {
      loadStationDetail();
    }
  }, [selectedStation]);

  const loadStationDetail = async () => {
    setLoading(true);
    try {
      const data = await api.stations.detail(selectedStation.id);
      setGuns(data.guns);
      setChargers(data.chargers);
    } catch (err) {
      console.error('Load station detail failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGunStatusInfo = (status: string) => {
    const info: Record<string, { label: string; color: string; bg: string }> = {
      idle: { label: '空闲可用', color: 'text-green-600', bg: 'bg-green-100' },
      charging: { label: '充电中', color: 'text-blue-600', bg: 'bg-blue-100' },
      reserved: { label: '已预约', color: 'text-purple-600', bg: 'bg-purple-100' },
      occupied: { label: '占用中', color: 'text-orange-600', bg: 'bg-orange-100' },
      fault: { label: '故障', color: 'text-red-600', bg: 'bg-red-100' },
    };
    return info[status] || info.idle;
  };

  const handleReserve = async (gun: any) => {
    if (!user) {
      setCurrentPage('login');
      return;
    }
    if (gun.status !== 'idle') {
      setError('该枪当前不可预约');
      return;
    }
    
    setActionLoading(gun.id);
    setError('');
    try {
      const result = await api.charging.reserve({
        station_id: selectedStation.id,
        gun_id: gun.id,
        vehicle_plate: user.vehicle_info,
        reserve_minutes: 30,
      });
      setSelectedGun(gun);
      alert(`预约成功！请在30分钟内到达站点\n预约号：${result.reservation.id}`);
      loadStationDetail();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartCharging = async (gun: any) => {
    if (!user) {
      setCurrentPage('login');
      return;
    }
    if (!['idle', 'reserved'].includes(gun.status)) {
      setError('该枪当前不可用');
      return;
    }

    setActionLoading(gun.id);
    setError('');
    try {
      const result = await api.charging.start({
        station_id: selectedStation.id,
        gun_id: gun.id,
        start_soc: 25,
      });
      setCurrentOrder(result.order);
      setSelectedGun(gun);
      setCurrentPage('charging');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNavigate = () => {
    const url = `https://uri.amap.com/navigation?to=${selectedStation.longitude},${selectedStation.latitude},${selectedStation.name}&mode=car`;
    window.open(url, '_blank');
  };

  if (!selectedStation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">未选择站点</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedStation(null);
              setCurrentPage('home');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 truncate">{selectedStation.name}</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{selectedStation.address}</span>
            </div>
          </div>
          <button
            onClick={handleNavigate}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <Navigation className="w-4 h-4" />
            导航
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <Zap className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">¥{selectedStation.price_per_kwh}</div>
              <div className="text-xs text-green-500">元/度</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">¥{selectedStation.parking_fee}</div>
              <div className="text-xs text-blue-500">停车费/小时</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <Car className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600">
                {selectedStation.available_guns}/{selectedStation.total_guns}
              </div>
              <div className="text-xs text-purple-500">空闲枪</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Clock className="w-6 h-6 text-gray-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-600">{selectedStation.business_hours}</div>
              <div className="text-xs text-gray-400">营业时间</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg">充电枪列表</h2>
            <p className="text-sm text-gray-500 mt-1">选择空闲的充电枪开始充电</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {guns.map((gun) => {
                const statusInfo = getGunStatusInfo(gun.status);
                const canReserve = gun.status === 'idle';
                const canStart = ['idle', 'reserved'].includes(gun.status);

                return (
                  <div key={gun.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-gray-800">
                            {gun.gun_no} 号枪
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {gun.connector_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            <span>最大功率：{gun.max_power}kW · {gun.charger_model}</span>
                          </div>
                          {gun.current_order_no && (
                            <div className="text-blue-600">
                              当前订单：{gun.current_order_no}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {canReserve && (
                          <button
                            onClick={() => handleReserve(gun)}
                            disabled={actionLoading === gun.id}
                            className="px-4 py-2 border-2 border-green-500 text-green-600 rounded-xl hover:bg-green-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === gun.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              '预约'
                            )}
                          </button>
                        )}
                        {canStart && (
                          <button
                            onClick={() => handleStartCharging(gun)}
                            disabled={actionLoading === gun.id}
                            className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === gun.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              '开始充电'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">充电桩信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chargers.map((charger) => (
              <div key={charger.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">{charger.serial_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    charger.status === 'online' ? 'bg-green-100 text-green-700' :
                    charger.status === 'charging' ? 'bg-blue-100 text-blue-700' :
                    charger.status === 'fault' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {charger.status === 'online' ? '在线' :
                     charger.status === 'charging' ? '充电中' :
                     charger.status === 'fault' ? '故障' : '离线'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>型号：{charger.model}</p>
                  <p>功率：{charger.power}kW</p>
                  <p>固件：{charger.firmware_version}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
