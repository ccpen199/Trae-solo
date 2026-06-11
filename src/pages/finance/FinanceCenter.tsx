import { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  Calendar,
  Lock,
} from 'lucide-react';
import { financeApi } from '../../lib/api';
import type { Wallet, Transaction, TransactionType, TransactionStatus } from '../../../shared/types';
import { cn } from '../../lib/utils';

const FinanceCenter = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: 0,
    bankAccount: '',
    bankName: '',
    accountName: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query: any = { page, pageSize };
        if (typeFilter) query.type = typeFilter;
        const [walletData, transactionsData] = await Promise.all([
          financeApi.getWallet(),
          financeApi.getTransactions(query),
        ]);
        setWallet(walletData);
        setTransactions(transactionsData.data);
        setTotal(transactionsData.total);
      } catch (err) {
        console.error('Failed to fetch finance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, typeFilter]);

  const handleWithdraw = async () => {
    try {
      await financeApi.withdraw(withdrawForm);
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: 0, bankAccount: '', bankName: '', accountName: '' });
      const [walletData, transactionsData] = await Promise.all([
        financeApi.getWallet(),
        financeApi.getTransactions({ page, pageSize }),
      ]);
      setWallet(walletData);
      setTransactions(transactionsData.data);
    } catch (err) {
      console.error('Failed to withdraw:', err);
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    const icons: Record<TransactionType, typeof DollarSign> = {
      deposit: ArrowDownLeft,
      escrow: Lock,
      release: ArrowUpRight,
      refund: ArrowDownLeft,
      withdraw: ArrowUpRight,
      fee: DollarSign,
    };
    return icons[type] || DollarSign;
  };

  const getTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      deposit: '充值',
      escrow: '资金托管',
      release: '款项释放',
      refund: '退款',
      withdraw: '提现',
      fee: '平台服务费',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: TransactionType) => {
    const colors: Record<TransactionType, string> = {
      deposit: 'bg-green-100 text-green-700',
      escrow: 'bg-amber-100 text-amber-700',
      release: 'bg-blue-100 text-blue-700',
      refund: 'bg-purple-100 text-purple-700',
      withdraw: 'bg-orange-100 text-orange-700',
      fee: 'bg-slate-100 text-slate-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: TransactionStatus) => {
    const icons: Record<TransactionStatus, typeof CheckCircle> = {
      pending: Clock,
      completed: CheckCircle,
      failed: XCircle,
    };
    return icons[status];
  };

  const getStatusColor = (status: TransactionStatus) => {
    const colors: Record<TransactionStatus, string> = {
      pending: 'text-amber-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
    };
    return colors[status];
  };

  const types: { value: TransactionType | ''; label: string }[] = [
    { value: '', label: '全部类型' },
    { value: 'deposit', label: '充值' },
    { value: 'escrow', label: '托管' },
    { value: 'release', label: '释放' },
    { value: 'withdraw', label: '提现' },
    { value: 'fee', label: '服务费' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">财务中心</h2>
          <p className="text-slate-500 mt-1">管理您的资金和交易记录</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!wallet || wallet.balance <= 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            申请提现
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" />
            导出账单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <WalletIcon className="w-8 h-8 opacity-80" />
            <span className="text-xs px-2 py-1 bg-white/20 rounded-full">可用余额</span>
          </div>
          <p className="text-3xl font-bold mb-1">¥{wallet?.balance?.toLocaleString() || '0.00'}</p>
          <p className="text-sm opacity-80">可随时提现</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">冻结中</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mb-1">
            ¥{wallet?.frozenBalance?.toLocaleString() || '0.00'}
          </p>
          <p className="text-sm text-slate-500">托管中的资金</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">累计收入</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mb-1">
            ¥{wallet?.totalIncome?.toLocaleString() || '0.00'}
          </p>
          <p className="text-sm text-slate-500">历史总收入</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">累计支出</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mb-1">
            ¥{wallet?.totalExpense?.toLocaleString() || '0.00'}
          </p>
          <p className="text-sm text-slate-500">历史总支出</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">交易记录</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map(tx => {
              const TypeIcon = getTypeIcon(tx.type);
              const StatusIcon = getStatusIcon(tx.status);
              const amount = tx.type === 'deposit' || tx.type === 'release' || tx.type === 'refund'
                ? `+¥${tx.amount.toLocaleString()}`
                : `-¥${tx.amount.toLocaleString()}`;
              const amountColor = tx.type === 'deposit' || tx.type === 'release' || tx.type === 'refund'
                ? 'text-green-600'
                : 'text-red-600';

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', getTypeColor(tx.type))}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800">{getTypeLabel(tx.type)}</p>
                      {tx.task && (
                        <span className="text-xs text-slate-500 truncate">· {tx.task.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                      <span className={cn('flex items-center gap-1', getStatusColor(tx.status))}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {tx.status === 'pending' ? '处理中' : tx.status === 'completed' ? '已完成' : '失败'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-lg font-bold', amountColor)}>{amount}</p>
                    <p className="text-sm text-slate-500">余额: ¥{tx.balance.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无交易记录</h3>
            <p className="text-slate-500">您的交易记录将显示在这里</p>
          </div>
        )}

        {total > pageSize && (
          <div className="flex items-center justify-center gap-2 pt-6 mt-6 border-t border-slate-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-slate-600">
              {page} / {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / pageSize)}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">申请提现</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 mb-1">可提现金额</p>
                <p className="text-2xl font-bold text-blue-700">¥{wallet?.balance?.toLocaleString() || '0.00'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">提现金额 (元)</label>
                <input
                  type="number"
                  value={withdrawForm.amount || ''}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: Number(e.target.value) })}
                  max={wallet?.balance}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入提现金额"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">开户银行</label>
                <input
                  type="text"
                  value={withdrawForm.bankName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="例如：中国工商银行"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">银行账号</label>
                <input
                  type="text"
                  value={withdrawForm.bankAccount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入银行账号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">开户人姓名</label>
                <input
                  type="text"
                  value={withdrawForm.accountName}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入开户人姓名"
                />
              </div>
              <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">温馨提示</p>
                  <p className="text-xs text-amber-600 mt-0.5">提现申请提交后，将在1-3个工作日内处理完成。平台收取5%的服务费。</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawForm.amount || withdrawForm.amount <= 0 || !withdrawForm.bankAccount || !withdrawForm.bankName || !withdrawForm.accountName}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCenter;
