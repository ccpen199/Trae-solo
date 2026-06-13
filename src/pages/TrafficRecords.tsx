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
  AlertCircle,
  Wallet,
  RefreshCw,
  CheckCircle,
  XCircle,
  Bell,
  Zap,
  AlertOctagon,
  Info,
  X,
  ShieldCheck,
  ArrowRightLeft,
  Clock3,
  Wrench,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';
import type { TrafficRecord } from '../../shared/types';

const customIcon = L.divIcon({
  className: '',
  html: '<span class="local-map-marker local-map-marker-gantry"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const failureReasonMap: Record<string, { icon: typeof AlertCircle; color: string; tip: string; solution: string }> = {
  E_INSUFFICIENT_BALANCE: {
    icon: DollarSign,
    color: 'text-red-600 bg-red-50 border-red-200',
    tip: '账户余额不足导致扣费失败',
    solution: '请先充值或选择其他支付方式完成补缴',
  },
  E_AUTH_EXPIRED: {
    icon: ShieldCheck,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    tip: '第三方支付授权已过期，请重新授权',
    solution: '前往充值中心重新授权微信/支付宝代扣',
  },
  E_AUTH_REQUIRED: {
    icon: ShieldCheck,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    tip: '尚未完成支付渠道授权',
    solution: '前往充值中心完成支付渠道授权后重试',
  },
  E_NETWORK_ERROR: {
    icon: Wrench,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    tip: '网络通信异常，系统将自动重试',
    solution: '系统将在下一个周期自动重试扣费',
  },
  E_HOLIDAY_PENDING: {
    icon: Info,
    color: 'text-green-600 bg-green-50 border-green-200',
    tip: '节假日免费资格核验中',
    solution: '核验通过后自动归档，无需手动操作',
  },
};

export default function TrafficRecords() {
  const navigate = useNavigate();
  const {
    trafficRecords,
    selectTrafficRecord,
    etcCard,
    payPendingFee,
    enableAutoPay,
    authorizePayChannel,
    autoPayConfig,
    triggerAutoPayForPending,
  } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState<TrafficRecord | null>(null);
  const [autoPayProcessing, setAutoPayProcessing] = useState(false);
  const [autoPayResult, setAutoPayResult] = useState<{ success: boolean; count?: number; message?: string } | null>(null);

  const statusFilters = ['全部', '已完成', '待扣费', '异常'];

  const filteredRecords = trafficRecords.filter((record) => {
    const matchStatus = filter === '全部' || record.status === filter;
    const matchSearch =
      searchTerm === '' ||
      record.entryStation.includes(searchTerm) ||
      record.exitStation.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const pendingRecords = trafficRecords.filter((r) => r.status === '待扣费' && !r.isHolidayFree);
  const holidayPendingRecords = trafficRecords.filter((r) => r.status === '待扣费' && r.isHolidayFree);
  const lowBalanceWarning = etcCard.balance < 100 && etcCard.type === '储值卡';
  const totalPendingAmount = pendingRecords.reduce((sum, r) => sum + r.actualFee, 0);
  const hasFailedAutoPay = pendingRecords.some(
    (r) => r.autoPayResult === 'failed' || r.paymentFailureCode === 'E_AUTH_EXPIRED' || r.paymentFailureCode === 'E_AUTH_REQUIRED'
  );

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

  const handleEnableAutoPay = async () => {
    enableAutoPay();
    await authorizePayChannel(autoPayConfig.payChannel);
    setAutoPayResult({
      success: true,
      message: `${autoPayConfig.payChannel === 'wechat' ? '微信' : autoPayConfig.payChannel === 'alipay' ? '支付宝' : '银行卡'}代扣已授权，可立即执行待扣费补缴`,
    });
    setTimeout(() => setAutoPayResult(null), 5000);
  };

  const handleTriggerAutoPay = async () => {
    const pendingCountBefore = pendingRecords.length;
    setAutoPayProcessing(true);
    setAutoPayResult(null);
    const success = await triggerAutoPayForPending();
    if (success) {
      setAutoPayResult({
        success: true,
        count: pendingCountBefore,
        message: `已成功代扣 ${pendingCountBefore} 笔通行费，余额不足时已自动充值`,
      });
    } else {
      const failRecord = pendingRecords.find((r) => r.paymentFailureCode);
      setAutoPayResult({
        success: false,
        message: failRecord?.paymentFailureReason || '代扣失败，请检查支付授权状态',
      });
    }
    setAutoPayProcessing(false);
    setTimeout(() => setAutoPayResult(null), 5000);
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

  const getFailureInfo = (record: TrafficRecord) => {
    if (!record.paymentFailureCode) return null;
    return failureReasonMap[record.paymentFailureCode] || {
      icon: AlertCircle,
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      tip: '其他未知原因',
      solution: '请联系客服处理',
    };
  };

  const getPendingProcessText = (record: TrafficRecord) => {
    if (record.isHolidayFree) return `${record.holidayName || '节假日'}免费核验中`;
    if (record.autoPayResult === 'failed') return `代扣失败 · ${record.paymentFailureCode || '待处理'}`;
    if (record.autoPayTriggered) return '代扣已触发 · 等待结果';
    return '待补缴 · 可手动支付';
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

        {lowBalanceWarning && (pendingRecords.length > 0 || holidayPendingRecords.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl flex items-start gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 flex items-center gap-2 flex-wrap">
                <Bell className="w-4 h-4" />
                余额不足预警
                <span className="text-xs font-normal bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                  触发时间 {dayjs().format('MM-DD HH:mm')}
                </span>
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                当前账户余额 <span className="font-bold">¥{etcCard.balance.toFixed(2)}</span>，
                待扣费金额 <span className="font-bold">¥{totalPendingAmount.toFixed(2)}</span>
                （{pendingRecords.length} 笔）
                {holidayPendingRecords.length > 0 && (
                  <span className="ml-1">
                    ，另有 {holidayPendingRecords.length} 笔节假日免费核验中
                  </span>
                )}
                。请及时充值或开通自动代扣，避免影响后续通行。
              </p>
              {hasFailedAutoPay && (
                <p className="text-sm text-orange-700 mt-1 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  检测到代扣失败记录，请检查支付授权状态或手动补缴
                </p>
              )}
              <div className="flex gap-3 mt-3 flex-wrap">
                <button
                  onClick={() => navigate('/recharge')}
                  className="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition-colors"
                >
                  <Wallet className="w-4 h-4 inline mr-1" />
                  立即充值
                </button>
                {!autoPayConfig.enabled && (
                  <button
                    onClick={handleEnableAutoPay}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  >
                    <Zap className="w-4 h-4 inline mr-1" />
                    开通自动代扣
                  </button>
                )}
                {autoPayConfig.enabled && pendingRecords.length > 0 && (
                  <button
                    onClick={handleTriggerAutoPay}
                    disabled={autoPayProcessing}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {autoPayProcessing ? (
                      <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4 inline mr-1" />
                    )}
                    {autoPayProcessing ? '代扣处理中...' : '立即执行代扣'}
                  </button>
                )}
              </div>
              {autoPayResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    autoPayResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {autoPayResult.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {autoPayResult.message}
                </motion.div>
              )}
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
                      : trafficRecords.filter((r) => r.status === f).length;
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
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            filter === f ? 'bg-white/20' : 'bg-dark-200 text-dark-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filter === '待扣费' && (pendingRecords.length > 0 || holidayPendingRecords.length > 0) && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold">
                      <Clock3 className="w-5 h-5" />
                      待处理扣费
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      {pendingRecords.length} 笔需补缴，合计 ¥{totalPendingAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 text-green-800 font-semibold">
                      <BadgePercent className="w-5 h-5" />
                      免费核验
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {holidayPendingRecords.length} 笔节假日免费资格正在核验
                    </p>
                  </div>
                </div>
              )}

              {filteredRecords.length === 0 ? (
                <div className="py-16 text-center text-dark-500">
                  <Filter className="w-10 h-10 mx-auto mb-3 text-dark-300" />
                  <p className="font-medium text-dark-700">暂无匹配的通行记录</p>
                  <p className="text-sm mt-1">调整筛选条件或搜索关键词后再试</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map((record, index) => {
                    const isExpanded = expandedId === record.id;
                    const failureInfo = getFailureInfo(record);
                    const FailureIcon = failureInfo?.icon;

                    return (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04 }}
                        className="rounded-xl border border-dark-200 bg-white p-4 hover:border-primary-200 hover:shadow-card transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                <Car className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-dark-800">
                                  {record.entryStation} → {record.exitStation}
                                </h3>
                                <p className="text-sm text-dark-500 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {dayjs(record.entryTime).format('YYYY-MM-DD HH:mm')} 出发
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap md:justify-end">
                            <span className={`badge ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                            {record.status === '待扣费' && (
                              <span className="badge bg-orange-100 text-orange-800">
                                {getPendingProcessText(record)}
                              </span>
                            )}
                            {record.isHolidayFree && (
                              <span className="badge bg-green-100 text-green-800">
                                {record.holidayName || '节假日'} 免费
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-lg font-bold text-dark-800 font-mono">
                                ¥{record.actualFee.toFixed(2)}
                              </p>
                              <p className="text-xs text-dark-500">{record.distance} km</p>
                            </div>
                            <button
                              onClick={() => toggleExpand(record.id)}
                              className="w-9 h-9 rounded-lg bg-dark-100 text-dark-600 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center transition-colors"
                              aria-label={isExpanded ? '收起详情' : '展开详情'}
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            {record.status === '待扣费' && !record.isHolidayFree && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setShowPayModal(record);
                                }}
                                className="px-3 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                              >
                                立即补缴
                              </button>
                            )}
                          </div>
                        </div>

                        {failureInfo && (
                          <div className={`mt-4 p-3 rounded-lg border text-sm ${failureInfo.color}`}>
                            <div className="flex items-start gap-2">
                              {FailureIcon && <FailureIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                              <div className="flex-1">
                                <p className="font-medium">{record.paymentFailureReason || failureInfo.tip}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs opacity-80">
                                  <span>错误码: {record.paymentFailureCode}</span>
                                  <span>已重试 {record.paymentRetryCount || 0} 次</span>
                                  {record.lastPaymentAttempt && (
                                    <span>最近尝试 {dayjs(record.lastPaymentAttempt).format('MM-DD HH:mm')}</span>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1 text-xs font-medium">
                                  <Zap className="w-3 h-3" />
                                  建议：{failureInfo.solution}
                                </div>
                              </div>
                            </div>
                            {record.autoPayTriggered && (
                              <div className="mt-3 pt-2 border-t border-current/10 space-y-1">
                                <p className="text-xs font-medium flex items-center gap-1">
                                  <ArrowRightLeft className="w-3 h-3" />
                                  代扣执行记录
                                </p>
                                <div className="flex items-center gap-2 text-xs opacity-80">
                                  {record.autoPayTriggeredAt && (
                                    <span>触发时间: {dayjs(record.autoPayTriggeredAt).format('MM-DD HH:mm:ss')}</span>
                                  )}
                                  <span className={`font-medium ${
                                    record.autoPayResult === 'failed' ? 'text-red-700' :
                                    record.autoPayResult === 'pending' ? 'text-yellow-700' :
                                    record.autoPayResult === 'success' ? 'text-green-700' : ''
                                  }`}>
                                    {record.autoPayResult === 'failed' ? '代扣失败' :
                                     record.autoPayResult === 'pending' ? '核验中...' :
                                     record.autoPayResult === 'success' ? '代扣成功' : '等待执行'}
                                  </span>
                                </div>
                              </div>
                            )}
                            {record.lowBalanceWarning && (
                              <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1 text-xs">
                                <Bell className="w-3 h-3" />
                                <span>余额预警已触发</span>
                                {record.lowBalanceWarningAt && (
                                  <span className="opacity-80">
                                    ({dayjs(record.lowBalanceWarningAt).format('MM-DD HH:mm')})
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="mt-3 flex gap-2 flex-wrap">
                              {record.paymentFailureCode !== 'E_HOLIDAY_PENDING' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowPayModal(record); }}
                                  className="px-3 py-1.5 bg-white/80 rounded-md text-xs font-medium hover:bg-white transition-colors"
                                >
                                  <CreditCard className="w-3 h-3 inline mr-1" />
                                  立即补缴
                                </button>
                              )}
                              {(record.paymentFailureCode === 'E_AUTH_EXPIRED' || record.paymentFailureCode === 'E_AUTH_REQUIRED') && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate('/recharge'); }}
                                  className="px-3 py-1.5 bg-white/80 rounded-md text-xs font-medium hover:bg-white transition-colors"
                                >
                                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                                  重新授权
                                </button>
                              )}
                              {record.paymentFailureCode === 'E_INSUFFICIENT_BALANCE' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate('/recharge'); }}
                                  className="px-3 py-1.5 bg-white/80 rounded-md text-xs font-medium hover:bg-white transition-colors"
                                >
                                  <Wallet className="w-3 h-3 inline mr-1" />
                                  前往充值
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-dark-200 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="p-3 bg-dark-50 rounded-lg">
                                      <p className="text-xs text-dark-500">入口时间</p>
                                      <p className="font-medium text-dark-800">{dayjs(record.entryTime).format('MM-DD HH:mm')}</p>
                                    </div>
                                    <div className="p-3 bg-dark-50 rounded-lg">
                                      <p className="text-xs text-dark-500">出口时间</p>
                                      <p className="font-medium text-dark-800">{dayjs(record.exitTime).format('MM-DD HH:mm')}</p>
                                    </div>
                                    <div className="p-3 bg-dark-50 rounded-lg">
                                      <p className="text-xs text-dark-500">通行门架</p>
                                      <p className="font-medium text-dark-800">{record.gantryPoints.length} 个</p>
                                    </div>
                                    <div className="p-3 bg-dark-50 rounded-lg">
                                      <p className="text-xs text-dark-500">扣费方式</p>
                                      <p className="font-medium text-dark-800">{getPaymentMethodText(record.paymentMethod)}</p>
                                    </div>
                                  </div>

                                  {record.status === '待扣费' && (
                                    <div className="col-span-2 md:col-span-4">
                                      <h4 className="font-semibold text-dark-800 mb-3 flex items-center gap-2 text-sm">
                                        <Clock3 className="w-4 h-4 text-amber-500" />
                                        扣费处理时间线
                                      </h4>
                                      <div className="relative pl-4 border-l-2 border-dark-200 space-y-3">
                                        <div className="relative">
                                          <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                                          <p className="text-xs text-dark-500">
                                            {dayjs(record.exitTime).format('MM-DD HH:mm:ss')} 通行出口，生成待扣费记录
                                          </p>
                                        </div>
                                        {record.lowBalanceWarning && record.lowBalanceWarningAt && (
                                          <div className="relative">
                                            <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-yellow-500 border-2 border-white" />
                                            <p className="text-xs text-yellow-700">
                                              {dayjs(record.lowBalanceWarningAt).format('MM-DD HH:mm:ss')} 余额预警触发
                                              {etcCard.balance < record.actualFee && (
                                                <span className="ml-1 font-medium">(余额 ¥{etcCard.balance.toFixed(2)} &lt; 应付 ¥{record.actualFee.toFixed(2)})</span>
                                              )}
                                            </p>
                                          </div>
                                        )}
                                        {record.autoPayTriggered && record.autoPayTriggeredAt && (
                                          <div className="relative">
                                            <span className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                                              record.autoPayResult === 'failed' ? 'bg-red-500' :
                                              record.autoPayResult === 'success' ? 'bg-green-500' :
                                              record.autoPayResult === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'
                                            }`} />
                                            <p className={`text-xs ${
                                              record.autoPayResult === 'failed' ? 'text-red-700' :
                                              record.autoPayResult === 'success' ? 'text-green-700' :
                                              'text-yellow-700'
                                            }`}>
                                              {dayjs(record.autoPayTriggeredAt).format('MM-DD HH:mm:ss')} 自动代扣{
                                                record.autoPayResult === 'failed' ? '执行失败' :
                                                record.autoPayResult === 'success' ? '执行成功' :
                                                record.autoPayResult === 'pending' ? '核验中...' : '已触发'
                                              }
                                              {record.paymentFailureReason && <span className="ml-1">— {record.paymentFailureReason}</span>}
                                            </p>
                                          </div>
                                        )}
                                        {(record.paymentRetryCount || 0) > 0 && record.lastPaymentAttempt && (
                                          <div className="relative">
                                            <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white" />
                                            <p className="text-xs text-dark-500">
                                              {dayjs(record.lastPaymentAttempt).format('MM-DD HH:mm:ss')} 第 {record.paymentRetryCount} 次重试
                                              {record.paymentFailureCode && <span className="ml-1">({record.paymentFailureCode})</span>}
                                            </p>
                                          </div>
                                        )}
                                        <div className="relative">
                                          <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-dark-300 border-2 border-white" />
                                          <p className="text-xs text-dark-400">等待处理...</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="rounded-lg border border-dark-200 overflow-hidden">
                                    <div className="grid grid-cols-3 bg-dark-50 text-sm font-medium text-dark-600">
                                      <span className="p-3">原价</span>
                                      <span className="p-3">优惠</span>
                                      <span className="p-3">实付</span>
                                    </div>
                                    <div className="grid grid-cols-3 text-sm text-dark-800">
                                      <span className="p-3 font-mono">¥{record.totalFee.toFixed(2)}</span>
                                      <span className="p-3 font-mono text-success">-¥{record.discountFee.toFixed(2)}</span>
                                      <span className="p-3 font-mono font-semibold">¥{record.actualFee.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-dark-800 mb-3 flex items-center gap-2">
                                      <Navigation className="w-4 h-4 text-primary-500" />
                                      门架明细
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                      {record.gantryPoints.map((point) => (
                                        <div key={point.id} className="flex items-center justify-between gap-3 p-3 bg-dark-50 rounded-lg">
                                          <div>
                                            <p className="font-medium text-dark-800">{point.gantryNo}</p>
                                            <p className="text-xs text-dark-500">{dayjs(point.passTime).format('MM-DD HH:mm:ss')}</p>
                                          </div>
                                          <span className="font-mono text-dark-700">¥{point.sectionFee.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="h-52 rounded-xl overflow-hidden border border-dark-200">
                                    <MapContainer
                                      center={[record.gantryPoints[0]?.location.lat || 23.1, record.gantryPoints[0]?.location.lng || 113.5]}
                                      zoom={9}
                                      scrollWheelZoom={false}
                                      className="h-full w-full local-leaflet-map"
                                    >
                                      {record.gantryPoints.length > 1 && (
                                        <Polyline
                                          positions={record.gantryPoints.map((p) => [p.location.lat, p.location.lng])}
                                          pathOptions={{ color: '#0ea5e9', weight: 4 }}
                                        />
                                      )}
                                      {record.gantryPoints.map((point) => (
                                        <Marker key={point.id} position={[point.location.lat, point.location.lng]} icon={customIcon}>
                                          <Popup>
                                            <div>
                                              <strong>{point.gantryNo}</strong>
                                              <br />
                                              ¥{point.sectionFee.toFixed(2)}
                                            </div>
                                          </Popup>
                                        </Marker>
                                      ))}
                                    </MapContainer>
                                  </div>

                                  {record.status === '待扣费' && !record.isHolidayFree && (
                                    <button
                                      onClick={() => setShowPayModal(record)}
                                      className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      立即补缴
                                    </button>
                                  )}
                                  {record.status === '待扣费' && record.isHolidayFree && (
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                                      <Info className="w-4 h-4 inline mr-1" />
                                      免费通行资格核验完成后将自动归档
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-dark-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                ETC 账户
              </h3>
              <div className="rounded-xl bg-gradient-hero p-5 text-white">
                <p className="text-white/70 text-sm">粤通卡</p>
                <p className="font-mono text-lg mt-1">{etcCard.cardNo}</p>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-white/70 text-sm">余额</p>
                    <p className="text-3xl font-bold font-mono">¥{etcCard.balance.toFixed(2)}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-sm">{etcCard.type}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/recharge')}
                className="btn-secondary w-full mt-4 flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                账户充值
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-dark-800 mb-4">扣费概览</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-500">总记录</span>
                  <span className="font-semibold text-dark-800">{trafficRecords.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-500">待扣费</span>
                  <span className="font-semibold text-warning">{pendingRecords.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-500">异常记录</span>
                  <span className="font-semibold text-danger">
                    {trafficRecords.filter((r) => r.status === '异常').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-500">本页金额</span>
                  <span className="font-mono font-semibold text-dark-800">
                    ¥{filteredRecords.reduce((sum, record) => sum + record.actualFee, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-dark-800 mb-3 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-primary-500" />
                处理建议
              </h3>
              <div className="space-y-3 text-sm text-dark-600">
                <p className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  已完成记录可展开查看门架路径与费用明细。
                </p>
                <p className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  待扣费记录建议优先补缴或开通自动代扣。
                </p>
                <p className="flex gap-2">
                  <AlertOctagon className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                  授权失效类记录需完成支付渠道授权后重试。
                </p>
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPayModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-xl font-bold text-dark-800">通行费补缴</h3>
                  <p className="text-sm text-dark-500 mt-1">
                    {showPayModal.entryStation} → {showPayModal.exitStation}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayModal(null)}
                  className="w-9 h-9 rounded-lg bg-dark-100 text-dark-500 hover:bg-dark-200 flex items-center justify-center"
                  aria-label="关闭补缴弹窗"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl bg-dark-50 p-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-dark-500">待补缴金额</span>
                  <span className="text-2xl font-bold font-mono text-accent-500">¥{showPayModal.actualFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-dark-500">账户余额</span>
                  <span className="font-mono text-dark-700">¥{etcCard.balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handlePay(showPayModal, 'balance')}
                  disabled={processingId === showPayModal.id || etcCard.balance < showPayModal.actualFee}
                  className="w-full p-4 rounded-xl border-2 border-dark-200 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-dark-800">账户余额</span>
                    <span className="text-sm text-dark-500">
                      {etcCard.balance < showPayModal.actualFee ? '余额不足' : '即时扣款'}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handlePay(showPayModal, 'wechat')}
                  disabled={processingId === showPayModal.id}
                  className="w-full p-4 rounded-xl border-2 border-dark-200 hover:border-primary-300 disabled:opacity-50 text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-dark-800">微信支付</span>
                    <span className="text-sm text-dark-500">外部支付</span>
                  </div>
                </button>
                <button
                  onClick={() => handlePay(showPayModal, 'alipay')}
                  disabled={processingId === showPayModal.id}
                  className="w-full p-4 rounded-xl border-2 border-dark-200 hover:border-primary-300 disabled:opacity-50 text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-dark-800">支付宝</span>
                    <span className="text-sm text-dark-500">外部支付</span>
                  </div>
                </button>
              </div>

              {processingId === showPayModal.id && (
                <div className="mt-4 text-sm text-primary-600 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  正在提交补缴请求...
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
