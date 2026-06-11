import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  MapPin,
  Calendar as CalendarIcon,
  Route,
  Gift,
  BadgePercent,
  ChevronDown,
  Map as MapIcon,
  CheckCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function TollCalculator() {
  const { tollStations, calculateToll, calculatedRoutes, holidayInfo, etcCard } = useStore();
  const [startStation, setStartStation] = useState('');
  const [endStation, setEndStation] = useState('');
  const [vehicleType, setVehicleType] = useState(1);
  const [travelDate, setTravelDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const vehicleTypes = [
    { id: 1, name: '一类客车', seats: '≤9座', rate: '0.45元/公里' },
    { id: 2, name: '二类客车', seats: '10-19座', rate: '0.675元/公里' },
    { id: 3, name: '三类客车', seats: '20-39座', rate: '0.90元/公里' },
    { id: 4, name: '四类客车', seats: '≥40座', rate: '1.125元/公里' },
    { id: 5, name: '一类货车', weight: '≤2吨', rate: '0.45元/公里' },
    { id: 6, name: '二类货车', weight: '2-5吨', rate: '0.90元/公里' },
  ];

  const filteredStartStations = tollStations.filter(
    (s) => !endStation || s.id !== endStation
  );
  const filteredEndStations = tollStations.filter(
    (s) => !startStation || s.id !== startStation
  );

  const handleCalculate = () => {
    if (startStation && endStation) {
      calculateToll(startStation, endStation, vehicleType, travelDate);
      setSelectedRoute(null);
    }
  };

  const canCalculate = startStation && endStation && startStation !== endStation;
  const startStationData = tollStations.find((s) => s.id === startStation);
  const endStationData = tollStations.find((s) => s.id === endStation);

  const mapCenter = calculatedRoutes.length > 0 && calculatedRoutes[0].pathPoints.length > 0
    ? [calculatedRoutes[0].pathPoints[0].lat, calculatedRoutes[0].pathPoints[0].lng]
    : [23.1, 113.3];

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-dark-800 mb-2">路费查询</h1>
          <p className="text-dark-500">输入起点和终点收费站，智能计算最优路线和费用</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6 sticky top-24"
            >
              <h3 className="text-lg font-semibold text-dark-800 mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary-500" />
                路径规划
              </h3>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    起点收费站
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                    <button
                      onClick={() => setShowStartDropdown(!showStartDropdown)}
                      className="w-full input-field pl-10 text-left flex items-center justify-between"
                    >
                      <span className={startStation ? 'text-dark-800' : 'text-dark-400'}>
                        {startStationData?.name || '请选择起点收费站'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                  {showStartDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-dark-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStartStations.map((station) => (
                        <button
                          key={station.id}
                          onClick={() => {
                            setStartStation(station.id);
                            setShowStartDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-dark-100 last:border-0"
                        >
                          <p className="font-medium text-dark-800">{station.name}</p>
                          <p className="text-xs text-dark-500">{station.highway}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    终点收费站
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-danger" />
                    <button
                      onClick={() => setShowEndDropdown(!showEndDropdown)}
                      className="w-full input-field pl-10 text-left flex items-center justify-between"
                    >
                      <span className={endStation ? 'text-dark-800' : 'text-dark-400'}>
                        {endStationData?.name || '请选择终点收费站'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                  {showEndDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-dark-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredEndStations.map((station) => (
                        <button
                          key={station.id}
                          onClick={() => {
                            setEndStation(station.id);
                            setShowEndDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-dark-100 last:border-0"
                        >
                          <p className="font-medium text-dark-800">{station.name}</p>
                          <p className="text-xs text-dark-500">{station.highway}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    车辆类型
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(Number(e.target.value))}
                    className="input-field"
                  >
                    {vehicleTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>
                        {vt.name} - {vt.rate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    出行日期
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                {holidayInfo?.isFree && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">节假日免费通行</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {holidayInfo.holidayName}期间 ({holidayInfo.freePeriod})，所有客车免费通行
                    </p>
                  </motion.div>
                )}

                <button
                  onClick={handleCalculate}
                  disabled={!canCalculate}
                  className="w-full btn-primary"
                >
                  查询路费
                </button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {calculatedRoutes.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="card p-6"
                >
                  <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-primary-500" />
                    路线地图
                  </h3>
                  <div className="h-80 rounded-lg overflow-hidden">
                    <MapContainer
                      center={mapCenter as [number, number]}
                      zoom={9}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {calculatedRoutes.map((route, idx) => (
                        <Polyline
                          key={route.id}
                          positions={route.pathPoints.map((p) => [p.lat, p.lng])}
                          color={selectedRoute === route.id ? '#FF6B35' : idx === 0 ? '#0F52BA' : '#9CA3AF'}
                          weight={selectedRoute === route.id ? 6 : idx === 0 ? 4 : 3}
                          opacity={selectedRoute === route.id ? 1 : idx === 0 ? 0.8 : 0.5}
                          dashArray={idx === 0 ? undefined : '10, 10'}
                        />
                      ))}
                      {startStationData && (
                        <Marker
                          position={[startStationData.location.lat, startStationData.location.lng]}
                          icon={customIcon}
                        >
                          <Popup>{startStationData.name}</Popup>
                        </Marker>
                      )}
                      {endStationData && (
                        <Marker
                          position={[endStationData.location.lat, endStationData.location.lng]}
                          icon={endIcon}
                        >
                          <Popup>{endStationData.name}</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="card p-6"
                >
                  <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                    <Route className="w-5 h-5 text-primary-500" />
                    可选路线
                    <span className="ml-auto text-sm font-normal text-dark-500">
                      共 {calculatedRoutes.length} 条路线
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {calculatedRoutes.map((route, idx) => (
                      <motion.div
                        key={route.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedRoute(route.id)}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedRoute === route.id
                            ? 'border-primary-500 bg-primary-50 shadow-lg'
                            : 'border-dark-200 bg-white hover:border-primary-300 hover:shadow-card'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                route.isShortest ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-600'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-dark-800">{route.name}</h4>
                                {route.isShortest && (
                                  <span className="badge badge-info">最短路径</span>
                                )}
                              </div>
                              <p className="text-sm text-dark-500">{route.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {holidayInfo?.isFree ? (
                              <p className="text-2xl font-bold text-success font-mono">免费</p>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-accent-500 font-mono">
                                  ¥{route.actualFee.toFixed(2)}
                                </p>
                                <p className="text-xs text-dark-400 line-through">
                                  ¥{route.totalFee.toFixed(2)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 pt-3 border-t border-dark-200">
                          <div>
                            <p className="text-xs text-dark-500 mb-1">总里程</p>
                            <p className="font-semibold text-dark-800 font-mono">
                              {route.distance.toFixed(1)} km
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-500 mb-1">预计时间</p>
                            <p className="font-semibold text-dark-800 font-mono">
                              {Math.floor(route.estimatedTime / 60)}h{' '}
                              {route.estimatedTime % 60}m
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-500 mb-1">收费站点</p>
                            <p className="font-semibold text-dark-800 font-mono">
                              {route.tollGates} 个
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-dark-500 mb-1">优惠金额</p>
                            <p className="font-semibold text-success font-mono">
                              ¥{route.discountFee.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {selectedRoute === route.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t border-primary-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-1 bg-white rounded-lg p-4">
                                <h5 className="text-sm font-medium text-dark-700 mb-2 flex items-center gap-2">
                                  <BadgePercent className="w-4 h-4 text-accent-500" />
                                  费用明细 ({etcCard.type} {etcCard.type === '储值卡' ? '95折' : ''})
                                </h5>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-dark-500">基础费用</span>
                                    <span className="font-mono">¥{route.totalFee.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-success">
                                    <span>优惠折扣</span>
                                    <span className="font-mono">-¥{route.discountFee.toFixed(2)}</span>
                                  </div>
                                  {holidayInfo?.isFree && (
                                    <div className="flex justify-between text-success">
                                      <span>节假日免费</span>
                                      <span className="font-mono">-¥{route.actualFee.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-2 border-t border-dark-100 font-semibold">
                                    <span>实付金额</span>
                                    <span className="font-mono text-accent-500">
                                      ¥{holidayInfo?.isFree ? '0.00' : route.actualFee.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button className="btn-primary whitespace-nowrap">
                                  开始导航
                                </button>
                                <button className="btn-secondary whitespace-nowrap">
                                  保存路线
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="card p-6"
                >
                  <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    折扣说明
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-primary-50 rounded-lg">
                      <p className="font-medium text-primary-800 mb-1">储值卡 95折</p>
                      <p className="text-sm text-primary-600">
                        使用粤通卡储值卡支付，所有客车享受95折优惠
                      </p>
                    </div>
                    <div className="p-4 bg-accent-50 rounded-lg">
                      <p className="font-medium text-accent-800 mb-1">货车 85折</p>
                      <p className="text-sm text-accent-600">
                        货车通行全省高速公路，统一享受85折优惠
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="font-medium text-green-800 mb-1">节假日免费</p>
                      <p className="text-sm text-green-600">
                        春节、清明、五一、国庆期间，7座及以下客车免费通行
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {calculatedRoutes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card p-12 text-center"
              >
                <Calculator className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dark-700 mb-2">选择起终点查询路费</h3>
                <p className="text-dark-500">
                  请在左侧选择起点和终点收费站，系统将为您计算最优路线和费用
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
