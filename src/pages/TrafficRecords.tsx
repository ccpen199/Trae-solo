import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertTriangle,
  Wallet,
  RefreshCw,
  CheckCircle,
  XCircle,
  Bell,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';
import type { TrafficRecord } from '../../shared/types';

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function TrafficRecords() {
  const navigate = useNavigate();
  const { trafficRecords, selectTrafficRecord, etcCard, payPendingFee, enableAutoPay } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState<TrafficRecord | null>(null);

  const statusFilters = ['全部', '已完成', '待扣费', '异常'];

  const filteredRecords = trafficRecords.filter((record) => {
    const matchStatus = filter === '全部' || record.status === filter;
    const matchSearch =
      searchTerm === '' ||
      record.entryStation.includes(searchTerm) ||
      record.exitStation.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const pendingRecords = trafficRecords.filter((r) => r.status === '待扣费');
  const lowBalanceWarning = etcCard.balance < 100 && etcCard.type === '储值卡';
  const totalPendingAmount = pendingRecords.reduce((sum, r) => sum + r.actualFee, 0);

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

  const handlePay = async (record: TrafficRecord, method: 'balance' | 'wechat' | 'alipay') => {
    setProcessingId(record.id);
    try {
      if (method === 'balance' && etcCard.balance < record.actualFee) {
        alert('余额不足，请先充值或选择其他支付方式');
        setProcessingId(null);
        return;
      }
      const success = await payPendingFee(record.id, method);
      if (success) {
        setShowPayModal(null);
        setExpandedId(null);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleEnableAutoPay = () => {
    enableAutoPay();
    alert('自动代扣已启用，下次通行将自动扣费');
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

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case 'balance':
        return '账户余额';
      case 'autopay':
        return '自动代扣';
      case 'wechat':
        return '微信支付';
      case 'alipay':
        return '支付宝';
      default:
        return '待处理';
    }
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
          <h1 className="text-2xl font-bold text-dark-800 mb-2">通行记录</h1>
          <p className="text-dark-500">查看您的ETC通行历史和详细费用明细</p>
        </motion.div>

        {lowBalanceWarning && pendingRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                余额不足预警
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                当前账户余额 <span className="font-bold">¥{etcCard.balance.toFixed(2)}</span>，
                待扣费金额 <span className="font-bold">¥{totalPendingAmount.toFixed(2)}</span>。
                请及时充值或开通自动代扣，避免影响后续通行。
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => navigate('/recharge')}
                  className="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
                >
                  <Wallet className="w-4 h-4 inline mr-1" />
                  立即充值
                </button>
                {!etcCard.autoPayEnabled && (
                  <button
                    onClick={handleEnableAutoPay}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Zap className="w-4 h-4 inline mr-1" />
                    开通自动代扣
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

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
                  {statusFilters.map((f) => {
                    const count = f === '全部' 
                      ? trafficRecords.length 
                      : trafficRecords.filter(r => r.status === f).length;
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                          filter === f
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                        }`}
                      >
                        {f}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          filter === f ? 'bg-white/20' : 'bg-dark-200 text-dark-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredRecords.map((record, idx) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                      transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                      className={`border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-card ${
                        record.status === '待扣费' ? 'border-yellow-300 bg-yellow-50/30' : 'border-dark-200'
                      }`}
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-dark-50 transition-colors"
                        onClick={() => toggleExpand(record.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                record.status === '待扣费' ? 'bg-yellow-100' : 'bg-primary-100'
                              }`}>
                                {record.status === '待扣费' ? (
                                  <Clock className="w-6 h-6 text-yellow-600" />
                                ) : record.status === '异常' ? (
                                  <AlertTriangle className="w-6 h-6 text-red-500" />
                                ) : (
                                  <Car className="w-6 h-6 text-primary-500" />
                                )}
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
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`badge ${getStatusColor(record.status)}`}>
                                  {record.status}
                                </span>
                                <span className="badge badge-info">{record.discountType}</span>
                                {record.isHolidayFree && (
                                  <span className="badge bg-green-100 text-green-800">
                                    🎉 {record.holidayName}免费
                                  </span>
                                )}
                                {record.status === '待扣费' && record.paymentRetryCount && record.paymentRetryCount > 0 && (
                                  <span className="badge bg-orange-100 text-orange-800">
                                    <RefreshCw className="w-3 h-3 inline mr-1" />
                                    已重试 {record.paymentRetryCount} 次
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                {record.isHolidayFree ? (
                                  <p className="text-lg font-bold text-green-600 font-mono">
                                    免费
                                  </p>
                                ) : (
                                  <>
                                    <p className="text-lg font-bold text-dark-800 font-mono">
                                      ¥{record.actualFee.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-success">已优惠 ¥{record.discountFee.toFixed(2)}</p>
                                  </>
                                )}
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

                      <AnimatePresence>
                        {expandedId === record.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-dark-200"
                          >
                            <div className="p-4 bg-dark-50">
                              {record.status === '待扣费' && !record.isHolidayFree && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        待扣费处理
                                      </h4>
                                      <p className="text-sm text-yellow-700 mt-1">
                                        支付方式：{getPaymentMethodText(record.paymentMethod)}
                                        {record.lastPaymentAttempt && (
                                          <span className="ml-2">
                                            上次尝试：{dayjs(record.lastPaymentAttempt).format('MM-DD HH:mm')}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowPayModal(record);
                                        }}
                                        disabled={processingId === record.id}
                                        className="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
                                      >
                                        {processingId === record.id ? (
                                          <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                                        ) : (
                                          <CreditCard className="w-4 h-4 inline mr-1" />
                                        )}
                                        立即补缴
                                      </button>
                                      {!etcCard.autoPayEnabled && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEnableAutoPay();
                                          }}
                                          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                                        >
                                          <Zap className="w-4 h-4 inline mr-1" />
                                          开通代扣
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {record.status === '异常' && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <h4 className="font-semibold text-red-800 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    通行异常
                                  </h4>
                                  <p className="text-sm text-red-700 mt-1">
                                    该笔通行存在异常，可能原因：跟车干扰、标签失效或路径异常。
                                    请联系客服96533处理或前往网点办理。
                                  </p>
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={() => navigate('/outlets')}
                                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                                    >
                                      <MapPin className="w-4 h-4 inline mr-1" />
                                      查找网点
                                    </button>
                                  </div>
                                </div>
                              )}

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
                                  <p className={`text-xl font-bold font-mono ${
                                    record.isHolidayFree ? 'text-green-600' : 'text-accent-500'
                                  }`}>
                                    {record.isHolidayFree ? '免费' : `¥${record.actualFee.toFixed(2)}`}
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
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredRecords.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    {filter === '待扣费' ? (
                      <>
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-dark-500 font-medium">太棒了！没有待扣费记录</p>
                        <p className="text-sm text-dark-400 mt-1">所有通行费用均已结清</p>
                      </>
                    ) : filter === '异常' ? (
                      <>
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-dark-500 font-medium">没有异常记录</p>
                        <p className="text-sm text-dark-400 mt-1">您的ETC通行一切正常</p>
                      </>
                    ) : (
                      <>
                        <Car className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                        <p className="text-dark-500">暂无符合条件的通行记录</p>
                      </>
                    )}
                  </motion.div>
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
                <span className="text-xs font-normal text-dark-400 ml-2">
                  {filter === '全部' ? '全部记录' : `当前筛选: ${filter}`}
                </span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-600 mb-1">通行次数</p>
                  <p className="text-2xl font-bold text-primary-700 font-mono">
                    {filteredRecords.length} 次
                  </p>
                  {filter !== '全部' && (
                    <p className="text-xs text-primary-500 mt-1">
                      共 {trafficRecords.length} 次
                    </p>
                  )}
                </div>
                <div className="p-4 bg-accent-50 rounded-lg">
                  <p className="text-sm text-accent-600 mb-1">消费金额</p>
                  <p className="text-2xl font-bold text-accent-700 font-mono">
                    ¥{filteredRecords.reduce((sum, r) => sum + (r.isHolidayFree ? 0 : r.actualFee), 0).toFixed(2)}
                  </p>
                  {filter !== '全部' && (
                    <p className="text-xs text-accent-500 mt-1">
                      共 ¥{trafficRecords.reduce((sum, r) => sum + r.actualFee, 0).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">累计优惠</p>
                  <p className="text-2xl font-bold text-green-700 font-mono">
                    ¥{filteredRecords.reduce((sum, r) => sum + r.discountFee, 0).toFixed(2)}
                  </p>
                  {filter !== '全部' && (
                    <p className="text-xs text-green-500 mt-1">
                      共 ¥{trafficRecords.reduce((sum, r) => sum + r.discountFee, 0).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">行驶里程</p>
                  <p className="text-2xl font-bold text-purple-700 font-mono">
                    {filteredRecords.reduce((sum, r) => sum + r.distance, 0).toFixed(0)} km
                  </p>
                  {filter !== '全部' && (
                    <p className="text-xs text-purple-500 mt-1">
                      共 {trafficRecords.reduce((sum, r) => sum + r.distance, 0).toFixed(0)} km
                    </p>
                  )}
                </div>

                {pendingRecords.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-700 mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      待扣费
                    </p>
                    <p className="text-2xl font-bold text-yellow-700 font-mono">
                      ¥{totalPendingAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      {pendingRecords.length} 笔待处理
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate('/toll-calculator')}
                  className="w-full btn-secondary"
                >
                  计算路费
                </button>
                <button
                  onClick={() => navigate('/recharge')}
                  className="w-full btn-primary"
                >
                  <Wallet className="w-4 h-4 inline mr-1" />
                  充值中心
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPayModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-dark-800">补缴通行费</h3>
                <button
                  onClick={() => setShowPayModal(null)}
                  className="p-2 hover:bg-dark-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5 text-dark-400" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-dark-50 rounded-lg">
                <p className="text-sm text-dark-500 mb-1">
                  {showPayModal.entryStation} → {showPayModal.exitStation}
                </p>
                <p className="text-3xl font-bold text-dark-800 font-mono">
                  ¥{showPayModal.actualFee.toFixed(2)}
                </p>
                <p className="text-sm text-success mt-1">
                  已优惠 ¥{showPayModal.discountFee.toFixed(2)} ({showPayModal.discountType})
                </p>
              </div>

              <h4 className="font-medium text-dark-800 mb-3">选择支付方式</h4>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handlePay(showPayModal, 'balance')}
                  disabled={processingId === showPayModal.id || etcCard.balance < showPayModal.actualFee}
                  className="w-full p-4 border-2 border-dark-200 rounded-xl flex items-center gap-3 hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-dark-800">账户余额支付</p>
                    <p className="text-sm text-dark-500">余额: ¥{etcCard.balance.toFixed(2)}</p>
                  </div>
                  {etcCard.balance < showPayModal.actualFee && (
                    <span className="text-xs text-red-500">余额不足</span>
                  )}
                </button>

                <button
                  onClick={() => handlePay(showPayModal, 'wechat')}
                  disabled={processingId === showPayModal.id}
                  className="w-full p-4 border-2 border-dark-200 rounded-xl flex items-center gap-3 hover:border-green-500 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">💬</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-dark-800">微信支付</p>
                    <p className="text-sm text-dark-500">推荐使用</p>
                  </div>
                </button>

                <button
                  onClick={() => handlePay(showPayModal, 'alipay')}
                  disabled={processingId === showPayModal.id}
                  className="w-full p-4 border-2 border-dark-200 rounded-xl flex items-center gap-3 hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">💰</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-dark-800">支付宝</p>
                    <p className="text-sm text-dark-500">快捷支付</p>
                  </div>
                </button>
              </div>

              {!etcCard.autoPayEnabled && (
                <div className="p-3 bg-primary-50 rounded-lg flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div className="flex-1 text-sm text-primary-700">
                    开通<span className="font-medium">自动代扣</span>，后续通行自动扣费，无需手动处理
                  </div>
                  <button
                    onClick={handleEnableAutoPay}
                    className="px-3 py-1 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    开通
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
