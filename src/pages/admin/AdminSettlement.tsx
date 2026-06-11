import { useState } from 'react';
import { motion } from 'framer-motion';
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

export default function AdminSettlement() {
  const { settlementRecords } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7days');
  const [statusFilter, setStatusFilter] = useState('全部');

  const settlementChartData = settlementRecords.map((record) => ({
    date: record.settleDate.slice(5),
    总金额: record.totalAmount / 10000,
    省中心: record.centerAmount / 10000,
    商户: record.merchantAmount / 10000,
  })).reverse();

  const totalStats = {
    totalTransactions: settlementRecords.reduce((sum, r) => sum + r.totalTransactions, 0),
    totalAmount: settlementRecords.reduce((sum, r) => sum + r.totalAmount, 0),
    totalDiff: settlementRecords.reduce((sum, r) => sum + r.diffAmount, 0),
    completedCount: settlementRecords.filter((r) => r.status === '已完成').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成':
        return 'bg-green-100 text-green-700';
      case '对账中':
        return 'bg-blue-100 text-blue-700';
      case '有差异':
        return 'bg-red-100 text-red-700';
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
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const filteredRecords = settlementRecords.filter((record) => {
    const matchStatus = statusFilter === '全部' || record.status === statusFilter;
    return matchStatus;
  });

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
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
          transition={{ duration: 0.5, delay: 0.4 }}
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
            {filteredRecords.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
                className="border border-dark-700 rounded-xl overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-dark-800 transition-colors"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-white font-semibold">{record.settleDate}</p>
                          <span className={`badge ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
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

                      {record.diffAmount > 0 && (
                        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg mb-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-300 font-medium">存在对账差异</p>
                              <p className="text-sm text-red-400">
                                与省联网中心对账存在 ¥{record.diffAmount.toLocaleString()} 的差异，需要人工复核处理
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3">
                        <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm">
                          查看明细
                        </button>
                        <button className="px-4 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors text-sm">
                          下载凭证
                        </button>
                        {record.status === '有差异' && (
                          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm">
                            差异处理
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
