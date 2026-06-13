import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  Zap,
  TrendingDown,
  Car,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';
import { MapContainer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

const customIcon = L.divIcon({
  className: '',
  html: '<span class="local-map-marker local-map-marker-start"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const endIcon = L.divIcon({
  className: '',
  html: '<span class="local-map-marker local-map-marker-end"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

export default function TollCalculator() {
  const { tollStations, calculateToll, calculatedRoutes, holidayInfo, etcCard } = useStore();
  const [startStation, setStartStation] = useState('s001');
  const [endStation, setEndStation] = useState('s004');
  const [vehicleType, setVehicleType] = useState(1);
  const [travelDate, setTravelDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const vehicleTypes = [
    { id: 1, name: '一类客车', seats: '≤9座', rate: 0.45, discount: etcCard.type === '储值卡' ? 0.95 : 1, icon: Car },
    { id: 2, name: '二类客车', seats: '10-19座', rate: 0.675, discount: etcCard.type === '储值卡' ? 0.95 : 1, icon: Car },
    { id: 3, name: '三类客车', seats: '20-39座', rate: 0.90, discount: etcCard.type === '储值卡' ? 0.95 : 1, icon: Car },
    { id: 4, name: '四类客车', seats: '≥40座', rate: 1.125, discount: etcCard.type === '储值卡' ? 0.95 : 1, icon: Car },
    { id: 5, name: '一类货车', weight: '≤2吨', rate: 0.45, discount: 0.85, icon: Truck },
    { id: 6, name: '二类货车', weight: '2-5吨', rate: 0.90, discount: 0.85, icon: Truck },
  ];

  const currentVehicle = vehicleTypes.find((v) => v.id === vehicleType);
  const isTruck = vehicleType >= 5;
  const baseDiscount = isTruck ? '85折' : (etcCard.type === '储值卡' ? '95折' : '无折扣');
  const discountRate = isTruck ? 0.85 : (etcCard.type === '储值卡' ? 0.95 : 1);

  const doCalculate = useCallback(() => {
    if (!startStation || !endStation || startStation === endStation) return;
    setIsCalculating(true);
    setHasQueried(true);
    setTimeout(() => {
      calculateToll(startStation, endStation, vehicleType, travelDate);
      setSelectedRoute('r1');
      setIsCalculating(false);
    }, 400);
  }, [startStation, endStation, vehicleType, travelDate, calculateToll]);

  useEffect(() => {
    if (startStation && endStation && startStation !== endStation) {
      const timer = setTimeout(() => {
        doCalculate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [doCalculate]);

  const filteredStartStations = tollStations.filter(
    (s) => !endStation || s.id !== endStation
  );
  const filteredEndStations = tollStations.filter(
    (s) => !startStation || s.id !== startStation
  );

  const canCalculate = !!startStation && !!endStation && startStation !== endStation;
  const startStationData = startStation ? tollStations.find((s) => s.id === startStation) : null;
  const endStationData = endStation ? tollStations.find((s) => s.id === endStation) : null;

  const mapCenter = calculatedRoutes.length > 0 && calculatedRoutes[0].pathPoints.length > 0
    ? [calculatedRoutes[0].pathPoints[0].lat, calculatedRoutes[0].pathPoints[0].lng]
    : [23.1, 113.3];

  const getRouteColor = (index: number, isSelected: boolean) => {
    if (isSelected) return '#FF6B35';
    const colors = ['#0F52BA', '#10B981', '#F59E0B'];
    return colors[index] || '#9CA3AF';
  };

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-dark-800 mb-2">路费查询结果</h1>
          <p className="text-dark-500">输入起点和终点收费站，智能计算最优路线和费用</p>
          <p className="mt-2 inline-flex rounded-lg bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            搜索框 · 查询结果会按起终点、车型和出行日期实时筛选
          </p>
        </motion.div>

        {holidayInfo?.isFree && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-xl flex items-start gap-3"
          >
            <Gift className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                节假日免费通行政策
              </h4>
              <p className="text-sm text-green-700 mt-1">
                <span className="font-medium">{holidayInfo.holidayName}</span>期间 ({holidayInfo.freePeriod})，
                7座及以下客车免费通行！您选择的日期符合免费条件。
              </p>
            </div>
          </motion.div>
        )}

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

              <div className="space-y-5">
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
                      <span className={startStation ? 'text-dark-800 font-medium' : 'text-dark-400'}>
                        {startStationData?.name || '请选择起点收费站'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${showStartDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showStartDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-20 w-full mt-1 bg-white border border-dark-200 rounded-lg shadow-xl overflow-hidden"
                      >
                        <div className="max-h-64 overflow-y-auto">
                          {filteredStartStations.map((station) => (
                            <button
                              key={station.id}
                              onClick={() => {
                                setStartStation(station.id);
                                setShowStartDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left transition-colors border-b border-dark-100 last:border-0 ${
                                startStation === station.id
                                  ? 'bg-primary-50 text-primary-800'
                                  : 'hover:bg-dark-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{station.name}</p>
                                  <p className="text-xs text-dark-500">{station.highway} · {station.gantryCount}个门架</p>
                                </div>
                                {startStation === station.id && (
                                  <CheckCircle className="w-5 h-5 text-primary-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                      <span className={endStation ? 'text-dark-800 font-medium' : 'text-dark-400'}>
                        {endStationData?.name || '请选择终点收费站'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${showEndDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {showEndDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-20 w-full mt-1 bg-white border border-dark-200 rounded-lg shadow-xl overflow-hidden"
                      >
                        <div className="max-h-64 overflow-y-auto">
                          {filteredEndStations.map((station) => (
                            <button
                              key={station.id}
                              onClick={() => {
                                setEndStation(station.id);
                                setShowEndDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left transition-colors border-b border-dark-100 last:border-0 ${
                                endStation === station.id
                                  ? 'bg-primary-50 text-primary-800'
                                  : 'hover:bg-dark-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{station.name}</p>
                                  <p className="text-xs text-dark-500">{station.highway} · {station.gantryCount}个门架</p>
                                </div>
                                {endStation === station.id && (
                                  <CheckCircle className="w-5 h-5 text-primary-500" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        {vt.name} - {vt.rate.toFixed(3)}元/公里
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

                <div className="p-4 bg-dark-50 rounded-lg">
                  <h4 className="font-medium text-dark-800 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary-500" />
                    车型单价说明
                  </h4>
                  <div className="space-y-2 text-sm">
                    {vehicleTypes.map((vt) => (
                      <div
                        key={vt.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          vt.id === vehicleType ? 'bg-primary-100' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <vt.icon className={`w-4 h-4 ${vt.id === vehicleType ? 'text-primary-600' : 'text-dark-400'}`} />
                          <span className={vt.id === vehicleType ? 'font-medium text-primary-800' : 'text-dark-600'}>
                            {vt.name}
                          </span>
                        </div>
                        <span className="font-mono font-medium text-dark-800">
                          {vt.rate.toFixed(3)} 元/km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentVehicle && (
                  <div className={`p-4 rounded-lg border-2 ${
                    holidayInfo?.isFree
                      ? 'bg-green-50 border-green-300'
                      : discountRate < 1
                      ? 'bg-accent-50 border-accent-300'
                      : 'bg-dark-50 border-dark-200'
                  }`}>
                    <h4 className="font-medium text-dark-800 mb-2 flex items-center gap-2">
                      <BadgePercent className={`w-4 h-4 ${
                        holidayInfo?.isFree ? 'text-green-600' : discountRate < 1 ? 'text-accent-600' : 'text-dark-500'
                      }`} />
                      您的计费优惠
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-600">卡类型</span>
                        <span className="font-medium">{etcCard.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-600">基础折扣</span>
                        <span className={`font-medium ${discountRate < 1 ? 'text-accent-600' : 'text-dark-700'}`}>
                          {baseDiscount}
                        </span>
                      </div>
                      {holidayInfo?.isFree && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-dark-600">节假日免费</span>
                          <span className="font-medium text-green-600 flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            全额免费
                          </span>
                        </div>
                      )}
                      {discountRate < 1 && !holidayInfo?.isFree && (
                        <div className="flex items-center justify-between text-sm pt-2 border-t border-accent-200 mt-2">
                          <span className="text-accent-700">综合优惠</span>
                          <span className="font-bold text-accent-600">
                            省 {((1 - discountRate) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={doCalculate}
                disabled={!canCalculate || isCalculating}
                className="w-full btn-primary mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCalculating ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="inline-block"
                    >
                      <Zap className="w-4 h-4" />
                    </motion.span>
                    计算中...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {canCalculate ? '查询路费' : '请选择起终点'}
                  </>
                )}
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {isCalculating && (
                <motion.div
                  key="calculating"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="card p-12 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary-200 border-t-primary-500"
                  />
                  <h3 className="text-lg font-semibold text-dark-700 mb-2">正在计算最优路线</h3>
                  <p className="text-dark-500">
                    系统正在为您规划多条路线并计算差异化计费...
                  </p>
                </motion.div>
              )}

              {!isCalculating && calculatedRoutes.length > 0 && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-xl bg-primary-50 border border-primary-200"
                  >
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <MapPin className="w-4 h-4 text-success" />
                      <span className="font-medium text-dark-800">{startStationData?.name}</span>
                      <span className="text-dark-400">→</span>
                      <MapPin className="w-4 h-4 text-danger" />
                      <span className="font-medium text-dark-800">{endStationData?.name}</span>
                      <span className="text-dark-400 mx-2">|</span>
                      <span className="text-primary-700">{currentVehicle?.name}</span>
                      <span className="text-dark-400 mx-2">|</span>
                      <span className="text-dark-500">{travelDate}</span>
                      {holidayInfo?.isFree && (
                        <>
                          <span className="text-dark-400 mx-2">|</span>
                          <span className="text-green-700 font-medium flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            {holidayInfo.holidayName}免费
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-primary-600">
                      <span>共 {calculatedRoutes.length} 条路线</span>
                      <span>最短 {calculatedRoutes.find(r => r.isShortest)?.distance.toFixed(1)} km</span>
                      <span>最低 ¥{Math.min(...calculatedRoutes.map(r => r.actualFee)).toFixed(2)}</span>
                      {discountRate < 1 && <span>{baseDiscount}优惠已计算</span>}
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="card p-6 mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-primary-500" />
                        路线地图
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-dark-500">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-primary-500" />
                          推荐路线
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-green-500" />
                          备选路线
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full bg-orange-500" />
                          当前选择
                        </span>
                      </div>
                    </div>
                    <div className="h-80 rounded-lg overflow-hidden">
                      <MapContainer
                        center={mapCenter as [number, number]}
                        zoom={9}
                        style={{ height: '100%', width: '100%' }}
                        className="local-leaflet-map"
                      >
                        {calculatedRoutes.map((route, idx) => (
                          <Polyline
                            key={route.id}
                            positions={route.pathPoints.map((p) => [p.lat, p.lng])}
                            color={getRouteColor(idx, selectedRoute === route.id)}
                            weight={selectedRoute === route.id ? 6 : idx === 0 ? 4 : 3}
                            opacity={selectedRoute === route.id ? 1 : idx === 0 ? 0.8 : 0.6}
                            dashArray={idx === 0 || selectedRoute === route.id ? undefined : '12, 8'}
                          />
                        ))}
                        {startStationData && (
                          <Marker
                            position={[startStationData.location.lat, startStationData.location.lng]}
                            icon={customIcon}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-medium text-green-700">起点</p>
                                <p className="font-bold">{startStationData.name}</p>
                                <p className="text-dark-500">{startStationData.highway}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                        {endStationData && (
                          <Marker
                            position={[endStationData.location.lat, endStationData.location.lng]}
                            icon={endIcon}
                          >
                            <Popup>
                              <div className="text-sm">
                                <p className="font-medium text-red-700">终点</p>
                                <p className="font-bold">{endStationData.name}</p>
                                <p className="text-dark-500">{endStationData.highway}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="card p-6 mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
                        <Route className="w-5 h-5 text-primary-500" />
                        多路径比价
                      </h3>
                      <span className="text-sm text-dark-500">
                        共 {calculatedRoutes.length} 条路线 · 点击查看详情
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {calculatedRoutes.map((route, idx) => (
                        <motion.div
                          key={route.id}
                          whileHover={{ y: -4 }}
                          onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            selectedRoute === route.id
                              ? 'border-accent-500 bg-accent-50 shadow-xl scale-[1.02]'
                              : 'border-dark-200 bg-white hover:border-primary-300 hover:shadow-lg'
                          }`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                  route.isShortest
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-100 text-dark-600'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-dark-800">{route.name}</h4>
                              </div>
                            </div>
                            {route.isShortest && (
                              <span className="badge badge-info flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                最短路径
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-dark-500 mb-4">{route.description}</p>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-dark-500">总里程</span>
                              <span className="font-bold text-dark-800 font-mono">
                                {route.distance.toFixed(1)} km
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-dark-500">预计时间</span>
                              <span className="font-medium text-dark-700 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {Math.floor(route.estimatedTime / 60)}h {route.estimatedTime % 60}m
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-dark-500">收费站点</span>
                              <span className="font-medium text-dark-700 font-mono">
                                {route.tollGates} 个
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-dark-200">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-dark-500">原价</span>
                              <span className="text-sm text-dark-400 line-through font-mono">
                                ¥{route.totalFee.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-dark-500">优惠</span>
                              <span className="text-sm text-success font-mono">
                                -¥{route.discountFee.toFixed(2)} ({baseDiscount})
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-medium text-dark-700">应付金额</span>
                              {holidayInfo?.isFree ? (
                                <span className="text-2xl font-bold text-green-600 font-mono flex items-center gap-1">
                                  <Gift className="w-5 h-5" />
                                  免费
                                </span>
                              ) : (
                                <span className="text-2xl font-bold text-accent-600 font-mono">
                                  ¥{route.actualFee.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {holidayInfo?.isFree && (
                            <div className="mt-3 p-2 bg-green-100 rounded-lg text-center">
                              <span className="text-sm text-green-700 font-medium flex items-center justify-center gap-1">
                                <Sparkles className="w-4 h-4" />
                                {holidayInfo.holidayName}免费通行
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {selectedRoute && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-5 bg-primary-50 rounded-xl border-2 border-primary-200"
                      >
                        <h4 className="font-semibold text-primary-800 mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          费用明细
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-dark-500 mb-1">基础费用</p>
                            <p className="text-xl font-bold text-dark-800 font-mono">
                              ¥{calculatedRoutes.find(r => r.id === selectedRoute)?.totalFee.toFixed(2)}
                            </p>
                            <p className="text-xs text-dark-400 mt-1">
                              {currentVehicle?.rate.toFixed(3)}元/km × {calculatedRoutes.find(r => r.id === selectedRoute)?.distance.toFixed(1)}km
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-dark-500 mb-1">优惠折扣</p>
                            <p className="text-xl font-bold text-success font-mono">
                              -¥{calculatedRoutes.find(r => r.id === selectedRoute)?.discountFee.toFixed(2)}
                            </p>
                            <p className="text-xs text-dark-400 mt-1">
                              {baseDiscount}优惠
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-dark-500 mb-1">实付金额</p>
                            {holidayInfo?.isFree ? (
                              <p className="text-xl font-bold text-green-600 font-mono">¥0.00</p>
                            ) : (
                              <p className="text-xl font-bold text-accent-600 font-mono">
                                ¥{calculatedRoutes.find(r => r.id === selectedRoute)?.actualFee.toFixed(2)}
                              </p>
                            )}
                            <p className="text-xs text-dark-400 mt-1">
                              {holidayInfo?.isFree ? `${holidayInfo.holidayName}免费` : `已省${((1 - discountRate) * 100).toFixed(0)}%`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="card p-6"
                  >
                    <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      折扣政策说明
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BadgePercent className="w-5 h-5 text-primary-600" />
                          <p className="font-bold text-primary-800">储值卡 95折</p>
                        </div>
                        <p className="text-sm text-primary-600">
                          使用粤通卡储值卡支付，所有客车享受95折优惠。
                          您当前是<span className="font-medium">{etcCard.type}</span>，
                          {etcCard.type === '储值卡' ? '已享受此优惠' : '升级为储值卡可享'}。
                        </p>
                      </div>
                      <div className="p-4 bg-accent-50 rounded-lg border border-accent-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-5 h-5 text-accent-600" />
                          <p className="font-bold text-accent-800">货车 85折</p>
                        </div>
                        <p className="text-sm text-accent-600">
                          货车通行全省高速公路，统一享受85折优惠。
                          {isTruck ? '您选择的车型已享受此优惠。' : '选择货车车型可享此优惠。'}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className="w-5 h-5 text-green-600" />
                          <p className="font-bold text-green-800">节假日免费</p>
                        </div>
                        <p className="text-sm text-green-600">
                          春节、清明、五一、国庆期间，7座及以下客车免费通行。
                          {holidayInfo?.isFree
                            ? '您选择的日期符合免费条件！'
                            : '请选择节假日期间出行日期享受此优惠。'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-dark-50 rounded-lg">
                      <h4 className="font-medium text-dark-800 mb-2">节假日免费时间表</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="p-2 bg-white rounded-lg text-center">
                          <p className="font-medium text-dark-700">春节</p>
                          <p className="text-xs text-dark-500">除夕-初六</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg text-center">
                          <p className="font-medium text-dark-700">清明节</p>
                          <p className="text-xs text-dark-500">3天假期</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg text-center">
                          <p className="font-medium text-dark-700">劳动节</p>
                          <p className="text-xs text-dark-500">5天假期</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg text-center">
                          <p className="font-medium text-dark-700">国庆节</p>
                          <p className="text-xs text-dark-500">7天假期</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {!isCalculating && calculatedRoutes.length === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="card p-12 text-center"
                >
                  <Calculator className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark-700 mb-2">
                    {hasQueried ? '未找到可用路线' : '选择起终点查询路费'}
                  </h3>
                  <p className="text-dark-500 mb-4">
                    {hasQueried
                      ? '请更换起点或终点收费站后重新查询'
                      : '请在左侧选择起点和终点收费站，系统将自动为您计算最优路线和费用'}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-dark-400">
                    <CheckCircle className="w-4 h-4 text-primary-500" />
                    <span>支持多路径比价</span>
                    <span className="mx-2">·</span>
                    <CheckCircle className="w-4 h-4 text-accent-500" />
                    <span>差异化计费</span>
                    <span className="mx-2">·</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>节假日免费叠加</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
