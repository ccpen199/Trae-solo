import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  Search,
  Map as MapIcon,
  CreditCard,
  BadgePercent,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function TrafficRecords() {
  const navigate = useNavigate();
  const { trafficRecords, selectTrafficRecord } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');

  const statusFilters = ['全部', '已完成', '待扣费', '异常'];

  const filteredRecords = trafficRecords.filter((record) => {
    const matchStatus = filter === '全部' || record.status === filter;
    const matchSearch =
      searchTerm === '' ||
      record.entryStation.includes(searchTerm) ||
      record.exitStation.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      selectTrafficRecord(null);
    } else {
      setExpandedId(id);
      const record = trafficRecords.find((r) => r.id === id);
      selectTrafficRecord(record || null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-800';
      case '待扣费':
        return 'bg-yellow-100 text-yellow-800';
      case '异常':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-dark-800 mb-2">通行记录</h1>
          <p className="text-dark-500">查看您的ETC通行历史和详细费用明细</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    placeholder="搜索收费站名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  {statusFilters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        filter === f
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {filteredRecords.map((record, idx) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                    className="border border-dark-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-card"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-dark-50 transition-colors"
                      onClick={() => toggleExpand(record.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                              <Car className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-dark-800">
                                  {record.entryStation}
                                </p>
                                <Navigation className="w-4 h-4 text-dark-400 rotate-45" />
                                <p className="font-semibold text-dark-800">
                                  {record.exitStation}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-dark-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {dayjs(record.entryTime).format('YYYY-MM-DD')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {dayjs(record.entryTime).format('HH:mm')} -{' '}
                                  {dayjs(record.exitTime).format('HH:mm')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {record.distance} km
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`badge ${getStatusColor(record.status)}`}>
                                {record.status}
                              </span>
                              <span className="badge badge-info">{record.discountType}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-dark-800 font-mono">
                                ¥{record.actualFee.toFixed(2)}
                              </p>
                              <p className="text-xs text-success">已优惠 ¥{record.discountFee.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedId === record.id ? (
                            <ChevronUp className="w-5 h-5 text-dark-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-dark-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedId === record.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-dark-200"
                      >
                        <div className="p-4 bg-dark-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-primary-500" />
                                <span className="text-sm text-dark-500">基础费用</span>
                              </div>
                              <p className="text-xl font-bold text-dark-800 font-mono">
                                ¥{record.totalFee.toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <BadgePercent className="w-4 h-4 text-accent-500" />
                                <span className="text-sm text-dark-500">优惠金额</span>
                              </div>
                              <p className="text-xl font-bold text-success font-mono">
                                -¥{record.discountFee.toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-accent-500" />
                                <span className="text-sm text-dark-500">实付金额</span>
                              </div>
                              <p className="text-xl font-bold text-accent-500 font-mono">
                                ¥{record.actualFee.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4">
                            <h4 className="font-medium text-dark-800 mb-3 flex items-center gap-2">
                              <MapIcon className="w-4 h-4 text-primary-500" />
                              门架路径拟合
                            </h4>
                            <div className="h-64 rounded-lg overflow-hidden">
                              <MapContainer
                                center={[record.gantryPoints[0]?.location.lat || 23.1, record.gantryPoints[0]?.location.lng || 113.3]}
                                zoom={10}
                                style={{ height: '100%', width: '100%' }}
                              >
                                <TileLayer
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Polyline
                                  positions={record.gantryPoints.map((p) => [
                                    p.location.lat,
                                    p.location.lng,
                                  ])}
                                  color="#0F52BA"
                                  weight={4}
                                  opacity={0.8}
                                />
                                {record.gantryPoints.map((point) => (
                                  <Marker
                                    key={point.id}
                                    position={[point.location.lat, point.location.lng]}
                                    icon={customIcon}
                                  >
                                    <Popup>
                                      <div className="text-sm">
                                        <p className="font-medium">门架 {point.gantryNo}</p>
                                        <p className="text-dark-500">
                                          {dayjs(point.passTime).format('HH:mm:ss')}
                                        </p>
                                        <p className="text-primary-500 font-medium">
                                          ¥{point.sectionFee.toFixed(2)}
                                        </p>
                                      </div>
                                    </Popup>
                                  </Marker>
                                ))}
                              </MapContainer>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-dark-200">
                                    <th className="text-left py-2 text-dark-500 font-medium">门架编号</th>
                                    <th className="text-left py-2 text-dark-500 font-medium">通过时间</th>
                                    <th className="text-right py-2 text-dark-500 font-medium">区间费用</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.gantryPoints.map((point) => (
                                    <tr key={point.id} className="border-b border-dark-100">
                                      <td className="py-2 font-mono text-dark-700">{point.gantryNo}</td>
                                      <td className="py-2 text-dark-600">
                                        {dayjs(point.passTime).format('HH:mm:ss')}
                                      </td>
                                      <td className="py-2 text-right font-medium text-dark-800 font-mono">
                                        ¥{point.sectionFee.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {filteredRecords.length === 0 && (
                  <div className="text-center py-12">
                    <Car className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">暂无符合条件的通行记录</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-6 sticky top-24"
            >
              <h3 className="text-lg font-semibold text-dark-800 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-500" />
                统计概览
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-600 mb-1">总通行次数</p>
                  <p className="text-2xl font-bold text-primary-700 font-mono">
                    {trafficRecords.length} 次
                  </p>
                </div>
                <div className="p-4 bg-accent-50 rounded-lg">
                  <p className="text-sm text-accent-600 mb-1">总消费金额</p>
                  <p className="text-2xl font-bold text-accent-700 font-mono">
                    ¥{trafficRecords.reduce((sum, r) => sum + r.actualFee, 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">累计优惠</p>
                  <p className="text-2xl font-bold text-green-700 font-mono">
                    ¥{trafficRecords.reduce((sum, r) => sum + r.discountFee, 0).toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">总行驶里程</p>
                  <p className="text-2xl font-bold text-purple-700 font-mono">
                    {trafficRecords.reduce((sum, r) => sum + r.distance, 0).toFixed(0)} km
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/toll-calculator')}
                className="w-full mt-6 btn-secondary"
              >
                计算路费
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
