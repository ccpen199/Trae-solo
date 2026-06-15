import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Clock, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import StatusBadge from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { useAppStore } from '@/store/authStore';

const typeLabels: Record<string, string> = {
  course_purchase: '课程购买',
  service_deposit: '服务定金',
  service_final: '服务尾款',
  subscription: '订阅收入',
  settlement: '结算',
};

export default function Earnings() {
  const { 
    wallet, 
    transactions, 
    settlement, 
    walletLoading,
    fetchWallet, 
    fetchTransactions, 
    fetchSettlement,
    withdraw
  } = useWorkspaceStore();
  
  const { platformFeeRate } = useAppStore();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchSettlement();
  }, [fetchWallet, fetchTransactions, fetchSettlement]);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      alert('请输入有效的提现金额');
      return;
    }
    if (wallet && amount > wallet.balance) {
      alert('提现金额不能超过可用余额');
      return;
    }

    setWithdrawLoading(true);
    try {
      await withdraw(amount);
      alert('提现申请已提交');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Failed to withdraw:', error);
      alert('提现失败，请重试');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (walletLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">钱包余额</p>
            <p className="mt-2 text-4xl font-bold">
              ¥{wallet?.balance?.toLocaleString() || '0.00'}
            </p>
            {wallet?.frozenBalance && wallet.frozenBalance > 0 && (
              <p className="mt-2 text-sm text-white/70">
                冻结中: ¥{wallet.frozenBalance.toLocaleString()}
              </p>
            )}
          </div>
          <div className="rounded-full bg-white/20 p-4">
            <Wallet className="h-8 w-8" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!wallet || wallet.balance <= 0}
            className="flex-1 rounded-full bg-white px-6 py-3 font-medium text-primary-600 transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            申请提现
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-2.5 text-green-600">
            <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">本月收入</p>
              <p className="text-xl font-bold text-zinc-900">
                ¥{settlement?.monthlyRevenue?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>
          </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
            <ArrowUpFromLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">平台服务费 ({(platformFeeRate * 100)}%)</p>
              <p className="text-xl font-bold text-zinc-900">
                ¥{settlement?.platformFee?.toLocaleString() || '0.00'}
              </p>
            </div>
          </div>
          </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-100 p-2.5 text-primary-600">
            <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">可提现</p>
              <p className="text-xl font-bold text-zinc-900">
                ¥{settlement?.withdrawable?.toLocaleString() || '0.00'}
              </p>
            </div>
            </div>
          </div>
      </div>

      <div className="card">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-900">交易记录</h3>
        </div>
        <div className="p-6">
          {transactions.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-zinc-100">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl p-2.5 ${
                      transaction.type === 'settlement' 
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {transaction.type === 'settlement' 
                        ? <ArrowUpFromLine className="h-5 w-5" />
                        : <ArrowDownToLine className="h-5 w-5" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">
                        {typeLabels[transaction.type] || transaction.type}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'settlement' ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.type === 'settlement' ? '-' : '+'}¥{transaction.amount.toLocaleString()}
                    </p>
                    <StatusBadge status={transaction.status} className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">申请提现</h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">可用余额</label>
                <p className="mt-1.5 text-2xl font-bold text-zinc-900">
                  ¥{wallet?.balance?.toLocaleString() || '0.00'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700">提现金额</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-zinc-500">
                    ¥
                  </span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    max={wallet?.balance || 0}
                    className="input-field pl-10"
                  />
                </div>
                <button
                  onClick={() => setWithdrawAmount(wallet?.balance?.toString() || '')}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  全部提现
                </button>
              </div>

              <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">
                <p>• 提现将在 1-3 个工作日内到账</p>
                <p className="mt-1">• 最低提现金额：¥1.00</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleWithdraw}
                disabled={withdrawLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="btn-primary w-full gap-2"
              >
                {withdrawLoading ? '处理中...' : '确认提现'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
