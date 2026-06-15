import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  ChevronDown,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { api } from '../../utils/api';
import { cn } from '../../lib/utils';
import type { Transaction, PaginatedResponse } from '../../../shared/types';

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course_purchase: { label: '课程购买', icon: FileText, color: 'bg-blue-500/20 text-blue-400' },
  service_deposit: { label: '服务定金', icon: Wallet, color: 'bg-purple-500/20 text-purple-400' },
  service_final: { label: '服务尾款', icon: Wallet, color: 'bg-purple-500/20 text-purple-400' },
  subscription: { label: '订阅', icon: Calendar, color: 'bg-green-500/20 text-green-400' },
  settlement: { label: '结算', icon: CheckCircle, color: 'bg-amber-500/20 text-amber-400' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-amber-500/20 text-amber-400' },
  success: { label: '成功', color: 'bg-green-500/20 text-green-400' },
  failed: { label: '失败', color: 'bg-red-500/20 text-red-400' },
};

const settlementRules = [
  {
    title: '平台服务费',
    description: '每笔交易收取 15% 的平台服务费，用于技术维护、客服支持和营销推广。',
    rate: '15%',
  },
  {
    title: '创作者分成',
    description: '创作者获得每笔交易的 85%，扣除平台服务费后自动结算到创作者钱包。',
    rate: '85%',
  },
  {
    title: '结算周期',
    description: '交易完成后 T+3 个工作日内完成结算，遇节假日顺延。',
    rate: 'T+3',
  },
  {
    title: '最低提现',
    description: '钱包余额满 100 元可申请提现，提现金额需为 10 的整数倍。',
    rate: '¥100',
  },
];

export default function Finance() {
  const [financeData, setFinanceData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFinanceData();
    loadTransactions();
  }, [typeFilter, statusFilter]);

  const loadFinanceData = async () => {
    try {
      const response: any = await api.admin.getFinance();
      setFinanceData(response.data);
    } catch (error) {
      console.error('Failed to load finance data:', error);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 20 };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response: any = await api.admin.getTransactions(params);
      const data = response.data as PaginatedResponse<Transaction>;
      setTransactions(data.items);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(amount);
  };

  const platformFeeRate = 0.15;
  const creatorShareRate = 1 - platformFeeRate;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">财务分账</h1>
        <p className="text-zinc-500 mt-1">平台收入统计、交易记录和分账规则</p>
      </div>

      {/* Revenue overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-400" />
            </div>
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              12.5%
            </span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">平台总收入</p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(financeData?.totalRevenue || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              8.3%
            </span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">本月收入</p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(financeData?.monthlyRevenue || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <span className="flex items-center gap-1 text-amber-400 text-sm">
              {financeData?.pendingSettlements && financeData.pendingSettlements > 0 ? '待处理' : '无待办'}
            </span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">待结算金额</p>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(financeData?.pendingSettlements || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-400" />
            </div>
            <span className="flex items-center gap-1 text-zinc-500 text-sm">
              <Info className="w-4 h-4" />
            </span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">平台服务费</p>
          <p className="text-3xl font-bold text-white">
            {(platformFeeRate * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">收入构成</h3>
              <p className="text-sm text-zinc-500">按交易类型统计</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: '课程销售', value: financeData?.courseRevenue || 0, percentage: 60, color: 'from-blue-500 to-blue-600' },
              { label: '服务交易', value: financeData?.serviceRevenue || 0, percentage: 30, color: 'from-purple-500 to-purple-600' },
              { label: '订阅收入', value: financeData?.subscriptionRevenue || 0, percentage: 10, color: 'from-green-500 to-green-600' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-zinc-400">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                    <span className="text-zinc-600 text-sm">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full bg-gradient-to-r rounded-full', item.color)}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent-500/20 rounded-xl flex items-center justify-center">
              <PieChart className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">分账比例</h3>
              <p className="text-sm text-zinc-500">平台与创作者分成</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(39, 39, 42, 1)"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#platformGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${(platformFeeRate * 100) * 2.51} 251`}
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#creatorGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${(creatorShareRate * 100) * 2.51} 251`}
                  strokeDashoffset={`${-(platformFeeRate * 100) * 2.51}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="platformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="creatorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">100%</span>
                <span className="text-sm text-zinc-500">交易金额</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-purple-500" />
              <span className="text-zinc-400 text-sm">平台 {(platformFeeRate * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-cyan-500" />
              <span className="text-zinc-400 text-sm">创作者 {(creatorShareRate * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">交易记录</h3>
              <p className="text-sm text-zinc-500 mt-1">共 {transactions.length} 条记录</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTypeFilter(!showTypeFilter);
                    setShowStatusFilter(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                >
                  <Filter className="w-4 h-4" />
                  {typeFilter === 'all' ? '全部类型' : typeConfig[typeFilter]?.label}
                  <ChevronDown
                    className={cn('w-4 h-4 transition-transform', showTypeFilter && 'rotate-180')}
                  />
                </button>
                {showTypeFilter && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10">
                    <button
                      onClick={() => {
                        setTypeFilter('all');
                        setShowTypeFilter(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left text-sm hover:bg-zinc-700 transition-colors',
                        typeFilter === 'all' ? 'text-primary-400' : 'text-zinc-400'
                      )}
                    >
                      全部类型
                    </button>
                    {Object.keys(typeConfig).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setTypeFilter(type);
                          setShowTypeFilter(false);
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left text-sm hover:bg-zinc-700 transition-colors',
                          typeFilter === type ? 'text-primary-400' : 'text-zinc-400'
                        )}
                      >
                        {typeConfig[type].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => {
                    setShowStatusFilter(!showStatusFilter);
                    setShowTypeFilter(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                >
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'all' ? '全部状态' : statusConfig[statusFilter]?.label}
                  <ChevronDown
                    className={cn('w-4 h-4 transition-transform', showStatusFilter && 'rotate-180')}
                  />
                </button>
                {showStatusFilter && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10">
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setShowStatusFilter(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left text-sm hover:bg-zinc-700 transition-colors',
                        statusFilter === 'all' ? 'text-primary-400' : 'text-zinc-400'
                      )}
                    >
                      全部状态
                    </button>
                    {Object.keys(statusConfig).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowStatusFilter(false);
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left text-sm hover:bg-zinc-700 transition-colors',
                          statusFilter === status ? 'text-primary-400' : 'text-zinc-400'
                        )}
                      >
                        {statusConfig[status].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  交易类型
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  订单/课程ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  平台服务费
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  交易时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    暂无交易记录
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const TransactionIcon = typeConfig[transaction.type]?.icon;
                  return (
                  <tr key={transaction.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', typeConfig[transaction.type]?.color)}>
                          {TransactionIcon && <TransactionIcon className="w-5 h-5" />}
                        </div>
                        <span className="text-white font-medium">
                          {typeConfig[transaction.type]?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-mono text-sm">
                      {transaction.orderId || transaction.courseId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'settlement' ? (
                          <ArrowDownRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-white font-semibold">{formatCurrency(transaction.amount)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-400">
                      {formatCurrency(transaction.platformFee)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('badge', statusConfig[transaction.status]?.color)}>
                        {transaction.status === 'success' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : transaction.status === 'failed' ? (
                          <XCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {statusConfig[transaction.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                      {new Date(transaction.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement rules */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">分账规则说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settlementRules.map((rule, i) => (
            <div
              key={i}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 hover:border-primary-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-white font-medium">{rule.title}</h4>
                <span className="text-primary-400 font-semibold text-lg">{rule.rate}</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
