import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Phone,
  Star,
  Users,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  Navigation,
  Map as MapIcon,
  List,
  X,
  Ticket,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Outlets() {
  const { outlets, selectOutlet, selectedOutlet, createAppointment } = useStore();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [businessType, setBusinessType] = useState<string>('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentType, setAppointmentType] = useState('新办');
  const [appointmentTime, setAppointmentTime] = useState(dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const businessTypes = ['全部', '新办', '充值', '故障处理', '激活'];

  const filteredOutlets = outlets.filter((outlet) => {
    const matchType = businessType === '全部' || outlet.businessTypes.includes(businessType as '新办' | '充值' | '故障处理' | '激活');
    const matchSearch =
      searchTerm === '' ||
      outlet.name.includes(searchTerm) ||
      outlet.address.includes(searchTerm);
    return matchType && matchSearch;
  });

  const handleSelectOutlet = (outlet: typeof outlets[0]) => {
    selectOutlet(outlet);
  };

  const handleAppointment = async () => {
    if (!selectedOutlet) return;
    setIsSubmitting(true);
    const success = await createAppointment(selectedOutlet.id, appointmentType, appointmentTime);
    setIsSubmitting(false);
    if (success) {
      setShowSuccess(true);
      setShowAppointmentModal(false);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const getQueueColor = (count: number) => {
    if (count < 5) return 'text-success';
    if (count < 15) return 'text-warning';
    return 'text-danger';
  };

  const getWaitTimeColor = (time: number) => {
    if (time < 20) return 'bg-green-100 text-green-700';
    if (time < 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const mapCenter = selectedOutlet
    ? [selectedOutlet.location.lat, selectedOutlet.location.lng]
    : [23.12, 113.36];

  const timeSlots = [];
  for (let h = 9; h < 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-dark-800 mb-2">网点服务</h1>
          <p className="text-dark-500">查找附近的粤通卡服务网点，在线预约办理业务</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="搜索网点名称或地址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <Filter className="w-5 h-5 text-dark-500 flex-shrink-0" />
              {businessTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setBusinessType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    businessType === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-dark-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'map' ? 'bg-white shadow text-primary-500' : 'text-dark-500'
                }`}
              >
                <MapIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-white shadow text-primary-500' : 'text-dark-500'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'map' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card overflow-hidden"
              >
                <div className="h-[600px]">
                  <MapContainer
                    center={mapCenter as [number, number]}
                    zoom={11}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredOutlets.map((outlet) => (
                      <div key={outlet.id}>
                        <Circle
                          center={[outlet.location.lat, outlet.location.lng]}
                          radius={2000}
                          pathOptions={{ color: '#0F52BA', fillColor: '#0F52BA', fillOpacity: 0.1 }}
                        />
                        <Marker
                          position={[outlet.location.lat, outlet.location.lng]}
                          icon={customIcon}
                          eventHandlers={{
                            click: () => handleSelectOutlet(outlet),
                          }}
                        >
                          <Popup>
                            <div className="text-sm min-w-[200px]">
                              <p className="font-semibold text-dark-800 mb-1">{outlet.name}</p>
                              <p className="text-dark-500 mb-2">{outlet.address}</p>
                              <div className="flex items-center gap-2 text-xs text-dark-600 mb-2">
                                <Clock className="w-3 h-3" />
                                {outlet.businessHours.weekday}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`badge ${getWaitTimeColor(outlet.avgWaitTime)}`}>
                                  等待 {outlet.avgWaitTime} 分钟
                                </span>
                                <span className="text-xs text-dark-500">
                                  {outlet.currentQueue} 人排队
                                </span>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      </div>
                    ))}
                  </MapContainer>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {filteredOutlets.map((outlet, idx) => (
                  <motion.div
                    key={outlet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleSelectOutlet(outlet)}
                    className={`card p-6 cursor-pointer transition-all duration-300 ${
                      selectedOutlet?.id === outlet.id
                        ? 'border-primary-500 shadow-lg'
                        : 'hover:shadow-card'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-dark-800 text-lg">{outlet.name}</h4>
                            <p className="text-sm text-dark-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-4 h-4" />
                              {outlet.address}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-sm text-dark-500">距离</p>
                            <p className="font-bold text-dark-800 font-mono">{outlet.distance} km</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <div className="flex items-center gap-1 text-sm text-dark-600">
                            <Clock className="w-4 h-4" />
                            <span>工作日 {outlet.businessHours.weekday}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-dark-600">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{outlet.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className={`w-4 h-4 ${getQueueColor(outlet.currentQueue)}`} />
                            <span className={getQueueColor(outlet.currentQueue)}>
                              {outlet.currentQueue} 人排队
                            </span>
                          </div>
                          <span className={`badge ${getWaitTimeColor(outlet.avgWaitTime)}`}>
                            平均等待 {outlet.avgWaitTime} 分钟
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {outlet.businessTypes.map((type) => (
                            <span
                              key={type}
                              className="badge bg-primary-100 text-primary-700"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedOutlet ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="card p-6 sticky top-24"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-dark-800">网点详情</h3>
                    <button
                      onClick={() => selectOutlet(null)}
                      className="p-1 hover:bg-dark-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-dark-500" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-dark-800 text-xl mb-2">
                      {selectedOutlet.name}
                    </h4>
                    <p className="text-dark-500 flex items-start gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-dark-400 flex-shrink-0 mt-0.5" />
                      {selectedOutlet.address}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= selectedOutlet.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-dark-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-dark-700">{selectedOutlet.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="p-4 bg-dark-50 rounded-xl">
                      <p className="text-sm text-dark-500 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        营业时间
                      </p>
                      <div className="space-y-1">
                        <p className="font-medium text-dark-800">
                          周一至周五：{selectedOutlet.businessHours.weekday}
                        </p>
                        <p className="font-medium text-dark-800">
                          周末：{selectedOutlet.businessHours.weekend}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-dark-50 rounded-xl">
                      <p className="text-sm text-dark-500 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        联系电话
                      </p>
                      <p className="font-medium text-dark-800">{selectedOutlet.phone}</p>
                    </div>

                    <div className="p-4 bg-dark-50 rounded-xl">
                      <p className="text-sm text-dark-500 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        当前排队情况
                      </p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className={`text-3xl font-bold font-mono ${getQueueColor(selectedOutlet.currentQueue)}`}>
                            {selectedOutlet.currentQueue}
                          </p>
                          <p className="text-sm text-dark-500">人排队</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold font-mono ${getQueueColor(selectedOutlet.avgWaitTime * 2)}`}>
                            {selectedOutlet.avgWaitTime}
                          </p>
                          <p className="text-sm text-dark-500">分钟等待</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-dark-50 rounded-xl">
                      <p className="text-sm text-dark-500 mb-2">可办理业务</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedOutlet.businessTypes.map((type) => (
                          <span
                            key={type}
                            className="badge bg-primary-100 text-primary-700"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAppointmentModal(true)}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      立即预约
                    </button>
                    <button className="w-full btn-secondary flex items-center justify-center gap-2">
                      <Navigation className="w-5 h-5" />
                      导航前往
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-8 text-center sticky top-24"
                >
                  <MapPin className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-dark-700 mb-2">选择网点</h3>
                  <p className="text-dark-500 text-sm">
                    点击地图上的标记或列表中的网点查看详情
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showAppointmentModal && selectedOutlet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm"
              onClick={() => setShowAppointmentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-dark-800 mb-2">预约办理</h3>
                <p className="text-dark-500 mb-6">{selectedOutlet.name}</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      业务类型
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOutlet.businessTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setAppointmentType(type)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            appointmentType === type
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-dark-200 hover:border-dark-300'
                          }`}
                        >
                          <p className="font-medium text-dark-800">{type}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      预约日期
                    </label>
                    <input
                      type="date"
                      value={appointmentTime.split('T')[0]}
                      onChange={(e) =>
                        setAppointmentTime(`${e.target.value}T${appointmentTime.split('T')[1]}`)
                      }
                      min={dayjs().format('YYYY-MM-DD')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      预约时段
                    </label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() =>
                            setAppointmentTime(`${appointmentTime.split('T')[0]}T${time}`)
                          }
                          className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            appointmentTime.includes(time)
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-100 text-dark-700 hover:bg-dark-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-primary-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Ticket className="w-8 h-8 text-primary-500" />
                      <div>
                        <p className="font-medium text-primary-800">预约成功后将生成排队号</p>
                        <p className="text-sm text-primary-600">
                          请提前15分钟到达网点，过号需重新取号
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAppointment}
                    disabled={isSubmitting}
                    className="flex-1 btn-primary"
                  >
                    {isSubmitting ? '提交中...' : '确认预约'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-8 right-8 z-50 p-6 bg-success text-white rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <CheckCircle className="w-8 h-8" />
              <div>
                <p className="font-semibold text-lg">预约成功</p>
                <p className="text-sm text-white/80">您的排队号已生成，请准时前往</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
