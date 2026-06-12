import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  RefreshCw,
  Download,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  FileText,
  Building2,
  ArrowRightLeft,
  History,
  Send,
  Eye,
  FileCheck,
  FileX,
  AlertTriangle,
  MessageSquare,
  User,
  Tag,
  RotateCcw,
  CheckSquare,
  XSquare,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useStore } from '../../store/useStore';
import AdminSidebar from '../../components/AdminSidebar';
import type { SettlementRecord } from '../../../shared/types';

const diffCategories = [
  { key: 'gate_mismatch', name: '门架数据不一致', color: 'bg-red-500' },
  { key: 'fee_calculation', name: '费用计算差异', color: 'bg-yellow-500' },
  { key: 'duplicate_transaction', name: '重复交易', color: 'bg-blue-500' },
  { key: 'missing_transaction', name: '缺失交易', color: 'bg-purple-500' },
  { key: 'other', name: '其他差异', color: 'bg-gray-500' },
];

const diffReasons: Record<string, string[]> = {
  '门架数据不一致': ['门架设备时钟偏差', '数据传输延迟', '设备故障重启', '网络丢包'],
  '费用计算差异': ['费率版本不一致', '车型判定差异', '优惠政策差异', '节假日判定差异'],
  '重复交易': ['系统重试机制', '网络超时重复提交', '设备重复识别'],
  '缺失交易': ['设备离线', '数据上传失败', '系统升级维护'],
  '其他差异': ['人工干预', '特殊车辆处理', '其他未知原因'],
};

const reviewTemplates = [
  '已核实门架数据，省中心数据准确，差异为本地数据延迟导致',
  '已核实费用计算，双方费率版本一致，差异为车型判定不同',
  '已核实重复交易，已提交退款申请',
  '已核实缺失交易，已补传相关数据',
  '差异原因已确认，待省中心复核',
];

export default function AdminSettlement() {
  const { settlementRecords } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7days');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SettlementRecord | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewRemark, setReviewRemark] = useState('');
  const [reviewHistory, setReviewHistory] = useState<Record<string, Array<{
    time: string;
    operator: string;
    action: string;
    status: string;
  }>>>({});
  const [reconciliationStatus, setReconciliationStatus] = useState<Record<string, string>>({});

  const settlementChartData = settlementRecords.map((record) => ({
    date: record.settleDate.slice(5),
    总金额: record.totalAmount / 10000,
    省中心: record.centerAmount / 10000,
    商户: record.merchantAmount / 10000,
  })).reverse();

  const diffByCategory = {
    '门架数据不一致': 2,
    '费用计算差异': 1,
    '重复交易': 0,
    '缺失交易': 1,
    '其他差异': 0,
  };

  const totalStats = {
    totalTransactions: settlementRecords.reduce((sum, r) => sum + r.totalTransactions, 0),
    totalAmount: settlementRecords.reduce((sum, r) => sum + r.totalAmount, 0),
    totalDiff: settlementRecords.reduce((sum, r) => sum + r.diffAmount, 0),
    completedCount: settlementRecords.filter((r) => r.status === '已完成').length,
    pendingReview: settlementRecords.filter((r) => r.status === '有差异').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-700';
      case '对账中':
        return 'bg-blue-100 text-blue-700';
      case '有差异':
        return 'bg-red-100 text-red-700';
      case '复查中':
        return 'bg-yellow-100 text-yellow-700';
      case '已调整':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已完成':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case '对账中':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case '有差异':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case '复查中':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case '已调整':
        return <CheckSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getRecordStatus = (record: SettlementRecord) => {
    return reconciliationStatus[record.id] || record.status;
  };

  const filteredRecords = settlementRecords.filter((record) => {
    const recordStatus = getRecordStatus(record);
    const matchStatus = statusFilter === '全部' || recordStatus === statusFilter;
    return matchStatus;
  });

  const getReviewHistory = (recordId: string) => {
    return reviewHistory[recordId] || [
      {
        time: new Date().toISOString(),
        operator: '系统',
        action: '与省联网中心对账完成，发现差异',
        status: '有差异',
      },
    ];
  };

  const handleRequestReview = (record: SettlementRecord) => {
    setSelectedRecord(record);
    setShowReviewModal(true);
    setReviewReason('');
    setReviewRemark('');
  };

  const confirmRequestReview = () => {
    if (selectedRecord && reviewReason) {
      const history = getReviewHistory(selectedRecord.id);
      const newHistory = [
        ...history,
        {
          time: new Date().toISOString(),
          operator: '管理员',
          action: `已提交省中心复查申请，原因：${reviewReason}${reviewRemark ? `，备注：${reviewRemark}` : ''}`,
          status: '复查中',
        },
      ];
      setReviewHistory({ ...reviewHistory, [selectedRecord.id]: newHistory });
      setReconciliationStatus({ ...reconciliationStatus, [selectedRecord.id]: '复查中' });
      setShowReviewModal(false);
      setSelectedRecord(null);
      setReviewReason('');
      setReviewRemark('');
    }
  };

  const handleAcceptResult = (recordId: string) => {
    const history = getReviewHistory(recordId);
    const newHistory = [
      ...history,
      {
        time: new Date().toISOString(),
        operator: '管理员',
        action: '已确认省中心复核结果，差异已处理',
        status: '已调整',
      },
    ];
    setReviewHistory({ ...reviewHistory, [recordId]: newHistory });
    setReconciliationStatus({ ...reconciliationStatus, [recordId]: '已调整' });
  };

  const handleRejectResult = (recordId: string) => {
    const history = getReviewHistory(recordId);
    const newHistory = [
      ...history,
      {
        time: new Date().toISOString(),
        operator: '管理员',
        action: '已驳回省中心结果，申请二次复核',
        status: '复查中',
      },
    ];
    setReviewHistory({ ...reviewHistory, [recordId]: newHistory });
  };

  const handleResettle = (recordId: string) => {
    const history = getReviewHistory(recordId);
    const newHistory = [
      ...history,
      {
        time: new Date().toISOString(),
        operator: '管理员',
        action: '已执行重新对账，差异已修正',
        status: '已完成',
      },
    ];
    setReviewHistory({ ...reviewHistory, [recordId]: newHistory });
    setReconciliationStatus({ ...reconciliationStatus, [recordId]: '已完成' });
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">清分结算管理</h1>
              <p className="text-dark-400">管理与省联网中心的对账结算</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition-colors">
                <Download className="w-4 h-4" />
                导出报表
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
                手动对账
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card-dark p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +8.5%
              </div>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              ¥{(totalStats.totalAmount / 10000).toFixed(0)}万
            </p>
            <p className="text-sm text-dark-400 mt-1">周期总金额</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="card-dark p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +12.3%
              </div>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {totalStats.totalTransactions.toLocaleString()}
            </p>
            <p className="text-sm text-dark-400 mt-1">周期总笔数</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card-dark p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +5.2%
              </div>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {totalStats.completedCount}/{settlementRecords.length}
            </p>
            <p className="text-sm text-dark-400 mt-1">已完成对账</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card-dark p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-yellow-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                +2.1%
              </div>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              {totalStats.pendingReview}
            </p>
            <p className="text-sm text-dark-400 mt-1">待复查</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="card-dark p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-1 text-red-400 text-sm">
                <TrendingDown className="w-4 h-4" />
                -12.5%
              </div>
            </div>
            <p className="text-3xl font-bold text-white font-mono">
              ¥{totalStats.totalDiff.toFixed(2)}
            </p>
            <p className="text-sm text-dark-400 mt-1">差异金额</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card-dark p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-400" />
              省联网中心对账
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">最近对账时间</p>
                    <p className="text-sm text-dark-400">2026-06-11 02:30:00</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge bg-green-100 text-green-700">对账成功</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">省中心确认</p>
                    <p className="text-sm text-dark-400">已完成 5/7 笔</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const pending = settlementRecords.find((r) => r.status === '有差异');
                    if (pending) handleRequestReview(pending);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  申请复查
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <History className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">差异处理</p>
                    <p className="text-sm text-dark-400">处理中 2 笔</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-yellow-400 font-mono">2</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="card-dark p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-400" />
              差异类型分布
            </h3>
            <div className="space-y-3">
              {Object.entries(diffByCategory).map(([name, count], idx) => {
                const category = diffCategories.find((c) => c.name === name);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${category?.color} rounded-full`} />
                    <span className="text-sm text-dark-300 flex-1">{name}</span>
                    <span className="text-sm text-white font-mono">{count} 笔</span>
                    <div className="w-32 bg-dark-600 rounded-full h-2">
                      <div
                        className={`${category?.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${(count / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card-dark p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-white mb-4">结算金额趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={settlementChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                  formatter={(value: number) => [`¥${value.toFixed(1)}万`, '']}
                />
                <Legend
                  formatter={(value) => <span className="text-dark-300">{value}</span>}
                />
                <Bar dataKey="总金额" fill="#0F52BA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="省中心" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="商户" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="card-dark p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="搜索结算记录..."
                className="input-field-dark pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-dark-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field-dark w-auto"
                >
                  <option value="全部">全部状态</option>
                  <option value="待对账">待对账</option>
                  <option value="对账中">对账中</option>
                  <option value="已完成">已完成</option>
                  <option value="有差异">有差异</option>
                  <option value="复查中">复查中</option>
                  <option value="已调整">已调整</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-dark-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="input-field-dark w-auto"
                >
                  <option value="7days">最近7天</option>
                  <option value="30days">最近30天</option>
                  <option value="90days">最近90天</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredRecords.map((record, idx) => {
              const recordStatus = getRecordStatus(record);
              const history = getReviewHistory(record.id);
              const hasDiff = record.diffAmount > 0 || recordStatus === '有差异' || recordStatus === '复查中';
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + idx * 0.05 }}
                  className="border border-dark-700 rounded-xl overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-dark-800 transition-colors"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                          {getStatusIcon(recordStatus)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-white font-semibold">{record.settleDate}</p>
                            <span className={`badge ${getStatusColor(recordStatus)}`}>
                              {recordStatus}
                            </span>
                            {hasDiff && (
                              <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                差异 ¥{record.diffAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-dark-400">
                            {record.totalTransactions.toLocaleString()} 笔交易
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-white font-semibold font-mono">
                            ¥{record.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-dark-400">交易总额</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasDiff && expandedId !== record.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (recordStatus === '有差异') {
                                  handleRequestReview(record);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                recordStatus === '复查中'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                            >
                              {recordStatus === '复查中' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  复查中
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  申请复查
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('View detail:', record.id);
                            }}
                            className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-dark-400" />
                          </button>
                          {expandedId === record.id ? (
                            <ChevronUp className="w-5 h-5 text-dark-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-dark-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === record.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-dark-700"
                      >
                        <div className="p-4 bg-dark-800">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="p-4 bg-dark-700 rounded-lg">
                              <p className="text-xs text-dark-400 mb-1">省中心分成</p>
                              <p className="text-xl font-bold text-green-400 font-mono">
                                ¥{record.centerAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 bg-dark-700 rounded-lg">
                              <p className="text-xs text-dark-400 mb-1">商户分成</p>
                              <p className="text-xl font-bold text-accent-400 font-mono">
                                ¥{record.merchantAmount.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 bg-dark-700 rounded-lg">
                              <p className="text-xs text-dark-400 mb-1">差异金额</p>
                              <p
                                className={`text-xl font-bold font-mono ${
                                  record.diffAmount > 0 ? 'text-red-400' : 'text-green-400'
                                }`}
                              >
                                {record.diffAmount > 0
                                  ? `¥${record.diffAmount.toLocaleString()}`
                                  : '¥0.00'}
                              </p>
                            </div>
                            <div className="p-4 bg-dark-700 rounded-lg">
                              <p className="text-xs text-dark-400 mb-1">分成比例</p>
                              <p className="text-xl font-bold text-primary-400 font-mono">
                                {((record.centerAmount / record.totalAmount) * 100).toFixed(1)}% /
                                {((record.merchantAmount / record.totalAmount) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {hasDiff && (
                            <>
                              <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg mb-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-red-300 font-medium">存在对账差异</p>
                                      <span className="text-sm text-red-400">
                                        差异金额：¥{record.diffAmount.toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-red-400">
                                      与省联网中心对账存在差异，需要人工复核处理
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                <div className="p-4 bg-dark-700 rounded-lg">
                                  <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-primary-400" />
                                    差异明细
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-dark-400">本地交易金额</span>
                                      <span className="text-white font-mono">¥{record.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-dark-400">省中心金额</span>
                                      <span className="text-white font-mono">¥{(record.totalAmount - record.diffAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm border-t border-dark-600 pt-2">
                                      <span className="text-red-400 font-medium">差异金额</span>
                                      <span className="text-red-400 font-mono font-bold">¥{record.diffAmount.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 bg-dark-700 rounded-lg">
                                  <h5 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary-400" />
                                    对账历史
                                  </h5>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {history.map((item, i) => (
                                      <div key={i} className="flex items-start gap-2 text-sm">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                          item.status === '有差异' ? 'bg-red-500' :
                                          item.status === '复查中' ? 'bg-yellow-500' :
                                          item.status === '已调整' ? 'bg-purple-500' :
                                          'bg-green-500'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">{item.operator}</span>
                                            <span className="text-xs text-dark-500">
                                              {new Date(item.time).toLocaleString('zh-CN', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-dark-300 text-xs">{item.action}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {recordStatus === '复查中' && (
                                <div className="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg mb-4">
                                  <div className="flex items-start gap-3">
                                    <Loader2 className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-spin" />
                                    <div className="flex-1">
                                      <p className="text-yellow-300 font-medium">省中心复核中</p>
                                      <p className="text-sm text-yellow-400">
                                        已提交省联网中心复核，预计3个工作日内反馈结果
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {recordStatus === '已调整' && (
                                <div className="p-4 bg-purple-900/30 border border-purple-700 rounded-lg mb-4">
                                  <div className="flex items-start gap-3">
                                    <CheckSquare className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-purple-300 font-medium">差异已处理</p>
                                      <p className="text-sm text-purple-400">
                                        省中心复核完成，差异已调整并完成重新结算
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex items-center justify-end gap-3 flex-wrap">
                            <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm">
                              查看明细
                            </button>
                            <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm">
                              下载凭证
                            </button>
                            {recordStatus === '有差异' && (
                              <button
                                onClick={() => handleRequestReview(record)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                              >
                                <Send className="w-4 h-4" />
                                申请省中心复查
                              </button>
                            )}
                            {recordStatus === '复查中' && (
                              <>
                                <button
                                  onClick={() => handleAcceptResult(record.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                >
                                  <FileCheck className="w-4 h-4" />
                                  确认结果
                                </button>
                                <button
                                  onClick={() => handleRejectResult(record.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                                >
                                  <FileX className="w-4 h-4" />
                                  驳回申请
                                </button>
                              </>
                            )}
                            {recordStatus === '已调整' && (
                              <button
                                onClick={() => handleResettle(record.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                              >
                                <RotateCcw className="w-4 h-4" />
                                重新结算
                              </button>
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
        </motion.div>

        <AnimatePresence>
          {showReviewModal && selectedRecord && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/70 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-dark-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-dark-700 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-2">申请省中心复查</h3>
                <p className="text-dark-400 mb-2">结算日期：{selectedRecord.settleDate}</p>
                <div className="flex items-center gap-2 mb-6">
                  <span className="badge bg-red-100 text-red-700">
                    差异金额：¥{selectedRecord.diffAmount.toLocaleString()}
                  </span>
                  <span className="text-sm text-dark-400">
                    本地金额：¥{selectedRecord.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    选择差异原因
                  </label>
                  <div className="space-y-2">
                    {Object.entries(diffReasons).map(([reason, details]) => (
                      <button
                        key={reason}
                        onClick={() => setReviewReason(reason)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          reviewReason === reason
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-600 hover:border-dark-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{reason}</p>
                          {reviewReason === reason && (
                            <CheckCircle className="w-5 h-5 text-primary-500" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {details.map((detail, i) => (
                            <span key={i} className="text-xs bg-dark-600 text-dark-300 px-2 py-0.5 rounded">
                              {detail}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    补充说明
                  </label>
                  <textarea
                    placeholder="请输入补充说明信息，以便省中心快速定位问题..."
                    rows={4}
                    value={reviewRemark}
                    onChange={(e) => setReviewRemark(e.target.value)}
                    className="input-field-dark resize-none"
                  />
                </div>

                <div className="mb-6 p-4 bg-dark-700 rounded-lg">
                  <h5 className="text-sm font-medium text-dark-300 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent-400" />
                    快捷说明
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {reviewTemplates.map((template, i) => (
                      <button
                        key={i}
                        onClick={() => setReviewRemark(template)}
                        className="text-xs px-3 py-1.5 bg-dark-600 text-dark-300 rounded hover:bg-dark-500 transition-colors"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary-900/30 border border-primary-700 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-primary-300 font-medium">复查流程说明</p>
                      <ul className="text-sm text-primary-400 mt-1 space-y-1">
                        <li>• 提交申请后，省中心将在3个工作日内完成复核</li>
                        <li>• 复核结果将通过系统消息和短信通知</li>
                        <li>• 如对复核结果有异议，可申请二次复核</li>
                        <li>• 最终差异确认后，系统将自动完成重新结算</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmRequestReview}
                    disabled={!reviewReason}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    提交复查申请
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
